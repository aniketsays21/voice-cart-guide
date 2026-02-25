/** Generates self-contained CSS for the widget (no Tailwind dependency) */
export function getWidgetStyles(primaryColor: string): string {
  return `
    .aicw-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a2e;
      box-sizing: border-box;
    }
    .aicw-root *, .aicw-root *::before, .aicw-root *::after {
      box-sizing: border-box;
    }

    /* Floating button */
    .aicw-fab {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: ${primaryColor};
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    .aicw-fab:hover { transform: scale(1.08); }
    .aicw-fab svg { width: 24px; height: 24px; }

    /* Panel */
    .aicw-panel {
      width: 380px; max-width: calc(100vw - 2rem);
      height: 560px; max-height: calc(100vh - 3rem);
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      background: #fff;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .aicw-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      background: ${primaryColor};
      color: #fff;
    }
    .aicw-header-title {
      display: flex; align-items: center; gap: 8px;
      font-weight: 600; font-size: 14px;
    }
    .aicw-header-title svg { width: 20px; height: 20px; }
    .aicw-close {
      width: 28px; height: 28px;
      border-radius: 50%; border: none;
      background: rgba(255,255,255,0.15);
      color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .aicw-close:hover { background: rgba(255,255,255,0.3); }
    .aicw-close svg { width: 16px; height: 16px; }

    /* Messages area */
    .aicw-messages {
      flex: 1; overflow-y: auto;
      padding: 12px 16px;
    }
    .aicw-empty { text-align: center; padding: 32px 0; }
    .aicw-empty p { color: #6b7280; font-size: 13px; margin: 0 0 4px; }
    .aicw-suggestions {
      display: flex; flex-wrap: wrap; gap: 8px;
      justify-content: center; margin-top: 16px;
    }
    .aicw-suggestion {
      font-size: 12px;
      background: #f3f4f6; color: #374151;
      border: none; border-radius: 999px;
      padding: 6px 14px; cursor: pointer;
      transition: opacity 0.2s;
    }
    .aicw-suggestion:hover { opacity: 0.75; }

    /* Message bubbles */
    .aicw-msg { display: flex; margin-bottom: 12px; }
    .aicw-msg-user { justify-content: flex-end; }
    .aicw-msg-assistant { justify-content: flex-start; }
    .aicw-bubble {
      max-width: 92%; padding: 10px 16px;
      border-radius: 16px; font-size: 14px; line-height: 1.5;
    }
    .aicw-bubble-user {
      background: ${primaryColor}; color: #fff;
      border-bottom-right-radius: 6px;
    }
    .aicw-bubble-assistant {
      background: #f3f4f6; color: #1a1a2e;
      border-bottom-left-radius: 6px;
    }
    .aicw-bubble p { margin: 0 0 4px; }
    .aicw-bubble p:last-child { margin-bottom: 0; }

    /* Loading */
    .aicw-loading {
      display: flex; justify-content: flex-start; margin-bottom: 12px;
    }
    .aicw-loading-dot {
      background: #f3f4f6; border-radius: 16px;
      border-bottom-left-radius: 6px;
      padding: 12px 20px;
      display: flex; gap: 4px; align-items: center;
    }
    .aicw-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #9ca3af;
      animation: aicw-bounce 1.4s infinite;
    }
    .aicw-dot:nth-child(2) { animation-delay: 0.2s; }
    .aicw-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes aicw-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }

    /* Product cards */
    .aicw-products { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
    .aicw-product {
      border: 1px solid #e5e7eb; border-radius: 12px;
      overflow: hidden; background: #fff;
    }
    .aicw-product-img {
      width: 100%; aspect-ratio: 1; object-fit: cover;
      background: #f3f4f6;
    }
    .aicw-product-body { padding: 10px; }
    .aicw-product-name {
      font-weight: 600; font-size: 13px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .aicw-product-price { font-weight: 700; font-size: 15px; margin-top: 6px; }
    .aicw-product-old { font-size: 12px; color: #9ca3af; text-decoration: line-through; margin-left: 6px; }
    .aicw-product-link {
      display: flex; align-items: center; justify-content: center; gap: 4px;
      margin-top: 8px; font-size: 11px; color: #6b7280;
      text-decoration: none; transition: color 0.2s;
    }
    .aicw-product-link:hover { color: #1a1a2e; }
    .aicw-product-link svg { width: 12px; height: 12px; }

    /* Input area */
    .aicw-input-area {
      border-top: 1px solid #e5e7eb;
      padding: 12px;
      display: flex; align-items: flex-end; gap: 8px;
    }
    .aicw-textarea {
      flex: 1; resize: none;
      border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 8px 12px; font-size: 14px;
      font-family: inherit; max-height: 96px;
      outline: none;
      transition: border-color 0.2s;
    }
    .aicw-textarea:focus { border-color: ${primaryColor}; }
    .aicw-send {
      width: 36px; height: 36px;
      border-radius: 50%; border: none;
      background: ${primaryColor}; color: #fff;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s;
    }
    .aicw-send:disabled { opacity: 0.4; cursor: default; }
    .aicw-send:not(:disabled):hover { opacity: 0.85; }
    .aicw-send svg { width: 16px; height: 16px; }

    /* Powered-by */
    .aicw-powered {
      text-align: center; font-size: 10px; color: #9ca3af;
      padding: 4px 0 8px;
    }

    /* Toast notifications */
    .aicw-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-10px);
      z-index: 100000;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
      animation: aicw-toast-in 0.3s ease forwards;
      max-width: 90vw;
    }
    .aicw-toast.aicw-toast-out {
      animation: aicw-toast-out 0.3s ease forwards;
    }
    .aicw-toast-success { background: #16a34a; }
    .aicw-toast-info { background: #2563eb; }
    .aicw-toast-error { background: #dc2626; }
    .aicw-toast svg { width: 18px; height: 18px; flex-shrink: 0; }
    @keyframes aicw-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes aicw-toast-out {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
  `;
}
