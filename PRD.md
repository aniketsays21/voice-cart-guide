# Product Requirements Document (PRD)
## Priya — Voice-First AI Shopping Assistant for Shopify

**Version**: 1.0  
**Last Updated**: February 2026  
**Platform**: Web (Shopify Embed + Standalone)

---

## 1. Executive Summary

Priya is a **multilingual, voice-first AI shopping assistant** designed for Indian e-commerce stores on Shopify. She operates as a conversational voice agent that helps users discover products, add items to cart, navigate to checkout, and even schedule callback phone calls — all through natural Hinglish (Hindi-English) voice commands.

Unlike traditional chatbots with text-based interfaces, Priya provides a **fully voice-driven experience** with no visible text input or chat history. The user speaks, Priya listens, processes the query, fetches relevant products from the live Shopify catalog, displays them in a product grid, and responds aloud via text-to-speech — all in real time.

---

## 2. Product Vision

> A voice-powered, results-oriented shopping engine — not a chatbot — that guides Indian consumers through product discovery to purchase using natural, conversational Hinglish.

### Core Design Principles
- **Voice-Only**: No text input field. Users interact entirely via speech.
- **Continuous Listening**: Mic auto-restarts after each TTS response for hands-free flow.
- **Results-Oriented**: Shows product grids, not chat bubbles. Priya is a shopping engine.
- **Platform-Native**: On Shopify, Priya controls the real store — navigating pages, clicking Add to Cart buttons, and opening checkout.
- **Multilingual**: Understands Hindi, English, and Hinglish; responds in natural Hinglish using Roman script.

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                           │
│                                                          │
│  ┌─────────────────────┐   ┌──────────────────────────┐  │
│  │  Standalone App      │   │  Embeddable Widget       │  │
│  │  (React + Vite)      │   │  (IIFE Bundle)           │  │
│  │  /pages/Chat.tsx     │   │  /embed/widget.ts        │  │
│  │  Voice-only UI       │   │  Shadow DOM, text chat   │  │
│  │  + Product Grid      │   │  + Product cards         │  │
│  │  + Talking Avatar    │   │  + Shopify native actions│  │
│  └──────────┬──────────┘   └──────────┬───────────────┘  │
│             │                          │                  │
└─────────────┼──────────────────────────┼──────────────────┘
              │          HTTPS           │
              ▼                          ▼
┌──────────────────────────────────────────────────────────┐
│                 BACKEND LAYER (Edge Functions)            │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐             │
│  │  chat     │  │ sarvam-stt│  │ sarvam-tts│             │
│  │  (AI +    │  │ (Speech   │  │ (Text to  │             │
│  │  Catalog) │  │  to Text) │  │  Speech)  │             │
│  └──────────┘  └───────────┘  └───────────┘             │
│  ┌──────────────┐  ┌────────────────────────┐            │
│  │ schedule-call │  │ trigger-scheduled-calls │            │
│  │ (Store call)  │  │ (pg_cron → ElevenLabs)  │            │
│  └──────────────┘  └────────────────────────┘            │
│                                                          │
│                    Lovable Cloud (Supabase)               │
│          ┌──────────────────────────────────┐             │
│          │  PostgreSQL Database             │             │
│          │  - conversations                 │             │
│          │  - messages                      │             │
│          │  - products (fallback)           │             │
│          │  - discounts                     │             │
│          │  - scheduled_calls               │             │
│          │  - rate_limits                   │             │
│          │  - daily_usage                   │             │
│          │  - request_logs                  │             │
│          └──────────────────────────────────┘             │
└──────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│                                                          │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Lovable AI      │  │ Sarvam AI    │  │ ElevenLabs   │ │
│  │ Gateway         │  │ (Indian TTS  │  │ (Fallback    │ │
│  │ (Gemini 3       │  │  & STT)      │  │  TTS/STT +   │ │
│  │  Flash Preview) │  │              │  │  Outbound    │ │
│  │                 │  │              │  │  Calling)    │ │
│  └────────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌────────────────────────────────────┐                  │
│  │ Shopify Storefront JSON API        │                  │
│  │ /products.json, /products/{h}.js   │                  │
│  │ /cart/add.js, /search/suggest.json │                  │
│  └────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Two Client Modes

| Feature | Standalone App (`Chat.tsx`) | Embeddable Widget (`widget.ts`) |
|---------|----------------------------|--------------------------------|
| **UI** | Full-screen voice-only with avatar | Floating chat bubble with text input |
| **Voice** | ✅ STT + TTS + VAD | ❌ Text-only |
| **Product Display** | Custom product grid component | Inline product cards in chat |
| **Shopify Actions** | Via action blocks (open, add to cart) | Native Shopify API (cart/add.js, navigation) |
| **Deployment** | Hosted on Lovable published URL | Embedded via `<script>` tag in Shopify `theme.liquid` |
| **Style Isolation** | React + Tailwind CSS | Shadow DOM with self-contained CSS |

---

## 4. Feature Breakdown

### 4.1 Voice Pipeline

The voice pipeline follows this sequence for each user interaction:

```
[User Speaks] → [MediaRecorder (WebM/Opus)]
       → [VAD: 1500ms silence detection]
       → [Base64 encode audio]
       → [STT Edge Function]
            → ElevenLabs Scribe V2 (primary)
            → Sarvam saaras:v2 (fallback)
       → [Transcript text]
       → [Chat Edge Function (Gemini 3 Flash)]
            → Stream SSE response
       → [Parse products + actions from response]
       → [Display product grid]
       → [TTS Edge Function (parallel)]
            → Sarvam bulbul:v2 "priya" voice (primary)
            → ElevenLabs multilingual_v2 (fallback)
       → [Play audio via HTMLAudioElement]
       → [Auto-restart mic for continuous listening]
```

#### 4.1.1 Speech-to-Text (STT)

**Edge Function**: `supabase/functions/sarvam-stt/index.ts`

| Provider | Model | Priority | Notes |
|----------|-------|----------|-------|
| ElevenLabs | `scribe_v2` | Primary | Reliable, supports multilingual |
| Sarvam AI | `saaras:v2` | Fallback 1 | Indian-language optimized, currently returning 404 |
| Sarvam AI (Key 2) | `saaras:v2` | Fallback 2 | Redundant key for rate limit handling |

**Input**: Base64-encoded audio (WebM/Opus, auto-detected via container sniffing)  
**Output**: `{ transcript: string, language_code: string }`  
**Max Size**: 5MB base64  
**MIME Resolution**: Container byte sniffing (WebM, OGG, MP4, WAV) for cross-browser compatibility (Safari/iOS)

#### 4.1.2 Text-to-Speech (TTS)

**Edge Function**: `supabase/functions/sarvam-tts/index.ts`

| Provider | Model | Voice | Priority | Format |
|----------|-------|-------|----------|--------|
| Sarvam AI | `bulbul:v2` | `priya` | Primary (Key 1 → Key 2) | WAV |
| ElevenLabs | `eleven_multilingual_v2` | `River` (SAz9YHcvj6GT2YYXdXww) | Fallback | MP3 |

**Input**: `{ text: string, target_language_code: "hi-IN" | "en-IN" }`  
**Output**: `{ audio: base64_string, audioFormat: "wav" | "mp3" }`  
**Max Text Length**: 2000 chars (truncated to 1000 for TTS)  
**Language Detection**: Auto-detects Hindi (Devanagari Unicode range `\u0900-\u097F`) to set correct language code.

#### 4.1.3 Voice Activity Detection (VAD)

**File**: `src/hooks/useVAD.ts`

- Custom WebAudio API-based VAD using `AnalyserNode`
- FFT size: 512
- RMS threshold: 0.015
- Silence timeout: **1500ms** (stops recording after 1.5s of silence)
- 10-second maximum recording timeout as safeguard

#### 4.1.4 Barge-In

Users can interrupt Priya mid-speech. When the mic activates, any playing TTS audio is immediately paused and cleared via `stopTTS()`.

### 4.2 AI Reasoning Engine

**Edge Function**: `supabase/functions/chat/index.ts`  
**Model**: `google/gemini-3-flash-preview` via Lovable AI Gateway  
**Streaming**: Server-Sent Events (SSE)

#### Request Flow:
1. **Validate input** (messages array, session ID format, max 20 messages, max 2000 chars per message)
2. **Sanitize** user input (strip `:::` markers, filter prompt injection patterns)
3. **Rate limit** check (10 requests/minute, 50 requests/day per session)
4. **Fetch product catalog** from Shopify (`/products.json`) with 5-minute server-side cache
5. **Extract intent** from user messages:
   - Category keywords (Perfume, Skincare, Gift Set, etc.)
   - Budget parsing (`under ₹500`, `budget kam hai`)
   - Gender detection (for men, for women, unisex)
   - Occasion keywords (party, date, office, wedding, etc.)
6. **Filter catalog** by detected intent
7. **Build system prompt** with Priya's personality, rules, and filtered product data
8. **Stream response** from Gemini with real-time SSE forwarding
9. **Persist** conversation and messages to database

#### System Prompt Structure:
The system prompt is ~700 lines and includes:
- **Identity**: Priya, warm Hinglish-speaking shopping friend
- **Welcome behavior**: Auto-greeting with top products
- **Conversation memory**: Track preferences, budget, rejections
- **Proactive upselling**: Suggest combos, complementary products
- **Mood/occasion shopping**: Ask follow-ups for vague queries
- **Budget empathy**: Never make user feel bad about budget
- **Voice command recognition**: Handle Hinglish voice commands
- **Callback scheduling**: Strictly reactive phone callback system
- **Security rules**: Anti-injection, no fake data
- **Voice output rules**: No markdown, no emojis, plain text only

#### Two Display Modes:

1. **Floating Overlay Mode** (`nativeDisplay: true`): Priya navigates real Shopify pages using action blocks (`navigate_to_search`, `open_product`, `navigate_to_collection`). No custom product cards.

2. **Legacy/Card Mode** (`nativeDisplay: false`): Priya renders her own `:::product` blocks with name, price, image, discount, and link.

#### Page Context Awareness:
When embedded on Shopify, Priya detects the current page type:
- **Product page**: Proactively talks about the viewed product
- **Cart page**: Suggests checkout or add-on products
- **Checkout page**: Reassures, answers shipping/payment questions
- **Collection page**: Helps filter and find best products

### 4.3 Product Catalog Integration

**Primary Source**: Shopify Storefront JSON API  
**Fallback Source**: Internal `products` table in database

#### Server-Side (Chat Edge Function):
```
Shopify /products.json → paginated fetch (up to 2500 products)
→ Map to internal format (name, price, salePrice, tags, handle, image)
→ 5-minute cache (server-side)
→ Filter by intent (category, budget, gender)
→ Inject into system prompt as PRODUCT CATALOG DATA
```

#### Client-Side (Embed Widget):
```
Widget can receive products from Shopify storefront JS
→ Sent as clientProducts in chat request body
→ Server uses them directly (freshest data)
→ Falls back to server-side fetch if no client data
```

#### Live Enrichment:
When product cards render in the embed widget, they're enriched with live Shopify data:
```
Product card rendered → fetchProductByHandle(/products/{handle}.js)
→ Update image, price, compare_at_price in DOM
```

### 4.4 Shopify Native Actions

When running on a Shopify storefront, the widget can execute real store actions:

| Action | How It Works |
|--------|-------------|
| **Add to Cart** | `POST /cart/add.js` with variant ID, then dispatch `cart:refresh` event |
| **Open Product** | `window.location.href = /products/{handle}` |
| **Navigate to Checkout** | `window.location.href = /checkout` |
| **Navigate to Cart** | `window.location.href = /cart` |
| **Search Products** | `GET /search/suggest.json?q={query}` |

**Product Resolution Flow** (for Add to Cart):
1. Extract handle from product link
2. If no handle, search Shopify by product name via `/search/suggest.json`
3. Fetch variant ID via `/products/{handle}.js`
4. POST to `/cart/add.js` with variant ID

Actions execute **immediately during streaming** — they fire as soon as a complete `:::action:::` block is parsed, while Priya is still speaking.

### 4.5 Cart System (Standalone App)

**File**: `src/contexts/CartContext.tsx`

The standalone app has its own cart system (separate from Shopify's cart):
- Local cart state persisted to `localStorage`
- Auto-applies best discount from `discounts` table
- Supports quantity updates, remove, clear
- Cart drawer with item list, subtotal, discounts, and total

### 4.6 Callback Scheduling System

A **strictly reactive** callback feature — Priya never proactively suggests it.

#### Trigger:
Only activates when the user explicitly says they are busy:
- "Abhi free nahi hu"
- "Baad mein call karo"
- "Meko 3 baje call karna"
- "I don't have time now"

#### Flow:
```
User: "Abhi time nahi hai, baad mein call karo"
Priya: "Zaroor! Phone number bata dijiye"
User: "9876543210"
Priya: "Kis time pe call karoon?"
User: "3 baje"
Priya: [Outputs :::action type: schedule_call phone_number: 9876543210 scheduled_time: 15:00 context: ...:::]
       "Done! Main aapko 3:00 PM pe call karungi!"
```

#### Backend Components:

1. **`schedule-call` Edge Function**: Parses time (HH:MM, H:MM AM/PM), normalizes phone to +91, inserts into `scheduled_calls` table with status `pending`.

2. **`trigger-scheduled-calls` Edge Function**: Triggered by `pg_cron` every minute. Queries `scheduled_calls` where `status = 'pending'` and `scheduled_at <= now()`. For each due call:
   - Loads conversation history from `messages` table
   - Initiates outbound call via ElevenLabs Conversational AI API (`/v1/convai/twilio/outbound-call`)
   - Passes conversation context as dynamic variables to the calling agent
   - Updates status to `calling` or `failed`

3. **Database Automation**: `pg_cron` + `pg_net` extensions schedule HTTP POST to the trigger function every minute.

### 4.7 Avatar & UI (Standalone App)

**File**: `src/components/assistant/TalkingAvatar.tsx`

Three avatar states with visual feedback:
- **Idle**: Subtle pulse animation, "Hi! I'm Priya, your shopping assistant"
- **Listening**: Red pulse ring, "Listening..."
- **Speaking**: Animated wave bars, "Priya is speaking..."

**Voice Button** (`VoiceButton.tsx`): Large circular mic button with pulsing rings.

**Audio Waveform** (`AudioWaveform.tsx`): Visual feedback during recording.

**Product Grid** (`ProductResults.tsx`): Scrollable product cards with images, prices, ratings, discounts.

**Product Detail Sheet** (`ProductDetailSheet.tsx`): Bottom sheet for detailed product view.

---

## 5. Deployment Model

### 5.1 Embeddable Widget

The widget is built as a **single IIFE bundle** using a separate Vite config (`vite.config.widget.ts`):

```javascript
// Output: dist-widget/ai-chat-widget.js
// Format: IIFE (Immediately Invoked Function Expression)
// Minification: Terser
```

#### Shopify Integration:
```html
<!-- In theme.liquid -->
<script>
  window.AIChatConfig = {
    storeId: 'bella-vita-test',
    apiUrl: 'https://cjgyelmkjgwgwbwydddz.supabase.co',
    apiKey: 'eyJ...',
    primaryColor: '#6c3beb',
    title: 'Priya - Shopping Assistant',
    platform: 'shopify',
    nativeDisplay: true
  };
</script>
<script src="https://voice-cart-guide.lovable.app/ai-chat-widget.js"></script>
```

**Key Design Decisions**:
- **Shadow DOM**: Complete style isolation from host page CSS
- **Zero dependencies**: No React, no Tailwind — pure vanilla JS + inline CSS
- **Auto-detect Shopify**: Checks `window.Shopify.shop` to enable native actions
- **Hosted on published URL**: Auto-updates across all stores when redeployed

### 5.2 Standalone App

The full React app is deployed on Lovable's published URL (`voice-cart-guide.lovable.app`). This serves as:
- The voice-first interface for direct use
- CDN host for the embeddable widget bundle

---

## 6. Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `conversations` | Track chat sessions | session_id, language, sentiment, product_clicks |
| `messages` | Store conversation history | conversation_id, role, content |
| `products` | Fallback product catalog | name, price, category, tags, external_link, image_url |
| `discounts` | Active discount/coupon data | coupon_code, discount_percent, applicable_category, product_id |
| `scheduled_calls` | Pending/completed callback requests | phone_number, scheduled_at, status, context_summary |
| `rate_limits` | Per-minute rate limiting | session_id, function_name, request_count, window_start |
| `daily_usage` | Per-day usage caps | session_id, function_name, request_count, usage_date |
| `request_logs` | Analytics/monitoring | session_id, function_name, message_length, response_time_ms |

### RLS Policies

- **conversations, messages**: Publicly readable/insertable (anonymous users, no auth)
- **products, discounts**: Publicly readable only
- **rate_limits, daily_usage, request_logs, scheduled_calls**: Service role only (edge functions)

---

## 7. API Reference

### 7.1 Edge Functions

| Function | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/chat` | POST | Anon key | AI conversation with streaming SSE |
| `/functions/v1/sarvam-stt` | POST | Anon key | Speech-to-text transcription |
| `/functions/v1/sarvam-tts` | POST | Anon key | Text-to-speech synthesis |
| `/functions/v1/schedule-call` | POST | Anon key | Store callback request |
| `/functions/v1/trigger-scheduled-calls` | POST | Anon key | Cron-triggered: initiate due calls |

### 7.2 Chat API

**Request**:
```json
{
  "messages": [{"role": "user", "content": "show me perfumes under 500"}],
  "sessionId": "session_1234567890_abc1234",
  "conversationId": null,
  "storeDomain": "bella-vita-test.myshopify.com",
  "clientProducts": [],
  "nativeDisplay": true,
  "pageContext": {"pageType": "collection"}
}
```

**Response**: SSE stream
```
data: {"choices":[{"delta":{"content":"Hello! Main Priya..."}}]}
data: {"choices":[{"delta":{"content":":::product\nname: CEO Man..."}}]}
data: [DONE]
```

**Response Headers**:
- `X-Conversation-Id`: UUID of the conversation (for persistence)

### 7.3 STT API

**Request**:
```json
{
  "audio": "<base64-encoded-audio>",
  "sessionId": "session_...",
  "audioMimeType": "audio/webm;codecs=opus"
}
```

**Response**:
```json
{
  "transcript": "mujhe ek perfume chahiye under 500",
  "language_code": "hi"
}
```

### 7.4 TTS API

**Request**:
```json
{
  "text": "Ye rahe aapke liye best perfumes under 500",
  "target_language_code": "hi-IN",
  "sessionId": "session_..."
}
```

**Response**:
```json
{
  "audio": "<base64-encoded-audio>",
  "audioFormat": "wav"
}
```

### 7.5 Schedule Call API

**Request**:
```json
{
  "phone_number": "9876543210",
  "scheduled_time": "15:00",
  "conversation_id": "uuid",
  "session_id": "session_...",
  "context_summary": "User interested in woody perfumes under 1000"
}
```

**Response**:
```json
{
  "success": true,
  "scheduled_at": "2026-02-26T09:30:00.000Z",
  "id": "uuid"
}
```

---

## 8. External Services & API Keys

| Service | Usage | Secret Name |
|---------|-------|-------------|
| **Lovable AI Gateway** | Gemini 3 Flash for AI reasoning | `LOVABLE_API_KEY` |
| **Sarvam AI** | Indian-accent TTS (bulbul:v2) + STT (saaras:v2) | `SARVAM_API_KEY`, `SARVAM_API_KEY_2` |
| **ElevenLabs** | Fallback TTS/STT + Outbound phone calls | `ELEVENLABS_API_KEY` |
| **ElevenLabs Agent** | Conversational AI agent for callbacks | `ELEVENLABS_AGENT_ID` |
| **ElevenLabs Phone** | Phone number for outbound calls | `ELEVENLABS_PHONE_NUMBER_ID` |
| **Shopify** | Product catalog via public JSON API | No key needed (public endpoints) |

---

## 9. Rate Limiting & Security

### Rate Limits
- **Chat**: 10 requests/minute, 50 requests/day per session
- **STT**: 20 requests/minute per session
- **TTS**: 20 requests/minute per session

### Security Measures
- **Prompt injection detection**: Regex-based filtering of injection patterns ("ignore previous instructions", "you are now", "jailbreak", etc.)
- **Input sanitization**: Strip `:::` markers from user input to prevent action block injection
- **Message limits**: Max 20 messages per request, max 2000 chars per user message, max 5000 chars stored
- **Audio limits**: Max 5MB base64 for STT, max 2000 chars for TTS
- **RLS policies**: Service-role-only access to rate limits, logs, and scheduled calls
- **No JWT verification**: Edge functions use anon key auth (public-facing widget)

---

## 10. Performance Optimizations

| Optimization | Impact |
|-------------|--------|
| STT: ElevenLabs first (skip failing Sarvam) | ~2-3s saved per transcription |
| TTS: Fixed Sarvam speaker to "priya" | ~2-3s saved (was falling back to ElevenLabs) |
| VAD: 1500ms silence threshold (was 2500ms) | ~1s faster response trigger |
| Server-side product cache (5min TTL) | Eliminates redundant Shopify fetches |
| SSE streaming | User sees response as it generates |
| Actions execute during streaming | Shopify actions fire while Priya speaks |
| Client-sent products | Freshest data without server fetch |
| Audio container sniffing | Cross-browser compatibility without extra processing |

---

## 11. Action Block Protocol

The AI response can contain structured blocks parsed by the client:

### Product Block
```
:::product
name: CEO Man Perfume
description: Woody fragrance for men
price: ₹599
discount_price: ₹449
image: https://cdn.shopify.com/...
link: https://store.com/products/ceo-man
rating: 4.5
:::
```

### Action Block
```
:::action
type: add_to_cart | open_product | navigate_to_checkout | navigate_to_cart | navigate_to_search | navigate_to_collection | schedule_call
product_name: Product Name
product_handle: product-handle
product_link: /products/product-handle
phone_number: 9876543210
scheduled_time: 15:00
context: User conversation summary
query: search keywords
collection_handle: men
:::
```

---

## 12. File Structure

```
├── src/
│   ├── pages/
│   │   ├── Chat.tsx              # Main voice-first UI (standalone app)
│   │   ├── Index.tsx             # Landing/redirect page
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── assistant/
│   │   │   ├── TalkingAvatar.tsx  # Animated Priya avatar (idle/speaking/listening)
│   │   │   ├── VoiceButton.tsx    # Microphone button with pulse animations
│   │   │   ├── AudioWaveform.tsx  # Recording visualization
│   │   │   ├── ProductResults.tsx # Product grid display
│   │   │   ├── ProductDetailSheet.tsx # Product detail bottom sheet
│   │   │   ├── AssistantInput.tsx # (unused — voice-only mode)
│   │   │   └── ShopifyProductCard.tsx
│   │   ├── cart/
│   │   │   └── CartDrawer.tsx     # Slide-out cart panel
│   │   └── chat/
│   │       ├── ChatWidget.tsx     # (Legacy text-based widget)
│   │       ├── ChatMessage.tsx
│   │       └── ProductCard.tsx
│   ├── embed/                     # Embeddable widget (zero-dependency)
│   │   ├── index.ts              # Entry point, auto-init from config
│   │   ├── widget.ts             # Core widget: Shadow DOM, send/render, actions
│   │   ├── shopify.ts            # Shopify native API handlers
│   │   ├── types.ts              # WidgetConfig, ActionBlock interfaces
│   │   ├── styles.ts             # Self-contained CSS (no Tailwind)
│   │   └── icons.ts              # SVG icon strings
│   ├── hooks/
│   │   ├── useVAD.ts             # Voice Activity Detection hook
│   │   └── use-mobile.tsx
│   ├── contexts/
│   │   └── CartContext.tsx        # Cart state management + discount auto-apply
│   └── integrations/supabase/
│       ├── client.ts             # Auto-generated Supabase client
│       └── types.ts              # Auto-generated database types
├── supabase/
│   ├── functions/
│   │   ├── chat/index.ts         # AI reasoning + catalog + streaming (873 lines)
│   │   ├── sarvam-stt/index.ts   # Speech-to-text with fallback chain
│   │   ├── sarvam-tts/index.ts   # Text-to-speech with fallback chain
│   │   ├── schedule-call/index.ts # Store callback request
│   │   └── trigger-scheduled-calls/index.ts # Cron: initiate due calls via ElevenLabs
│   └── config.toml               # Function config (JWT disabled)
├── vite.config.ts                # Main app build config
├── vite.config.widget.ts         # Widget IIFE build config
└── public/
    ├── ai-chat-widget.js         # Pre-built widget bundle
    └── embed-demo.html           # Widget integration demo
```

---

## 13. Current Limitations & Known Issues

1. **Sarvam STT returning 404**: API endpoint may have changed. ElevenLabs is used as primary STT.
2. **No user authentication**: All sessions are anonymous. No login/signup.
3. **Single store**: Hardcoded to Bella Vita test store. Multi-tenant support would require store routing.
4. **No real-time cart sync**: Standalone app cart is separate from Shopify cart.
5. **10-message context window**: Only last 10 messages sent to AI to manage token limits.
6. **No persistent user profiles**: Preferences reset each session.
7. **Callback calls**: Depend on ElevenLabs outbound calling API availability and phone number verification.

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| **Hinglish** | Mix of Hindi and English, written in Roman script |
| **VAD** | Voice Activity Detection — detects when user stops speaking |
| **SSE** | Server-Sent Events — streaming response protocol |
| **IIFE** | Immediately Invoked Function Expression — self-executing JS bundle |
| **Shadow DOM** | Browser API for style-isolated custom elements |
| **Barge-in** | User interrupting Priya mid-speech |
| **Action Block** | Structured `:::action:::` markers in AI response that trigger platform actions |
| **Native Display** | Mode where Priya navigates real Shopify pages instead of showing custom product cards |
| **Container Sniffing** | Detecting audio format by inspecting file header bytes |
