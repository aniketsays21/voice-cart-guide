

# Serve Widget Bundle from Published Lovable URL

## Goal
Make the chat widget available at `https://voice-cart-guide.lovable.app/ai-chat-widget.js` so you can embed it on any Shopify store without needing to build locally.

## How It Works
Files in the `public/` folder of a Lovable project are served as-is at the published URL. By placing a ready-to-use JavaScript file there, Shopify (or any website) can load it directly via a script tag.

## Plan

### Step 1: Create `public/ai-chat-widget.js`
Convert the existing TypeScript widget source (`src/embed/`) into a single, self-contained JavaScript file and place it in `public/`. This file will contain:
- All the widget logic (chat panel, message rendering, streaming)
- All styles (inline CSS)
- All SVG icons (inline)
- Shopify integration (add-to-cart, navigation, product search)
- The auto-initialization code

No build step needed -- this is plain JavaScript wrapped in an IIFE.

### Step 2: Update `public/embed-demo.html`
Point the demo page's script tag to `/ai-chat-widget.js` so you can test the widget locally in the Lovable preview.

## After Implementation

Your Shopify embed code becomes:

```html
<script>
  window.AIChatConfig = {
    storeId: "your-store-name",
    apiUrl: "https://cjgyelmkjgwgwbwydddz.supabase.co",
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZ3llbG1ramd3Z3did3lkZGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjUzNzUsImV4cCI6MjA4NzUwMTM3NX0.pdf-BL2W6o4PFsiPjXYjanDWCEswWpt6SZoSqS86-sU",
    title: "Your Store Assistant",
    primaryColor: "#6c3beb",
    welcomeMessage: "Hi! How can I help you today?",
    suggestions: ["Show me products", "Best sellers"],
    position: "bottom-right"
  };
</script>
<script src="https://voice-cart-guide.lovable.app/ai-chat-widget.js"></script>
```

No local build, no CLI, no GitHub -- just paste this into your Shopify theme and publish.

## Technical Details

- The `public/ai-chat-widget.js` file is a manually compiled version of the TypeScript source in `src/embed/`
- It uses an IIFE (Immediately Invoked Function Expression) to avoid polluting the global scope
- Shadow DOM is used for style isolation so Shopify theme CSS won't affect the widget
- Future changes to the widget source will need to be reflected in this file as well
- The file will be approximately 15-20 KB unminified

