/**
 * Embeddable AI Chat Widget — Entry Point
 *
 * Usage (script tag attributes):
 *   <script src="https://cdn.example.com/ai-chat-widget.js"
 *     data-store-id="my-store"
 *     data-api-url="https://xyz.supabase.co"
 *     data-api-key="ey..."
 *     data-primary-color="#6c3beb"
 *     data-title="My Assistant"
 *   ></script>
 *
 * Usage (global config):
 *   <script>
 *     window.AIChatConfig = {
 *       storeId: 'my-store',
 *       apiUrl: 'https://xyz.supabase.co',
 *       apiKey: 'ey...',
 *       primaryColor: '#6c3beb',
 *       title: 'My Assistant',
 *       welcomeMessage: '👋 Hello!',
 *       suggestions: ['Show me phones', 'Best deals today'],
 *       position: 'bottom-right',
 *     };
 *   </script>
 *   <script src="https://cdn.example.com/ai-chat-widget.js"></script>
 */

import { createWidget } from "./widget";
import type { WidgetConfig } from "./types";

declare global {
  interface Window {
    AIChatConfig?: Partial<WidgetConfig>;
    AIChatWidget?: ReturnType<typeof createWidget>;
  }
}

function init() {
  // Method 1: Global config object
  const globalConfig = window.AIChatConfig || {};

  // Method 2: Script tag data attributes
  const scriptEl =
    document.currentScript ||
    document.querySelector("script[data-store-id]");

  const attr = (name: string) => scriptEl?.getAttribute(`data-${name}`) || undefined;

  const config: WidgetConfig = {
    storeId: globalConfig.storeId || attr("store-id") || "default",
    apiUrl: globalConfig.apiUrl || attr("api-url") || "",
    apiKey: globalConfig.apiKey || attr("api-key") || "",
    primaryColor: globalConfig.primaryColor || attr("primary-color") || "#6c3beb",
    title: globalConfig.title || attr("title") || "Shopping Assistant",
    welcomeMessage: globalConfig.welcomeMessage || attr("welcome-message"),
    suggestions: globalConfig.suggestions,
    position: (globalConfig.position || attr("position") || "bottom-right") as WidgetConfig["position"],
    zIndex: globalConfig.zIndex || parseInt(attr("z-index") || "99999"),
  };

  if (!config.apiUrl) {
    console.error("[AI Chat Widget] Missing apiUrl. Set data-api-url or window.AIChatConfig.apiUrl");
    return;
  }

  window.AIChatWidget = createWidget(config);
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export { createWidget };
export type { WidgetConfig };
