import React from "react";
import { ShoppingCart, Check, ExternalLink } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductCardProps {
  name: string;
  price: string;
  discountPrice?: string;
  discountCode?: string;
  image?: string;
  link: string;
  rating?: string;
  description?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  discountPrice,
  discountCode,
  image,
  link,
  rating,
  description,
}) => {
  const { addToCart, isInCart } = useCart();

  // Generate a stable ID from name+link
  const productId = `${name}-${link}`.replace(/\s+/g, "_").toLowerCase();
  const inCart = isInCart(productId);

  const numericPrice = parseFloat(price.replace(/[^\d.]/g, "")) || 0;

  const discountPercent =
    discountPrice && price
      ? Math.round(
          ((numericPrice - parseFloat(discountPrice.replace(/[^\d.]/g, ""))) / numericPrice) * 100
        )
      : null;

  const handleAddToCart = async () => {
    if (inCart) return;
    await addToCart(
      { id: productId, name, price: numericPrice, image, link },
      undefined // category not available from chat cards
    );
    toast.success(`${name} added to cart!`, { duration: 2000 });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {image && (
        <div className="relative aspect-square bg-secondary">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {discountPercent && discountPercent > 0 && (
            <span className="absolute bottom-2 left-2 bg-[hsl(145,60%,35%)] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      )}

      <div className="p-2.5">
        <h4 className="font-semibold text-sm text-card-foreground leading-tight truncate">{name}</h4>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{description}</p>
        )}

        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-base font-bold text-foreground">{discountPrice || price}</span>
          {discountPrice && (
            <>
              <span className="text-xs text-muted-foreground line-through">{price}</span>
              {discountPercent && discountPercent > 0 && (
                <span className="text-xs font-semibold text-[hsl(145,60%,35%)]">↓{discountPercent}%</span>
              )}
            </>
          )}
        </div>

        {discountCode && (
          <div className="mt-1.5 text-[10px] bg-accent text-accent-foreground rounded px-2 py-0.5 inline-block">
            Code: {discountCode} (auto-applied)
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={inCart}
          className={`mt-2.5 flex items-center justify-center gap-1.5 w-full text-xs font-semibold uppercase tracking-wider rounded-lg py-2 transition-colors ${
            inCart
              ? "bg-accent text-accent-foreground cursor-default"
              : "border-2 border-foreground text-foreground hover:bg-foreground hover:text-background"
          }`}
        >
          {inCart ? (
            <>
              <Check className="h-3.5 w-3.5" /> In Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
            </>
          )}
        </button>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> View Details
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
