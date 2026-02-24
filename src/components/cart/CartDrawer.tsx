import React from "react";
import { Minus, Plus, Trash2, ShoppingBag, ExternalLink } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ open, onOpenChange }) => {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, totalDiscount, finalTotal } = useCart();

  const handleCheckout = (item: typeof items[0]) => {
    let url = item.link;
    if (item.couponCode) {
      url += (url.includes("?") ? "&" : "?") + `coupon=${item.couponCode}`;
    }
    window.open(url, "_blank");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Your Cart
          </DrawerTitle>
          <DrawerDescription>
            {items.length === 0 ? "Your cart is empty" : `${items.length} item${items.length > 1 ? "s" : ""}`}
          </DrawerDescription>
        </DrawerHeader>

        {items.length === 0 ? (
          <div className="text-center py-10 px-4">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No items yet. Ask the assistant for product recommendations!</p>
          </div>
        ) : (
          <div className="overflow-y-auto px-4 space-y-3 max-h-[45vh]">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-md object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-card-foreground truncate">{item.name}</h4>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-foreground">₹{item.discountPrice || item.price}</span>
                    {item.discountPrice && (
                      <span className="text-xs text-muted-foreground line-through">₹{item.price}</span>
                    )}
                  </div>
                  {item.couponCode && (
                    <span className="text-[10px] bg-accent text-accent-foreground rounded px-1.5 py-0.5 mt-1 inline-block">
                      Code: {item.couponCode}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-accent"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-6 w-6 rounded-full border border-border flex items-center justify-center hover:bg-accent"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-auto h-6 w-6 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <DrawerFooter>
            <div className="space-y-1.5 text-sm mb-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-[hsl(145,60%,35%)] font-medium">
                  <span>Discount</span>
                  <span>-₹{totalDiscount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground text-base pt-1 border-t border-border">
                <span>Total</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            {items.length === 1 ? (
              <Button onClick={() => handleCheckout(items[0])} className="w-full gap-2">
                <ExternalLink className="h-4 w-4" /> Proceed to Checkout
              </Button>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckout(item)}
                    className="w-full justify-between text-xs"
                  >
                    <span className="truncate">{item.name}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 ml-2" />
                  </Button>
                ))}
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
              Clear Cart
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
