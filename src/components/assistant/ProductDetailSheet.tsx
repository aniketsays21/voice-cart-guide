import React, { useState, useRef, useCallback } from "react";
import { X, Star, Check, ShoppingCart, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import AssistantInput from "./AssistantInput";
import type { AssistantProduct } from "./ProductResults";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarvam-stt`;

interface ProductDetailSheetProps {
  product: AssistantProduct | null;
  open: boolean;
  onClose: () => void;
  sessionId: string;
  conversationId: string | null;
}

interface PdpMessage {
  role: "user" | "assistant";
  content: string;
}

const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  product, open, onClose, sessionId, conversationId,
}) => {
  const { addToCart, isInCart } = useCart();
  const [pdpMessages, setPdpMessages] = useState<PdpMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sendPdpQuestion = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !product) return;
    const contextualMsg = `[The user is viewing the product "${product.name}" priced at ${product.price}. They ask:] ${text.trim()}`;

    const userMsg: PdpMessage = { role: "user", content: text.trim() };
    setPdpMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const allMessages = [
        ...pdpMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: contextualMsg },
      ];

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, sessionId, conversationId }),
      });

      if (!resp.ok) { setIsLoading(false); return; }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
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
            if (content) assistantText += content;
          } catch {
            // incomplete JSON, skip
          }
        }
      }

      const cleanText = assistantText.replace(/:::product[\s\S]*?:::/g, "").replace(/\n{3,}/g, "\n\n").trim();
      setPdpMessages((prev) => [...prev, { role: "assistant", content: cleanText }]);
    } catch (e) {
      console.error("PDP chat error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, product, pdpMessages, sessionId, conversationId]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        setIsTranscribing(true);
        try {
          const fileReader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            fileReader.onloadend = () => resolve((fileReader.result as string).split(",")[1]);
            fileReader.readAsDataURL(audioBlob);
          });
          const resp = await fetch(STT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ audio: base64 }),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.transcript?.trim()) { sendPdpQuestion(data.transcript.trim()); }
          }
        } catch {
          // STT error
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic error:", e);
    }
  }, [sendPdpQuestion]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleClose = () => {
    onClose();
    setPdpMessages([]);
  };

  if (!product) return null;

  const productId = `${product.name}-${product.link}`.replace(/\s+/g, "_").toLowerCase();
  const inCart = isInCart(productId);
  const numericPrice = parseFloat(product.price.replace(/[^\d.]/g, "")) || 0;
  const numericDiscount = product.discountPrice ? parseFloat(product.discountPrice.replace(/[^\d.]/g, "")) : null;
  const discountPercent = numericDiscount ? Math.round(((numericPrice - numericDiscount) / numericPrice) * 100) : null;
  const ratingNum = product.rating ? parseFloat(product.rating) : null;

  const handleAdd = async () => {
    if (inCart) return;
    await addToCart({ id: productId, name: product.name, price: numericPrice, image: product.image, link: product.link });
    toast.success(`${product.name} added to cart!`, { duration: 2000 });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0 flex flex-col">
        <SheetTitle className="sr-only">{product.name}</SheetTitle>
        <button onClick={handleClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center border border-border">
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto">
          {/* Product image */}
          <div className="relative aspect-[4/3] bg-secondary">
            {product.image && (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            {discountPercent && discountPercent > 0 && (
              <span className="absolute bottom-3 left-3 bg-[hsl(145,60%,35%)] text-white text-xs font-bold px-3 py-1 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Details */}
          <div className="px-4 py-4">
            {product.description && (
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.description}</p>
            )}
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>

            {ratingNum && (
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="h-4 w-4 fill-[hsl(45,90%,50%)] text-[hsl(45,90%,50%)]" />
                <span className="text-sm font-medium text-foreground">{ratingNum}</span>
                <span className="text-xs text-muted-foreground">| ✓ Verified</span>
              </div>
            )}

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-foreground">{product.discountPrice || product.price}</span>
              {product.discountPrice && (
                <span className="text-sm text-muted-foreground line-through">{product.price}</span>
              )}
            </div>

            {product.discountCode && (
              <div className="mt-2 text-xs bg-accent text-accent-foreground rounded px-3 py-1 inline-block">
                Code: {product.discountCode} (auto-applied)
              </div>
            )}

            <button
              onClick={handleAdd}
              className={`mt-4 flex items-center justify-center gap-2 w-full text-sm font-semibold uppercase tracking-wider rounded-xl py-3.5 transition-opacity ${
                inCart ? "bg-accent text-accent-foreground" : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {inCart ? (<><Check className="h-4 w-4" /> In Cart</>) : (<><ShoppingCart className="h-4 w-4" /> Add to Cart</>)}
            </button>
          </div>

          {/* AI Q&A section */}
          {pdpMessages.length > 0 && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Questions about this product</p>
              {pdpMessages.map((m, i) => (
                <div key={i} className={`rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-primary/10 text-foreground ml-8" : "bg-accent text-accent-foreground mr-4"
                }`}>
                  {m.content}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <AssistantInput
            onSend={sendPdpQuestion}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            isLoading={isLoading}
            placeholder="Ask about this product..."
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductDetailSheet;
