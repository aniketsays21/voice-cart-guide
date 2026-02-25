/**
 * Shopify native action handlers.
 * These only work when the widget is embedded on a Shopify storefront.
 */

declare global {
  interface Window {
    Shopify?: { shop: string; theme?: { id: number } };
  }
}

/** Check if we're running on a Shopify storefront */
export function isShopify(): boolean {
  try {
    return typeof window !== "undefined" && !!window.Shopify?.shop;
  } catch {
    return false;
  }
}

/** Extract product handle from a URL like /products/bella-vita-perfume or full URL */
export function extractHandle(url: string): string | null {
  const match = url.match(/\/products\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Full product data returned from Shopify */
export interface ShopifyProductData {
  title: string;
  handle: string;
  price: string;
  compare_at_price: string | null;
  image: string | null;
  available: boolean;
  variantId: number | null;
}

/** Fetch the first variant ID for a product handle via Shopify's JSON API */
export async function fetchVariantId(handle: string): Promise<number | null> {
  const product = await fetchProductByHandle(handle);
  return product?.variantId ?? null;
}

/** Fetch full product data by handle from Shopify's storefront JSON API */
export async function fetchProductByHandle(handle: string): Promise<ShopifyProductData | null> {
  try {
    const resp = await fetch(`/products/${handle}.js`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const variant = data.variants?.[0];
    return {
      title: data.title,
      handle: data.handle,
      price: variant ? (variant.price / 100).toFixed(2) : "0",
      compare_at_price: variant?.compare_at_price ? (variant.compare_at_price / 100).toFixed(2) : null,
      image: data.images?.[0] || data.featured_image || null,
      available: variant?.available ?? data.available ?? true,
      variantId: variant?.id ?? null,
    };
  } catch {
    return null;
  }
}

/** Add a product to the Shopify cart by variant ID */
export async function shopifyAddToCart(
  variantId: number,
  quantity = 1
): Promise<boolean> {
  try {
    const resp = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: variantId, quantity }] }),
    });
    if (!resp.ok) return false;

    // Dispatch a custom event so Shopify themes can update cart UI
    document.dispatchEvent(new CustomEvent("cart:refresh"));
    // Also try triggering Shopify's native cart update
    try {
      document.querySelectorAll("[data-cart-count]").forEach(async () => {
        const cartResp = await fetch("/cart.js");
        const cart = await cartResp.json();
        document.querySelectorAll("[data-cart-count]").forEach((el) => {
          el.textContent = String(cart.item_count);
        });
      });
    } catch {}

    return true;
  } catch {
    return false;
  }
}

/** Navigate to a product page */
export function shopifyNavigate(url: string): void {
  // If it's a relative path or full URL on the same domain, navigate
  if (url.startsWith("/") || url.includes(window.location.hostname)) {
    window.location.href = url;
  } else {
    // External product link — extract handle and go to store's PDP
    const handle = extractHandle(url);
    if (handle) {
      window.location.href = `/products/${handle}`;
    } else {
      window.open(url, "_blank");
    }
  }
}

/** Redirect to Shopify checkout */
export function shopifyGoToCheckout(): void {
  window.location.href = "/checkout";
}

/** Redirect to Shopify cart page */
export function shopifyGoToCart(): void {
  window.location.href = "/cart";
}

/**
 * Resolve a product name/link to a variant ID and add to cart.
 * Tries the link first (extracting handle), falls back to search.
 */
export async function addToCartByProduct(
  productName: string,
  productLink?: string
): Promise<{ success: boolean; message: string }> {
  let handle: string | null = null;

  // Try extracting handle from link
  if (productLink) {
    handle = extractHandle(productLink);
  }

  // If no handle from link, try searching by product name
  if (!handle) {
    try {
      const resp = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(productName)}&resources[type]=product&resources[limit]=1`
      );
      const data = await resp.json();
      const firstProduct = data.resources?.results?.products?.[0];
      if (firstProduct?.handle) {
        handle = firstProduct.handle;
      }
    } catch {}
  }

  if (!handle) {
    return { success: false, message: `Could not find "${productName}" in the store.` };
  }

  const variantId = await fetchVariantId(handle);
  if (!variantId) {
    return { success: false, message: `Could not load product details for "${productName}".` };
  }

  const added = await shopifyAddToCart(variantId);
  if (added) {
    return { success: true, message: `"${productName}" has been added to your cart!` };
  }
  return { success: false, message: `Failed to add "${productName}" to cart. Please try again.` };
}
