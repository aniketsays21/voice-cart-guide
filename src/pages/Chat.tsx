import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Mic, MicOff, Volume2, VolumeX, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import ChatMessage from "@/components/chat/ChatMessage";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-stt`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-tts`;

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();
  const [sessionId] = useState(generateSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // TTS playback
  const playTTS = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    try {
      // Detect language - simple heuristic
      const hasHindi = /[\u0900-\u097F]/.test(text);
      const langCode = hasHindi ? "hi-IN" : "en-IN";

      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, target_language_code: langCode }),
      });

      if (!resp.ok) return;
      const data = await resp.json();
      if (!data.audio) return;

      const audioSrc = `data:audio/wav;base64,${data.audio}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
    } catch (e) {
      console.error("TTS playback error:", e);
      setIsPlaying(false);
    }
  }, [voiceEnabled]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      const userMsg: Msg = { role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

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
          const err = await resp.json().catch(() => ({ error: "Something went wrong" }));
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: err.error || "Sorry, something went wrong. Please try again." },
          ]);
          setIsLoading(false);
          return;
        }

        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        const upsert = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

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
              if (content) upsert(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } catch (e) {
        console.error("Chat error:", e);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Connection error. Please try again." },
        ]);
      } finally {
        setIsLoading(false);
        // Play TTS for assistant response
        if (assistantSoFar) {
          playTTS(assistantSoFar);
        }
      }
    },
    [messages, isLoading, sessionId, conversationId, playTTS]
  );

  // Recording logic
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
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic access error:", e);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
      });

      const resp = await fetch(STT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ audio: base64 }),
      });

      if (!resp.ok) {
        console.error("STT failed:", resp.status);
        setIsTranscribing(false);
        return;
      }

      const data = await resp.json();
      if (data.transcript?.trim()) {
        send(data.transcript.trim());
      }
    } catch (e) {
      console.error("Transcription error:", e);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled((v) => !v);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[hsl(var(--chat-widget))] text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="h-5 w-5" />
          <span className="font-semibold text-sm">Shopping Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleVoice}
            className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="h-7 w-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors relative"
            title="Cart"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-3">
              👋 Hi! I'm your shopping assistant.
            </p>
            <p className="text-muted-foreground text-xs">
              Tell me what you're looking for or tap the mic to speak!
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {["Show me electronics", "I need a gift under ₹1000", "मुझे फोन चाहिए"].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-accent text-accent-foreground rounded-full px-3 py-1.5 hover:opacity-80 transition-opacity"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start mb-3">
            <div className="bg-[hsl(var(--chat-assistant))] rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        {isPlaying && (
          <div className="flex justify-start mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span>Speaking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-3 mb-16">
        {isTranscribing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Transcribing...</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring max-h-24"
          />
          {/* Mic button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing || isLoading}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-50 ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
            title={isRecording ? "Stop recording" : "Tap to speak"}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          {/* Send button */}
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-full bg-[hsl(var(--chat-widget))] text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Inline icon to avoid extra import
const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

export default Chat;
