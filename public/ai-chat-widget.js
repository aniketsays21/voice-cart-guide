/**
 * AI Chat Widget — Voice-First Shopping Assistant with Native Shopify Display (IIFE)
 * v2.0 — Avatar-first flow, live catalog from Shopify, native product navigation
 */
(function () {
  "use strict";

  // ── Icons ──────────────────────────────────────────────────────────
  var ICONS = {
    chat: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    mic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    micOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    voice: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
  };

  // ── Styles ──────────────────────────────────────────────────────────
  function getWidgetStyles(primaryColor) {
    return "\
    .aicw-root {\
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\
      font-size: 14px; line-height: 1.5; color: #1a1a2e; box-sizing: border-box;\
      width: 100%; height: 100%;\
    }\
    .aicw-root *, .aicw-root *::before, .aicw-root *::after { box-sizing: border-box; }\
    .aicw-panel {\
      width: 100%; height: 100%; border-radius: 0; border: none;\
      background: #fff; display: flex; flex-direction: column; overflow: hidden;\
    }\
    .aicw-header {\
      display: flex; align-items: center; justify-content: space-between;\
      padding: 12px 16px; background: " + primaryColor + "; color: #fff; flex-shrink: 0;\
    }\
    .aicw-header-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }\
    .aicw-header-title svg { width: 20px; height: 20px; }\
    .aicw-close {\
      width: 28px; height: 28px; border-radius: 50%; border: none;\
      background: rgba(255,255,255,0.15); color: #fff; cursor: pointer;\
      display: flex; align-items: center; justify-content: center; transition: background 0.2s;\
    }\
    .aicw-close:hover { background: rgba(255,255,255,0.3); }\
    .aicw-close svg { width: 16px; height: 16px; }\
    /* Avatar area */\
    .aicw-avatar-area {\
      flex: 1; display: flex; flex-direction: column; align-items: center;\
      justify-content: center; padding: 24px; text-align: center;\
      background: linear-gradient(180deg, #f8f6ff 0%, #fff 100%);\
    }\
    .aicw-avatar-circle {\
      width: 120px; height: 120px; border-radius: 50%;\
      background: linear-gradient(135deg, " + primaryColor + ", #a78bfa);\
      display: flex; align-items: center; justify-content: center;\
      margin-bottom: 16px; position: relative;\
      box-shadow: 0 8px 32px rgba(108, 59, 235, 0.25);\
    }\
    .aicw-avatar-circle svg { width: 48px; height: 48px; color: #fff; }\
    .aicw-avatar-circle.speaking { animation: aicw-avatar-pulse 1.5s ease-in-out infinite; }\
    .aicw-avatar-circle.listening { animation: aicw-avatar-pulse 0.8s ease-in-out infinite; }\
    @keyframes aicw-avatar-pulse {\
      0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(108, 59, 235, 0.25); }\
      50% { transform: scale(1.08); box-shadow: 0 12px 48px rgba(108, 59, 235, 0.4); }\
    }\
    .aicw-avatar-status {\
      font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;\
    }\
    .aicw-avatar-sub {\
      font-size: 12px; color: #9ca3af;\
    }\
    .aicw-transcript {\
      margin-top: 12px; padding: 8px 16px; border-radius: 12px;\
      background: #f3f4f6; font-size: 13px; color: #374151;\
      max-width: 90%; word-wrap: break-word;\
    }\
    /* Mic button */\
    .aicw-mic-btn {\
      width: 72px; height: 72px; border-radius: 50%; border: none;\
      cursor: pointer; display: flex; align-items: center; justify-content: center;\
      transition: transform 0.2s, background 0.2s; position: relative;\
      color: #fff; flex-shrink: 0;\
    }\
    .aicw-mic-btn svg { width: 32px; height: 32px; position: relative; z-index: 1; }\
    .aicw-mic-btn.small { width: 40px; height: 40px; }\
    .aicw-mic-btn.small svg { width: 20px; height: 20px; }\
    .aicw-mic-btn.idle { background: " + primaryColor + "; }\
    .aicw-mic-btn.listening { background: #ef4444; }\
    .aicw-mic-btn.processing { background: #f59e0b; pointer-events: none; }\
    .aicw-mic-btn.speaking { background: #10b981; pointer-events: none; }\
    .aicw-mic-btn:hover { transform: scale(1.06); }\
    .aicw-mic-btn::before {\
      content: ''; position: absolute; inset: -6px; border-radius: 50%;\
      border: 2px solid; opacity: 0; animation: none;\
    }\
    .aicw-mic-btn.idle::before {\
      border-color: " + primaryColor + "; opacity: 0.3; animation: aicw-pulse 2s ease-in-out infinite;\
    }\
    .aicw-mic-btn.listening::before {\
      border-color: #ef4444; opacity: 0.5; animation: aicw-pulse 1s ease-in-out infinite;\
    }\
    @keyframes aicw-pulse {\
      0%, 100% { transform: scale(1); opacity: 0.3; }\
      50% { transform: scale(1.15); opacity: 0; }\
    }\
    /* Spinner */\
    .aicw-spinner {\
      width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3);\
      border-top-color: #fff; border-radius: 50%;\
      animation: aicw-spin 0.8s linear infinite; position: relative; z-index: 1;\
    }\
    @keyframes aicw-spin { to { transform: rotate(360deg); } }\
    /* Bottom bar */\
    .aicw-bottom-bar {\
      flex-shrink: 0; border-top: 1px solid #e5e7eb; padding: 8px 12px;\
      display: flex; align-items: center; gap: 10px; background: #fafafa;\
    }\
    .aicw-bar-info {\
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0;\
    }\
    .aicw-bar-status {\
      font-size: 11px; color: #6b7280; white-space: nowrap;\
      overflow: hidden; text-overflow: ellipsis; max-width: 100%;\
    }\
    .aicw-bar-waveform { width: 100%; height: 28px; }\
    .aicw-cancel-btn {\
      font-size: 11px; color: #6b7280; background: none;\
      border: 1px solid #e5e7eb; border-radius: 999px;\
      padding: 4px 12px; cursor: pointer; transition: color 0.2s; flex-shrink: 0;\
    }\
    .aicw-cancel-btn:hover { color: #ef4444; border-color: #ef4444; }\
    /* Product cards grid */\
    .aicw-product-grid {\
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;\
      padding: 10px 12px; overflow-y: auto; flex: 1;\
    }\
    .aicw-pcard {\
      border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;\
      background: #fff; display: flex; flex-direction: column;\
      transition: box-shadow 0.2s;\
    }\
    .aicw-pcard:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }\
    .aicw-pcard-img-wrap {\
      position: relative; width: 100%; aspect-ratio: 1; background: #f3f4f6; overflow: hidden;\
    }\
    .aicw-pcard-img {\
      width: 100%; height: 100%; object-fit: cover; display: block;\
    }\
    .aicw-pcard-badge {\
      position: absolute; bottom: 6px; left: 6px;\
      background: #16a34a; color: #fff; font-size: 10px; font-weight: 700;\
      padding: 2px 6px; border-radius: 4px;\
    }\
    .aicw-pcard-body { padding: 8px; display: flex; flex-direction: column; gap: 4px; flex: 1; }\
    .aicw-pcard-name {\
      font-size: 12px; font-weight: 600; color: #1a1a2e;\
      overflow: hidden; text-overflow: ellipsis;\
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;\
    }\
    .aicw-pcard-price { font-size: 13px; font-weight: 700; color: " + primaryColor + "; }\
    .aicw-pcard-old {\
      font-size: 11px; color: #9ca3af; text-decoration: line-through; margin-left: 4px;\
    }\
    .aicw-pcard-atc {\
      width: 100%; border: none; border-radius: 8px; padding: 7px 0;\
      font-size: 12px; font-weight: 600; cursor: pointer;\
      transition: background 0.2s, transform 0.1s;\
      background: " + primaryColor + "; color: #fff; margin-top: auto;\
    }\
    .aicw-pcard-atc:hover { filter: brightness(1.1); transform: scale(1.02); }\
    .aicw-pcard-atc:active { transform: scale(0.98); }\
    .aicw-pcard-atc.in-cart {\
      background: #16a34a; pointer-events: none;\
    }\
    .aicw-pcard-atc.adding {\
      background: #9ca3af; pointer-events: none;\
    }\
    /* Toast */\
    .aicw-toast {\
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);\
      background: #1a1a2e; color: #fff; padding: 8px 16px; border-radius: 8px;\
      font-size: 12px; z-index: 99999; display: flex; align-items: center; gap: 6px;\
      animation: aicw-toast-in 0.3s ease;\
    }\
    .aicw-toast svg { width: 14px; height: 14px; }\
    .aicw-toast-out { opacity: 0; transition: opacity 0.3s; }\
    @keyframes aicw-toast-in { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }\
    /* Powered */\
    .aicw-powered {\
      text-align: center; font-size: 10px; color: #9ca3af; padding: 4px 0 8px; flex-shrink: 0;\
    }\
    /* Loading dots for welcome */\
    .aicw-loading-dots {\
      display: flex; gap: 6px; justify-content: center; margin-top: 12px;\
    }\
    .aicw-loading-dots span {\
      width: 8px; height: 8px; border-radius: 50%; background: " + primaryColor + ";\
      animation: aicw-dot-pulse 1.4s ease-in-out infinite both;\
    }\
    .aicw-loading-dots span:nth-child(2) { animation-delay: 0.2s; }\
    .aicw-loading-dots span:nth-child(3) { animation-delay: 0.4s; }\
    @keyframes aicw-dot-pulse {\
      0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }\
      40% { transform: scale(1); opacity: 1; }\
    }\
    /* Card just-added flash */\
    .aicw-pcard-just-added {\
      animation: aicw-card-flash 1.5s ease;\
    }\
    @keyframes aicw-card-flash {\
      0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }\
      30% { box-shadow: 0 0 0 4px rgba(22,163,74,0.4); border-color: #16a34a; }\
      100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }\
    }\
    /* Image placeholder */\
    .aicw-pcard-placeholder {\
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;\
      background: #f3f4f6; color: #d1d5db;\
    }\
    .aicw-pcard-placeholder svg { width: 32px; height: 32px; }\
    /* Cart toast large */\
    .aicw-toast.aicw-toast-cart {\
      background: #16a34a; font-size: 14px; padding: 12px 20px;\
    }\
    .aicw-toast.aicw-toast-cart svg { width: 18px; height: 18px; }";
  }

  // ── Shopify helpers ────────────────────────────────────────────────
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

  // ── Fetch Shopify catalog client-side ──────────────────────────────
  function fetchShopifyCatalog() {
    if (!isShopify()) return Promise.resolve([]);
    return fetch("/products.json?limit=250")
      .then(function (r) { return r.ok ? r.json() : { products: [] }; })
      .then(function (d) { return d.products || []; })
      .catch(function () { return []; });
  }

  // ── Helpers ────────────────────────────────────────────────────────
  function generateSessionId() {
    return "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  // Extract action blocks from AI response
  function extractActions(content) {
    var actions = [];
    var regex = /:::action\n([\s\S]*?):::/g;
    var match;
    while ((match = regex.exec(content)) !== null) {
      var props = {};
      match[1].split("\n").forEach(function (line) {
        var i = line.indexOf(":");
        if (i > 0) { var k = line.slice(0, i).trim(); var v = line.slice(i + 1).trim(); if (k && v) props[k] = v; }
      });
      if (props.type) actions.push(props);
    }
    return actions;
  }

  // Clean text for TTS — strip action blocks, markdown, emojis
  function cleanForTTS(content) {
    return content
      .replace(/:::(product|action)\n[\s\S]*?:::/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/#{1,6}\s*/g, "")
      .replace(/[_~>`|[\]{}()]/g, "")
      .replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/gu, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ── Widget ─────────────────────────────────────────────────────────
  function createWidget(config) {
    var apiUrl = config.apiUrl;
    var apiKey = config.apiKey;
    var storeId = config.storeId;
    var primaryColor = config.primaryColor || "#6c3beb";
    var title = config.title || "Bella Vita AI";
    var position = config.position || "bottom-right";
    var zIndex = config.zIndex || 99999;
    var platform = config.platform;

    var isShopifyPlatform = platform === "shopify" || (platform === undefined && isShopify());
    var chatUrl = apiUrl + "/functions/v1/chat";
    var sttUrl = apiUrl + "/functions/v1/sarvam-stt";
    var ttsUrl = apiUrl + "/functions/v1/sarvam-tts";
    var sessionId = generateSessionId();
    var conversationId = null;
    var isOpen = false;
    var pendingActions = [];
    var shopifyCatalog = []; // client-fetched products
    var inCartHandles = {}; // track handles added to cart
    var pendingNavigation = null; // URL to navigate to after TTS
    var productCards = []; // enriched product cards for multi-product display
    var showProductGrid = false; // whether to show product grid view

    // Voice state
    var voiceState = "idle"; // idle | listening | processing | speaking
    var voiceStatusText = "";
    var voiceTranscript = "";
    var mediaRecorder = null;
    var audioChunks = [];
    var micStream = null;
    var audioContext = null;
    var analyserNode = null;
    var vadRafId = 0;
    var vadSilenceStart = 0;
    var currentAudio = null;
    var voiceMessages = [];
    var waveformRafId = 0;
    var welcomeTriggered = false;
    var isWelcomeLoading = false;

    // Product enrichment from catalog (kept for add_to_cart lookups)

    // Fetch catalog on init if Shopify
    if (isShopifyPlatform) {
      fetchShopifyCatalog().then(function (products) {
        shopifyCatalog = products;
        console.log("[AI Widget] Fetched " + products.length + " products from Shopify catalog");
      });
    }

    function executePendingActions() {
      var actions = pendingActions.slice();
      pendingActions = [];
      actions.forEach(function (action) {
        if (!isShopifyPlatform) return;
        switch (action.type) {
          case "add_to_cart":
            if (action.product_name) {
              addToCartByProduct(action.product_name, action.product_link).then(function (result) {
                console.log("Add to cart:", result.message);
              });
            }
            break;
          case "open_product":
            // Handled in onChatComplete via enrichAction + productCards
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

    // Host element — full-screen overlay
    var host = document.createElement("div");
    host.id = "ai-chat-widget";
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = String(zIndex);
    host.style.display = "none";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "closed" });
    var styleEl = document.createElement("style");
    styleEl.textContent = getWidgetStyles(primaryColor);
    shadow.appendChild(styleEl);

    var root = document.createElement("div");
    root.className = "aicw-root";
    shadow.appendChild(root);

    // ── Voice ────────────────────────────────────────────────────
    function setVoiceState(state, status) {
      voiceState = state;
      voiceStatusText = status || "";
      render();
    }

    function stopMic() {
      cancelAnimationFrame(vadRafId);
      cancelAnimationFrame(waveformRafId);
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try { mediaRecorder.stop(); } catch (e) {}
      }
      if (micStream) {
        micStream.getTracks().forEach(function (t) { t.stop(); });
        micStream = null;
      }
      if (audioContext) {
        try { audioContext.close(); } catch (e) {}
        audioContext = null;
        analyserNode = null;
      }
      mediaRecorder = null;
    }

    function cancelVoice() {
      stopMic();
      if (currentAudio) { currentAudio.pause(); currentAudio = null; }
      setVoiceState("idle", "");
    }

    function startListening() {
      audioChunks = [];
      voiceTranscript = "";
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        micStream = stream;
        setVoiceState("listening", "Listening... speak now");

        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorder.ondataavailable = function (e) {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
          if (voiceState !== "listening") return;
          var blob = new Blob(audioChunks, { type: "audio/webm" });
          processAudio(blob);
        };
        mediaRecorder.start();

        audioContext = new AudioContext();
        var source = audioContext.createMediaStreamSource(stream);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 512;
        source.connect(analyserNode);
        vadSilenceStart = 0;

        var vadData = new Float32Array(analyserNode.fftSize);
        function checkVAD() {
          if (voiceState !== "listening") return;
          analyserNode.getFloatTimeDomainData(vadData);
          var rms = 0;
          for (var i = 0; i < vadData.length; i++) rms += vadData[i] * vadData[i];
          rms = Math.sqrt(rms / vadData.length);

          var now = Date.now();
          if (rms < 0.01) {
            if (vadSilenceStart === 0) vadSilenceStart = now;
            else if (now - vadSilenceStart > 2000) { stopMic(); return; }
          } else { vadSilenceStart = 0; }
          vadRafId = requestAnimationFrame(checkVAD);
        }
        vadRafId = requestAnimationFrame(checkVAD);
        startWaveform();
      }).catch(function (err) {
        console.error("Mic access denied:", err);
        setVoiceState("idle", "Microphone access denied");
      });
    }

    function startWaveform() {
      var canvas = root.querySelector(".aicw-bar-waveform");
      if (!canvas || !analyserNode) return;
      var ctx = canvas.getContext("2d");
      var freqData = new Uint8Array(analyserNode.frequencyBinCount);
      var barCount = 24;

      function draw() {
        if (voiceState !== "listening" || !analyserNode) return;
        analyserNode.getByteFrequencyData(freqData);
        var dpr = window.devicePixelRatio || 1;
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);
        var gap = 2;
        var barW = (w - (barCount - 1) * gap) / barCount;
        var centerY = h / 2;
        for (var i = 0; i < barCount; i++) {
          var dataIdx = Math.floor((i / barCount) * freqData.length);
          var val = freqData[dataIdx] / 255;
          var barH = Math.max(2, val * (h * 0.8));
          var x = i * (barW + gap);
          var y = centerY - barH / 2;
          var opacity = 0.3 + val * 0.7;
          ctx.fillStyle = "rgba(108, 59, 235, " + opacity + ")";
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, barW / 2);
          ctx.fill();
        }
        waveformRafId = requestAnimationFrame(draw);
      }
      waveformRafId = requestAnimationFrame(draw);
    }

    function processAudio(blob) {
      setVoiceState("processing", "Processing...");
      var reader = new FileReader();
      reader.onloadend = function () {
        var base64 = reader.result.split(",")[1];
        fetch(sttUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
          body: JSON.stringify({ audio: base64, sessionId: sessionId })
        }).then(function (r) { return r.json(); }).then(function (sttResult) {
          var transcript = sttResult.transcript;
          if (!transcript || !transcript.trim()) {
      setVoiceState("idle", "Didn't catch that. Tap mic to try again.");
            return;
          }
          voiceTranscript = transcript;
          setVoiceState("processing", "Thinking...");
          render();
          voiceMessages.push({ role: "user", content: transcript });
          sendToChat(transcript);
        }).catch(function (err) {
          console.error("STT error:", err);
          setVoiceState("idle", "Didn't catch that. Tap mic to try again.");
        });
      };
      reader.readAsDataURL(blob);
    }

    function sendToChat(query) {
      // Build request with client products and native display flag
      var requestBody = {
        messages: voiceMessages.map(function (m) { return { role: m.role, content: m.content }; }),
        sessionId: sessionId,
        conversationId: conversationId,
        storeId: storeId,
        nativeDisplay: isShopifyPlatform,
        storeDomain: isShopifyPlatform ? window.location.origin : undefined,
        clientProducts: shopifyCatalog.length > 0 ? shopifyCatalog : undefined
      };

      fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify(requestBody)
      }).then(function (resp) {
        var convIdHeader = resp.headers.get("X-Conversation-Id");
        if (convIdHeader && !conversationId) conversationId = convIdHeader;

        if (!resp.ok) {
          return resp.json().catch(function () { return {}; }).then(function (err) {
            setVoiceState("idle", err.error || "Something went wrong");
            isWelcomeLoading = false;
            render();
          });
        }

        var fullResponse = "";
        var streamReader = resp.body.getReader();
        var decoder = new TextDecoder();
        var textBuffer = "";

        function pump() {
          return streamReader.read().then(function (result) {
            if (result.done) { onChatComplete(fullResponse, query); return; }
            textBuffer += decoder.decode(result.value, { stream: true });
            var newlineIndex;
            while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
              var line = textBuffer.slice(0, newlineIndex);
              textBuffer = textBuffer.slice(newlineIndex + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              var jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                var parsed = JSON.parse(jsonStr);
                var content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
                if (content) fullResponse += content;
              } catch (e) {
                textBuffer = line + "\n" + textBuffer;
                break;
              }
            }
            return pump();
          });
        }
        return pump();
      }).catch(function (err) {
        console.error("Chat error:", err);
        setVoiceState("idle", "Connection error. Retrying...");
        isWelcomeLoading = false;
        render();
        // Auto-retry listening after 3 seconds
        setTimeout(function () {
          if (voiceState === "idle") startListening();
        }, 3000);
      });
    }

    function lookupCatalog(handle, name) {
      if (!shopifyCatalog.length) return null;
      // Match by handle first
      if (handle) {
        for (var i = 0; i < shopifyCatalog.length; i++) {
          if (shopifyCatalog[i].handle === handle) return shopifyCatalog[i];
        }
      }
      // Fuzzy match by name
      if (name) {
        var lower = name.toLowerCase();
        for (var i = 0; i < shopifyCatalog.length; i++) {
          if (shopifyCatalog[i].title && shopifyCatalog[i].title.toLowerCase().indexOf(lower) !== -1) return shopifyCatalog[i];
        }
      }
      return null;
    }

    function enrichAction(action) {
      var handle = action.product_handle || extractHandle(action.product_link || "");
      var catalogProduct = lookupCatalog(handle, action.product_name);
      var variant = catalogProduct && catalogProduct.variants && catalogProduct.variants[0];
      var price = variant ? parseFloat(variant.price) : 0;
      var comparePrice = variant && variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      var image = catalogProduct ? (catalogProduct.images && catalogProduct.images[0] ? (catalogProduct.images[0].src || catalogProduct.images[0]) : catalogProduct.featured_image) : null;
      return {
        name: action.product_name || (catalogProduct ? catalogProduct.title : "Product"),
        handle: handle || (catalogProduct ? catalogProduct.handle : ""),
        link: action.product_link || (handle ? "/products/" + handle : "#"),
        image: image || "",
        price: price,
        comparePrice: comparePrice,
        variantId: variant ? variant.id : null,
        available: variant ? variant.available : true
      };
    }

    function onChatComplete(fullResponse, query) {
      voiceMessages.push({ role: "assistant", content: fullResponse });

      var actions = extractActions(fullResponse);
      pendingNavigation = null;
      
      // Collect open_product actions
      var openProductActions = actions.filter(function (a) { return a.type === "open_product" && (a.product_handle || a.product_link); });
      
      // Determine if we had a grid showing before this response
      var hadGrid = showProductGrid;
      
      if (openProductActions.length > 1 && isShopifyPlatform) {
        // Multiple products — build/refresh product cards for grid display
        productCards = [];
        openProductActions.forEach(function (action) {
          var enriched = enrichAction(action);
          productCards.push(enriched);
        });
        // Grid will be shown after TTS
      } else if (openProductActions.length === 1) {
        // Single product — navigate to product page after TTS
        var action = openProductActions[0];
        var handle = action.product_handle || extractHandle(action.product_link);
        pendingNavigation = handle ? "/products/" + handle : action.product_link;
        showProductGrid = false;
        productCards = [];
      } else if (openProductActions.length === 0 && hadGrid) {
        // No product actions in response — check if it's a cart/nav action
        var hasNavAction = actions.some(function (a) {
          return a.type === "navigate_to_checkout" || a.type === "navigate_to_cart";
        });
        var hasCartAction = actions.some(function (a) { return a.type === "add_to_cart"; });
        if (!hasNavAction && !hasCartAction) {
          // Pure conversation, no product context — hide grid
          showProductGrid = false;
          productCards = [];
        }
        // If add_to_cart or nav, keep grid visible (will update cards in-place)
      }
      
      // Handle other actions
      actions.forEach(function (action) {
        if (action.type === "add_to_cart") {
          if (isShopifyPlatform && action.product_name) {
            var enriched = enrichAction(action);
            var handleToMark = enriched.handle;
            if (enriched.variantId) {
              shopifyAddToCart(enriched.variantId).then(function (ok) {
                if (ok) {
                  inCartHandles[handleToMark] = true;
                  showToast(enriched.name + " added to cart! ✓", true);
                  flashCard(handleToMark);
                  render(); // Re-render to update card state
                }
              });
            } else {
              addToCartByProduct(action.product_name, action.product_link).then(function (result) {
                if (result.success) {
                  inCartHandles[handleToMark] = true;
                  showToast(enriched.name + " added to cart! ✓", true);
                  flashCard(handleToMark);
                  render();
                }
              });
            }
          }
        } else if (action.type === "navigate_to_checkout") {
          if (isShopifyPlatform) pendingNavigation = "/checkout";
        } else if (action.type === "navigate_to_cart") {
          if (isShopifyPlatform) pendingNavigation = "/cart";
        }
      });

      isWelcomeLoading = false;

      // TTS
      var ttsText = cleanForTTS(fullResponse);
      if (!ttsText) {
        if (pendingNavigation && isShopifyPlatform) {
          setTimeout(function () { window.location.href = pendingNavigation; pendingNavigation = null; }, 500);
          return;
        }
        setVoiceState("idle", "");
        render();
        setTimeout(startListening, 500);
        return;
      }

      setVoiceState("speaking", "Speaking...");
      render();

      fetch(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({ text: ttsText.slice(0, 500), sessionId: sessionId, target_language_code: detectLang(ttsText) })
      }).then(function (r) { return r.json(); }).then(function (ttsResult) {
        if (voiceState !== "speaking") return;
        var audioBase64 = ttsResult.audio;
        if (!audioBase64) {
          setVoiceState("idle", "");
          setTimeout(startListening, 500);
          return;
        }
        currentAudio = new Audio("data:audio/wav;base64," + audioBase64);
        currentAudio.onended = function () {
          currentAudio = null;
          if (voiceState === "speaking") {
            if (pendingNavigation && isShopifyPlatform) {
              window.location.href = pendingNavigation;
              pendingNavigation = null;
              return;
            }
            if (productCards.length > 1) {
              showProductGrid = true;
              setVoiceState("idle", "");
              // Auto-start listening so user can keep talking over the grid
              setTimeout(startListening, 800);
              return;
            }
            // Auto-listen after any response (including cart confirmations)
            setVoiceState("idle", "");
            setTimeout(startListening, 500);
          }
        };
      currentAudio.onerror = function () {
          currentAudio = null;
          if (pendingNavigation && isShopifyPlatform) { window.location.href = pendingNavigation; pendingNavigation = null; return; }
          // Still execute actions even if TTS fails
          executePendingActions();
          setVoiceState("idle", "");
          setTimeout(startListening, 1000);
        };
        currentAudio.play().catch(function () {
          if (pendingNavigation && isShopifyPlatform) { window.location.href = pendingNavigation; pendingNavigation = null; return; }
          executePendingActions();
          setVoiceState("idle", "");
          setTimeout(startListening, 1000);
        });
      }).catch(function (err) {
        console.error("TTS error:", err);
        setVoiceState("idle", "");
        setTimeout(startListening, 1000);
      });
    }

    function onMicToggle() {
      if (voiceState === "idle") startListening();
      else if (voiceState === "listening") { stopMic(); setVoiceState("idle", ""); }
    }

    function triggerWelcome() {
      if (welcomeTriggered) return;
      welcomeTriggered = true;
      isWelcomeLoading = true;
      pendingNavigation = null;
      render();

      var welcomeQuery = "Hi, show me top selling Bella Vita products";
      voiceMessages.push({ role: "user", content: welcomeQuery });
      sendToChat(welcomeQuery);
    }

    // Language detection for TTS
    function detectLang(text) {
      var hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
      var totalChars = text.replace(/\s/g, "").length || 1;
      return (hindiChars / totalChars) > 0.15 ? "hi-IN" : "en-IN";
    }

    function showToast(msg, isCart) {
      var existing = shadow.querySelector(".aicw-toast");
      if (existing) existing.remove();
      var t = document.createElement("div");
      t.className = "aicw-toast" + (isCart ? " aicw-toast-cart" : "");
      t.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' + msg;
      root.appendChild(t);
      setTimeout(function () { t.classList.add("aicw-toast-out"); }, isCart ? 3000 : 2000);
      setTimeout(function () { t.remove(); }, isCart ? 3500 : 2500);
    }

    function flashCard(handle) {
      if (!showProductGrid) return;
      var cards = root.querySelectorAll(".aicw-pcard");
      cards.forEach(function (card) {
        var idx = parseInt(card.getAttribute("data-idx"));
        var p = productCards[idx];
        if (p && p.handle === handle) {
          card.classList.add("aicw-pcard-just-added");
          setTimeout(function () { card.classList.remove("aicw-pcard-just-added"); }, 1500);
        }
      });
    }

    // ── Render ────────────────────────────────────────────────────
    function render() {
      if (!isOpen) {
        host.style.display = "none";
        root.innerHTML = "";
        return;
      }
      host.style.display = "block";

      // Avatar state
      var avatarClass = "";
      var micIcon = ICONS.mic;
      var micClass = "idle";
      var statusText = "Tap the mic to ask me anything!";

      if (isWelcomeLoading) {
        avatarClass = "speaking";
        micClass = "processing";
        micIcon = '<div class="aicw-spinner"></div>';
        statusText = "Loading your assistant...";
      } else if (voiceState === "listening") {
        avatarClass = "listening";
        micIcon = ICONS.micOff;
        micClass = "listening";
        statusText = "Listening... speak now";
      } else if (voiceState === "processing") {
        avatarClass = "";
        micIcon = '<div class="aicw-spinner"></div>';
        micClass = "processing";
        statusText = voiceStatusText || "Thinking...";
      } else if (voiceState === "speaking") {
        avatarClass = "speaking";
        micIcon = ICONS.voice;
        micClass = "speaking";
        statusText = "Speaking...";
      }

      var transcriptHtml = voiceTranscript
        ? '<div class="aicw-transcript">"' + voiceTranscript + '"</div>'
        : '';

      // Navigation indicator
      var navHtml = "";
      if (pendingNavigation && (voiceState === "speaking" || voiceState === "processing")) {
        navHtml = '<div class="aicw-transcript">Navigating to store page after response...</div>';
      }

      // Cancel button
      var cancelBtn = (voiceState === "processing" || voiceState === "speaking")
        ? '<button class="aicw-cancel-btn">Cancel</button>'
        : '';

      var bodyHtml;

      if (showProductGrid && productCards.length > 1) {
        // Product grid view with persistent mic bar at bottom
        var cardsHtml = productCards.map(function (p, idx) {
          var priceHtml = '<span class="aicw-pcard-price">₹' + p.price + '</span>';
          if (p.comparePrice && p.comparePrice > p.price) {
            priceHtml = '<span class="aicw-pcard-price">₹' + p.price + '</span><span class="aicw-pcard-old">₹' + p.comparePrice + '</span>';
          }
          var discountBadge = '';
          if (p.comparePrice && p.comparePrice > p.price) {
            var pct = Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100);
            discountBadge = '<span class="aicw-pcard-badge">' + pct + '% OFF</span>';
          }
          var atcClass = inCartHandles[p.handle] ? 'aicw-pcard-atc in-cart' : 'aicw-pcard-atc';
          var atcText = inCartHandles[p.handle] ? '✓ In Cart' : 'Add to Cart';
          return '\
            <div class="aicw-pcard" data-idx="' + idx + '">\
              <div class="aicw-pcard-img-wrap">\
                ' + (p.image ? '<img class="aicw-pcard-img" src="' + p.image + '" alt="' + p.name + '" loading="lazy" />' : '<div class="aicw-pcard-placeholder"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>') + '\
                ' + discountBadge + '\
              </div>\
              <div class="aicw-pcard-body">\
                <div class="aicw-pcard-name">' + p.name + '</div>\
                <div>' + priceHtml + '</div>\
                <button class="' + atcClass + '" data-atc="' + idx + '">' + atcText + '</button>\
              </div>\
            </div>';
        }).join("");

        // Compact mic bar for product grid view
        var gridMicIcon = micIcon;
        var gridMicClass = micClass;
        var gridStatusText = statusText;
        if (voiceState === "idle" && !isWelcomeLoading) {
          gridStatusText = "Say a command...";
        }
        var gridWaveformHtml = voiceState === "listening" ? '<canvas class="aicw-bar-waveform"></canvas>' : '';

        bodyHtml = '\
          <div style="padding: 10px 12px 4px; display: flex; align-items: center; gap: 8px;">\
            <button class="aicw-cancel-btn aicw-back-btn" style="padding: 4px 12px;">← Back</button>\
            <span style="font-size: 13px; font-weight: 600; color: #374151;">Recommended for you</span>\
          </div>\
          <div class="aicw-product-grid">' + cardsHtml + '</div>\
          <div class="aicw-bottom-bar">\
            <button class="aicw-mic-btn small ' + gridMicClass + '" aria-label="Toggle microphone">' + gridMicIcon + '</button>\
            <div class="aicw-bar-info">\
              <div class="aicw-bar-status">' + gridStatusText + '</div>\
              ' + gridWaveformHtml + '\
            </div>\
            ' + ((voiceState === "processing" || voiceState === "speaking") ? '<button class="aicw-cancel-btn">Cancel</button>' : '') + '\
          </div>';
      } else {
        bodyHtml = '\
          <div class="aicw-avatar-area">\
            <div class="aicw-avatar-circle ' + avatarClass + '">' + ICONS.voice + '</div>\
            <div class="aicw-avatar-status">' + statusText + '</div>\
            <div class="aicw-avatar-sub">Your AI Shopping Assistant</div>\
            ' + (isWelcomeLoading ? '<div class="aicw-loading-dots"><span></span><span></span><span></span></div>' : '') + '\
            ' + transcriptHtml + navHtml + '\
            <div style="margin-top: 24px;">\
              <button class="aicw-mic-btn ' + micClass + '" aria-label="Toggle microphone">' + micIcon + '</button>\
            </div>\
            ' + (cancelBtn ? '<div style="margin-top: 8px;">' + cancelBtn + '</div>' : '') + '\
          </div>';
      }

      root.innerHTML = '\
        <div class="aicw-panel">\
          <div class="aicw-header">\
            <div class="aicw-header-title">' + ICONS.mic + '<span>' + title + '</span></div>\
            <button class="aicw-close" aria-label="Close">' + ICONS.close + '</button>\
          </div>' + bodyHtml + '\
          <div class="aicw-powered">Powered by AI</div>\
        </div>';

      // Bind close
      root.querySelector(".aicw-close").addEventListener("click", function () {
        cancelVoice();
        isOpen = false;
        render();
      });

      // Bind back button
      var backBtn = root.querySelector(".aicw-back-btn");
      if (backBtn) backBtn.addEventListener("click", function () {
        showProductGrid = false;
        productCards = [];
        setVoiceState("idle", "");
        setTimeout(startListening, 300);
      });

      // Bind product card clicks (navigate to product page)
      root.querySelectorAll(".aicw-pcard").forEach(function (card) {
        card.addEventListener("click", function (e) {
          if (e.target.closest("[data-atc]")) return; // don't navigate on ATC click
          var idx = parseInt(card.getAttribute("data-idx"));
          var p = productCards[idx];
          if (p && p.link) shopifyNavigate(p.link);
        });
      });

      // Bind add to cart buttons
      root.querySelectorAll("[data-atc]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var idx = parseInt(btn.getAttribute("data-atc"));
          var p = productCards[idx];
          if (!p || inCartHandles[p.handle]) return;
          btn.textContent = "Adding...";
          btn.className = "aicw-pcard-atc adding";
          if (p.variantId) {
            shopifyAddToCart(p.variantId).then(function (ok) {
              if (ok) {
                inCartHandles[p.handle] = true;
                btn.textContent = "✓ In Cart";
                btn.className = "aicw-pcard-atc in-cart";
                showToast(p.name + " added to cart!");
              } else {
                btn.textContent = "Add to Cart";
                btn.className = "aicw-pcard-atc";
              }
            });
          } else {
            addToCartByProduct(p.name, p.link).then(function (result) {
              if (result.success) {
                inCartHandles[p.handle] = true;
                btn.textContent = "✓ In Cart";
                btn.className = "aicw-pcard-atc in-cart";
                showToast(p.name + " added to cart!");
              } else {
                btn.textContent = "Add to Cart";
                btn.className = "aicw-pcard-atc";
              }
            });
          }
        });
      });

      // Bind mic (disabled during welcome load)
      root.querySelectorAll(".aicw-mic-btn").forEach(function (btn) {
        if (!isWelcomeLoading && (voiceState === "idle" || voiceState === "listening")) {
          btn.addEventListener("click", onMicToggle);
        }
      });

      // Bind cancel
      var cancelEl = root.querySelector(".aicw-cancel-btn:not(.aicw-back-btn)");
      if (cancelEl) cancelEl.addEventListener("click", function () {
        pendingNavigation = null;
        cancelVoice();
      });

      // Waveform
      if (voiceState === "listening" && analyserNode) startWaveform();
    }

    render();

    return {
      open: function () { isOpen = true; render(); triggerWelcome(); },
      close: function () { cancelVoice(); isOpen = false; render(); },
      destroy: function () { cancelVoice(); host.remove(); }
    };
  }

  // ── Auto-init ──────────────────────────────────────────────────────
  function init() {
    var globalConfig = window.AIChatConfig || {};
    var scriptEl = document.currentScript || document.querySelector("script[data-store-id]");
    function attr(name) { return scriptEl ? scriptEl.getAttribute("data-" + name) : null; }

    var config = {
      storeId: globalConfig.storeId || attr("store-id") || "default",
      apiUrl: globalConfig.apiUrl || attr("api-url") || "",
      apiKey: globalConfig.apiKey || attr("api-key") || "",
      primaryColor: globalConfig.primaryColor || attr("primary-color") || "#6c3beb",
      title: globalConfig.title || attr("title") || "Bella Vita AI",
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
