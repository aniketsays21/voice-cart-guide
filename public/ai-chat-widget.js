/**
 * AI Chat Widget — Self-contained embeddable bundle (IIFE)
 * Drop this script on any website (Shopify, WordPress, etc.)
 *
 * Configuration via window.AIChatConfig or data-* attributes on the script tag.
 */
(function () {
  "use strict";

  // ── Icons (inline SVG) ──────────────────────────────────────────────
  var ICONS = {
    chat: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
  };

  // ── Styles ───────────────────────────────────────────────────────────
  function getWidgetStyles(primaryColor) {
    return "\
    .aicw-root {\
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\
      font-size: 14px;\
      line-height: 1.5;\
      color: #1a1a2e;\
      box-sizing: border-box;\
    }\
    .aicw-root *, .aicw-root *::before, .aicw-root *::after {\
      box-sizing: border-box;\
    }\
    .aicw-fab {\
      width: 56px; height: 56px;\
      border-radius: 50%;\
      background: " + primaryColor + ";\
      color: #fff;\
      border: none;\
      cursor: pointer;\
      display: flex; align-items: center; justify-content: center;\
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);\
      transition: transform 0.2s;\
    }\
    .aicw-fab:hover { transform: scale(1.08); }\
    .aicw-fab svg { width: 24px; height: 24px; }\
    .aicw-panel {\
      width: 380px; max-width: calc(100vw - 2rem);\
      height: 560px; max-height: calc(100vh - 3rem);\
      border-radius: 16px;\
      border: 1px solid #e5e7eb;\
      background: #fff;\
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);\
      display: flex; flex-direction: column;\
      overflow: hidden;\
    }\
    .aicw-header {\
      display: flex; align-items: center; justify-content: space-between;\
      padding: 12px 16px;\
      background: " + primaryColor + ";\
      color: #fff;\
    }\
    .aicw-header-title {\
      display: flex; align-items: center; gap: 8px;\
      font-weight: 600; font-size: 14px;\
    }\
    .aicw-header-title svg { width: 20px; height: 20px; }\
    .aicw-close {\
      width: 28px; height: 28px;\
      border-radius: 50%; border: none;\
      background: rgba(255,255,255,0.15);\
      color: #fff; cursor: pointer;\
      display: flex; align-items: center; justify-content: center;\
      transition: background 0.2s;\
    }\
    .aicw-close:hover { background: rgba(255,255,255,0.3); }\
    .aicw-close svg { width: 16px; height: 16px; }\
    .aicw-messages {\
      flex: 1; overflow-y: auto;\
      padding: 12px 16px;\
    }\
    .aicw-empty { text-align: center; padding: 32px 0; }\
    .aicw-empty p { color: #6b7280; font-size: 13px; margin: 0 0 4px; }\
    .aicw-suggestions {\
      display: flex; flex-wrap: wrap; gap: 8px;\
      justify-content: center; margin-top: 16px;\
    }\
    .aicw-suggestion {\
      font-size: 12px;\
      background: #f3f4f6; color: #374151;\
      border: none; border-radius: 999px;\
      padding: 6px 14px; cursor: pointer;\
      transition: opacity 0.2s;\
    }\
    .aicw-suggestion:hover { opacity: 0.75; }\
    .aicw-msg { display: flex; margin-bottom: 12px; }\
    .aicw-msg-user { justify-content: flex-end; }\
    .aicw-msg-assistant { justify-content: flex-start; }\
    .aicw-bubble {\
      max-width: 92%; padding: 10px 16px;\
      border-radius: 16px; font-size: 14px; line-height: 1.5;\
    }\
    .aicw-bubble-user {\
      background: " + primaryColor + "; color: #fff;\
      border-bottom-right-radius: 6px;\
    }\
    .aicw-bubble-assistant {\
      background: #f3f4f6; color: #1a1a2e;\
      border-bottom-left-radius: 6px;\
    }\
    .aicw-bubble p { margin: 0 0 4px; }\
    .aicw-bubble p:last-child { margin-bottom: 0; }\
    .aicw-loading {\
      display: flex; justify-content: flex-start; margin-bottom: 12px;\
    }\
    .aicw-loading-dot {\
      background: #f3f4f6; border-radius: 16px;\
      border-bottom-left-radius: 6px;\
      padding: 12px 20px;\
      display: flex; gap: 4px; align-items: center;\
    }\
    .aicw-dot {\
      width: 6px; height: 6px; border-radius: 50%;\
      background: #9ca3af;\
      animation: aicw-bounce 1.4s infinite;\
    }\
    .aicw-dot:nth-child(2) { animation-delay: 0.2s; }\
    .aicw-dot:nth-child(3) { animation-delay: 0.4s; }\
    @keyframes aicw-bounce {\
      0%, 80%, 100% { transform: translateY(0); }\
      40% { transform: translateY(-6px); }\
    }\
    .aicw-products { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }\
    .aicw-product {\
      border: 1px solid #e5e7eb; border-radius: 12px;\
      overflow: hidden; background: #fff;\
    }\
    .aicw-product-img {\
      width: 100%; aspect-ratio: 1; object-fit: cover;\
      background: #f3f4f6;\
    }\
    .aicw-product-body { padding: 10px; }\
    .aicw-product-name {\
      font-weight: 600; font-size: 13px;\
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\
    }\
    .aicw-product-price { font-weight: 700; font-size: 15px; margin-top: 6px; }\
    .aicw-product-old { font-size: 12px; color: #9ca3af; text-decoration: line-through; margin-left: 6px; }\
    .aicw-product-link {\
      display: flex; align-items: center; justify-content: center; gap: 4px;\
      margin-top: 8px; font-size: 11px; color: #6b7280;\
      text-decoration: none; transition: color 0.2s;\
    }\
    .aicw-product-link:hover { color: #1a1a2e; }\
    .aicw-product-link svg { width: 12px; height: 12px; }\
    .aicw-input-area {\
      border-top: 1px solid #e5e7eb;\
      padding: 12px;\
      display: flex; align-items: flex-end; gap: 8px;\
    }\
    .aicw-textarea {\
      flex: 1; resize: none;\
      border: 1px solid #e5e7eb; border-radius: 12px;\
      padding: 8px 12px; font-size: 14px;\
      font-family: inherit; max-height: 96px;\
      outline: none;\
      transition: border-color 0.2s;\
    }\
    .aicw-textarea:focus { border-color: " + primaryColor + "; }\
    .aicw-send {\
      width: 36px; height: 36px;\
      border-radius: 50%; border: none;\
      background: " + primaryColor + "; color: #fff;\
      cursor: pointer; flex-shrink: 0;\
      display: flex; align-items: center; justify-content: center;\
      transition: opacity 0.2s;\
    }\
    .aicw-send:disabled { opacity: 0.4; cursor: default; }\
    .aicw-send:not(:disabled):hover { opacity: 0.85; }\
    .aicw-send svg { width: 16px; height: 16px; }\
    .aicw-powered {\
      text-align: center; font-size: 10px; color: #9ca3af;\
      padding: 4px 0 8px;\
    }";
  }

  // ── Shopify helpers ─────────────────────────────────────────────────
  function isShopify() {
    try { return typeof window !== "undefined" && !!window.Shopify && !!window.Shopify.shop; } catch (e) { return false; }
  }

  function extractHandle(url) {
    var match = url.match(/\/products\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function fetchVariantId(handle) {
    return fetch("/products/" + handle + ".js")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && d.variants && d.variants[0] ? d.variants[0].id : null; })
      .catch(function () { return null; });
  }

  function shopifyAddToCart(variantId, quantity) {
    return fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: variantId, quantity: quantity || 1 }] })
    }).then(function (r) {
      if (!r.ok) return false;
      document.dispatchEvent(new CustomEvent("cart:refresh"));
      try {
        fetch("/cart.js").then(function (cr) { return cr.json(); }).then(function (cart) {
          document.querySelectorAll("[data-cart-count]").forEach(function (el) { el.textContent = String(cart.item_count); });
        });
      } catch (e) {}
      return true;
    }).catch(function () { return false; });
  }

  function shopifyNavigate(url) {
    if (url.startsWith("/") || url.includes(window.location.hostname)) {
      window.location.href = url;
    } else {
      var handle = extractHandle(url);
      if (handle) { window.location.href = "/products/" + handle; }
      else { window.open(url, "_blank"); }
    }
  }

  function shopifyGoToCheckout() { window.location.href = "/checkout"; }
  function shopifyGoToCart() { window.location.href = "/cart"; }

  function addToCartByProduct(productName, productLink) {
    var handle = null;
    if (productLink) handle = extractHandle(productLink);

    var p = handle ? Promise.resolve(handle) : fetch("/search/suggest.json?q=" + encodeURIComponent(productName) + "&resources[type]=product&resources[limit]=1")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var fp = d.resources && d.resources.results && d.resources.results.products && d.resources.results.products[0];
        return fp ? fp.handle : null;
      }).catch(function () { return null; });

    return (handle ? Promise.resolve(handle) : p).then(function (h) {
      if (!h) return { success: false, message: 'Could not find "' + productName + '" in the store.' };
      return fetchVariantId(h).then(function (vid) {
        if (!vid) return { success: false, message: 'Could not load product details for "' + productName + '".' };
        return shopifyAddToCart(vid).then(function (added) {
          return added
            ? { success: true, message: '"' + productName + '" has been added to your cart!' }
            : { success: false, message: 'Failed to add "' + productName + '" to cart. Please try again.' };
        });
      });
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  function generateSessionId() {
    return "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  function miniMarkdown(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  function renderProductCard(p) {
    var img = p.image ? '<img class="aicw-product-img" src="' + p.image + '" alt="' + (p.name || "") + '" loading="lazy" onerror="this.style.display=\'none\'"/>' : "";
    var price = p.discount_price || p.price || "";
    var old = (p.discount_price && p.price) ? '<span class="aicw-product-old">' + p.price + '</span>' : "";
    return '<div class="aicw-product">' + img + '<div class="aicw-product-body"><div class="aicw-product-name">' + (p.name || "Product") + '</div><div class="aicw-product-price">' + price + old + '</div><a class="aicw-product-link" href="' + (p.link || "#") + '" target="_blank" rel="noopener">' + ICONS.link + ' View Details</a></div></div>';
  }

  function parseContent(content, onAction) {
    var parts = [];
    var regex = /:::(product|action)\n([\s\S]*?):::/g;
    var lastIndex = 0;
    var match;
    var productBuffer = [];

    function flushProducts() {
      if (productBuffer.length) {
        parts.push('<div class="aicw-products">' + productBuffer.join("") + '</div>');
        productBuffer = [];
      }
    }

    while ((match = regex.exec(content)) !== null) {
      var before = content.slice(lastIndex, match.index).trim();
      if (before) { flushProducts(); parts.push("<p>" + miniMarkdown(before) + "</p>"); }
      var blockType = match[1];
      var props = {};
      match[2].split("\n").forEach(function (line) {
        var i = line.indexOf(":");
        if (i > 0) { var k = line.slice(0, i).trim(); var v = line.slice(i + 1).trim(); if (k && v) props[k] = v; }
      });

      if (blockType === "product") {
        productBuffer.push(renderProductCard(props));
      } else if (blockType === "action" && onAction) {
        onAction(props);
      }

      lastIndex = regex.lastIndex;
    }
    flushProducts();
    var remaining = content.slice(lastIndex).trim();
    if (remaining) parts.push("<p>" + miniMarkdown(remaining) + "</p>");
    return parts.join("");
  }

  // ── Widget ──────────────────────────────────────────────────────────
  function createWidget(config) {
    var apiUrl = config.apiUrl;
    var apiKey = config.apiKey;
    var storeId = config.storeId;
    var primaryColor = config.primaryColor || "#6c3beb";
    var title = config.title || "Shopping Assistant";
    var welcomeMessage = config.welcomeMessage || "\ud83d\udc4b Hi! I'm your shopping assistant.";
    var suggestions = config.suggestions || ["Show me electronics", "I need a gift under \u20b91000"];
    var position = config.position || "bottom-right";
    var zIndex = config.zIndex || 99999;
    var platform = config.platform;

    var isShopifyPlatform = platform === "shopify" || (platform === undefined && isShopify());
    var chatUrl = apiUrl + "/functions/v1/chat";
    var sessionId = generateSessionId();
    var conversationId = null;
    var messages = [];
    var isLoading = false;
    var isOpen = false;
    var pendingActions = [];

    function handleAction(action) { pendingActions.push(action); }

    function executePendingActions() {
      var actions = pendingActions.slice();
      pendingActions = [];
      actions.forEach(function (action) {
        if (!isShopifyPlatform) return;
        switch (action.type) {
          case "add_to_cart":
            if (action.product_name) {
              addToCartByProduct(action.product_name, action.product_link).then(function (result) {
                messages = messages.concat([{ role: "assistant", content: result.message }]);
                render();
              });
            }
            break;
          case "open_product":
            if (action.product_link) shopifyNavigate(action.product_link);
            break;
          case "navigate_to_checkout":
            shopifyGoToCheckout();
            break;
          case "navigate_to_cart":
            shopifyGoToCart();
            break;
        }
      });
    }

    // Create host element
    var host = document.createElement("div");
    host.id = "ai-chat-widget";
    host.style.position = "fixed";
    host.style[position === "bottom-left" ? "left" : "right"] = "24px";
    host.style.bottom = "24px";
    host.style.zIndex = String(zIndex);
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "closed" });

    var styleEl = document.createElement("style");
    styleEl.textContent = getWidgetStyles(primaryColor);
    shadow.appendChild(styleEl);

    var root = document.createElement("div");
    root.className = "aicw-root";
    shadow.appendChild(root);

    function render() {
      if (!isOpen) {
        root.innerHTML = '<button class="aicw-fab" aria-label="Open chat">' + ICONS.chat + '</button>';
        root.querySelector(".aicw-fab").addEventListener("click", function () { isOpen = true; render(); });
        return;
      }

      var suggestionsHtml = messages.length === 0
        ? '<div class="aicw-empty"><p>' + welcomeMessage + '</p><p style="font-size:12px;color:#9ca3af;">Tell me what you\'re looking for!</p><div class="aicw-suggestions">' + suggestions.map(function (s, i) { return '<button class="aicw-suggestion" data-idx="' + i + '">' + s + '</button>'; }).join("") + '</div></div>'
        : "";

      var messagesHtml = messages.map(function (m) {
        var cls = m.role === "user" ? "user" : "assistant";
        return '<div class="aicw-msg aicw-msg-' + cls + '"><div class="aicw-bubble aicw-bubble-' + cls + '">' + (m.role === "user" ? miniMarkdown(m.content) : parseContent(m.content, handleAction)) + '</div></div>';
      }).join("");

      var loadingHtml = isLoading && (!messages.length || messages[messages.length - 1].role !== "assistant")
        ? '<div class="aicw-loading"><div class="aicw-loading-dot"><span class="aicw-dot"></span><span class="aicw-dot"></span><span class="aicw-dot"></span></div></div>'
        : "";

      root.innerHTML = '\
        <div class="aicw-panel">\
          <div class="aicw-header">\
            <div class="aicw-header-title">' + ICONS.chat + '<span>' + title + '</span></div>\
            <button class="aicw-close" aria-label="Close">' + ICONS.close + '</button>\
          </div>\
          <div class="aicw-messages">' + suggestionsHtml + messagesHtml + loadingHtml + '<div class="aicw-scroll-anchor"></div></div>\
          <div class="aicw-input-area">\
            <textarea class="aicw-textarea" placeholder="Type a message..." rows="1"></textarea>\
            <button class="aicw-send" aria-label="Send"' + (isLoading ? " disabled" : "") + '>' + ICONS.send + '</button>\
          </div>\
          <div class="aicw-powered">Powered by AI</div>\
        </div>';

      var anchor = root.querySelector(".aicw-scroll-anchor");
      if (anchor) anchor.scrollIntoView({ behavior: "smooth" });

      root.querySelector(".aicw-close").addEventListener("click", function () { isOpen = false; render(); });

      var textarea = root.querySelector(".aicw-textarea");
      var sendBtn = root.querySelector(".aicw-send");
      if (textarea) textarea.focus();

      var doSend = function () { var v = textarea ? textarea.value.trim() : ""; if (v) send(v); };
      if (sendBtn) sendBtn.addEventListener("click", doSend);
      if (textarea) textarea.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
      });

      root.querySelectorAll(".aicw-suggestion").forEach(function (btn) {
        btn.addEventListener("click", function () { send(btn.textContent || ""); });
      });
    }

    function send(text) {
      if (!text.trim() || isLoading) return;
      var userMsg = { role: "user", content: text.trim() };
      messages = messages.concat([userMsg]);
      isLoading = true;
      render();

      var assistantSoFar = "";

      fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
          messages: messages.map(function (m) { return { role: m.role, content: m.content }; }),
          sessionId: sessionId,
          conversationId: conversationId,
          storeId: storeId
        })
      }).then(function (resp) {
        var convIdHeader = resp.headers.get("X-Conversation-Id");
        if (convIdHeader && !conversationId) conversationId = convIdHeader;

        if (!resp.ok) {
          return resp.json().catch(function () { return { error: "Something went wrong" }; }).then(function (err) {
            messages = messages.concat([{ role: "assistant", content: err.error || "Sorry, something went wrong." }]);
            isLoading = false;
            render();
          });
        }

        var reader = resp.body.getReader();
        var decoder = new TextDecoder();
        var textBuffer = "";

        function upsert(chunk) {
          assistantSoFar += chunk;
          var last = messages[messages.length - 1];
          if (last && last.role === "assistant") {
            messages = messages.map(function (m, i) { return i === messages.length - 1 ? { role: m.role, content: assistantSoFar } : m; });
          } else {
            messages = messages.concat([{ role: "assistant", content: assistantSoFar }]);
          }
          render();
        }

        function pump() {
          return reader.read().then(function (result) {
            if (result.done) {
              isLoading = false;
              render();
              executePendingActions();
              return;
            }
            textBuffer += decoder.decode(result.value, { stream: true });
            var newlineIndex;
            while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
              var line = textBuffer.slice(0, newlineIndex);
              textBuffer = textBuffer.slice(newlineIndex + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              var jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;
              try {
                var parsed = JSON.parse(jsonStr);
                var content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
                if (content) upsert(content);
              } catch (e) {
                textBuffer = line + "\n" + textBuffer;
                break;
              }
            }
            return pump();
          });
        }

        return pump();
      }).catch(function (e) {
        console.error("AI Chat Widget error:", e);
        messages = messages.concat([{ role: "assistant", content: "Connection error. Please try again." }]);
        isLoading = false;
        render();
      });
    }

    render();

    return {
      open: function () { isOpen = true; render(); },
      close: function () { isOpen = false; render(); },
      destroy: function () { host.remove(); }
    };
  }

  // ── Auto-init ───────────────────────────────────────────────────────
  function init() {
    var globalConfig = window.AIChatConfig || {};
    var scriptEl = document.currentScript || document.querySelector("script[data-store-id]");

    function attr(name) { return scriptEl ? scriptEl.getAttribute("data-" + name) : null; }

    var config = {
      storeId: globalConfig.storeId || attr("store-id") || "default",
      apiUrl: globalConfig.apiUrl || attr("api-url") || "",
      apiKey: globalConfig.apiKey || attr("api-key") || "",
      primaryColor: globalConfig.primaryColor || attr("primary-color") || "#6c3beb",
      title: globalConfig.title || attr("title") || "Shopping Assistant",
      welcomeMessage: globalConfig.welcomeMessage || attr("welcome-message"),
      suggestions: globalConfig.suggestions,
      position: globalConfig.position || attr("position") || "bottom-right",
      zIndex: globalConfig.zIndex || parseInt(attr("z-index") || "99999", 10),
      platform: globalConfig.platform || attr("platform") || undefined
    };

    if (!config.apiUrl) {
      console.error("[AI Chat Widget] Missing apiUrl. Set data-api-url or window.AIChatConfig.apiUrl");
      return;
    }

    window.AIChatWidget = createWidget(config);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
