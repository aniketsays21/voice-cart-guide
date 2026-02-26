/**
 * AI Chat Widget — Voice-First Shopping Assistant — Floating Overlay Mode
 * v3.0 — Compact floating mic bar that controls real Shopify pages
 */
(function () {
  "use strict";

  // ── Icons ──────────────────────────────────────────────────────────
  var ICONS = {
    mic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    micOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    voice: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  // ── Styles ──────────────────────────────────────────────────────────
  function getWidgetStyles(primaryColor) {
    return "\
    .aicw-root {\
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\
      font-size: 14px; line-height: 1.5; color: #1a1a2e; box-sizing: border-box;\
    }\
    .aicw-root *, .aicw-root *::before, .aicw-root *::after { box-sizing: border-box; }\
    /* Floating bar */\
    .aicw-floating-bar {\
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);\
      display: flex; align-items: center; gap: 12px;\
      background: #fff; border-radius: 28px;\
      padding: 8px 16px 8px 8px;\
      box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08);\
      max-width: 380px; min-width: 240px;\
      z-index: 99999;\
      animation: aicw-bar-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);\
    }\
    @keyframes aicw-bar-in {\
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }\
      to { opacity: 1; transform: translateX(-50%) translateY(0); }\
    }\
    /* Mic button */\
    .aicw-mic-btn {\
      min-width: 44px; height: 44px; border-radius: 22px; border: none;\
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;\
      transition: transform 0.2s, background 0.2s; position: relative;\
      color: #fff; flex-shrink: 0; padding: 0 14px;\
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\
      font-size: 13px; font-weight: 600; letter-spacing: 0.3px; white-space: nowrap;\
    }\
    .aicw-mic-btn svg { width: 18px; height: 18px; position: relative; z-index: 1; flex-shrink: 0; }\
    .aicw-mic-btn.idle { background: " + primaryColor + "; }\
    .aicw-mic-btn.listening { background: #ef4444; }\
    .aicw-mic-btn.processing { background: #f59e0b; pointer-events: none; }\
    .aicw-mic-btn.speaking { background: #10b981; pointer-events: none; }\
    .aicw-mic-btn:hover { transform: scale(1.05); }\
    .aicw-mic-btn::before {\
      content: ''; position: absolute; inset: -4px; border-radius: 22px;\
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
    /* Bar info */\
    .aicw-bar-info {\
      flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;\
    }\
    .aicw-bar-status {\
      font-size: 13px; font-weight: 500; color: #374151;\
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\
    }\
    .aicw-bar-sub {\
      font-size: 11px; color: #9ca3af;\
    }\
    .aicw-bar-waveform { width: 100%; height: 24px; }\
    /* Close button */\
    .aicw-close-btn {\
      width: 28px; height: 28px; border-radius: 50%; border: none;\
      background: #f3f4f6; color: #6b7280; cursor: pointer;\
      display: flex; align-items: center; justify-content: center;\
      transition: background 0.2s; flex-shrink: 0;\
    }\
    .aicw-close-btn:hover { background: #e5e7eb; color: #374151; }\
    .aicw-close-btn svg { width: 14px; height: 14px; }\
    /* Transcript bubble */\
    .aicw-transcript-bubble {\
      position: fixed; bottom: 76px; left: 50%; transform: translateX(-50%);\
      background: #1a1a2e; color: #fff; padding: 10px 16px;\
      border-radius: 12px; font-size: 13px; max-width: 360px;\
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);\
      animation: aicw-bubble-in 0.3s ease;\
      z-index: 99998; word-wrap: break-word;\
    }\
    .aicw-transcript-bubble.user {\
      background: " + primaryColor + "; color: #fff;\
    }\
    .aicw-transcript-bubble.fading {\
      opacity: 0; transition: opacity 0.5s;\
    }\
    @keyframes aicw-bubble-in {\
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }\
      to { opacity: 1; transform: translateX(-50%) translateY(0); }\
    }\
    /* FAB (closed state) */\
    .aicw-fab {\
      height: 48px; border-radius: 24px; border: none;\
      background: " + primaryColor + "; color: #fff; cursor: pointer;\
      display: flex; align-items: center; justify-content: center; gap: 8px;\
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);\
      transition: transform 0.2s;\
      position: fixed; bottom: 24px; right: 24px;\
      padding: 0 20px;\
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\
      font-size: 14px; font-weight: 600; letter-spacing: 0.3px; white-space: nowrap;\
    }\
    .aicw-fab:hover { transform: scale(1.05); }\
    .aicw-fab svg { width: 20px; height: 20px; }\
    /* Spinner */\
    .aicw-spinner {\
      width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);\
      border-top-color: #fff; border-radius: 50%;\
      animation: aicw-spin 0.8s linear infinite; position: relative; z-index: 1;\
    }\
    @keyframes aicw-spin { to { transform: rotate(360deg); } }\
    /* Toast */\
    .aicw-toast {\
      position: fixed; bottom: 76px; left: 50%; transform: translateX(-50%);\
      background: #16a34a; color: #fff; padding: 10px 18px; border-radius: 10px;\
      font-size: 13px; z-index: 100000; display: flex; align-items: center; gap: 8px;\
      animation: aicw-toast-in 0.3s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.2);\
    }\
    .aicw-toast svg { width: 16px; height: 16px; }\
    .aicw-toast.error { background: #ef4444; }\
    .aicw-toast-out { opacity: 0; transition: opacity 0.3s; }\
    @keyframes aicw-toast-in {\
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }\
      to { opacity: 1; transform: translateX(-50%) translateY(0); }\
    }";
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

  // Try to click the native Add to Cart button on a PDP
  function clickNativeAddToCart() {
    var selectors = [
      '[type="submit"][name="add"]',
      'button.product-form__submit',
      'form[action="/cart/add"] button[type="submit"]',
      '#AddToCart',
      '.btn-addtocart',
      'button[data-action="add-to-cart"]',
      '.add-to-cart',
      '.product-form__cart-submit',
      'button.shopify-payment-button__button--unbranded'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var btn = document.querySelector(selectors[i]);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        // Dispatch cart refresh event
        document.dispatchEvent(new CustomEvent("cart:refresh"));
        return true;
      }
    }
    return false;
  }

  // Try to click the native checkout button
  function clickNativeCheckout() {
    var selectors = [
      '[name="checkout"]',
      '.cart__checkout-button',
      'button[type="submit"][value*="Check"]',
      'a[href="/checkout"]',
      '.cart__checkout',
      '#checkout',
      'input[name="checkout"]',
      'button.cart__checkout'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var btn = document.querySelector(selectors[i]);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function shopifyGoToCheckout() {
    if (!clickNativeCheckout()) {
      window.location.href = "/checkout";
    }
  }

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

  function fetchShopifyCatalog() {
    if (!isShopify()) return Promise.resolve([]);
    return fetch("/products.json?limit=250")
      .then(function (r) { return r.ok ? r.json() : { products: [] }; })
      .then(function (d) { return d.products || []; })
      .catch(function () { return []; });
  }

  // ── Session helpers ────────────────────────────────────────────────
  var STORAGE_KEY = "aicw_session";

  function generateSessionId() {
    return "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  function saveSession(data) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function loadSession() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearSession() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function detectPageContext() {
    var path = window.location.pathname;
    if (path.indexOf("/products/") !== -1) {
      var handle = path.split("/products/")[1].split("?")[0].split("#")[0].replace(/\/$/, "");
      return { pageType: "product", productHandle: handle, url: window.location.href };
    }
    if (path === "/cart" || path.indexOf("/cart") === 0) {
      return { pageType: "cart", url: window.location.href };
    }
    if (path.indexOf("/checkout") !== -1) {
      return { pageType: "checkout", url: window.location.href };
    }
    if (path.indexOf("/collections/") !== -1) {
      return { pageType: "collection", url: window.location.href };
    }
    return { pageType: "browse", url: window.location.href };
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

  // Clean text for TTS
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

  // ── Fallback helpers for auto-search ────────────────────────────
  function looksLikeProductRecommendation(text) {
    if (!text) return false;
    var lower = text.toLowerCase();
    // Price indicators
    var pricePattern = /(₹|rs\.?|rupees?|mrp|price)\s*\d/i;
    if (pricePattern.test(text)) return true;
    // Multiple product-like mentions (capitalized multi-word names near prices)
    var productMentions = (text.match(/[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+/g) || []).length;
    if (productMentions >= 2) return true;
    // Keywords indicating product talk
    var keywords = ["perfume", "fragrance", "body wash", "shower gel", "gift set", "combo", "deo", "attar", "skincare", "moisturizer"];
    var keywordCount = keywords.filter(function (k) { return lower.includes(k); }).length;
    if (keywordCount >= 2) return true;
    return false;
  }

  function simplifyQuery(query) {
    if (!query) return "";
    var fillerWords = ["mujhe", "muje", "dikhao", "dikha", "do", "suggest", "karo", "show", "me", "please", "kuch", "accha", "best", "batao", "bata", "chahiye", "can", "you", "i", "want", "need", "looking", "for", "the", "a", "an", "some", "hai", "hain", "ke", "ki", "ka", "ko", "se", "mein", "aur", "ya", "bhi", "toh", "na", "nahi"];
    var words = query.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(function (w) {
      return w.length > 1 && fillerWords.indexOf(w) === -1;
    });
    return words.slice(0, 4).join(" ");
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

    // Auto-checkout: if we navigated to /cart with the flag, click checkout button after page loads
    if (isShopifyPlatform && sessionStorage.getItem("bellaai_auto_checkout") === "1" && window.location.pathname === "/cart") {
      sessionStorage.removeItem("bellaai_auto_checkout");
      setTimeout(function () {
        if (!clickNativeCheckout()) {
          window.location.href = "/checkout";
        }
      }, 1500); // Wait for cart page to fully render
    }

    var chatUrl = apiUrl + "/functions/v1/chat";
    var sttUrl = apiUrl + "/functions/v1/sarvam-stt";
    var ttsUrl = apiUrl + "/functions/v1/sarvam-tts";

    // Restore session
    var savedSession = loadSession();
    var sessionId = (savedSession && savedSession.sessionId) || generateSessionId();
    var conversationId = (savedSession && savedSession.conversationId) || null;
    var isOpen = (savedSession && savedSession.isOpen) || false;
    var shopifyCatalog = [];
    var pendingNavigation = null;

    // Voice state
    var voiceState = "idle";
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
    var voiceMessages = (savedSession && savedSession.voiceMessages) || [];
    var waveformRafId = 0;
    var welcomeTriggered = (savedSession && savedSession.welcomeTriggered) || false;
    var isWelcomeLoading = false;
    var transcriptBubbleTimeout = null;
    var lastBotText = (savedSession && savedSession.lastBotText) || "";

    function persistState() {
      saveSession({
        sessionId: sessionId,
        conversationId: conversationId,
        isOpen: isOpen,
        voiceMessages: voiceMessages,
        welcomeTriggered: welcomeTriggered,
        lastBotText: lastBotText
      });
    }

    // Fetch catalog on init
    if (isShopifyPlatform) {
      fetchShopifyCatalog().then(function (products) {
        shopifyCatalog = products;
        console.log("[AI Widget] Fetched " + products.length + " products from Shopify catalog");
      });
    }

    // ── DOM setup ────────────────────────────────────────────────
    var host = document.createElement("div");
    host.id = "ai-chat-widget";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "closed" });
    var styleEl = document.createElement("style");
    styleEl.textContent = getWidgetStyles(primaryColor);
    shadow.appendChild(styleEl);

    var root = document.createElement("div");
    root.className = "aicw-root";
    shadow.appendChild(root);

    // ── Toast ────────────────────────────────────────────────────
    function showToast(msg, isError) {
      var existing = root.querySelector(".aicw-toast");
      if (existing) existing.remove();
      var t = document.createElement("div");
      t.className = "aicw-toast" + (isError ? " error" : "");
      t.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' + msg;
      root.appendChild(t);
      setTimeout(function () { t.classList.add("aicw-toast-out"); }, 3000);
      setTimeout(function () { t.remove(); }, 3500);
    }

    // ── Transcript bubble ────────────────────────────────────────
    function showBubble(text, isUser) {
      var existing = root.querySelector(".aicw-transcript-bubble");
      if (existing) existing.remove();
      if (transcriptBubbleTimeout) clearTimeout(transcriptBubbleTimeout);

      var bubble = document.createElement("div");
      bubble.className = "aicw-transcript-bubble" + (isUser ? " user" : "");
      bubble.textContent = isUser ? ('"' + text + '"') : text;
      root.appendChild(bubble);

      transcriptBubbleTimeout = setTimeout(function () {
        bubble.classList.add("fading");
        setTimeout(function () { bubble.remove(); }, 500);
      }, 5000);
    }

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

    function getSupportedMimeType() {
      var types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", ""];
      for (var i = 0; i < types.length; i++) {
        if (types[i] === "" || MediaRecorder.isTypeSupported(types[i])) return types[i];
      }
      return "";
    }

    function normalizeMime(rawMime) {
      if (!rawMime) return "audio/webm";
      var lower = rawMime.toLowerCase().split(";")[0].trim();
      if (lower.indexOf("webm") !== -1) return "audio/webm";
      if (lower.indexOf("ogg") !== -1) return "audio/ogg";
      if (lower.indexOf("mp4") !== -1 || lower.indexOf("m4a") !== -1 || lower.indexOf("aac") !== -1) return "audio/mp4";
      return "audio/webm";
    }

    var sttFailCount = 0;
    var maxRecordingTimeout = null;

    function startListening() {
      if (!isOpen) return;
      audioChunks = [];
      voiceTranscript = "";
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        micStream = stream;
        setVoiceState("listening", "Listening...");

        var mimeType = getSupportedMimeType();
        var recorderOpts = mimeType ? { mimeType: mimeType } : undefined;
        mediaRecorder = new MediaRecorder(stream, recorderOpts);
        var recordingMimeType = mediaRecorder.mimeType || "audio/webm";
        mediaRecorder.ondataavailable = function (e) {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
          var blob = new Blob(audioChunks, { type: recordingMimeType });
          if (blob.size < 500) {
            setVoiceState("idle", "Tap to speak");
            if (isOpen) setTimeout(startListening, 1500);
            return;
          }
          processAudio(blob);
        };
        mediaRecorder.start(250);

        if (maxRecordingTimeout) clearTimeout(maxRecordingTimeout);
        maxRecordingTimeout = setTimeout(function () {
          if (voiceState === "listening") stopMic();
        }, 10000);

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
        setVoiceState("idle", "Mic access denied");
      });
    }

    function startWaveform() {
      var canvas = root.querySelector(".aicw-bar-waveform");
      if (!canvas || !analyserNode) return;
      var ctx = canvas.getContext("2d");
      var freqData = new Uint8Array(analyserNode.frequencyBinCount);
      var barCount = 20;

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
          ctx.fillStyle = "rgba(239, 68, 68, " + opacity + ")";
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, barW / 2);
          ctx.fill();
        }
        waveformRafId = requestAnimationFrame(draw);
      }
      waveformRafId = requestAnimationFrame(draw);
    }

    function processAudio(blob) {
      if (maxRecordingTimeout) { clearTimeout(maxRecordingTimeout); maxRecordingTimeout = null; }
      var rawMime = blob.type || "audio/webm";
      var normalizedMime = normalizeMime(rawMime);
      setVoiceState("processing", "Processing...");
      var reader = new FileReader();
      reader.onloadend = function () {
        var base64 = reader.result.split(",")[1];
        fetch(sttUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
          body: JSON.stringify({ audio: base64, sessionId: sessionId, audioMimeType: normalizedMime, audioMimeTypeRaw: rawMime })
        }).then(function (r) { return r.json(); }).then(function (sttResult) {
          if (sttResult.error) {
            sttFailCount++;
            setVoiceState("idle", "Tap to speak");
            if (isOpen) setTimeout(startListening, 1500);
            return;
          }
          var transcript = sttResult.transcript;
          if (!transcript || !transcript.trim()) {
            setVoiceState("idle", "Tap to speak");
            if (isOpen) setTimeout(startListening, 1500);
            return;
          }
          sttFailCount = 0;
          voiceTranscript = transcript;
          showBubble(transcript, true);
          setVoiceState("processing", "Thinking...");
          voiceMessages.push({ role: "user", content: transcript });
          sendToChat(transcript);
        }).catch(function (err) {
          console.error("STT error:", err);
          sttFailCount++;
          setVoiceState("idle", "Tap to speak");
          if (isOpen) setTimeout(startListening, 1500);
        });
      };
      reader.readAsDataURL(blob);
    }

    function sendToChat(query) {
      persistState();
      var pageContext = detectPageContext();
      var requestBody = {
        messages: voiceMessages.map(function (m) { return { role: m.role, content: m.content }; }),
        sessionId: sessionId,
        conversationId: conversationId,
        storeId: storeId,
        nativeDisplay: isShopifyPlatform,
        storeDomain: isShopifyPlatform ? window.location.origin : undefined,
        clientProducts: shopifyCatalog.length > 0 ? shopifyCatalog : undefined,
        pageContext: pageContext
      };

      function doFetch(retryCount) {
        fetch(chatUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
          body: JSON.stringify(requestBody)
        }).then(function (resp) {
          var convIdHeader = resp.headers.get("X-Conversation-Id");
          if (convIdHeader && !conversationId) { conversationId = convIdHeader; persistState(); }

          if (!resp.ok) {
            // Retry once on 500/503 errors
            if ((resp.status === 500 || resp.status === 503) && retryCount < 1) {
              console.warn("[AI Widget] Got " + resp.status + ", retrying in 2s...");
              setTimeout(function () { doFetch(retryCount + 1); }, 2000);
              return;
            }
            return resp.json().catch(function () { return {}; }).then(function (err) {
              setVoiceState("idle", err.error || "Something went wrong");
              isWelcomeLoading = false;
              render();
              setTimeout(function () {
                if (isOpen && voiceState === "idle") startListening();
              }, 3000);
            });
          }

          var fullResponse = "";
          var streamReader = resp.body.getReader();
          var decoder = new TextDecoder();
          var textBuffer = "";

          function pump() {
            return streamReader.read().then(function (result) {
              if (result.done) {
                onChatComplete(fullResponse, query);
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
          // Retry once on network errors
          if (retryCount < 1) {
            console.warn("[AI Widget] Fetch error, retrying in 2s...", err);
            setTimeout(function () { doFetch(retryCount + 1); }, 2000);
            return;
          }
          console.error("[AI Widget] Chat fetch error:", err);
          setVoiceState("idle", "Connection error");
          isWelcomeLoading = false;
          render();
          setTimeout(function () {
            if (isOpen && voiceState === "idle") startListening();
          }, 3000);
        });
      }
      doFetch(0);
    }

    function onChatComplete(fullResponse, query) {
      voiceMessages.push({ role: "assistant", content: fullResponse });
      persistState();

      var actions = extractActions(fullResponse);
      pendingNavigation = null;

      // Handle actions — navigate to real Shopify pages
      actions.forEach(function (action) {
        if (action.type === "open_product") {
          var handle = action.product_handle || extractHandle(action.product_link || "");
          if (handle && !pendingNavigation) pendingNavigation = "/products/" + handle;
        } else if (action.type === "navigate_to_search") {
          if (isShopifyPlatform && action.query) {
            pendingNavigation = "/search?q=" + encodeURIComponent(action.query);
          }
        } else if (action.type === "navigate_to_collection") {
          if (isShopifyPlatform && action.collection_handle) {
            pendingNavigation = "/collections/" + action.collection_handle;
          }
        } else if (action.type === "add_to_cart") {
          if (isShopifyPlatform) {
            // If on a PDP, try clicking the native Add to Cart button first
            var onPDP = window.location.pathname.indexOf("/products/") !== -1;
            if (onPDP) {
              var clicked = clickNativeAddToCart();
              if (clicked) {
                showToast("Added to cart!", false);
              } else if (action.product_name) {
                // Native button not found, fall back to API
                addToCartByProduct(action.product_name, action.product_link).then(function (result) {
                  showToast(result.message, !result.success);
                });
              }
            } else if (action.product_name) {
              // Not on PDP, use API approach
              addToCartByProduct(action.product_name, action.product_link).then(function (result) {
                showToast(result.message, !result.success);
              });
            }
          }
        } else if (action.type === "navigate_to_checkout") {
          if (isShopifyPlatform) pendingNavigation = "__checkout__";
        } else if (action.type === "navigate_to_cart") {
          if (isShopifyPlatform) pendingNavigation = "/cart";
        } else if (action.type === "schedule_call") {
          if (action.phone_number && action.scheduled_time) {
            console.log("[CALLBACK] Scheduling call:", action.phone_number, action.scheduled_time);
            showToast("Scheduling callback...", false);
            fetch(apiUrl + "/functions/v1/schedule-call", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
              body: JSON.stringify({
                phone_number: action.phone_number,
                scheduled_time: action.scheduled_time,
                conversation_id: conversationId,
                session_id: sessionId,
                context_summary: action.context || ""
              })
            }).then(function (r) {
              if (!r.ok) {
                console.error("[CALLBACK] schedule-call returned:", r.status);
                showToast("Failed to schedule callback", true);
                return null;
              }
              return r.json();
            }).then(function (data) {
              if (!data) return;
              if (data.success) {
                console.log("[CALLBACK] Scheduled successfully:", data);
                showToast("Callback scheduled for " + action.scheduled_time + "!", false);
              } else {
                console.error("[CALLBACK] Error:", data);
                showToast("Failed to schedule callback", true);
              }
            }).catch(function (err) {
              console.error("[CALLBACK] Failed:", err);
              showToast("Failed to schedule callback", true);
            });
          }
        }
      });

      // Fallback: if AI talked about products but forgot the action block, auto-search
      var hasNavAction = actions.some(function (a) {
        return a.type === "navigate_to_search" || a.type === "navigate_to_collection" || a.type === "open_product";
      });
      if (isShopifyPlatform && !hasNavAction && !pendingNavigation && looksLikeProductRecommendation(fullResponse) && query) {
        var sq = simplifyQuery(query);
        if (sq) {
          console.log("[AI Widget] Fallback auto-search for:", sq);
          pendingNavigation = "/search?q=" + encodeURIComponent(sq);
        }
      }

      isWelcomeLoading = false;

      // TTS
      var ttsText = cleanForTTS(fullResponse);
      lastBotText = ttsText;
      persistState();

      if (ttsText) {
        showBubble(ttsText.length > 120 ? ttsText.substring(0, 117) + "..." : ttsText, false);
      }

      if (!ttsText) {
        if (pendingNavigation && isShopifyPlatform) {
          executeNavigation();
          return;
        }
        setVoiceState("idle", "Tap to speak");
        setTimeout(startListening, 500);
        return;
      }

      setVoiceState("speaking", "Speaking...");

      fetch(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({ text: ttsText.slice(0, 500), sessionId: sessionId, target_language_code: detectLang(ttsText) })
      }).then(function (r) { return r.json(); }).then(function (ttsResult) {
        if (voiceState !== "speaking") return;
        var audioBase64 = ttsResult.audio;
        if (!audioBase64) {
          if (pendingNavigation && isShopifyPlatform) { executeNavigation(); return; }
          setVoiceState("idle", "Tap to speak");
          setTimeout(startListening, 500);
          return;
        }
        var audioMime = ttsResult.audioFormat === "mp3" ? "audio/mpeg" : "audio/wav";
        currentAudio = new Audio("data:" + audioMime + ";base64," + audioBase64);
        currentAudio.onended = function () {
          currentAudio = null;
          // Navigate AFTER speaking finishes
          if (pendingNavigation && isShopifyPlatform) {
            setTimeout(function () {
              persistState();
              executeNavigation();
            }, 1000);
            return;
          }
          if (voiceState === "speaking") {
            setVoiceState("idle", "Tap to speak");
            setTimeout(startListening, 800);
          }
        };
        currentAudio.onerror = function () {
          currentAudio = null;
          if (pendingNavigation && isShopifyPlatform) { executeNavigation(); return; }
          setVoiceState("idle", "Tap to speak");
          setTimeout(startListening, 1000);
        };
        currentAudio.play().then(function () {
          // Audio is playing — navigation will happen in onended
        }).catch(function () {
          if (pendingNavigation && isShopifyPlatform) { executeNavigation(); return; }
          setVoiceState("idle", "Tap to speak");
          setTimeout(startListening, 1000);
        });
      }).catch(function (err) {
        console.error("TTS error:", err);
        if (pendingNavigation && isShopifyPlatform) { executeNavigation(); return; }
        setVoiceState("idle", "Tap to speak");
        setTimeout(startListening, 1000);
      });
    }

    function executeNavigation() {
      if (!pendingNavigation) return;
      var nav = pendingNavigation;
      pendingNavigation = null;
      if (nav === "__checkout__") {
        // If already on /cart, click the native checkout button directly
        if (window.location.pathname === "/cart") {
          if (!clickNativeCheckout()) {
            // Fallback if native button not found
            window.location.href = "/checkout";
          }
        } else {
          // Navigate to /cart first, then auto-click checkout after page loads
          sessionStorage.setItem("bellaai_auto_checkout", "1");
          window.location.href = "/cart";
        }
      } else {
        window.location.href = nav;
      }
    }

    function onMicToggle() {
      if (isWelcomeLoading) return;
      if (voiceState === "idle") startListening();
      else if (voiceState === "listening") { stopMic(); setVoiceState("idle", "Tap to speak"); }
    }

    function triggerWelcome() {
      if (welcomeTriggered) return;
      welcomeTriggered = true;
      isWelcomeLoading = true;
      pendingNavigation = null;
      persistState();
      render();

      var welcomeQuery = "Hi, introduce yourself briefly as Bella AI";
      voiceMessages.push({ role: "user", content: welcomeQuery });
      sendToChat(welcomeQuery);
    }

    function closeWidget() {
      cancelVoice();
      welcomeTriggered = false;
      isWelcomeLoading = false;
      voiceMessages = [];
      voiceTranscript = "";
      lastBotText = "";
      conversationId = null;
      isOpen = false;
      clearSession();
      render();
    }

    function detectLang(text) {
      var hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
      var totalChars = text.replace(/\s/g, "").length || 1;
      return (hindiChars / totalChars) > 0.15 ? "hi-IN" : "en-IN";
    }

    // ── Render ────────────────────────────────────────────────────
    function render() {
      if (!isOpen) {
        // Show FAB — "Bella AI" text button
        root.innerHTML = '<button class="aicw-fab" aria-label="Open assistant">' + ICONS.mic + '<span>Bella AI</span></button>';
        root.querySelector(".aicw-fab").addEventListener("click", function () {
          isOpen = true;
          persistState();
          render();
          triggerWelcome();
        });
        return;
      }

      // Determine mic state
      var micIcon = ICONS.mic;
      var micLabel = '<span>Bella AI</span>';
      var micClass = "idle";
      var statusText = "Tap to speak";
      var subText = title;

      if (isWelcomeLoading) {
        micIcon = '<div class="aicw-spinner"></div>';
        micLabel = '';
        micClass = "processing";
        statusText = "Loading...";
        subText = "Setting up your assistant";
      } else if (voiceState === "listening") {
        micIcon = ICONS.micOff;
        micLabel = '';
        micClass = "listening";
        statusText = "Listening...";
        subText = "Speak now";
      } else if (voiceState === "processing") {
        micIcon = '<div class="aicw-spinner"></div>';
        micLabel = '';
        micClass = "processing";
        statusText = voiceStatusText || "Thinking...";
        subText = "";
      } else if (voiceState === "speaking") {
        micIcon = ICONS.voice;
        micLabel = '';
        micClass = "speaking";
        statusText = "Speaking...";
        subText = "";
      }

      var waveformHtml = voiceState === "listening" ? '<canvas class="aicw-bar-waveform"></canvas>' : '';

      // Build floating bar only (no panel, no overlay)
      var barHtml = '\
        <div class="aicw-floating-bar">\
          <button class="aicw-mic-btn ' + micClass + '" aria-label="Toggle microphone">' + micIcon + micLabel + '</button>\
          <div class="aicw-bar-info">\
            <div class="aicw-bar-status">' + statusText + '</div>\
            ' + (subText ? '<div class="aicw-bar-sub">' + subText + '</div>' : '') + '\
            ' + waveformHtml + '\
          </div>\
          <button class="aicw-close-btn" aria-label="Close">' + ICONS.close + '</button>\
        </div>';

      // Keep existing bubbles/toasts, only replace the bar
      var existingBubble = root.querySelector(".aicw-transcript-bubble");
      var existingToast = root.querySelector(".aicw-toast");
      root.innerHTML = barHtml;
      if (existingBubble) root.appendChild(existingBubble);
      if (existingToast) root.appendChild(existingToast);

      // Bind events
      root.querySelector(".aicw-close-btn").addEventListener("click", closeWidget);
      var micBtn = root.querySelector(".aicw-mic-btn");
      if (!isWelcomeLoading && (voiceState === "idle" || voiceState === "listening")) {
        micBtn.addEventListener("click", onMicToggle);
      }

      // Waveform
      if (voiceState === "listening" && analyserNode) startWaveform();
    }

    // ── Auto-restore ─────────────────────────────────────────────
    if (isOpen && savedSession) {
      var pageCtx = detectPageContext();
      console.log("[AI Widget] Restoring session, page:", pageCtx.pageType);
      render();
      if (voiceMessages.length > 0) {
        var contextNudge = null;
        if (pageCtx.pageType === "product" && pageCtx.productHandle) {
          contextNudge = "User has navigated to product page: " + pageCtx.productHandle + ". Briefly acknowledge this product and offer help.";
        } else if (pageCtx.pageType === "cart") {
          contextNudge = "User has navigated to the cart page. Briefly acknowledge and suggest checkout or add-ons.";
        } else if (pageCtx.pageType === "checkout") {
          contextNudge = "User is now on checkout. Briefly encourage them to complete the purchase.";
        }
        if (contextNudge) {
          voiceMessages.push({ role: "user", content: contextNudge });
          isWelcomeLoading = true;
          render();
          sendToChat(contextNudge);
        } else {
          setTimeout(startListening, 500);
        }
      } else {
        triggerWelcome();
      }
    } else {
      render();
    }

    return {
      open: function () {
        isOpen = true;
        persistState();
        render();
        triggerWelcome();
      },
      close: function () { closeWidget(); },
      destroy: function () { cancelVoice(); clearSession(); host.remove(); }
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
