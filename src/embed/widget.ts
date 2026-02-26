/**
 * Embeddable AI Chat Widget — zero-dependency, self-contained.
 * Renders inside a Shadow DOM so host page styles don't leak in.
 */
import { WidgetConfig, Msg, ActionBlock } from "./types";
import { getWidgetStyles } from "./styles";
import { ICONS } from "./icons";
import { isShopify, addToCartByProduct, shopifyNavigate, shopifyGoToCheckout, shopifyGoToCart, fetchProductByHandle, extractHandle } from "./shopify";

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

// Parse :::product and :::action blocks
// Track product cards for live enrichment on Shopify
let productCardCounter = 0;
const pendingEnrichments: { cardId: string; handle: string }[] = [];

function parseContent(content: string, onAction?: (action: ActionBlock) => void): string {
  const parts: string[] = [];
  const regex = /:::(product|action)\n([\s\S]*?):::/g;
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
    const blockType = match[1];
    const props: Record<string, string> = {};
    match[2].split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i > 0) { const k = line.slice(0, i).trim(); const v = line.slice(i + 1).trim(); if (k && v) props[k] = v; }
    });

    if (blockType === "product") {
      const cardId = `pc-${++productCardCounter}`;
      const handle = props.link ? extractHandle(props.link) : null;
      if (handle) {
        pendingEnrichments.push({ cardId, handle });
      }
      productBuffer.push(renderProductCard(props, cardId));
    } else if (blockType === "action" && onAction) {
      onAction(props as unknown as ActionBlock);
    }

    lastIndex = regex.lastIndex;
  }
  flushProducts();
  const remaining = content.slice(lastIndex).trim();
  if (remaining) parts.push(`<p>${miniMarkdown(remaining)}</p>`);
  return parts.join("");
}

function renderProductCard(p: Record<string, string>, cardId?: string): string {
  const img = p.image ? `<img class="aicw-product-img" src="${p.image}" alt="${p.name || ""}" loading="lazy" onerror="this.style.display='none'"/>` : "";
  const price = p.discount_price || p.price || "";
  const old = p.discount_price && p.price ? `<span class="aicw-product-old">${p.price}</span>` : "";
  const idAttr = cardId ? ` data-product-card="${cardId}"` : "";
  return `<div class="aicw-product"${idAttr}>${img}<div class="aicw-product-body"><div class="aicw-product-name">${p.name || "Product"}</div><div class="aicw-product-price">${price}${old}</div><a class="aicw-product-link" href="${p.link || "#"}" target="_blank" rel="noopener">${ICONS.link} View Details</a></div></div>`;
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
    platform,
  } = config;

  // Detect platform: explicit config > auto-detect > generic
  const isShopifyPlatform = platform === "shopify" || (platform === undefined && isShopify());

  const chatUrl = `${apiUrl}/functions/v1/chat`;
  const sessionId = generateSessionId();
  let conversationId: string | null = null;
  let messages: Msg[] = [];
  let isLoading = false;
  let isOpen = false;
  let pendingActions: ActionBlock[] = [];

  // Handle parsed action blocks from AI responses — execute immediately during streaming
  function handleAction(action: ActionBlock) {
    pendingActions.push(action);
    // Execute immediately so actions fire while Priya is still speaking
    executePendingActions();
  }

  // Execute collected actions after render
  async function executePendingActions() {
    const actions = [...pendingActions];
    pendingActions = [];

    for (const action of actions) {
      if (!isShopifyPlatform) {
        showToast("This action works on the Shopify store", "info");
        continue;
      }

      switch (action.type) {
        case "add_to_cart": {
          if (action.product_name) {
            showToast(`Adding ${action.product_name} to cart...`, "info");
            const result = await addToCartByProduct(action.product_name, action.product_link);
            showToast(result.message, result.success ? "success" : "error");
            const feedbackMsg: Msg = { role: "assistant", content: result.message };
            messages = [...messages, feedbackMsg];
            render();
          }
          break;
        }
        case "open_product": {
          const link = action.product_link;
          if (link) {
            showToast("Opening product...", "info");
            shopifyNavigate(link);
          }
          break;
        }
        case "navigate_to_checkout":
          showToast("Going to checkout...", "info");
          shopifyGoToCheckout();
          break;
        case "navigate_to_cart":
          showToast("Opening cart...", "info");
          shopifyGoToCart();
          break;
        case "schedule_call": {
          if (action.phone_number && action.scheduled_time) {
            console.log("[CALLBACK] Scheduling call:", action.phone_number, action.scheduled_time);
            showToast("Scheduling callback...", "info");
            fetch(`${apiUrl}/functions/v1/schedule-call`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({
                phone_number: action.phone_number,
                scheduled_time: action.scheduled_time,
                conversation_id: conversationId,
                session_id: sessionId,
                context_summary: action.context || "",
              }),
            })
              .then((r) => {
                if (!r.ok) {
                  console.error("[CALLBACK] schedule-call returned:", r.status);
                  showToast("Failed to schedule callback", "error");
                  return null;
                }
                return r.json();
              })
              .then((data) => {
                if (!data) return;
                if (data.success) {
                  console.log("[CALLBACK] Scheduled successfully:", data);
                  showToast(`Callback scheduled for ${action.scheduled_time}!`, "success");
                } else {
                  console.error("[CALLBACK] Error:", data);
                  showToast("Failed to schedule callback", "error");
                }
              })
              .catch((err) => {
                console.error("[CALLBACK] Failed:", err);
                showToast("Failed to schedule callback", "error");
              });
          }
          break;
        }
      }
    }
  }

  // Enrich product cards with live Shopify data
  async function enrichProductCards() {
    if (!isShopifyPlatform || pendingEnrichments.length === 0) {
      pendingEnrichments.length = 0;
      return;
    }
    const items = [...pendingEnrichments];
    pendingEnrichments.length = 0;

    for (const { cardId, handle } of items) {
      try {
        const product = await fetchProductByHandle(handle);
        if (!product) continue;
        const card = root.querySelector(`[data-product-card="${cardId}"]`);
        if (!card) continue;

        // Update image
        const img = card.querySelector(".aicw-product-img") as HTMLImageElement;
        if (img && product.image) {
          img.src = product.image;
        } else if (!img && product.image) {
          const newImg = document.createElement("img");
          newImg.className = "aicw-product-img";
          newImg.src = product.image;
          newImg.alt = product.title;
          newImg.loading = "lazy";
          card.insertBefore(newImg, card.firstChild);
        }

        // Update price
        const priceEl = card.querySelector(".aicw-product-price");
        if (priceEl) {
          const livePrice = `₹${product.price}`;
          const oldPrice = product.compare_at_price ? `<span class="aicw-product-old">₹${product.compare_at_price}</span>` : "";
          priceEl.innerHTML = `${livePrice}${oldPrice}`;
        }
      } catch {}
    }
  }


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

  // Toast notification system
  function showToast(message: string, type: "success" | "info" | "error" = "info") {
    const icons: Record<string, string> = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    };
    const toast = document.createElement("div");
    toast.className = `aicw-toast aicw-toast-${type}`;
    toast.innerHTML = `${icons[type]}<span>${message}</span>`;
    shadow.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("aicw-toast-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

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
      return `<div class="aicw-msg aicw-msg-${cls}"><div class="aicw-bubble aicw-bubble-${cls}">${m.role === "user" ? miniMarkdown(m.content) : parseContent(m.content, handleAction)}</div></div>`;
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
      // Enrich product cards with live Shopify data
      enrichProductCards();
      // Actions are now executed immediately during streaming via handleAction()
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
