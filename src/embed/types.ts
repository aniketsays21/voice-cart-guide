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
}

export type Msg = { role: "user" | "assistant"; content: string };
