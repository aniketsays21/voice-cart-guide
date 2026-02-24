import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string; // product id or unique key
  name: string;
  price: number;
  image?: string;
  link: string;
  quantity: number;
  category?: string;
  discountPercent?: number;
  discountPrice?: number;
  couponCode?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity" | "discountPercent" | "discountPrice" | "couponCode">, category?: string) => Promise<void>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "shopai_cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback(async (item: Omit<CartItem, "quantity" | "discountPercent" | "discountPrice" | "couponCode">, category?: string) => {
    // Check if already in cart
    if (items.find((i) => i.id === item.id)) return;

    // Fetch best discount
    let discountPercent: number | undefined;
    let discountPrice: number | undefined;
    let couponCode: string | undefined;

    try {
      const { data: discounts } = await supabase
        .from("discounts")
        .select("*")
        .eq("is_active", true);

      if (discounts && discounts.length > 0) {
        const applicable = discounts.filter(
          (d) => d.product_id === item.id || (category && d.applicable_category === category)
        );
        const best = applicable.sort((a, b) => b.discount_percent - a.discount_percent)[0];
        if (best) {
          discountPercent = best.discount_percent;
          discountPrice = Math.round(item.price * (1 - best.discount_percent / 100));
          couponCode = best.coupon_code;
        }
      }
    } catch (e) {
      console.error("Error fetching discounts:", e);
    }

    setItems((prev) => [
      ...prev,
      { ...item, category, quantity: 1, discountPercent, discountPrice, couponCode },
    ]);
  }, [items]);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const finalTotal = items.reduce((sum, i) => sum + (i.discountPrice || i.price) * i.quantity, 0);
  const totalDiscount = subtotal - finalTotal;

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, isInCart, totalItems, subtotal, totalDiscount, finalTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
