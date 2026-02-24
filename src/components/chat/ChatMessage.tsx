import React from "react";
import ReactMarkdown from "react-markdown";
import ProductCard from "./ProductCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

function parseProductCards(content: string) {
  const parts: Array<{ type: "text"; value: string } | { type: "products"; items: Record<string, string>[] }> = [];
  const regex = /:::product\n([\s\S]*?):::/g;
  let lastIndex = 0;
  let match;
  let pendingProducts: Record<string, string>[] = [];

  const flushProducts = () => {
    if (pendingProducts.length > 0) {
      parts.push({ type: "products", items: [...pendingProducts] });
      pendingProducts = [];
    }
  };

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      flushProducts();
      parts.push({ type: "text", value: textBefore });
    }

    const props: Record<string, string> = {};
    match[1].split("\n").forEach((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        if (key && val) props[key] = val;
      }
    });
    pendingProducts.push(props);
    lastIndex = regex.lastIndex;
  }

  flushProducts();

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) parts.push({ type: "text", value: remaining });
  }

  return parts;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === "user";
  const parts = isUser ? [{ type: "text" as const, value: content }] : parseProductCards(content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[hsl(var(--chat-user))] text-[hsl(var(--chat-user-foreground))] rounded-br-md"
            : "bg-[hsl(var(--chat-assistant))] text-[hsl(var(--chat-assistant-foreground))] rounded-bl-md"
        }`}
      >
        {parts.map((part, i) =>
          part.type === "products" ? (
            <div key={i} className="grid grid-cols-2 gap-2 my-2">
              {(part as any).items.map((p: Record<string, string>, j: number) => (
                <ProductCard
                  key={j}
                  name={p.name || "Product"}
                  price={p.price || ""}
                  discountPrice={p.discount_price}
                  discountCode={p.discount_code}
                  image={p.image}
                  link={p.link || "#"}
                  rating={p.rating}
                  description={p.description}
                />
              ))}
            </div>
          ) : (
            <div key={i} className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-1 [&>p:last-child]:mb-0">
              <ReactMarkdown>{(part as any).value}</ReactMarkdown>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
