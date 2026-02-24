import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShoppingCart, Menu, Star, ChevronLeft, ChevronRight, Grid2X2, Sparkles, Droplets, Gift, Palette, Wind, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  rating: number | null;
  external_link: string;
  description: string | null;
};

type Discount = {
  id: string;
  discount_percent: number;
  coupon_code: string;
  product_id: string | null;
  applicable_category: string | null;
};

const FILTERS = ["All", "Perfume", "Skincare", "Gift Set", "Cosmetics", "Shower Gel", "Attar"] as const;

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [cartOpen, setCartOpen] = useState(false);
  const { addToCart, isInCart, totalItems } = useCart();
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: discs }] = await Promise.all([
        supabase.from("products").select("*").order("rating", { ascending: false }),
        supabase.from("discounts").select("*").eq("is_active", true),
      ]);
      if (prods) setProducts(prods);
      if (discs) setDiscounts(discs);
    };
    fetchData();
  }, []);

  const getDiscount = (product: Product) => {
    return discounts.find(
      (d) => d.product_id === product.id || d.applicable_category === product.category
    );
  };

  const filtered = activeFilter === "All"
    ? products
    : products.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Announcement Bar */}
      <div className="bg-foreground text-background flex items-center justify-between px-4 py-2.5">
        <ChevronLeft className="h-4 w-4 opacity-70" />
        <p className="text-xs font-medium tracking-wide uppercase">Get 5% on prepaid orders</p>
        <ChevronRight className="h-4 w-4 opacity-70" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Menu className="h-5 w-5 text-foreground" />
          <h1 className="text-xl font-bold tracking-wider text-foreground">ShopAI</h1>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-foreground" />
            <button onClick={() => setCartOpen(true)} className="relative">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            const icons: Record<string, React.ReactNode> = {
              All: <Grid2X2 className="h-3.5 w-3.5" />,
              Perfume: <Sparkles className="h-3.5 w-3.5" />,
              Skincare: <Droplets className="h-3.5 w-3.5" />,
              "Gift Set": <Gift className="h-3.5 w-3.5" />,
              Cosmetics: <Palette className="h-3.5 w-3.5" />,
              "Shower Gel": <Wind className="h-3.5 w-3.5" />,
              Attar: <Star className="h-3.5 w-3.5" />,
            };
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
                {icons[f]}
                {f === "All" ? "SHOP ALL" : f.toUpperCase()}
              </button>
            );
          })}
        </div>
      </header>

      {/* Title */}
      <div className="px-4 py-5">
        <h2 className="text-2xl font-bold text-center text-foreground">
          {activeFilter === "All" ? "Shop All Products" : activeFilter}
        </h2>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 px-3">
        {filtered.map((product) => {
          const disc = getDiscount(product);
          const discountedPrice = disc
            ? Math.round(product.price * (1 - disc.discount_percent / 100))
            : null;

          return (
            <div key={product.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Image */}
              <div className="relative aspect-square bg-secondary">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                {/* Bestseller Badge */}
                {product.rating && product.rating >= 4.2 && (
                  <span className="absolute top-2 left-2 bg-[hsl(45,90%,45%)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Bestseller
                  </span>
                )}
                {/* Discount Badge */}
                {disc && (
                  <span className="absolute bottom-2 left-2 bg-[hsl(145,60%,35%)] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {disc.discount_percent}% OFF
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  {product.category || "General"}
                </p>
                <h3 className="text-sm font-semibold text-card-foreground leading-tight truncate">
                  {product.name}
                </h3>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="h-3.5 w-3.5 fill-[hsl(45,90%,50%)] text-[hsl(45,90%,50%)]" />
                    <span className="text-xs font-medium text-foreground">{product.rating}</span>
                    <span className="text-[10px] text-muted-foreground">| ✓ Verified</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-base font-bold text-foreground">
                    ₹{discountedPrice || product.price}
                  </span>
                  {discountedPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      ₹{product.price}
                    </span>
                  )}
                </div>

                {/* Add to Cart */}
                <button
                  onClick={async () => {
                    const pid = product.id;
                    if (isInCart(pid)) return;
                    await addToCart(
                      { id: pid, name: product.name, price: product.price, image: product.image_url || undefined, link: product.external_link },
                      product.category || undefined
                    );
                    toast.success(`${product.name} added to cart!`, { duration: 2000 });
                  }}
                  className={`mt-3 flex items-center justify-center gap-1.5 w-full text-xs font-semibold uppercase tracking-wider rounded-lg py-2.5 transition-opacity ${
                    isInCart(product.id)
                      ? "bg-accent text-accent-foreground"
                      : "bg-foreground text-background hover:opacity-90"
                  }`}
                >
                  {isInCart(product.id) ? (
                    <><Check className="h-3.5 w-3.5" /> In Cart</>
                  ) : (
                    "Add to Cart"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No products found.</p>
      )}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default Index;
