

## AI E-commerce Shopping Assistant — MVP Plan

### Overview
A multilingual (English + Hindi) AI shopping assistant that guides users through product discovery via text or voice conversation, recommends products, shares product links, applies the best available discounts, and redirects users to external stores for checkout. Includes an admin dashboard for setup and sentiment analytics.

---

### Part 1: Customer-Facing Assistant (Chat Widget)

**1. Conversational Chat Interface**
- A floating chat widget that opens as a sidebar/modal on the page
- Text input with send button + voice input toggle (microphone button)
- Chat bubbles for user messages and assistant responses
- Assistant responses rendered with markdown support (for product cards, links, etc.)
- Typing indicator while the assistant is thinking

**2. Voice Conversation (Full Duplex)**
- **Voice Input**: ElevenLabs real-time speech-to-text (`scribe_v2_realtime`) for capturing user speech in English and Hindi
- **Voice Output**: ElevenLabs text-to-speech (`eleven_multilingual_v2`) so the assistant speaks back to the user
- Toggle between text-only and voice mode
- Visual indicator when assistant is speaking vs. listening

**3. AI-Powered Product Recommendations**
- Powered by Lovable AI (Gemini) via edge function
- The assistant understands user preferences, budget, and needs through conversation
- Recommends products from your custom product database (stored in Supabase)
- Displays product cards inline in chat (image, name, price, discount, rating)
- Each product card has a "View Product" button that opens the external store link

**4. Discount Engine**
- Discounts/coupons loaded from a JSON/database source into Supabase
- Assistant automatically finds the best applicable discount for the user's selected product
- Shows original price vs. discounted price in the product card
- When redirecting to external store, appends coupon code to the URL or instructs the user to apply it

**5. Guided Shopping Journey**
- Assistant stays active throughout: from discovery → product selection → adding to cart
- Contextual follow-ups: "Would you like to see similar products?", "Ready to buy?"
- When user is ready, assistant provides the direct link to the product page / add-to-cart page on the external store
- Language detection: responds in the same language the user speaks/types (English or Hindi)

---

### Part 2: Admin Dashboard

**6. Product & Discount Management**
- Upload/manage products (name, description, price, image URL, external link, category, tags)
- Upload/manage discount rules (coupon codes, discount %, applicable products, validity)
- Import via JSON upload or manual entry

**7. Agent Configuration**
- Set the assistant's personality/tone and system prompt
- Configure welcome message and suggested conversation starters
- Enable/disable languages
- Set the assistant's voice (choose ElevenLabs voice)

**8. Conversation Analytics & Sentiment**
- View all user conversations with the assistant
- AI-powered sentiment analysis on each conversation (positive/neutral/negative)
- Dashboard metrics: total conversations, conversion rate (clicked product link), top recommended products, language breakdown
- Filterable by date range and sentiment

---

### Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Tailwind + shadcn/ui |
| Backend | Supabase (database, auth, edge functions) |
| AI Brain | Lovable AI (Gemini) via edge functions |
| Voice Input | ElevenLabs Speech-to-Text (real-time) |
| Voice Output | ElevenLabs Text-to-Speech |
| Product Data | Supabase database (custom tables) |
| Discounts | Supabase database (loaded from JSON) |
| Sentiment | Lovable AI analyzing conversation transcripts |

### What You'll Need to Connect
- **Lovable Cloud** — for database, edge functions, and AI
- **ElevenLabs connector** — for voice input/output

### Build Order (MVP)
1. Set up Lovable Cloud + database tables (products, discounts, conversations)
2. Build the text chat interface with AI-powered product recommendations
3. Add product cards with external store links and discount display
4. Integrate ElevenLabs for voice input and voice output
5. Build admin dashboard — product/discount management
6. Add conversation logging and sentiment analysis dashboard

