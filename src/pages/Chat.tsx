import React, { useState, useRef, useCallback } from "react";
import { Loader2, ShoppingCart, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import VoiceButton from "@/components/assistant/VoiceButton";
import ProductResults, { type AssistantProduct, type ResultGroup } from "@/components/assistant/ProductResults";
import ProductDetailSheet from "@/components/assistant/ProductDetailSheet";
import { useVAD } from "@/hooks/useVAD";
import { toast } from "sonner";

type AssistantState = "idle" | "listening" | "transcribing" | "searching" | "results";
type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-stt`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-tts`;

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Strip markdown/special chars for clean TTS */
function cleanForTTS(text: string): string {
  return text
    .replace(/:::product[\s\S]*?:::/g, "")
    .replace(/:::action[\s\S]*?:::/g, "")
    .replace(/[#*_~`>|[\](){}]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
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
        name, price,
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

/** Parse :::action blocks */
function parseActions(text: string): Array<{ action: string; productName: string }> {
  const actions: Array<{ action: string; productName: string }> = [];
  const actionRegex = /:::action\s*\n([\s\S]*?):::/g;
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    const block = match[1];
    const getVal = (key: string) => {
      const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim() : undefined;
    };
    const action = getVal("type");
    const productName = getVal("product_name");
    if (action && productName) actions.push({ action, productName });
  }
  return actions;
}

const Chat: React.FC = () => {
  const [state, setState] = useState<AssistantState>("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(generateSessionId);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems, addToCart, isInCart } = useCart();

  // Results history
  const [resultGroups, setResultGroups] = useState<ResultGroup[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const [transcribedText, setTranscribedText] = useState("");

  // PDP
  const [selectedProduct, setSelectedProduct] = useState<AssistantProduct | null>(null);

  // Voice
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // TTS
  const playTTS = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    try {
      const clean = cleanForTTS(text);
      if (!clean) return;
      const hasHindi = /[\u0900-\u097F]/.test(clean);
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text: clean, target_language_code: hasHindi ? "hi-IN" : "en-IN" }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data.audio) return;
      const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
      audioRef.current = audio;
      await audio.play();
    } catch (e) { console.error("TTS error:", e); }
  }, [voiceEnabled]);

  // Handle AI actions (open PDP, add to cart)
  const handleActions = useCallback((actions: Array<{ action: string; productName: string }>, products: AssistantProduct[]) => {
    for (const act of actions) {
      if (act.action === "open_product") {
        const product = products.find(p => p.name.toLowerCase().includes(act.productName.toLowerCase()));
        if (product) {
          setTimeout(() => setSelectedProduct(product), 500);
        }
      } else if (act.action === "add_to_cart") {
        // Find from all result groups
        let targetProduct: AssistantProduct | undefined;
        for (const group of resultGroups) {
          targetProduct = group.products.find(p => p.name.toLowerCase().includes(act.productName.toLowerCase()));
          if (targetProduct) break;
        }
        // Also check current products
        if (!targetProduct) {
          targetProduct = products.find(p => p.name.toLowerCase().includes(act.productName.toLowerCase()));
        }
        // Also check selectedProduct
        if (!targetProduct && selectedProduct && selectedProduct.name.toLowerCase().includes(act.productName.toLowerCase())) {
          targetProduct = selectedProduct;
        }
        if (targetProduct) {
          const productId = `${targetProduct.name}-${targetProduct.link}`.replace(/\s+/g, "_").toLowerCase();
          if (!isInCart(productId)) {
            const numericPrice = parseFloat(targetProduct.price.replace(/[^\d.]/g, "")) || 0;
            addToCart({ id: productId, name: targetProduct.name, price: numericPrice, image: targetProduct.image, link: targetProduct.link });
            toast.success(`${targetProduct.name} added to cart!`, { duration: 2000 });
          }
        }
      }
    }
  }, [resultGroups, selectedProduct, addToCart, isInCart]);

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionId, conversationId,
        }),
      });

      const convIdHeader = resp.headers.get("X-Conversation-Id");
      if (convIdHeader && !conversationId) setConversationId(convIdHeader);

      if (!resp.ok) { setState(resultGroups.length > 0 ? "results" : "idle"); return; }

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
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }

      // Parse products, actions and APPEND to result groups
      const { products: parsed, commentary } = parseProducts(assistantSoFar);
      const actions = parseActions(assistantSoFar);
      const newGroup: ResultGroup = { query: text.trim(), commentary, products: parsed };

      setResultGroups((prev) => [newGroup, ...prev]);
      setMessages((prev) => [...prev, { role: "assistant", content: assistantSoFar }]);
      setState("results");

      // Handle actions
      if (actions.length > 0) handleActions(actions, parsed);

      if (commentary) playTTS(commentary);
    } catch (e) {
      console.error("Chat error:", e);
      setState(resultGroups.length > 0 ? "results" : "idle");
    }
  }, [messages, sessionId, conversationId, playTTS, resultGroups.length, handleActions]);

  // VAD stop ref to break circular dependency
  const vadStopRef = useRef<() => void>(() => {});

  // Stop recording handler
  const doStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    vadStopRef.current();
  }, []);

  // VAD: auto-stop after silence
  const vad = useVAD(doStopRecording, 2000, 0.01);
  vadStopRef.current = vad.stop;

  // Recording
  const startRecording = useCallback(async () => {
    try {
      // Stop any playing audio
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
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
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ audio: base64 }),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.transcript?.trim()) { setTranscribedText(data.transcript.trim()); send(data.transcript.trim()); return; }
          }
          setState(resultGroups.length > 0 ? "results" : "idle");
        } catch { setState(resultGroups.length > 0 ? "results" : "idle"); }
      };

      mediaRecorder.start();
      setState("listening");

      // Start VAD monitoring
      vad.start(stream);
    } catch (e) { console.error("Mic access error:", e); }
  }, [send, resultGroups.length, vad]);

  const toggleVoice = () => {
    setVoiceEnabled((v) => !v);
    if (audioRef.current) audioRef.current.pause();
  };

  const showHero = state === "idle" && resultGroups.length === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleVoice} className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button onClick={() => setCartOpen(true)} className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors relative">
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">{totalItems}</span>
            )}
          </button>
        </div>
      </div>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* HERO: idle with no results - voice only */}
      {showHero && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <VoiceButton isListening={false} onToggle={startRecording} />
        </div>
      )}

      {/* LISTENING */}
      {state === "listening" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <VoiceButton isListening={true} onToggle={doStopRecording} />
        </div>
      )}

      {/* TRANSCRIBING */}
      {state === "transcribing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <div className="bg-secondary rounded-xl px-5 py-3 max-w-xs text-center">
            {transcribedText ? (
              <p className="text-sm text-foreground font-medium">"{transcribedText}"</p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Transcribing your voice...</div>
            )}
          </div>
        </div>
      )}

      {/* SEARCHING */}
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

      {/* RESULTS: product grid + voice button */}
      {state === "results" && (
        <>
          <ProductResults resultGroups={resultGroups} onProductClick={setSelectedProduct} />
          <div className="border-t border-border px-3 py-3 bg-background mb-16 flex justify-center">
            <VoiceButton isListening={false} onToggle={startRecording} size="small" />
          </div>
        </>
      )}

      {/* Idle with previous results: show results + voice button */}
      {state === "idle" && resultGroups.length > 0 && (
        <>
          <ProductResults resultGroups={resultGroups} onProductClick={setSelectedProduct} />
          <div className="border-t border-border px-3 py-3 bg-background mb-16 flex justify-center">
            <VoiceButton isListening={false} onToggle={startRecording} size="small" />
          </div>
        </>
      )}

      {/* PDP Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        sessionId={sessionId}
        conversationId={conversationId}
      />
    </div>
  );
};

export default Chat;
