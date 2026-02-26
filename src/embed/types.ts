/** Configuration for the embeddable AI chat widget */
export interface WidgetConfig {
  /** Your store identifier (used for product routing) */
  storeId: string;
  /** Backend API base URL (your Supabase project URL) */
  apiUrl: string;
  /** Anon/publishable key for the backend */
  apiKey: string;
  /** Primary brand color (hex or hsl) */
  primaryColor?: string;
  /** Widget title */
  title?: string;
  /** Welcome message */
  welcomeMessage?: string;
  /** Suggested prompts shown on first open */
  suggestions?: string[];
  /** Position of the widget */
  position?: "bottom-right" | "bottom-left";
  /** Z-index for the widget */
  zIndex?: number;
  /** Platform detection — auto-detects Shopify if not specified */
  platform?: "shopify" | "generic";
  /** Store domain passed to backend for catalog fetch */
  storeDomain?: string;
  /** Use native Shopify display instead of custom product cards */
  nativeDisplay?: boolean;
}

export type Msg = { role: "user" | "assistant"; content: string };

/** Parsed action block from AI response */
export interface ActionBlock {
  type: "add_to_cart" | "open_product" | "navigate_to_checkout" | "navigate_to_cart" | "schedule_call";
  product_name?: string;
  product_link?: string;
  phone_number?: string;
  scheduled_time?: string;
  context?: string;
}
