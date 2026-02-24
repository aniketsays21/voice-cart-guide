import React from "react";

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
  const finalLink = discountCode
    ? `${link}${link.includes("?") ? "&" : "?"}coupon=${discountCode}`
    : link;

  // Calculate discount percentage
  const discountPercent =
    discountPrice && price
      ? Math.round(
          ((parseFloat(price.replace(/[^\d.]/g, "")) -
            parseFloat(discountPrice.replace(/[^\d.]/g, ""))) /
            parseFloat(price.replace(/[^\d.]/g, ""))) *
            100
        )
      : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Image */}
      {image && (
        <div className="relative aspect-square bg-secondary">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {discountPercent && discountPercent > 0 && (
            <span className="absolute bottom-2 left-2 bg-[hsl(145,60%,35%)] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      )}

      <div className="p-2.5">
        <h4 className="font-semibold text-sm text-card-foreground leading-tight truncate">
          {name}
        </h4>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{description}</p>
        )}

        {/* Price Row */}
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-base font-bold text-foreground">
            {discountPrice || price}
          </span>
          {discountPrice && (
            <>
              <span className="text-xs text-muted-foreground line-through">{price}</span>
              {discountPercent && discountPercent > 0 && (
                <span className="text-xs font-semibold text-[hsl(145,60%,35%)]">
                  ↓{discountPercent}%
                </span>
              )}
            </>
          )}
        </div>

        {discountCode && (
          <div className="mt-1.5 text-[10px] bg-accent text-accent-foreground rounded px-2 py-0.5 inline-block">
            Code: {discountCode}
          </div>
        )}

        <a
          href={finalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 block w-full text-center text-xs font-semibold uppercase tracking-wider border-2 border-foreground text-foreground rounded-lg py-2 hover:bg-foreground hover:text-background transition-colors"
        >
          View Product
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
