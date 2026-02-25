import React from "react";
import { Star, Check, ShoppingCart } from "lucide-react";
import type { AssistantProduct } from "./ProductResults";

interface ShopifyProductCardProps {
  product: AssistantProduct;
  inCart: boolean;
  onAdd: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const ShopifyProductCard: React.FC<ShopifyProductCardProps> = ({ product, inCart, onAdd, onClick }) => {
  const numericPrice = parseFloat(product.price.replace(/[^\d.]/g, "")) || 0;
  const numericDiscount = product.discountPrice ? parseFloat(product.discountPrice.replace(/[^\d.]/g, "")) : null;
  const discountPercent = numericDiscount ? Math.round(((numericPrice - numericDiscount) / numericPrice) * 100) : null;
  const ratingNum = product.rating ? parseFloat(product.rating) : null;

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
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
        {product.description && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">{product.description}</p>
        )}
        <h3 className="text-sm font-semibold text-card-foreground leading-tight truncate">{product.name}</h3>

        {ratingNum && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="h-3.5 w-3.5 fill-[hsl(45,90%,50%)] text-[hsl(45,90%,50%)]" />
            <span className="text-xs font-medium text-foreground">{ratingNum}</span>
            <span className="text-[10px] text-muted-foreground">| ✓ Verified</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-foreground">{product.discountPrice || product.price}</span>
          {product.discountPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.price}</span>
          )}
        </div>

        {product.discountCode && (
          <div className="mt-1 text-[10px] bg-accent text-accent-foreground rounded px-2 py-0.5 inline-block">
            Code: {product.discountCode} (auto-applied)
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onAdd(e); }}
          className={`mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-semibold uppercase tracking-wider rounded-lg py-2.5 transition-opacity ${
            inCart ? "bg-accent text-accent-foreground" : "bg-foreground text-background hover:opacity-90"
          }`}
        >
          {inCart ? (<><Check className="h-3.5 w-3.5" /> In Cart</>) : (<><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>)}
        </button>
      </div>
    </div>
  );
};

export default ShopifyProductCard;
