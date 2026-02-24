import React from "react";
import { Star, Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export interface AssistantProduct {
  name: string;
  price: string;
  discountPrice?: string;
  discountCode?: string;
  image?: string;
  link: string;
  rating?: string;
  description?: string;
}

interface ProductResultsProps {
  products: AssistantProduct[];
  query: string;
  aiMessage?: string;
}

const ProductResults: React.FC<ProductResultsProps> = ({ products, query, aiMessage }) => {
  const { addToCart, isInCart } = useCart();

  const handleAdd = async (p: AssistantProduct) => {
    const productId = `${p.name}-${p.link}`.replace(/\s+/g, "_").toLowerCase();
    if (isInCart(productId)) return;
    const numericPrice = parseFloat(p.price.replace(/[^\d.]/g, "")) || 0;
    await addToCart({ id: productId, name: p.name, price: numericPrice, image: p.image, link: p.link });
    toast.success(`${p.name} added to cart!`, { duration: 2000 });
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-4">
      {/* Query header */}
      <div className="py-3 px-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Results for</p>
        <h2 className="text-lg font-bold text-foreground truncate">{query}</h2>
      </div>

      {/* AI commentary */}
      {aiMessage && (
        <div className="mb-3 px-3 py-2 bg-accent rounded-lg">
          <p className="text-xs text-accent-foreground">{aiMessage}</p>
        </div>
      )}

      {/* Product grid - identical to homepage */}
      <div className="grid grid-cols-2 gap-3">
        {products.map((p, i) => {
          const productId = `${p.name}-${p.link}`.replace(/\s+/g, "_").toLowerCase();
          const inCart = isInCart(productId);
          const numericPrice = parseFloat(p.price.replace(/[^\d.]/g, "")) || 0;
          const numericDiscount = p.discountPrice ? parseFloat(p.discountPrice.replace(/[^\d.]/g, "")) : null;
          const discountPercent = numericDiscount ? Math.round(((numericPrice - numericDiscount) / numericPrice) * 100) : null;
          const ratingNum = p.rating ? parseFloat(p.rating) : null;

          return (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Image */}
              <div className="relative aspect-square bg-secondary">
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                {ratingNum && ratingNum >= 4.2 && (
                  <span className="absolute top-2 left-2 bg-[hsl(45,90%,45%)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Bestseller
                  </span>
                )}
                {discountPercent && discountPercent > 0 && (
                  <span className="absolute bottom-2 left-2 bg-[hsl(145,60%,35%)] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="p-3">
                {p.description && (
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">
                    {p.description}
                  </p>
                )}
                <h3 className="text-sm font-semibold text-card-foreground leading-tight truncate">
                  {p.name}
                </h3>

                {ratingNum && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="h-3.5 w-3.5 fill-[hsl(45,90%,50%)] text-[hsl(45,90%,50%)]" />
                    <span className="text-xs font-medium text-foreground">{ratingNum}</span>
                    <span className="text-[10px] text-muted-foreground">| ✓ Verified</span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-base font-bold text-foreground">
                    {p.discountPrice || p.price}
                  </span>
                  {p.discountPrice && (
                    <span className="text-xs text-muted-foreground line-through">{p.price}</span>
                  )}
                </div>

                {p.discountCode && (
                  <div className="mt-1 text-[10px] bg-accent text-accent-foreground rounded px-2 py-0.5 inline-block">
                    Code: {p.discountCode} (auto-applied)
                  </div>
                )}

                <button
                  onClick={() => handleAdd(p)}
                  className={`mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-semibold uppercase tracking-wider rounded-lg py-2.5 transition-opacity ${
                    inCart
                      ? "bg-accent text-accent-foreground"
                      : "bg-foreground text-background hover:opacity-90"
                  }`}
                >
                  {inCart ? (
                    <><Check className="h-3.5 w-3.5" /> In Cart</>
                  ) : (
                    <><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No products found.</p>
      )}
    </div>
  );
};

export default ProductResults;
