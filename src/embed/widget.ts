/**
 * Embeddable AI Chat Widget — zero-dependency, self-contained.
 * Renders inside a Shadow DOM so host page styles don't leak in.
 */
import { WidgetConfig, Msg } from "./types";
import { getWidgetStyles } from "./styles";
import { ICONS } from "./icons";

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Simple markdown: **bold**, *italic*, \n → <br>
function miniMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

// Parse :::product blocks
function parseContent(content: string): string {
  const parts: string[] = [];
  const regex = /:::product\n([\s\S]*?):::/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let productBuffer: string[] = [];

  const flushProducts = () => {
    if (productBuffer.length) {
      parts.push(`<div class="aicw-products">${productBuffer.join("")}</div>`);
      productBuffer = [];
    }
  };

  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index).trim();
    if (before) { flushProducts(); parts.push(`<p>${miniMarkdown(before)}</p>`); }
    const props: Record<string, string> = {};
    match[1].split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i > 0) { const k = line.slice(0, i).trim(); const v = line.slice(i + 1).trim(); if (k && v) props[k] = v; }
    });
    productBuffer.push(renderProductCard(props));
    lastIndex = regex.lastIndex;
  }
  flushProducts();
  const remaining = content.slice(lastIndex).trim();
  if (remaining) parts.push(`<p>${miniMarkdown(remaining)}</p>`);
  return parts.join("");
}

function renderProductCard(p: Record<string, string>): string {
  const img = p.image ? `<img class="aicw-product-img" src="${p.image}" alt="${p.name || ""}" loading="lazy" onerror="this.style.display='none'"/>` : "";
  const price = p.discount_price || p.price || "";
  const old = p.discount_price && p.price ? `<span class="aicw-product-old">${p.price}</span>` : "";
  return `<div class="aicw-product">${img}<div class="aicw-product-body"><div class="aicw-product-name">${p.name || "Product"}</div><div class="aicw-product-price">${price}${old}</div><a class="aicw-product-link" href="${p.link || "#"}" target="_blank" rel="noopener">${ICONS.link} View Details</a></div></div>`;
}

export function createWidget(config: WidgetConfig) {
  const {
    apiUrl,
    apiKey,
    storeId,
    primaryColor = "#6c3beb",
    title = "Shopping Assistant",
    welcomeMessage = "👋 Hi! I'm your shopping assistant.",
    suggestions = ["Show me electronics", "I need a gift under ₹1000"],
    position = "bottom-right",
    zIndex = 99999,
  } = config;

  const chatUrl = `${apiUrl}/functions/v1/chat`;
  const sessionId = generateSessionId();
  let conversationId: string | null = null;
  let messages: Msg[] = [];
  let isLoading = false;
  let isOpen = false;

  // Create host element
  const host = document.createElement("div");
  host.id = "ai-chat-widget";
  host.style.position = "fixed";
  host.style[position === "bottom-left" ? "left" : "right"] = "24px";
  host.style.bottom = "24px";
  host.style.zIndex = String(zIndex);
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  // Inject styles
  const style = document.createElement("style");
  style.textContent = getWidgetStyles(primaryColor);
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "aicw-root";
  shadow.appendChild(root);

  function render() {
    if (!isOpen) {
      root.innerHTML = `<button class="aicw-fab" aria-label="Open chat">${ICONS.chat}</button>`;
      root.querySelector(".aicw-fab")!.addEventListener("click", () => { isOpen = true; render(); });
      return;
    }

    const suggestionsHtml = messages.length === 0
      ? `<div class="aicw-empty"><p>${welcomeMessage}</p><p style="font-size:12px;color:#9ca3af;">Tell me what you're looking for!</p><div class="aicw-suggestions">${suggestions.map((s, i) => `<button class="aicw-suggestion" data-idx="${i}">${s}</button>`).join("")}</div></div>`
      : "";

    const messagesHtml = messages.map((m) => {
      const cls = m.role === "user" ? "user" : "assistant";
      return `<div class="aicw-msg aicw-msg-${cls}"><div class="aicw-bubble aicw-bubble-${cls}">${m.role === "user" ? miniMarkdown(m.content) : parseContent(m.content)}</div></div>`;
    }).join("");

    const loadingHtml = isLoading && messages[messages.length - 1]?.role !== "assistant"
      ? `<div class="aicw-loading"><div class="aicw-loading-dot"><span class="aicw-dot"></span><span class="aicw-dot"></span><span class="aicw-dot"></span></div></div>`
      : "";

    root.innerHTML = `
      <div class="aicw-panel">
        <div class="aicw-header">
          <div class="aicw-header-title">${ICONS.chat}<span>${title}</span></div>
          <button class="aicw-close" aria-label="Close">${ICONS.close}</button>
        </div>
        <div class="aicw-messages">${suggestionsHtml}${messagesHtml}${loadingHtml}<div class="aicw-scroll-anchor"></div></div>
        <div class="aicw-input-area">
          <textarea class="aicw-textarea" placeholder="Type a message..." rows="1"></textarea>
          <button class="aicw-send" aria-label="Send"${isLoading ? " disabled" : ""}>${ICONS.send}</button>
        </div>
        <div class="aicw-powered">Powered by AI</div>
      </div>`;

    // Scroll
    const anchor = root.querySelector(".aicw-scroll-anchor") as HTMLElement;
    anchor?.scrollIntoView({ behavior: "smooth" });

    // Events
    root.querySelector(".aicw-close")!.addEventListener("click", () => { isOpen = false; render(); });

    const textarea = root.querySelector(".aicw-textarea") as HTMLTextAreaElement;
    const sendBtn = root.querySelector(".aicw-send") as HTMLButtonElement;
    textarea?.focus();

    const doSend = () => { const v = textarea?.value?.trim(); if (v) send(v); };
    sendBtn?.addEventListener("click", doSend);
    textarea?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
    });

    // Suggestion clicks
    root.querySelectorAll(".aicw-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => send((btn as HTMLElement).textContent || ""));
    });
  }

  async function send(text: string) {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    messages = [...messages, userMsg];
    isLoading = true;
    render();

    let assistantSoFar = "";

    try {
      const resp = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          sessionId,
          conversationId,
          storeId,
        }),
      });

      const convIdHeader = resp.headers.get("X-Conversation-Id");
      if (convIdHeader && !conversationId) conversationId = convIdHeader;

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Something went wrong" }));
        messages = [...messages, { role: "assistant", content: err.error || "Sorry, something went wrong." }];
        isLoading = false;
        render();
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const last = messages[messages.length - 1];
        if (last?.role === "assistant") {
          messages = messages.map((m, i) => i === messages.length - 1 ? { ...m, content: assistantSoFar } : m);
        } else {
          messages = [...messages, { role: "assistant", content: assistantSoFar }];
        }
        render();
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
      console.error("AI Chat Widget error:", e);
      messages = [...messages, { role: "assistant", content: "Connection error. Please try again." }];
    } finally {
      isLoading = false;
      render();
    }
  }

  // Initial render
  render();

  // Return API for programmatic control
  return {
    open: () => { isOpen = true; render(); },
    close: () => { isOpen = false; render(); },
    destroy: () => { host.remove(); },
  };
}
