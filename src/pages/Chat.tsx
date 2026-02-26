import React, { useState, useRef, useCallback, useEffect } from "react";
import { Loader2, ShoppingCart, Volume2, VolumeX } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import VoiceButton from "@/components/assistant/VoiceButton";
import AudioWaveform from "@/components/assistant/AudioWaveform";
import ProductResults, { type AssistantProduct, type ResultGroup } from "@/components/assistant/ProductResults";
import ProductDetailSheet from "@/components/assistant/ProductDetailSheet";
import TalkingAvatar from "@/components/assistant/TalkingAvatar";
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

  const [resultGroups, setResultGroups] = useState<ResultGroup[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<AssistantProduct | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [continuousListening, setContinuousListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const shouldRestartRef = useRef(false);

  // Avatar state
  const [avatarState, setAvatarState] = useState<"idle" | "speaking" | "listening">("idle");
  const [showProducts, setShowProducts] = useState(false);
  const isSpeakingRef = useRef(false);

  // Stop any playing TTS (barge-in)
  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    isSpeakingRef.current = false;
    setAvatarState("idle");
  }, []);

  // TTS with avatar sync
  const playTTS = useCallback(async (text: string): Promise<void> => {
    if (!voiceEnabled || !text.trim()) return;
    try {
      const clean = cleanForTTS(text);
      if (!clean) return;
      const hasHindi = /[\u0900-\u097F]/.test(clean);
      setAvatarState("speaking");
      isSpeakingRef.current = true;
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text: clean, target_language_code: hasHindi ? "hi-IN" : "en-IN" }),
      });
      if (!resp.ok) { setAvatarState("idle"); isSpeakingRef.current = false; return; }
      const data = await resp.json();
      if (!data.audio) { setAvatarState("idle"); isSpeakingRef.current = false; return; }
      const mimeType = data.audioFormat === "wav" ? "audio/wav" : "audio/mpeg";
      const audio = new Audio(`data:${mimeType};base64,${data.audio}`);
      audioRef.current = audio;
      
      return new Promise<void>((resolve) => {
        audio.onended = () => {
          isSpeakingRef.current = false;
          setAvatarState("idle");
          resolve();
        };
        audio.onerror = () => {
          isSpeakingRef.current = false;
          setAvatarState("idle");
          resolve();
        };
        audio.play().catch(() => {
          isSpeakingRef.current = false;
          setAvatarState("idle");
          resolve();
        });
      });
    } catch (e) {
      console.error("TTS error:", e);
      isSpeakingRef.current = false;
      setAvatarState("idle");
    }
  }, [voiceEnabled]);

  // Handle AI actions
  const handleActions = useCallback((actions: Array<{ action: string; productName: string }>, products: AssistantProduct[]) => {
    for (const act of actions) {
      if (act.action === "open_product") {
        const product = products.find(p => p.name.toLowerCase().includes(act.productName.toLowerCase()));
        if (product) {
          setTimeout(() => setSelectedProduct(product), 500);
        }
      } else if (act.action === "add_to_cart") {
        let targetProduct: AssistantProduct | undefined;
        for (const group of resultGroups) {
          targetProduct = group.products.find(p => p.name.toLowerCase().includes(act.productName.toLowerCase()));
          if (targetProduct) break;
        }
        if (!targetProduct) {
          targetProduct = products.find(p => p.name.toLowerCase().includes(act.productName.toLowerCase()));
        }
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

      const { products: parsed, commentary } = parseProducts(assistantSoFar);
      const actions = parseActions(assistantSoFar);
      const newGroup: ResultGroup = { query: text.trim(), commentary, products: parsed };

      setResultGroups((prev) => [newGroup, ...prev]);
      setMessages((prev) => [...prev, { role: "assistant", content: assistantSoFar }]);
      setState("results");

      if (actions.length > 0) handleActions(actions, parsed);
      
      // Show products immediately while TTS plays simultaneously
      setShowProducts(true);
      if (commentary) playTTS(commentary);

      // Auto-restart listening if continuous mode is on
      if (shouldRestartRef.current) {
        setTimeout(() => {
          startRecordingInternal();
        }, 500);
      }
    } catch (e) {
      console.error("Chat error:", e);
      setState(resultGroups.length > 0 ? "results" : "idle");
      if (shouldRestartRef.current) {
        setTimeout(() => startRecordingInternal(), 500);
      }
    }
  }, [messages, sessionId, conversationId, playTTS, resultGroups.length, handleActions]);

  // VAD stop ref
  const vadStopRef = useRef<() => void>(() => {});

  const doStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    vadStopRef.current();
  }, []);

  const vad = useVAD(doStopRecording, 2500, 0.015);
  vadStopRef.current = vad.stop;

  // Internal start recording
  const startRecordingInternal = useCallback(async () => {
    try {
      // Barge-in: stop any playing TTS when user starts speaking
      stopTTS();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setActiveStream(stream);
      setAvatarState("listening");
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setActiveStream(null);
        setAvatarState("idle");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        if (audioBlob.size < 1000) {
          if (shouldRestartRef.current) {
            setTimeout(() => startRecordingInternal(), 300);
          }
          return;
        }
        
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
            if (data.transcript?.trim()) {
              send(data.transcript.trim());
              return;
            }
          }
          setState(resultGroups.length > 0 ? "results" : "idle");
          if (shouldRestartRef.current) {
            setTimeout(() => startRecordingInternal(), 300);
          }
        } catch {
          setState(resultGroups.length > 0 ? "results" : "idle");
          if (shouldRestartRef.current) {
            setTimeout(() => startRecordingInternal(), 300);
          }
        }
      };

      mediaRecorder.start();
      setState("listening");
      vad.start(stream);
    } catch (e) { console.error("Mic access error:", e); }
  }, [send, resultGroups.length, vad, stopTTS]);

  const startRecording = useCallback(() => {
    shouldRestartRef.current = true;
    setContinuousListening(true);
    startRecordingInternal();
  }, [startRecordingInternal]);

  const stopEverything = useCallback(() => {
    shouldRestartRef.current = false;
    setContinuousListening(false);
    stopTTS();
    setAvatarState("idle");
    doStopRecording();
    setState(resultGroups.length > 0 ? "results" : "idle");
  }, [doStopRecording, resultGroups.length, stopTTS]);

  const toggleVoice = () => {
    setVoiceEnabled((v) => !v);
    if (audioRef.current) audioRef.current.pause();
  };

  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  const welcomeSentRef = useRef(false);

  // Auto-trigger welcome with greeting TTS first, then products
  useEffect(() => {
    if (welcomeSentRef.current) return;
    welcomeSentRef.current = true;

    const triggerWelcome = async () => {
      // Play greeting TTS while fetching products
      const greetingPromise = playTTS("Hello! Main Priya hoon, aapki personal shopping assistant. Aaj main aapko Bella Vita ke best products dikhati hoon.");

      const welcomePrompt = "Hi, show me top selling Bella Vita products";
      setLastQuery(welcomePrompt);
      setState("searching");

      const userMsg: Msg = { role: "user", content: welcomePrompt };
      let assistantSoFar = "";

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: [{ role: "user", content: welcomePrompt }],
            sessionId, conversationId,
          }),
        });

        const convIdHeader = resp.headers.get("X-Conversation-Id");
        if (convIdHeader && !conversationId) setConversationId(convIdHeader);

        if (!resp.ok) { setState("idle"); setIsWelcomeLoading(false); return; }

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
            } catch {}
          }
        }

        const { products: parsed, commentary } = parseProducts(assistantSoFar);
        const actions = parseActions(assistantSoFar);
        const newGroup: ResultGroup = { query: "Welcome", commentary, products: parsed };

        setResultGroups([newGroup]);
        setMessages([userMsg, { role: "assistant", content: assistantSoFar }]);
        setState("results");
        setIsWelcomeLoading(false);

        if (actions.length > 0) handleActions(actions, parsed);

        // Show products immediately while greeting TTS plays
        await greetingPromise;
        setShowProducts(true);
      } catch (e) {
        console.error("Welcome message error:", e);
        setState("idle");
        setIsWelcomeLoading(false);
        setShowProducts(true);
      }
    };

    triggerWelcome();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasResults = resultGroups.length > 0;
  const isProcessing = state === "transcribing" || state === "searching";
  const isAvatarPhase = !showProducts;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Minimal header */}
      <div className="flex items-center justify-end px-4 py-2 bg-background">
        <div className="flex items-center gap-1">
          <button onClick={toggleVoice} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors">
            {voiceEnabled ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </button>
          <button onClick={() => setCartOpen(true)} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors relative">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">{totalItems}</span>
            )}
          </button>
        </div>
      </div>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* ===== PHASE 1: Avatar Mode ===== */}
      {isAvatarPhase && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 transition-all duration-500">
          <TalkingAvatar state={avatarState} size="large" />

          {isWelcomeLoading && (
            <div className="flex items-center gap-2 mt-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Finding products for you...</span>
            </div>
          )}

          {/* Mic button in avatar phase - always visible so user can interrupt */}
          {!isWelcomeLoading && !isProcessing && (
            <div className="mt-4">
              <VoiceButton
                isListening={continuousListening && state === "listening"}
                onToggle={continuousListening ? stopEverything : startRecording}
              />
            </div>
          )}

          {/* Waveform when listening */}
          {state === "listening" && activeStream && (
            <AudioWaveform stream={activeStream} isActive={true} barCount={32} className="max-w-[240px] mx-auto" />
          )}

          {isProcessing && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {state === "transcribing" ? "Processing your voice..." : "Finding products..."}
              </p>
              <button onClick={stopEverything} className="text-xs text-muted-foreground underline hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== PHASE 2: Products Mode ===== */}
      {showProducts && hasResults && (
        <>
          {/* Small avatar at top */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border animate-fade-in">
            <TalkingAvatar state={avatarState} size="small" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Priya</p>
              <p className="text-sm font-medium text-foreground truncate">
                {avatarState === "speaking" ? "Priya is speaking..." : "Here are your results"}
              </p>
            </div>
          </div>

          {/* Product grid */}
          <div className="animate-fade-in">
            <ProductResults resultGroups={resultGroups} onProductClick={setSelectedProduct} />
          </div>

          {/* Compact bottom bar */}
          <div className="border-t border-border bg-background mb-16 px-4 py-2 flex items-center gap-3">
            <VoiceButton
              isListening={continuousListening}
              onToggle={continuousListening ? stopEverything : startRecording}
              size="small"
            />
            <div className="flex-1 min-w-0">
              {state === "listening" && activeStream ? (
                <AudioWaveform stream={activeStream} isActive={true} barCount={20} className="h-[32px]" />
              ) : isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">{state === "transcribing" ? "Processing..." : "Searching..."}</span>
                </div>
              ) : !continuousListening ? (
                <span className="text-xs text-muted-foreground">Tap mic to continue</span>
              ) : (
                <span className="text-xs text-muted-foreground">Listening...</span>
              )}
            </div>
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
