

# Live Shopify Product Catalog Integration

## Overview

Replace the database-stored product catalog with live products fetched directly from your Shopify store (`bella-vita-test.myshopify.com`). The AI will recommend products that are actually in your Shopify store with correct images, prices, and availability.

## How It Works

```text
User speaks --> Chat Edge Function --> Fetches products from Shopify --> AI recommends --> Widget shows live products
                                         |
                                         v
                               bella-vita-test.myshopify.com/products.json
```

## Changes

### 1. Chat Edge Function (`supabase/functions/chat/index.ts`)

**Replace database product fetching with Shopify API calls:**

- Fetch products from `https://bella-vita-test.myshopify.com/products.json` (Shopify's public JSON API, no API key needed)
- Parse Shopify product format (variants, images, prices) into the same catalog format the AI already uses
- Cache the Shopify catalog for 5 minutes (same as current database cache)
- Handle pagination (Shopify returns 30 products per page by default, will fetch up to 250 per page and paginate for all 400-500 products)
- Product links will use the actual Shopify URLs (`https://bella-vita-test.myshopify.com/products/handle`)
- Fall back to database products if Shopify fetch fails

**Specific changes:**
- New `fetchShopifyProducts()` function that calls `/products.json?limit=250` and paginates
- New `mapShopifyProduct()` function that converts Shopify product format to internal format (name, price, image, category/type, tags, link)
- Update `getCachedCatalog()` to use Shopify fetch first, database as fallback
- Store URL stored as a constant (later moved to a stores table for multi-tenant)

### 2. Widget Product Card Enrichment (`src/embed/widget.ts`)

**When running on Shopify, enrich product cards with live data:**

- When parsing `:::product` blocks, extract the product handle from the link
- Call `/products/{handle}.js` (relative URL, works because widget is on Shopify) to get live price and image
- Replace card data with live Shopify data before rendering
- Fallback: if enrichment fails, show the data the AI provided

### 3. Shopify Utilities (`src/embed/shopify.ts`)

**Add product fetching function:**

- `fetchProductByHandle(handle)` -- already partially exists for variant fetching, extend to return full product data (images, price, compare_at_price, availability)

### 4. System Prompt Update

- Update product link format to use Shopify URLs: `https://bella-vita-test.myshopify.com/products/{handle}`
- Add store domain reference so the AI generates correct links

## What This Means

- The AI will show your actual Shopify products with real images, prices, and availability
- No need to manually sync products between database and Shopify
- When you add/remove products in Shopify, the AI picks them up automatically (within 5 minutes due to caching)
- Add-to-cart, open product, and checkout actions will work with correct product handles
- The database products table stays as a fallback but is no longer the primary source

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Fetch products from Shopify API instead of database |
| `src/embed/widget.ts` | Enrich product cards with live Shopify data |
| `src/embed/shopify.ts` | Add `fetchProductByHandle()` with full product data |

