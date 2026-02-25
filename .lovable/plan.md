
Goal: make the Shopify experience match your expectation: opening “Bella Vita AI” should show the talking avatar flow, recommendations should come from your live Shopify catalog (not old data), and products should be shown using Shopify-native storefront UI instead of custom cards.

What I found from the current implementation:
1. The avatar experience you approved exists in the app route `/chat` (React page), not in the Shopify embed script path.
2. Shopify storefront is currently loading `public/ai-chat-widget.js`, which is a separate, older widget code path.
3. Backend logs show `Shopify fetch failed: 401` and then `Fetched 0 products from Shopify`, so chat falls back to old database products (that is why you see old responses).
4. Because of (2) and (3), you are seeing old behavior on Shopify even after publish.

Implementation approach:

Phase 1: Fix data source so recommendations are truly from Shopify
- Update chat backend function to stop relying on one hardcoded store URL only.
- Pass the actual storefront domain from widget request (example: current Shopify hostname) and use that for catalog retrieval.
- Handle 401 explicitly:
  - If storefront is protected, use authenticated Shopify catalog access path (storefront token path) or return a clear fallback mode.
- Keep existing database fallback only as last resort and only when Shopify is unavailable.
- Add clear logging so we can confirm: selected store domain, fetch status, product count, fallback reason.

Why this phase first:
- Without fixing catalog retrieval, UI changes still show old/incorrect products.

Phase 2: Move Shopify to “native storefront display” mode (no custom product cards)
- Update widget behavior so it does not render custom recommendation cards.
- Keep AI as conversation + voice layer.
- For product display, route user to Shopify-native pages:
  - product pages (`/products/{handle}`),
  - cart (`/cart`),
  - checkout (`/checkout`),
  - and searchable result pages (`/search?q=...&type=product`) for multi-product recommendations.
- AI still recommends multiple products, but actual browsing is shown via native Shopify UI/components.

Why this matches your request:
- Recommendations still come from AI.
- Product browsing/presentation is Shopify-native, not custom widget cards.

Phase 3: Bring avatar experience into Shopify flow
- Add an “avatar-first open state” in the Shopify widget flow:
  - On opening Bella Vita AI, show talking model first.
  - Auto-greet immediately.
  - Keep voice agent behavior unchanged.
  - Once assistant says it is showing best sellers, transition to Shopify-native result navigation (instead of custom cards).
- Preserve current mic/listening/speaking loop.

Phase 4: Fix delivery mismatch so Shopify always gets latest changes
- Unify embed build path so Shopify script is generated from the current source of truth.
- Ensure published script URL serves updated widget code.
- Add cache-busting strategy for Shopify theme script include (version query) so old JS is not reused.

Planned file-level changes:
1. `supabase/functions/chat/index.ts`
   - dynamic store domain support,
   - robust Shopify catalog fetch and 401 handling,
   - safer fallback behavior and better logging.
2. `src/embed/widget.ts`
   - native Shopify display mode,
   - avatar-first flow for Shopify,
   - multi-product recommendation routing to Shopify-native pages.
3. `src/embed/types.ts`
   - config additions for native display mode / store domain.
4. `src/embed/index.ts`
   - pass/store new config values.
5. `public/ai-chat-widget.js`
   - regenerate/update to match latest embed source (to remove old production behavior).

No database schema changes required:
- This is mainly widget + backend-function behavior. Existing tables remain usable as fallback/logging.

Validation checklist (end-to-end):
1. Open Shopify storefront and click Bella Vita AI.
2. Confirm avatar greeting starts immediately.
3. Ask for “top 5 perfumes under X budget”.
4. Confirm AI recommendations are from current Shopify catalog (not old domain products).
5. Confirm product browsing occurs on Shopify-native pages/cards.
6. Confirm add-to-cart/cart/checkout actions work from AI flow.
7. Confirm no stale script by testing after hard refresh and in incognito.

Risks and mitigations:
- Risk: storefront protection causes 401.
  - Mitigation: authenticated Shopify catalog path + explicit fallback messaging.
- Risk: stale JS cache on Shopify.
  - Mitigation: cache-busting script URL versioning.
- Risk: mixed behavior between app `/chat` and Shopify widget.
  - Mitigation: keep app chat unchanged, explicitly optimize Shopify embed path for this requirement.

Expected outcome after implementation:
- On Shopify, Bella Vita AI opens with avatar flow, answers with live Shopify catalog recommendations, and presents products through Shopify’s own native storefront UI rather than custom product cards.
