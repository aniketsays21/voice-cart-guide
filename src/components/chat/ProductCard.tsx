import React from "react";

interface ProductCardProps {
  name: string;
  price: string;
  discountPrice?: string;
  discountCode?: string;
  image?: string;
  link: string;
  rating?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  discountPrice,
  discountCode,
  image,
  link,
  rating,
}) => {
  const finalLink = discountCode
    ? `${link}${link.includes("?") ? "&" : "?"}coupon=${discountCode}`
    : link;

  return (
    <div className="rounded-lg border border-border bg-card p-3 my-2 max-w-[280px]">
      {image && (
        <img
          src={image}
          alt={name}
          className="w-full h-36 object-cover rounded-md mb-2"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <h4 className="font-semibold text-sm text-card-foreground">{name}</h4>
      <div className="flex items-center gap-2 mt-1">
        {discountPrice ? (
          <>
            <span className="text-base font-bold text-primary">{discountPrice}</span>
            <span className="text-xs line-through text-muted-foreground">{price}</span>
          </>
        ) : (
          <span className="text-base font-bold text-card-foreground">{price}</span>
        )}
      </div>
      {rating && (
        <div className="text-xs text-muted-foreground mt-1">⭐ {rating}/5</div>
      )}
      {discountCode && (
        <div className="mt-1 text-xs bg-accent text-accent-foreground rounded px-2 py-0.5 inline-block">
          Code: {discountCode}
        </div>
      )}
      <a
        href={finalLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block w-full text-center text-xs font-medium bg-primary text-primary-foreground rounded-md py-2 hover:opacity-90 transition-opacity"
      >
        View Product →
      </a>
    </div>
  );
};

export default ProductCard;
