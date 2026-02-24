import React from "react";
import ReactMarkdown from "react-markdown";
import ProductCard from "./ProductCard";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

function parseProductCards(content: string) {
  const parts: Array<{ type: "text"; value: string } | { type: "product"; props: Record<string, string> }> = [];
  const regex = /:::product\n([\s\S]*?):::/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
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
    parts.push({ type: "product", props });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === "user";
  const parts = isUser ? [{ type: "text" as const, value: content }] : parseProductCards(content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[hsl(var(--chat-user))] text-[hsl(var(--chat-user-foreground))] rounded-br-md"
            : "bg-[hsl(var(--chat-assistant))] text-[hsl(var(--chat-assistant-foreground))] rounded-bl-md"
        }`}
      >
        {parts.map((part, i) =>
          part.type === "product" ? (
            <ProductCard
              key={i}
              name={part.props.name || "Product"}
              price={part.props.price || ""}
              discountPrice={part.props.discount_price}
              discountCode={part.props.discount_code}
              image={part.props.image}
              link={part.props.link || "#"}
              rating={part.props.rating}
            />
          ) : (
            <div key={i} className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-1 [&>p:last-child]:mb-0">
              <ReactMarkdown>{part.value.trim()}</ReactMarkdown>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
