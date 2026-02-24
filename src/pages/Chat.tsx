import React, { useState, useRef, useCallback } from "react";
import { Loader2, ShoppingCart, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import VoiceButton from "@/components/assistant/VoiceButton";
import ProductResults, { type AssistantProduct } from "@/components/assistant/ProductResults";
import AssistantInput from "@/components/assistant/AssistantInput";

type AssistantState = "idle" | "listening" | "transcribing" | "searching" | "results";
type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-stt`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-tts`;

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse :::product blocks from AI response */
function parseProducts(text: string): { products: AssistantProduct[]; commentary: string } {
  const products: AssistantProduct[] = [];
  const productRegex = /:::product\s*\n([\s\S]*?):::/g;
  let match;
  let commentary = text;

  while ((match = productRegex.exec(text)) !== null) {
    commentary = commentary.replace(match[0], "");
    const block = match[1];
    const get = (key: string) => {
      const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim() : undefined;
    };
    const name = get("name");
    const price = get("price");
    const link = get("link");
    if (name && price && link) {
      products.push({
        name,
        price,
        discountPrice: get("discount_price"),
        discountCode: get("discount_code"),
        image: get("image"),
        link,
        rating: get("rating"),
        description: get("description"),
      });
    }
  }

  commentary = commentary.replace(/\n{3,}/g, "\n\n").trim();
  return { products, commentary };
}

const Chat: React.FC = () => {
  const [state, setState] = useState<AssistantState>("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(generateSessionId);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  // Results
  const [products, setProducts] = useState<AssistantProduct[]>([]);
  const [aiCommentary, setAiCommentary] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [transcribedText, setTranscribedText] = useState("");

  // Voice
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // TTS
  const playTTS = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    try {
      const hasHindi = /[\u0900-\u097F]/.test(text);
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, target_language_code: hasHindi ? "hi-IN" : "en-IN" }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data.audio) return;
      const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
      audioRef.current = audio;
      await audio.play();
    } catch (e) {
      console.error("TTS error:", e);
    }
  }, [voiceEnabled]);

  // Send query to AI
  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLastQuery(text.trim());
    setState("searching");

    const userMsg: Msg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionId,
          conversationId,
        }),
      });

      const convIdHeader = resp.headers.get("X-Conversation-Id");
      if (convIdHeader && !conversationId) setConversationId(convIdHeader);

      if (!resp.ok) {
        setState("idle");
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) assistantSoFar += content;
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Parse products from response
      const { products: parsed, commentary } = parseProducts(assistantSoFar);
      setProducts(parsed);
      setAiCommentary(commentary);
      setMessages((prev) => [...prev, { role: "assistant", content: assistantSoFar }]);
      setState("results");

      // TTS for commentary only
      if (commentary) playTTS(commentary);
    } catch (e) {
      console.error("Chat error:", e);
      setState("idle");
    }
  }, [messages, sessionId, conversationId, playTTS]);

  // Recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setState("transcribing");
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(audioBlob);
          });

          const resp = await fetch(STT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ audio: base64 }),
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.transcript?.trim()) {
              setTranscribedText(data.transcript.trim());
              send(data.transcript.trim());
              return;
            }
          }
          setState("idle");
        } catch {
          setState("idle");
        }
      };

      mediaRecorder.start();
      setState("listening");
    } catch (e) {
      console.error("Mic access error:", e);
    }
  }, [send]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleVoice = () => {
    setVoiceEnabled((v) => !v);
    if (audioRef.current) { audioRef.current.pause(); }
  };

  const suggestions = ["Show me electronics under ₹2000", "Best deals today", "मुझे फोन चाहिए"];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleVoice}
            className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors relative"
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* IDLE STATE: Hero with mic button */}
      {state === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Your AI Shopping Assistant</h2>
            <p className="text-sm text-muted-foreground">Tap to speak or type what you're looking for</p>
          </div>

          <VoiceButton isListening={false} onToggle={startRecording} />

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs bg-secondary text-foreground border border-border rounded-full px-4 py-2 hover:bg-accent transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LISTENING STATE */}
      {state === "listening" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <VoiceButton isListening={true} onToggle={stopRecording} />
        </div>
      )}

      {/* TRANSCRIBING STATE */}
      {state === "transcribing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <div className="bg-secondary rounded-xl px-5 py-3 max-w-xs text-center">
            {transcribedText ? (
              <p className="text-sm text-foreground font-medium">"{transcribedText}"</p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Transcribing your voice...
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCHING STATE */}
      {state === "searching" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          {lastQuery && (
            <div className="bg-secondary rounded-xl px-5 py-3 max-w-xs text-center">
              <p className="text-sm text-foreground font-medium">"{lastQuery}"</p>
            </div>
          )}
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Finding the best products for you...</p>
          </div>
        </div>
      )}

      {/* RESULTS STATE: 90% products + 10% input */}
      {state === "results" && (
        <>
          <ProductResults products={products} query={lastQuery} aiMessage={aiCommentary} />
          <AssistantInput
            onSend={send}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isRecording={false}
            isTranscribing={false}
            isLoading={false}
          />
        </>
      )}

      {/* Bottom fallback text input for idle state */}
      {state === "idle" && (
        <AssistantInput
          onSend={send}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          isRecording={false}
          isTranscribing={false}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default Chat;
