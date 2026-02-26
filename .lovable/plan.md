

# Change Assistant Identity from "Priya" to "Bella AI"

## Problem
The system prompt in the backend chat function still identifies the assistant as "Priya" (44 references). This is why the live Shopify store keeps saying "Hi I'm Priya" when users click the voice agent button.

## Changes

### 1. Backend: `supabase/functions/chat/index.ts`
Replace all 44 references to "Priya" with "Bella AI" throughout the system prompt. Key sections to update:

- **Line 462**: `"Tera naam PRIYA hai"` -> `"Tera naam BELLA AI hai"`
- **Lines 466-471**: The entire "YOUR IDENTITY - PRIYA" section renamed to "YOUR IDENTITY - BELLA AI" with all self-references updated
- **Line 468**: Introduction changed to: `"Hi, I am Bella AI, here are the best selling products of Bella Vita!"` (English) and the Hindi equivalent
- **Lines 474**: Welcome behavior greeting updated to: `"Hi I am Bella AI, here are best selling products of Bella Vita. Hindi: Namaste, main Bella AI hoon, ye rahe Bella Vita ke bestselling products!"`
- **Lines 494, 499, 501, 505-510, 529, 536**: All remaining "Priya" references replaced with "Bella AI"

### 2. Widget: `public/ai-chat-widget.js`
- Update the welcome trigger message (around line 898) to match the new greeting:
  `"Hi I am Bella AI, here are best selling products of Bella Vita. Namaste, main Bella AI hoon, ye rahe Bella Vita ke bestselling products!"`

### 3. Welcome Message Content
The new welcome greeting when users click the button will be:
- **English**: "Hi, I am Bella AI! Here are the best selling products of Bella Vita."
- **Hindi**: "Namaste, main Bella AI hoon! Ye rahe Bella Vita ke bestselling products."

After these changes, you'll need to bump your Shopify script version (e.g., `?v=105`) and hard refresh.
