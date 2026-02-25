import React from "react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import ShopifyProductCard from "./ShopifyProductCard";

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

export interface ResultGroup {
  query: string;
  commentary: string;
  products: AssistantProduct[];
}

interface ProductResultsProps {
  resultGroups: ResultGroup[];
  onProductClick?: (product: AssistantProduct) => void;
}

const ProductResults: React.FC<ProductResultsProps> = ({ resultGroups = [], onProductClick }) => {
  const { addToCart, isInCart } = useCart();

  const handleAdd = async (e: React.MouseEvent, p: AssistantProduct) => {
    e.stopPropagation();
    const productId = `${p.name}-${p.link}`.replace(/\s+/g, "_").toLowerCase();
    if (isInCart(productId)) return;
    const numericPrice = parseFloat(p.price.replace(/[^\d.]/g, "")) || 0;
    await addToCart({ id: productId, name: p.name, price: numericPrice, image: p.image, link: p.link });
    toast.success(`${p.name} added to cart!`, { duration: 2000 });
  };

  if (resultGroups.length === 0) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground text-sm">No products found.</p></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-4">
      {resultGroups.map((group, gi) => (
        <div key={gi} className="mb-6">
          {/* Query header */}
          <div className="py-3 px-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Results for</p>
            <h2 className="text-lg font-bold text-foreground truncate">{group.query}</h2>
          </div>

          {/* Product grid */}
          {group.products.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {group.products.map((p, i) => {
                const productId = `${p.name}-${p.link}`.replace(/\s+/g, "_").toLowerCase();
                return (
                  <ShopifyProductCard
                    key={i}
                    product={p}
                    inCart={isInCart(productId)}
                    onAdd={(e) => handleAdd(e, p)}
                    onClick={() => onProductClick?.(p)}
                  />
                );
              })}
            </div>
          )}

          {gi < resultGroups.length - 1 && (
            <div className="mt-4 border-t border-border" />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductResults;
