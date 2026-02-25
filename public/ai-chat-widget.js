/**
 * AI Chat Widget — Voice-First Shopping Assistant (IIFE)
 * Drop this script on any website (Shopify, WordPress, etc.)
 * Voice-only mode with auto-welcome, rich product cards, and result groups.
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
    link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    mic: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    micOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    stop: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    voice: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" width="12" height="12"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    cart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'
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
    .aicw-panel {\
      width: 100%; height: 100%;\
      border-radius: 0;\
      border: none;\
      background: #fff;\
      display: flex; flex-direction: column;\
      overflow: hidden;\
    }\
    .aicw-header {\
      display: flex; align-items: center; justify-content: space-between;\
      padding: 12px 16px;\
      background: " + primaryColor + ";\
      color: #fff;\
      flex-shrink: 0;\
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
    /* ── Loading welcome ───────────── */\
    .aicw-loading-welcome {\
      flex: 1; display: flex; flex-direction: column;\
      align-items: center; justify-content: center;\
      padding: 32px 24px; text-align: center;\
    }\
    .aicw-loading-welcome h2 {\
      font-size: 18px; font-weight: 700; color: #1a1a2e;\
      margin: 0 0 8px;\
    }\
    .aicw-loading-welcome p {\
      font-size: 13px; color: #6b7280; margin: 0 0 24px;\
    }\
    .aicw-welcome-spinner {\
      width: 40px; height: 40px;\
      border: 4px solid #e5e7eb;\
      border-top-color: " + primaryColor + ";\
      border-radius: 50%;\
      animation: aicw-spin 0.8s linear infinite;\
    }\
    @keyframes aicw-spin {\
      to { transform: rotate(360deg); }\
    }\
    /* ── Results area ──────────────── */\
    .aicw-results-area {\
      flex: 1; overflow-y: auto;\
      padding: 12px;\
    }\
    .aicw-result-group {\
      margin-bottom: 16px;\
    }\
    .aicw-result-header {\
      font-size: 11px; font-weight: 600;\
      color: #6b7280; text-transform: uppercase;\
      letter-spacing: 0.05em;\
      padding: 0 4px 8px; margin: 0;\
    }\
    .aicw-results-grid {\
      display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));\
      gap: 10px;\
    }\
    @media (min-width: 768px) {\
      .aicw-results-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }\
    }\
    /* ── Rich product card ─────────── */\
    .aicw-rp {\
      border: 1px solid #e5e7eb; border-radius: 12px;\
      overflow: hidden; background: #fff;\
      transition: box-shadow 0.2s;\
    }\
    .aicw-rp:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }\
    .aicw-rp-img-wrap {\
      position: relative; aspect-ratio: 1;\
      background: #f3f4f6; overflow: hidden;\
    }\
    .aicw-rp-img {\
      width: 100%; height: 100%; object-fit: cover;\
    }\
    .aicw-rp-badges {\
      position: absolute; top: 6px; left: 6px;\
      display: flex; flex-direction: column; gap: 4px;\
    }\
    .aicw-badge-bestseller {\
      font-size: 9px; font-weight: 700; text-transform: uppercase;\
      background: linear-gradient(135deg, #f59e0b, #d97706);\
      color: #fff; padding: 2px 6px; border-radius: 4px;\
      letter-spacing: 0.04em;\
    }\
    .aicw-badge-discount {\
      font-size: 9px; font-weight: 700;\
      background: #10b981; color: #fff;\
      padding: 2px 6px; border-radius: 4px;\
    }\
    .aicw-rp-body { padding: 8px 10px 10px; }\
    .aicw-rp-name {\
      font-weight: 600; font-size: 12px; line-height: 1.3;\
      overflow: hidden; text-overflow: ellipsis;\
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;\
      color: #1a1a2e; margin: 0 0 4px;\
    }\
    .aicw-rp-rating {\
      display: flex; align-items: center; gap: 4px;\
      margin-bottom: 4px;\
    }\
    .aicw-rp-stars { display: flex; gap: 1px; color: #f59e0b; }\
    .aicw-rp-stars svg { width: 10px; height: 10px; }\
    .aicw-rp-verified {\
      font-size: 9px; color: #6b7280;\
    }\
    .aicw-rp-price-row {\
      display: flex; align-items: baseline; gap: 4px;\
      margin-bottom: 4px;\
    }\
    .aicw-rp-price {\
      font-weight: 700; font-size: 14px; color: #1a1a2e;\
    }\
    .aicw-rp-old-price {\
      font-size: 11px; color: #9ca3af; text-decoration: line-through;\
    }\
    .aicw-rp-discount-pct {\
      font-size: 10px; font-weight: 600; color: #10b981;\
    }\
    .aicw-rp-coupon {\
      font-size: 9px; background: #fef3c7; color: #92400e;\
      padding: 2px 6px; border-radius: 4px;\
      display: inline-block; margin-bottom: 6px;\
    }\
    .aicw-rp-link {\
      display: flex; align-items: center; justify-content: center; gap: 4px;\
      font-size: 11px; color: #6b7280;\
      text-decoration: none; transition: color 0.2s;\
      padding: 4px 0 0;\
    }\
    .aicw-rp-link:hover { color: " + primaryColor + "; }\
    .aicw-rp-link svg { width: 12px; height: 12px; }\
    /* ── Bottom bar ────────────────── */\
    .aicw-bottom-bar {\
      flex-shrink: 0;\
      border-top: 1px solid #e5e7eb;\
      padding: 8px 12px;\
      display: flex; align-items: center; gap: 10px;\
      background: #fafafa;\
    }\
    .aicw-mic-btn {\
      width: 72px; height: 72px;\
      border-radius: 50%; border: none;\
      cursor: pointer;\
      display: flex; align-items: center; justify-content: center;\
      transition: transform 0.2s, background 0.2s;\
      position: relative;\
      color: #fff; flex-shrink: 0;\
    }\
    .aicw-mic-btn svg { width: 32px; height: 32px; position: relative; z-index: 1; }\
    .aicw-mic-btn.small {\
      width: 40px; height: 40px;\
    }\
    .aicw-mic-btn.small svg { width: 20px; height: 20px; }\
    .aicw-mic-btn.idle { background: " + primaryColor + "; }\
    .aicw-mic-btn.listening { background: #ef4444; }\
    .aicw-mic-btn.processing { background: #f59e0b; pointer-events: none; }\
    .aicw-mic-btn.speaking { background: #10b981; pointer-events: none; }\
    .aicw-mic-btn:hover { transform: scale(1.06); }\
    .aicw-mic-btn::before {\
      content: '';\
      position: absolute; inset: -6px;\
      border-radius: 50%;\
      border: 2px solid;\
      opacity: 0;\
      animation: none;\
    }\
    .aicw-mic-btn.small::before { inset: -4px; }\
    .aicw-mic-btn.idle::before {\
      border-color: " + primaryColor + ";\
      opacity: 0.3;\
      animation: aicw-pulse 2s ease-in-out infinite;\
    }\
    .aicw-mic-btn.listening::before {\
      border-color: #ef4444;\
      opacity: 0.5;\
      animation: aicw-pulse 1s ease-in-out infinite;\
    }\
    @keyframes aicw-pulse {\
      0%, 100% { transform: scale(1); opacity: 0.3; }\
      50% { transform: scale(1.15); opacity: 0; }\
    }\
    .aicw-bar-info {\
      flex: 1; display: flex; flex-direction: column;\
      align-items: center; gap: 2px; min-width: 0;\
    }\
    .aicw-bar-status {\
      font-size: 11px; color: #6b7280;\
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\
      max-width: 100%;\
    }\
    .aicw-bar-waveform {\
      width: 100%; height: 28px;\
    }\
    .aicw-cancel-btn {\
      font-size: 11px; color: #6b7280;\
      background: none; border: 1px solid #e5e7eb;\
      border-radius: 999px; padding: 4px 12px;\
      cursor: pointer; transition: color 0.2s;\
      flex-shrink: 0;\
    }\
    .aicw-cancel-btn:hover { color: #ef4444; border-color: #ef4444; }\
    /* ── Idle center layout ────────── */\
    .aicw-center-idle {\
      flex: 1; display: flex; flex-direction: column;\
      align-items: center; justify-content: center;\
      padding: 32px 24px;\
    }\
    .aicw-center-idle p {\
      font-size: 13px; color: #6b7280; margin: 16px 0 0; text-align: center;\
    }\
    .aicw-spinner {\
      width: 24px; height: 24px;\
      border: 3px solid rgba(255,255,255,0.3);\
      border-top-color: #fff;\
      border-radius: 50%;\
      animation: aicw-spin 0.8s linear infinite;\
      position: relative; z-index: 1;\
    }\
    .aicw-powered {\
      text-align: center; font-size: 10px; color: #9ca3af;\
      padding: 4px 0 8px; flex-shrink: 0;\
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

  // Extract product blocks as data from AI response
  function extractProducts(content) {
    var products = [];
    var regex = /:::product\n([\s\S]*?):::/g;
    var match;
    while ((match = regex.exec(content)) !== null) {
      var props = {};
      match[1].split("\n").forEach(function (line) {
        var i = line.indexOf(":");
        if (i > 0) { var k = line.slice(0, i).trim(); var v = line.slice(i + 1).trim(); if (k && v) props[k] = v; }
      });
      if (props.name) products.push(props);
    }
    return products;
  }

  // Extract action blocks
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

  // Clean text for TTS — strip product/action blocks, markdown, emojis
  function cleanForTTS(content) {
    var text = content
      .replace(/:::(product|action)\n[\s\S]*?:::/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/#{1,6}\s*/g, "")
      .replace(/[_~>`|[\]{}()]/g, "")
      .replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/gu, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
    return text;
  }

  // Rich product card renderer
  function renderProductCardRich(p) {
    var img = p.image
      ? '<div class="aicw-rp-img-wrap"><img class="aicw-rp-img" src="' + p.image + '" alt="' + (p.name || "") + '" loading="lazy" onerror="this.style.display=\'none\'"/>'
      : '<div class="aicw-rp-img-wrap">';

    // Badges
    var badges = '';
    var rating = parseFloat(p.rating) || 0;
    if (rating >= 4.2) {
      badges += '<span class="aicw-badge-bestseller">★ Bestseller</span>';
    }

    var numPrice = parseFloat((p.price || "").replace(/[^\d.]/g, "")) || 0;
    var numDiscount = parseFloat((p.discount_price || "").replace(/[^\d.]/g, "")) || 0;
    var discountPct = 0;
    if (numDiscount > 0 && numPrice > numDiscount) {
      discountPct = Math.round(((numPrice - numDiscount) / numPrice) * 100);
    }
    if (discountPct > 0) {
      badges += '<span class="aicw-badge-discount">' + discountPct + '% OFF</span>';
    }

    if (badges) {
      img += '<div class="aicw-rp-badges">' + badges + '</div>';
    }
    img += '</div>';

    // Rating stars
    var ratingHtml = '';
    if (rating > 0) {
      var starsHtml = '';
      for (var s = 0; s < 5; s++) {
        var starOpacity = s < Math.round(rating) ? '1' : '0.25';
        starsHtml += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="opacity:' + starOpacity + '"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      }
      ratingHtml = '<div class="aicw-rp-rating"><div class="aicw-rp-stars">' + starsHtml + '</div><span class="aicw-rp-verified">' + rating.toFixed(1) + ' Verified</span></div>';
    }

    // Price
    var displayPrice = p.discount_price || p.price || "";
    var priceHtml = '<div class="aicw-rp-price-row"><span class="aicw-rp-price">' + displayPrice + '</span>';
    if (p.discount_price && p.price) {
      priceHtml += '<span class="aicw-rp-old-price">' + p.price + '</span>';
      if (discountPct > 0) {
        priceHtml += '<span class="aicw-rp-discount-pct">↓' + discountPct + '%</span>';
      }
    }
    priceHtml += '</div>';

    // Coupon
    var couponHtml = p.discount_code
      ? '<div class="aicw-rp-coupon">🏷️ ' + p.discount_code + '</div>'
      : '';

    // Link
    var linkHtml = '<a class="aicw-rp-link" href="' + (p.link || "#") + '" target="_blank" rel="noopener">' + ICONS.link + ' View Details</a>';

    return '<div class="aicw-rp">' + img +
      '<div class="aicw-rp-body">' +
        '<div class="aicw-rp-name">' + (p.name || "Product") + '</div>' +
        ratingHtml +
        priceHtml +
        couponHtml +
        linkHtml +
      '</div></div>';
  }

  // ── Widget ──────────────────────────────────────────────────────────
  function createWidget(config) {
    var apiUrl = config.apiUrl;
    var apiKey = config.apiKey;
    var storeId = config.storeId;
    var primaryColor = config.primaryColor || "#6c3beb";
    var title = config.title || "Shopping Assistant";
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

    // Result groups state
    var resultGroups = []; // [{query: string, products: []}]
    var isWelcomeLoading = false;
    var welcomeTriggered = false;

    function hasResults() { return resultGroups.length > 0 && resultGroups.some(function(g) { return g.products.length > 0; }); }

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
                console.log("Add to cart result:", result.message);
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

    // Create host element — full-screen overlay, hidden by default
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

    // ── Voice helpers ──────────────────────────────────────────────

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
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
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
            else if (now - vadSilenceStart > 2000) {
              stopMic();
              return;
            }
          } else {
            vadSilenceStart = 0;
          }
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
            setVoiceState("idle", "Didn't catch that. Try again.");
            return;
          }
          voiceTranscript = transcript;
          setVoiceState("processing", "Thinking...");
          render();

          voiceMessages.push({ role: "user", content: transcript });

          sendToChat(transcript);

        }).catch(function (err) {
          console.error("STT error:", err);
          setVoiceState("idle", "Speech recognition failed. Try again.");
        });
      };
      reader.readAsDataURL(blob);
    }

    // Send a message to chat API and handle response (used by both welcome and voice)
    function sendToChat(query) {
      fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
          messages: voiceMessages.map(function (m) { return { role: m.role, content: m.content }; }),
          sessionId: sessionId,
          conversationId: conversationId,
          storeId: storeId
        })
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
        console.error("Voice chat error:", err);
        setVoiceState("idle", "Connection error. Try again.");
        isWelcomeLoading = false;
        render();
      });
    }

    function onChatComplete(fullResponse, query) {
      voiceMessages.push({ role: "assistant", content: fullResponse });

      // Extract products and prepend as new result group
      var products = extractProducts(fullResponse);
      if (products.length > 0) {
        resultGroups.unshift({ query: query || "Results", products: products });
      }

      // Execute actions
      var actions = extractActions(fullResponse);
      actions.forEach(handleAction);
      executePendingActions();

      isWelcomeLoading = false;

      // TTS
      var ttsText = cleanForTTS(fullResponse);
      if (!ttsText) {
        setVoiceState("idle", "");
        render();
        setTimeout(startListening, 500);
        return;
      }

      setVoiceState("speaking", "Speaking...");

      fetch(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({ text: ttsText.slice(0, 500), sessionId: sessionId, target_language_code: "hi-IN" })
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
            setVoiceState("idle", "");
            setTimeout(startListening, 500);
          }
        };
        currentAudio.onerror = function () {
          currentAudio = null;
          setVoiceState("idle", "");
          setTimeout(startListening, 1000);
        };
        currentAudio.play().catch(function () {
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
      if (voiceState === "idle") {
        startListening();
      } else if (voiceState === "listening") {
        stopMic();
        setVoiceState("idle", "");
      }
    }

    // Auto-welcome: send initial query when widget opens
    function triggerWelcome() {
      if (welcomeTriggered) return;
      welcomeTriggered = true;
      isWelcomeLoading = true;
      render();

      var welcomeQuery = "Hi, show me top selling Bella Vita products";
      voiceMessages.push({ role: "user", content: welcomeQuery });
      sendToChat("Welcome");
    }

    // ── Render ─────────────────────────────────────────────────────

    function render() {
      if (!isOpen) {
        host.style.display = "none";
        root.innerHTML = "";
        return;
      }
      host.style.display = "block";

      var bodyHtml = "";

      if (isWelcomeLoading && !hasResults()) {
        // Loading state
        bodyHtml = '<div class="aicw-loading-welcome">\
          <h2>Welcome to Bella Vita</h2>\
          <p>Connecting to your shopping assistant...</p>\
          <div class="aicw-welcome-spinner"></div>\
        </div>';
      } else if (hasResults()) {
        // Results layout: scrollable grid + compact bottom bar
        var groupsHtml = resultGroups.map(function (group) {
          if (!group.products.length) return "";
          return '<div class="aicw-result-group">\
            <div class="aicw-result-header">Results for: ' + group.query + '</div>\
            <div class="aicw-results-grid">' + group.products.map(renderProductCardRich).join("") + '</div>\
          </div>';
        }).join("");

        bodyHtml = '<div class="aicw-results-area">' + groupsHtml + '</div>' + renderBottomBar();
      } else {
        // Idle, no results yet
        var micIcon = ICONS.mic;
        var micClass = "idle";
        if (voiceState === "listening") { micIcon = ICONS.micOff; micClass = "listening"; }
        else if (voiceState === "processing") { micIcon = '<div class="aicw-spinner"></div>'; micClass = "processing"; }
        else if (voiceState === "speaking") { micIcon = ICONS.voice; micClass = "speaking"; }

        bodyHtml = '<div class="aicw-center-idle">\
          <button class="aicw-mic-btn ' + micClass + '" aria-label="Toggle microphone">' + micIcon + '</button>\
          <p>Tap the mic and ask me anything!</p>\
        </div>';
      }

      root.innerHTML = '\
        <div class="aicw-panel">\
          <div class="aicw-header">\
            <div class="aicw-header-title">' + ICONS.mic + '<span>Bella Vita AI</span></div>\
            <button class="aicw-close" aria-label="Close">' + ICONS.close + '</button>\
          </div>' +
          bodyHtml + '\
          <div class="aicw-powered">Powered by AI</div>\
        </div>';

      // Bind close
      root.querySelector(".aicw-close").addEventListener("click", function () {
        cancelVoice();
        isOpen = false;
        render();
      });

      // Bind mic buttons (both center idle and bottom bar)
      root.querySelectorAll(".aicw-mic-btn").forEach(function (btn) {
        if (voiceState === "idle" || voiceState === "listening") {
          btn.addEventListener("click", onMicToggle);
        }
      });

      // Bind cancel
      var cancelEl = root.querySelector(".aicw-cancel-btn");
      if (cancelEl) cancelEl.addEventListener("click", cancelVoice);

      // Re-start waveform if listening
      if (voiceState === "listening" && analyserNode) {
        startWaveform();
      }
    }

    function renderBottomBar() {
      var micIcon = ICONS.mic;
      var micClass = "idle";
      if (voiceState === "listening") { micIcon = ICONS.micOff; micClass = "listening"; }
      else if (voiceState === "processing") { micIcon = '<div class="aicw-spinner"></div>'; micClass = "processing"; }
      else if (voiceState === "speaking") { micIcon = ICONS.voice; micClass = "speaking"; }

      var cancelBtn = (voiceState === "processing" || voiceState === "speaking")
        ? '<button class="aicw-cancel-btn">Cancel</button>'
        : '';

      var statusText = voiceStatusText || (voiceState === "idle" ? "Tap mic to ask..." : "");

      return '<div class="aicw-bottom-bar">\
        <button class="aicw-mic-btn small ' + micClass + '" aria-label="Toggle microphone">' + micIcon + '</button>\
        <div class="aicw-bar-info">\
          <div class="aicw-bar-status">' + statusText + '</div>\
          <canvas class="aicw-bar-waveform"></canvas>\
        </div>' +
        cancelBtn + '\
      </div>';
    }

    render();

    return {
      open: function () { isOpen = true; render(); triggerWelcome(); },
      close: function () { isOpen = false; render(); },
      destroy: function () { cancelVoice(); host.remove(); }
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
