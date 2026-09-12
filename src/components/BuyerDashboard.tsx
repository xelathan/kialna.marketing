"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder, getBuyerOrders } from "@/app/actions/orders";
import RoleSwitcher from "./RoleSwitcher";
import {
  Search,
  Compass,
  ShoppingBag,
  Clock,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  User,
  Check,
  X,
  DollarSign,
  Calculator,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  LogOut,
} from "lucide-react";

interface BuyerDashboardProps {
  initialProducts: any[];
  currentUser: {
    id: string;
    role: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
}

export default function BuyerDashboard({ initialProducts, currentUser }: BuyerDashboardProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"browse" | "orders">("browse");
  
  // Products and Filtering State
  const [products] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Cart State
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Details Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutName, setCheckoutName] = useState(currentUser.name || "");
  const [checkoutAddress, setCheckoutAddress] = useState(currentUser.address || "");
  const [checkoutPhone, setCheckoutPhone] = useState(currentUser.phone || "");
  const [submitError, setSubmitError] = useState("");
  const [checkoutSuccessOrderId, setCheckoutSuccessOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Orders History State
  const [orders, setOrders] = useState<any[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const EXCHANGE_RATE = 25000; // 25,000 VND = 1 USD
  const FIXED_SHIPPING = 120000; // 120,000 VND
  const FIXED_PACKAGING = 30000; // 30,000 VND

  // Load orders when entering order view
  useEffect(() => {
    if (activeView === "orders") {
      loadOrders();
    }
  }, [activeView]);

  const loadOrders = async () => {
    setIsOrdersLoading(true);
    setOrdersError("");
    const result = await getBuyerOrders();
    if (result.success && result.orders) {
      setOrders(result.orders);
    } else {
      setOrdersError(result.error || "Failed to load orders");
    }
    setIsOrdersLoading(false);
  };

  // Get categories from products
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.status === "active";
  });

  // Cart operations
  const addToCart = (product: any, qty: number) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.inventory) {
        alert(`Cannot add more. Only ${product.inventory} available in stock.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        )
      );
    } else {
      if (qty > product.inventory) {
        alert(`Cannot add. Only ${product.inventory} available in stock.`);
        return;
      }
      setCart([...cart, { product, quantity: qty }]);
    }
    setSelectedProduct(null);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.inventory) {
              alert(`Only ${item.product.inventory} items are available in stock.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Totals calculations
  const cartSubtotalVND = cart.reduce((acc, item) => acc + item.product.basePrice * item.quantity, 0);
  const cartShippingVND = cart.reduce((acc, item) => acc + FIXED_SHIPPING * item.quantity, 0);
  const cartPackagingVND = cart.reduce((acc, item) => acc + FIXED_PACKAGING * item.quantity, 0);
  const cartTotalVND = cartSubtotalVND + cartShippingVND + cartPackagingVND;
  const cartTotalUSD = cartTotalVND / EXCHANGE_RATE;

  // Checkout submission
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutAddress.trim() || !checkoutPhone.trim()) {
      setSubmitError("Please fill in all delivery details.");
      return;
    }

    setSubmitError("");
    startTransition(async () => {
      const payloadItems = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const payloadInfo = {
        name: checkoutName,
        address: checkoutAddress,
        phone: checkoutPhone,
      };

      const result = await createOrder(payloadItems, payloadInfo);
      if (result.success && result.orderId) {
        setCheckoutSuccessOrderId(result.orderId);
        setCart([]);
        setIsCheckingOut(false);
        setIsCartOpen(false);
        router.refresh();
      } else {
        setSubmitError(result.error || "Order checkout failed. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 font-sans max-w-md mx-auto relative border-x border-border-light shadow-xl pb-24">
      {/* 1. Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-brand-primary" />
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight">Kialna Shop</h1>
            <p className="text-[10px] text-text-secondary leading-none">Vietnam Craft Market</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User Sign Out Button */}
          <button
            onClick={async () => {
              const { signOut } = await import("@/app/actions/auth");
              await signOut();
              window.location.href = "/login";
            }}
            className="p-2 text-text-secondary hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Cart Icon Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-text-secondary hover:text-brand-primary transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
            aria-label="View shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-primary text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Canvas */}
      <main className="flex-1 overflow-y-auto">
        {/* VIEW A: BROWSE */}
        {activeView === "browse" && (
          <div className="p-4 flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Promo Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-800 text-white p-5 shadow-md">
              <div className="relative z-10 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Guaranteed Authentic
                </span>
                <h2 className="text-lg font-bold leading-tight">Vietnamese Masterpieces</h2>
                <p className="text-[11px] text-blue-100 leading-relaxed max-w-[260px]">
                  Traditional textiles, organic tea, and home decor sourced directly from local craftsmen. Flat international shipping.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 translate-y-6 translate-x-4 opacity-10 pointer-events-none">
                <Compass className="h-44 w-44" />
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium crafts..."
                className="input-primary w-full pl-11 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>

            {/* Categories Slider */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                    selectedCategory === cat
                      ? "bg-brand-primary border-brand-primary text-white font-bold"
                      : "bg-white dark:bg-zinc-900 border-border-light text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  let imageList = [];
                  try {
                    imageList = JSON.parse(p.images);
                  } catch (e) {}
                  const imageUrl = imageList[0] || "/file.svg";
                  const isLowStock = p.inventory <= 5 && p.inventory > 0;
                  const isOutOfStock = p.inventory === 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setDetailQuantity(1);
                      }}
                      className="card-primary overflow-hidden flex flex-col bg-white dark:bg-zinc-900 hover:shadow-md transition-all cursor-pointer group"
                    >
                      {/* Thumbnail container */}
                      <div className="aspect-square bg-zinc-50 border-b border-border-light overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = "/file.svg";
                          }}
                        />
                        {/* Out of Stock overlay */}
                        {isOutOfStock ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-white bg-red-600 px-2 py-0.5 rounded shadow">
                              Out of Stock
                            </span>
                          </div>
                        ) : isLowStock ? (
                          <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow leading-none uppercase">
                            Only {p.inventory} left
                          </span>
                        ) : null}
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col gap-1 flex-1">
                        <span className="text-[9px] text-text-secondary uppercase font-semibold tracking-wider">
                          {p.category}
                        </span>
                        <h3 className="text-xs font-bold text-text-primary line-clamp-2 leading-tight flex-1">
                          {p.name}
                        </h3>
                        <div className="mt-1 flex flex-col">
                          <span className="text-xs font-bold text-brand-primary leading-tight">
                            ${(p.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                          </span>
                          <span className="text-[9px] text-text-secondary leading-none mt-0.5">
                            {p.basePrice.toLocaleString()} VND
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 card-primary p-8 text-center flex flex-col items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-dashed border-border-light">
                  <ShoppingBag className="h-10 w-10 text-text-secondary opacity-50" />
                  <h3 className="text-sm font-semibold text-text-primary">No products found</h3>
                  <p className="text-xs text-text-secondary">
                    Try refining your search query or selecting a different category.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW B: ORDER HISTORY */}
        {activeView === "orders" && (
          <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-light pb-2">
              Your Purchase History
            </h2>

            {isOrdersLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                <span className="text-xs">Fetching your receipts...</span>
              </div>
            ) : ordersError ? (
              <div className="card-primary p-4 border-red-200 dark:border-red-900 bg-red-50/20 text-center text-xs text-red-600 dark:text-red-400">
                {ordersError}
              </div>
            ) : orders.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="card-primary p-4 flex flex-col gap-3.5 bg-white dark:bg-zinc-900 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-border-light pb-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-mono text-text-secondary">
                          ORDER: {o.id.substring(0, 8).toUpperCase()}...
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {new Date(o.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-brand-primary border border-blue-200 dark:border-blue-900 uppercase">
                        {o.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center text-xs justify-between">
                          <span className="text-text-primary font-medium line-clamp-1 flex-1">
                            {item.product.name}
                            <span className="text-text-secondary ml-1.5 font-bold">x{item.quantity}</span>
                          </span>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-semibold text-text-primary">
                              ${((item.sellerPriceAtPurchase * item.quantity) / EXCHANGE_RATE).toFixed(2)} USD
                            </span>
                            <span className="text-[9px] text-text-secondary leading-none">
                              {(item.sellerPriceAtPurchase * item.quantity).toLocaleString()} VND
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fees Breakdown */}
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-border-light text-[10px] text-text-secondary flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span>Packaging Fee:</span>
                        <span>
                          ${(o.items.reduce((acc: number, item: any) => acc + item.packagingFeeAtPurchase * item.quantity, 0) / EXCHANGE_RATE).toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>International Shipping:</span>
                        <span>
                          ${(o.items.reduce((acc: number, item: any) => acc + item.shippingFeeAtPurchase * item.quantity, 0) / EXCHANGE_RATE).toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    {/* Paid Receipt Total */}
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[10px] font-bold text-text-primary uppercase">Total Paid</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-brand-primary">
                          ${o.totalPaid.toFixed(2)} USD
                        </span>
                        <div className="text-[10px] text-text-secondary leading-none mt-0.5">
                          {(
                            o.items.reduce(
                              (acc: number, item: any) =>
                                acc +
                                (item.sellerPriceAtPurchase +
                                  item.shippingFeeAtPurchase +
                                  item.packagingFeeAtPurchase) *
                                  item.quantity,
                              0
                            )
                          ).toLocaleString()} VND
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-primary p-8 text-center flex flex-col items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-dashed border-border-light">
                <Clock className="h-10 w-10 text-text-secondary opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">No orders found</h3>
                <p className="text-xs text-text-secondary">
                  Your purchase history will show up here after completing checkouts.
                </p>
                <button
                  onClick={() => setActiveView("browse")}
                  className="btn-primary text-xs mt-2"
                >
                  Explore Crafts
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Product Details Modal Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-200">
          {/* Modal Container */}
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl max-h-[85vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300 relative">
            
            {/* Header image cover */}
            <div className="relative aspect-video bg-zinc-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={JSON.parse(selectedProduct.images)[0] || "/file.svg"}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/file.svg";
                }}
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer shadow-md border border-white/10"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-5 flex flex-col gap-4 flex-1">
              <div>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                  {selectedProduct.category}
                </span>
                <h2 className="text-base font-bold text-text-primary mt-0.5 leading-snug">
                  {selectedProduct.name}
                </h2>
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-text-primary">
                      ${(selectedProduct.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-text-secondary leading-none">
                      {selectedProduct.basePrice.toLocaleString()} VND
                    </span>
                  </div>
                  
                  {/* Stock status badge */}
                  {selectedProduct.inventory === 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 leading-none">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/20 text-brand-accent border border-teal-200 dark:border-teal-900 leading-none">
                      {selectedProduct.inventory} In Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="flex flex-col gap-1.5 border-t border-border-light pt-3">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    About This Craft
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Dynamic Price transparency breakdown panel */}
              <div className="card-primary p-4 bg-zinc-50 dark:bg-zinc-900 border border-border-light flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 border-b border-border-light pb-2">
                  <Calculator className="h-3.5 w-3.5 text-brand-primary" />
                  <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
                    Price Transparency Breakdown
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Base Craftsman Price:</span>
                    <span className="font-semibold text-text-primary">
                      ${(selectedProduct.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>+ fixed Packaging Fee:</span>
                    <span>${(FIXED_PACKAGING / EXCHANGE_RATE).toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>+ fixed International Shipping:</span>
                    <span>${(FIXED_SHIPPING / EXCHANGE_RATE).toFixed(2)} USD</span>
                  </div>
                  <div className="border-t border-border-light my-2 pt-2 flex justify-between items-baseline font-semibold">
                    <span className="text-text-primary">Total Per Unit:</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-primary">
                        ${((selectedProduct.basePrice + FIXED_SHIPPING + FIXED_PACKAGING) / EXCHANGE_RATE).toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-none">
                        {(selectedProduct.basePrice + FIXED_SHIPPING + FIXED_PACKAGING).toLocaleString()} VND
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive quantity selector and Add To Cart CTA */}
              {selectedProduct.inventory > 0 && (
                <div className="flex flex-col gap-3 pt-3 border-t border-border-light">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">Select Quantity</span>
                    <div className="flex items-center border border-border-light rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
                      <button
                        onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                        disabled={detailQuantity <= 1}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shrink-0 disabled:opacity-30 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 text-sm font-bold text-text-primary text-center min-w-[40px]">
                        {detailQuantity}
                      </span>
                      <button
                        onClick={() => setDetailQuantity(Math.min(selectedProduct.inventory, detailQuantity + 1))}
                        disabled={detailQuantity >= selectedProduct.inventory}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shrink-0 disabled:opacity-30 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(selectedProduct, detailQuantity)}
                    className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[48px] shadow-md mt-1"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Cart — ${(((selectedProduct.basePrice + FIXED_SHIPPING + FIXED_PACKAGING) * detailQuantity) / EXCHANGE_RATE).toFixed(2)} USD</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sliding Cart Drawer Panel */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-200">
          {/* Drawer container */}
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 relative shadow-2xl">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-border-light flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-primary" />
                <h2 className="text-base font-bold text-text-primary">Shopping Cart</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {cart.length > 0 ? (
                cart.map((item) => {
                  let imageList = [];
                  try {
                    imageList = JSON.parse(item.product.images);
                  } catch (e) {}
                  const imageUrl = imageList[0] || "/file.svg";

                  return (
                    <div
                      key={item.product.id}
                      className="card-primary p-3 flex gap-3 items-center bg-white dark:bg-zinc-900 border border-border-light relative"
                    >
                      {/* Image */}
                      <div className="h-14 w-14 rounded-lg overflow-hidden border border-border-light shrink-0 bg-zinc-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/file.svg";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <h4 className="text-xs font-bold text-text-primary truncate pr-2">
                          {item.product.name}
                        </h4>
                        <span className="text-[9px] text-text-secondary uppercase font-semibold">
                          {item.product.category}
                        </span>
                        <div className="flex flex-col mt-1">
                          <span className="text-xs font-bold text-text-primary">
                            ${(item.product.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                          </span>
                          <span className="text-[9px] text-text-secondary">
                            + ${( (FIXED_SHIPPING + FIXED_PACKAGING) / EXCHANGE_RATE).toFixed(2)} fees/unit
                          </span>
                        </div>
                      </div>

                      {/* Control Panel */}
                      <div className="flex flex-col gap-2 items-end shrink-0 border-l border-border-light pl-3.5">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-text-secondary hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        {/* Selector */}
                        <div className="flex items-center border border-border-light rounded bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-xs">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-text-secondary shrink-0 cursor-pointer"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-2 font-bold text-text-primary text-center min-w-[20px]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-text-secondary shrink-0 cursor-pointer"
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
                  <ShoppingBag className="h-12 w-12 text-text-secondary opacity-40" />
                  <h3 className="text-sm font-semibold text-text-primary">Your cart is empty</h3>
                  <p className="text-xs text-text-secondary text-center">
                    Browse the crafts catalog and add traditional craft goods to purchase.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Summary details */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-border-light bg-zinc-50 dark:bg-zinc-900 shrink-0 flex flex-col gap-3.5">
                {/* Cost Breakdown */}
                <div className="space-y-1.5 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="text-text-primary font-medium">
                      ${(cartSubtotalVND / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packaging Fees:</span>
                    <span className="text-text-primary font-medium">
                      ${(cartPackagingVND / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>International Shipping:</span>
                    <span className="text-text-primary font-medium">
                      ${(cartShippingVND / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="border-t border-border-light my-2 pt-2 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-text-primary">Order Total:</span>
                    <div className="text-right">
                      <div className="text-base font-bold text-brand-primary">
                        ${cartTotalUSD.toFixed(2)} USD
                      </div>
                      <div className="text-xs text-text-secondary leading-none mt-0.5">
                        {cartTotalVND.toLocaleString()} VND
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout trigger */}
                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[48px] shadow-md"
                >
                  <span>Proceed to Delivery Checkout</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Checkout Delivery Details Overlay Dialog */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-200">
          {/* Modal Container */}
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl max-h-[85vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300 relative">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border-light flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-text-primary">Delivery Checkout Details</h2>
              <button
                onClick={() => setIsCheckingOut(false)}
                className="p-1 text-text-secondary hover:text-text-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
                aria-label="Close checkout"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="p-5 flex flex-col gap-4">
              {submitError && (
                <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span className="font-semibold">{submitError}</span>
                </div>
              )}

              {/* Order total header summary card */}
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-border-light rounded-xl p-4 flex justify-between items-baseline shrink-0">
                <span className="text-xs text-text-secondary">Amount Due:</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-text-primary">
                    ${cartTotalUSD.toFixed(2)} USD
                  </span>
                  <div className="text-[10px] text-text-secondary mt-0.5 leading-none text-right">
                    {cartTotalVND.toLocaleString()} VND
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="checkoutName" className="text-xs font-semibold text-text-primary">
                  Recipient Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="checkoutName"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    className="input-primary w-full pl-11 text-xs min-h-[44px]"
                    placeholder="e.g. John Doe"
                    disabled={isPending}
                    required
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="checkoutPhone" className="text-xs font-semibold text-text-primary">
                  Delivery Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="checkoutPhone"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    className="input-primary w-full pl-11 text-xs min-h-[44px]"
                    placeholder="e.g. +1 555-123-4567"
                    disabled={isPending}
                    required
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="checkoutAddress" className="text-xs font-semibold text-text-primary">
                  International Shipping Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="checkoutAddress"
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="input-primary w-full pl-11 text-xs min-h-[80px] py-2.5 resize-none"
                    placeholder="e.g. 456 Broadway, New York, NY 10012, USA"
                    disabled={isPending}
                    required
                  />
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-text-secondary pointer-events-none" />
                </div>
              </div>

              <div className="text-[10px] text-text-secondary bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-border-light leading-relaxed">
                💡 **Checkout Exchange Note**: Your card will be billed in USD for international custom packaging and fast global logistics fulfillment from the Kialna District 1 Shipping Hub.
              </div>

              {/* Submit Checkout */}
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[48px] shadow-md mt-1"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Order Checkout...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Authorise Checkout (${cartTotalUSD.toFixed(2)} USD)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Checkout Success Modal Dialog */}
      {checkoutSuccessOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4 shadow-2xl border border-border-light animate-in zoom-in-95 duration-300">
            <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950/20 text-brand-accent border border-teal-200 dark:border-teal-900 flex items-center justify-center">
              <Check className="h-6 w-6 stroke-[3px]" />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-text-primary">Order Placed Successfully!</h3>
              <p className="text-xs text-text-secondary mt-1 px-2">
                Thank you for supporting authentic Vietnamese artisans! Your order reference is:
              </p>
              <div className="mt-2.5 font-mono text-[10px] bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded border border-border-light text-text-primary select-all">
                {checkoutSuccessOrderId.toUpperCase()}
              </div>
            </div>

            <div className="w-full border-t border-border-light pt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setCheckoutSuccessOrderId(null);
                  setActiveView("orders");
                }}
                className="btn-primary w-full text-xs"
              >
                View Orders History
              </button>
              <button
                onClick={() => {
                  setCheckoutSuccessOrderId(null);
                  setActiveView("browse");
                }}
                className="bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 text-text-secondary hover:text-text-primary text-xs font-semibold py-2.5 rounded-lg border border-border-light cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-border-light grid grid-cols-2 py-2.5 z-40 px-2 shadow-inner">
        <button
          onClick={() => setActiveView("browse")}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-all ${
            activeView === "browse"
              ? "text-brand-primary font-bold scale-[1.03]"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px]">Explore Crafts</span>
        </button>

        <button
          onClick={() => setActiveView("orders")}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-all ${
            activeView === "orders"
              ? "text-brand-primary font-bold scale-[1.03]"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Clock className="h-5 w-5" />
          <span className="text-[10px]">My Orders</span>
        </button>
      </nav>

      {/* 8. User role testing switcher */}
      <RoleSwitcher currentUser={currentUser} />
    </div>
  );
}
