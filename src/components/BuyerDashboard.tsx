"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder, createStripeCheckoutSession, createPaymentIntent, getBuyerOrders } from "@/app/actions/orders";
import RoleSwitcher from "./RoleSwitcher";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import UserProfileCard from "./UserProfileCard";
import KialnaLogo from "./KialnaLogo";
import LanguageToggle, {
  usePortalLanguage,
  translateCategory,
  translateProductName,
  translateProductDesc,
  translateOrderStatus,
} from "./LanguageSwitcher";
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
  CreditCard,
  Scale,
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
    logo?: string | null;
  };
}

export default function BuyerDashboard({ initialProducts, currentUser }: BuyerDashboardProps) {
  const router = useRouter();
  const { lang, setLang } = usePortalLanguage("buyer");
  const isVi = lang === "vi";
  const [user, setUser] = useState(currentUser);
  const [activeView, setActiveView] = useState<"browse" | "orders" | "profile">("browse");
  
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
  const SHIPPING_RATE_PER_KG = 120000; // 120,000 VND per kg
  const FIXED_PACKAGING = 30000; // 30,000 VND per unit

  const getProductWeightKg = (p: any) => (p?.weight && p.weight > 0 ? p.weight : 0.5);
  const getUnitShippingVND = (p: any) => Math.round(SHIPPING_RATE_PER_KG * getProductWeightKg(p));

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
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      translateProductName(p.name, "vi").toLowerCase().includes(q) ||
      translateCategory(p.category, "vi").toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      translateProductDesc(p.description, "vi").toLowerCase().includes(q);
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
  const cartTotalWeightKg = cart.reduce(
    (acc, item) => acc + getProductWeightKg(item.product) * item.quantity,
    0
  );
  const cartShippingVND = cart.reduce(
    (acc, item) => acc + getUnitShippingVND(item.product) * item.quantity,
    0
  );
  const cartPackagingVND = cart.reduce((acc, item) => acc + FIXED_PACKAGING * item.quantity, 0);
  const cartTotalVND = cartSubtotalVND + cartShippingVND + cartPackagingVND;
  const cartTotalUSD = cartTotalVND / EXCHANGE_RATE;

  const [checkoutStep, setCheckoutStep] = useState<"details" | "payment">("details");
  const [paymentIntentData, setPaymentIntentData] = useState<{
    clientSecret: string;
    orderId: string;
    amountUSD: number;
  } | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [isStripeRedirecting, setIsStripeRedirecting] = useState(false);

  // In-Portal Embedded Payment initialization
  const handleStartInPortalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutAddress.trim() || !checkoutPhone.trim()) {
      setSubmitError("Please fill in all delivery details.");
      return;
    }

    setSubmitError("");
    setIsPreparingPayment(true);

    try {
      const payloadItems = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const payloadInfo = {
        name: checkoutName,
        address: checkoutAddress,
        phone: checkoutPhone,
      };

      const result = await createPaymentIntent(payloadItems, payloadInfo);
      if (result.success && result.clientSecret && result.orderId) {
        setPaymentIntentData({
          clientSecret: result.clientSecret,
          orderId: result.orderId,
          amountUSD: result.amountUSD || cartTotalUSD,
        });
        setCheckoutStep("payment");
      } else {
        setSubmitError(result.error || "Failed to initialize embedded checkout.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setIsPreparingPayment(false);
    }
  };

  // Stripe Checkout redirection
  const handleStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutAddress.trim() || !checkoutPhone.trim()) {
      setSubmitError("Please fill in all delivery details.");
      return;
    }

    setSubmitError("");
    setIsStripeRedirecting(true);

    try {
      const payloadItems = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const payloadInfo = {
        name: checkoutName,
        address: checkoutAddress,
        phone: checkoutPhone,
      };

      const result = await createStripeCheckoutSession(
        payloadItems,
        payloadInfo,
        window.location.origin
      );

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setSubmitError(result.error || "Failed to initiate Stripe checkout.");
        setIsStripeRedirecting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
      setIsStripeRedirecting(false);
    }
  };

  // Direct simulated checkout (Quick sandbox fallback)
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans pb-20 md:pb-8 text-text-primary">
      {/* 1. Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-border-light px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            {user.logo ? (
              <img
                src={user.logo}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover border border-border-light shadow-sm"
              />
            ) : (
              <KialnaLogo size={36} />
            )}
            <div>
              <h1 className="text-base font-bold text-ink tracking-tight leading-tight">{user.name || "Kialna Shop"}</h1>
              <p className="text-[10px] text-text-secondary font-medium tracking-wide leading-none">
                {isVi ? "Sàn thương mại Việt Nam - Hoa Kỳ" : "Vietnam to U.S. Marketplace"}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Switcher (Meta Pill Group) */}
          <div className="hidden md:flex items-center gap-1 bg-surface-soft p-1 rounded-full border border-border-light">
            <button
              onClick={() => setActiveView("browse")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeView === "browse"
                  ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                  : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>{isVi ? "Khám phá Sản phẩm" : "Explore Products"}</span>
            </button>
            <button
              onClick={() => setActiveView("orders")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeView === "orders"
                  ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                  : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{isVi ? "Đơn hàng của tôi" : "My Orders"}</span>
            </button>
            <button
              onClick={() => setActiveView("profile")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeView === "profile"
                  ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                  : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
              }`}
            >
              <User className="h-4 w-4" />
              <span>{isVi ? "Hồ sơ của tôi" : "My Profile"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Switcher (Default EN for Buyer) */}
            <LanguageToggle lang={lang} onChange={setLang} />

            {/* User Sign Out Button */}
            <button
              onClick={async () => {
                try {
                  const { signOut } = await import("@/app/actions/auth");
                  await signOut();
                } catch {
                  await fetch("/api/auth/signout", { method: "POST" });
                } finally {
                  window.location.href = "/login";
                }
              }}
              className="p-2 text-text-secondary hover:text-ink transition-colors hover:bg-surface-soft rounded-full cursor-pointer"
              title={isVi ? "Đăng xuất" : "Sign Out"}
              aria-label={isVi ? "Đăng xuất" : "Sign Out"}
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Cart Icon Pill */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-ink hover:text-brand-primary transition-colors hover:bg-surface-soft rounded-full cursor-pointer border border-border-light"
              aria-label={isVi ? "Giỏ hàng" : "View shopping cart"}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* VIEW A: BROWSE */}
        {activeView === "browse" && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-200">
            {/* Meta Dark Promo Strip */}
            <div className="card-promo-strip p-8 sm:p-10 md:p-12 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold tracking-wide backdrop-blur-sm border border-white/15 w-fit">
                  <Sparkles className="h-3 w-3 text-white" />{" "}
                  {isVi
                    ? "Đặc sản & Hàng Việt Nam Chính gốc Giao tận nơi"
                    : "Authentic Vietnamese Products Direct to You"}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  {isVi
                    ? "Đặc sản Việt Nam & Thủ công Mỹ nghệ Truyền thống"
                    : "Authentic Vietnamese Goods & Heritage Crafts"}
                </h2>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal max-w-xl">
                  {isVi
                    ? "Cà phê Tây Nguyên, gốm sứ truyền thống, trà thảo mộc, lụa tơ tằm và đặc sản địa phương chính gốc từ các hộ kinh doanh và nghệ nhân Việt Nam. Đóng gói và vận chuyển đường hàng không từ Saigon Hub đi Mỹ và toàn cầu."
                    : "Specialty highland coffee, heritage ceramics, organic teas, textiles, and authentic local goods sourced directly from Vietnamese sellers and producers. Dispatched via our Saigon Hub to the U.S. & worldwide."}
                </p>
              </div>
              <div className="absolute right-0 bottom-0 translate-y-12 translate-x-8 opacity-15 pointer-events-none">
                <KialnaLogo size={280} />
              </div>
            </div>

            {/* Search & Categories Bar (Meta Pill Controls) */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              {/* Search Pill Input */}
              <div className="relative flex-1 md:max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isVi
                      ? "Tìm sản phẩm Việt Nam, cà phê, thủ công mỹ nghệ, trà..."
                      : "Search Vietnamese products, coffee, crafts, teas..."
                  }
                  className="search-pill w-full pl-11 text-xs focus:bg-white transition-all outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>

              {/* Categories Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-[13px] whitespace-nowrap transition-all cursor-pointer border ${
                      selectedCategory === cat
                        ? "bg-[#164e63] text-white border-[#164e63] font-bold shadow-sm"
                        : "bg-white text-text-primary border-border-hairline hover:bg-sky-50/60 font-semibold"
                    }`}
                  >
                    {translateCategory(cat, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                      className="card-product group cursor-pointer"
                    >
                      {/* Thumbnail container on Soft Surface */}
                      <div className="aspect-square bg-surface-soft overflow-hidden relative border-b border-border-light">
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
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-white bg-red-600 px-2.5 py-0.5 rounded-full shadow-sm">
                              {isVi ? "Hết hàng" : "Out of Stock"}
                            </span>
                          </div>
                        ) : isLowStock ? (
                          <span className="absolute top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm leading-none uppercase tracking-wide">
                            {isVi ? `Còn ${p.inventory}` : `Only ${p.inventory} left`}
                          </span>
                        ) : null}
                      </div>

                      {/* Info */}
                      <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider truncate">
                            {translateCategory(p.category, lang)}
                          </span>
                          <span className="text-[10px] text-text-secondary inline-flex items-center gap-0.5 bg-surface-soft px-1.5 py-0.5 rounded-md border border-border-light shrink-0">
                            <Scale className="h-2.5 w-2.5 text-brand-primary" />
                            <span>{getProductWeightKg(p)} kg</span>
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-ink line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors flex-1">
                          {translateProductName(p.name, lang)}
                        </h3>
                        <div className="mt-1 flex flex-col pt-1">
                          <span className="text-sm sm:text-base font-bold text-brand-primary tracking-tight">
                            ${(p.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-text-secondary font-medium leading-none mt-0.5">
                            {p.basePrice.toLocaleString()} VND
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 sm:col-span-3 lg:col-span-4 p-12 text-center flex flex-col items-center gap-3 bg-white border-2 border-dashed border-border-light rounded-[32px]">
                  <div className="h-12 w-12 rounded-full bg-surface-soft flex items-center justify-center text-text-secondary">
                    <ShoppingBag className="h-6 w-6 opacity-60" />
                  </div>
                  <h3 className="text-base font-bold text-ink">
                    {isVi ? "Không tìm thấy sản phẩm" : "No products found"}
                  </h3>
                  <p className="text-xs text-text-secondary max-w-sm">
                    {isVi
                      ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác ở phía trên."
                      : "Try refining your search keyword or selecting a different category filter above."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW B: ORDER HISTORY */}
        {activeView === "orders" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="border-b border-border-light pb-4">
              <h2 className="text-xl font-bold text-ink tracking-tight">
                {isVi ? "Biên lai Đơn hàng của bạn" : "Your Order Receipts"}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {isVi
                  ? "Lịch sử các đơn hàng và vận đơn quốc tế được gửi đi từ Saigon Hub."
                  : "Past verified shipments and logistics manifests dispatched from Saigon Hub."}
              </p>
            </div>

            {isOrdersLoading ? (
              <div className="flex flex-col items-center justify-center p-16 text-text-secondary gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                <span className="text-xs font-medium">
                  {isVi ? "Đang tải biên lai đơn hàng..." : "Fetching verified receipts..."}
                </span>
              </div>
            ) : ordersError ? (
              <div className="p-4 border border-red-200 bg-red-50/40 rounded-2xl text-center text-xs text-red-600 font-medium">
                {ordersError}
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-4 bg-white border border-border-light shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-border-light pb-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-text-secondary font-semibold">
                          {isVi ? "MÃ ĐƠN" : "ORDER"}: {o.id.substring(0, 8).toUpperCase()}...
                        </span>
                        <span className="text-[11px] text-text-secondary">
                          {new Date(o.createdAt).toLocaleDateString(isVi ? "vi-VN" : "en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-surface-soft text-ink border border-border-light uppercase tracking-wide">
                        {translateOrderStatus(o.status, lang)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-2.5">
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center text-xs justify-between">
                          <span className="text-ink font-semibold line-clamp-1 flex-1">
                            {translateProductName(item.product.name, lang)}
                            <span className="text-text-secondary ml-1.5 font-bold">x{item.quantity}</span>
                          </span>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="font-bold text-ink">
                              ${((item.sellerPriceAtPurchase * item.quantity) / EXCHANGE_RATE).toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-text-secondary leading-none">
                              {(item.sellerPriceAtPurchase * item.quantity).toLocaleString()} VND
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fees Breakdown */}
                    <div className="bg-surface-soft p-3.5 rounded-2xl border border-border-light text-[11px] text-text-secondary flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span>{isVi ? "Phí đóng gói:" : "Packaging Fee:"}</span>
                        <span className="font-medium text-ink">
                          ${(o.items.reduce((acc: number, item: any) => acc + item.packagingFeeAtPurchase * item.quantity, 0) / EXCHANGE_RATE).toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isVi ? "Vận chuyển quốc tế:" : "International Shipping:"}</span>
                        <span className="font-medium text-ink">
                          ${(o.items.reduce((acc: number, item: any) => acc + item.shippingFeeAtPurchase * item.quantity, 0) / EXCHANGE_RATE).toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    {/* Paid Receipt Total */}
                    <div className="flex justify-between items-baseline pt-2 border-t border-border-light">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">
                        {isVi ? "Tổng thanh toán" : "Total Paid"}
                      </span>
                      <div className="text-right">
                        <span className="text-base font-bold text-brand-primary">
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
              <div className="p-12 text-center flex flex-col items-center gap-3 bg-white border-2 border-dashed border-border-light rounded-[32px]">
                <div className="h-12 w-12 rounded-full bg-surface-soft flex items-center justify-center text-text-secondary">
                  <Clock className="h-6 w-6 opacity-60" />
                </div>
                <h3 className="text-base font-bold text-ink">
                  {isVi ? "Chưa có đơn hàng nào" : "No purchases found"}
                </h3>
                <p className="text-xs text-text-secondary max-w-sm">
                  {isVi
                    ? "Lịch sử mua hàng và biên lai vận chuyển của bạn sẽ hiển thị tại đây sau khi thanh toán."
                    : "Your purchase history and live fulfillment receipts will show up here after checkout."}
                </p>
                <button
                  onClick={() => setActiveView("browse")}
                  className="btn-primary text-xs mt-3 cursor-pointer"
                >
                  {isVi ? "Khám phá Sản phẩm" : "Explore Products"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: PROFILE */}
        {activeView === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
            <UserProfileCard
              currentUser={user}
              onUserUpdate={(updated) => {
                setUser((prev) => ({ ...prev, ...updated }));
                if (updated.name) setCheckoutName(updated.name);
                if (updated.phone) setCheckoutPhone(updated.phone);
                if (updated.address) setCheckoutAddress(updated.address);
              }}
              roleLabel={isVi ? "Người mua Quốc tế" : "Global Buyer"}
              addressLabel={isVi ? "Địa chỉ Nhận hàng Quốc tế Mặc định" : "Default Shipping Delivery Address"}
              addressPlaceholder="e.g. 456 Broadway, New York, NY 10012, USA"
              logoLabel={isVi ? "Ảnh đại diện Người mua" : "Buyer Profile Logo"}
              lang={lang}
            />

            {/* Buyer Guarantee & Perks Card */}
            <div className="card-product rounded-[28px] p-6 sm:p-8 bg-surface-soft/60 border border-border-light flex flex-col gap-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-brand-primary" />
                {isVi ? "Bảo vệ Người mua Quốc tế" : "International Buyer Protection"}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {isVi
                  ? "Ảnh đại diện và địa chỉ nhận hàng mặc định giúp thanh toán nhanh chóng cho các mặt hàng đặc sản Việt Nam gửi trực tiếp từ Sài Gòn."
                  : "Your profile logo and default address make checkout instant for authentic Vietnamese products and crafts direct from Saigon."}
              </p>
              <div className="space-y-3 pt-2">
                <div className="bg-white p-4 rounded-2xl border border-border-light flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">
                      {isVi ? "Kiểm định Chính hãng tại Saigon Hub" : "Export Hub Authenticity Verification"}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {isVi
                        ? "Mỗi đơn hàng đều được kiểm tra và đóng gói tiêu chuẩn xuất khẩu tại Saigon Hub trước khi vận chuyển quốc tế."
                        : "Every order is carefully inspected and packaged at the Saigon Hub before international shipment."}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-border-light flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-blue-50 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">
                      {isVi ? "Đảm bảo Tỷ giá VND sang USD Cố định" : "Fixed VND-to-USD Exchange Guarantee"}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {isVi
                        ? "Tỷ giá cố định 25,000 VND / USD không phát sinh phí chuyển đổi ngoại tệ ẩn trên cổng thanh toán Stripe."
                        : "Guaranteed conversion rate at 25,000 VND / USD with zero surprise foreign transaction surcharges on our Stripe portal."}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-border-light flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">
                      {isVi ? "Thanh toán Trực tiếp cho Hộ kinh doanh" : "Direct Seller Payouts"}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {isVi
                        ? "Giá cả minh bạch hỗ trợ trực tiếp cho các nhà sản xuất, tiểu thương và nghệ nhân tại Việt Nam."
                        : "Fair pricing directly supporting independent Vietnamese producers, merchants, and artisans."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Product Details Modal Dialog (Meta Rounded-32 Card) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md md:max-w-4xl rounded-t-[32px] md:rounded-[32px] max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative shadow-2xl border border-border-light">
            
            {/* Header image cover on Soft Surface */}
            <div className="relative aspect-video md:aspect-auto md:w-1/2 bg-surface-soft shrink-0 md:min-h-[420px] overflow-hidden">
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
                className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 hover:bg-white text-ink rounded-full transition-all cursor-pointer shadow-md border border-border-light"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-6 md:p-8 flex flex-col gap-5 flex-1 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                  {translateCategory(selectedProduct.category, lang)}
                </span>
                <h2 className="text-xl font-bold text-ink mt-1 leading-snug">
                  {translateProductName(selectedProduct.name, lang)}
                </h2>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-brand-primary tracking-tight">
                      ${(selectedProduct.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                    <span className="text-xs text-text-secondary leading-none mt-0.5">
                      {selectedProduct.basePrice.toLocaleString()} VND
                    </span>
                  </div>
                  
                  {/* Stock status badge */}
                  {selectedProduct.inventory === 0 ? (
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 leading-none uppercase tracking-wide">
                      {isVi ? "Hết hàng" : "Out of Stock"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">
                      {isVi ? `Còn ${selectedProduct.inventory} sản phẩm` : `${selectedProduct.inventory} In Stock`}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="flex flex-col gap-1.5 border-t border-border-light pt-4">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    {isVi ? "Thông tin Sản phẩm" : "About This Product"}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {translateProductDesc(selectedProduct.description, lang)}
                  </p>
                </div>
              )}

              {/* Dynamic Price transparency breakdown panel */}
              <div className="bg-surface-soft rounded-2xl p-4 sm:p-5 border border-border-light flex flex-col gap-2.5">
                <div className="flex items-center gap-2 border-b border-border-light pb-2.5">
                  <Calculator className="h-4 w-4 text-brand-primary" />
                  <h4 className="text-[11px] font-bold text-ink uppercase tracking-wider">
                    {isVi ? "Chi tiết Giá Minh bạch (Saigon Hub)" : "Saigon Hub Price Transparency"}
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {isVi ? "Giá gốc người bán:" : "Seller Base Price:"}
                    </span>
                    <span className="font-semibold text-ink">
                      ${(selectedProduct.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>{isVi ? "+ Phí đóng gói xuất khẩu:" : "+ Export Packaging Fee:"}</span>
                    <span>${(FIXED_PACKAGING / EXCHANGE_RATE).toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>
                      {isVi
                        ? `+ Vận chuyển hàng không (${getProductWeightKg(selectedProduct)} kg × $${(SHIPPING_RATE_PER_KG / EXCHANGE_RATE).toFixed(2)}/kg):`
                        : `+ Air Shipping (${getProductWeightKg(selectedProduct)} kg × $${(SHIPPING_RATE_PER_KG / EXCHANGE_RATE).toFixed(2)}/kg):`}
                    </span>
                    <span>${(getUnitShippingVND(selectedProduct) / EXCHANGE_RATE).toFixed(2)} USD</span>
                  </div>
                  <div className="border-t border-border-light my-2 pt-2.5 flex justify-between items-baseline font-semibold">
                    <span className="text-ink">{isVi ? "Tổng mỗi sản phẩm:" : "Total Per Unit:"}</span>
                    <div className="text-right">
                      <div className="text-base font-bold text-brand-primary">
                        ${((selectedProduct.basePrice + getUnitShippingVND(selectedProduct) + FIXED_PACKAGING) / EXCHANGE_RATE).toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 leading-none">
                        {(selectedProduct.basePrice + getUnitShippingVND(selectedProduct) + FIXED_PACKAGING).toLocaleString()} VND
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive quantity selector and Add To Cart CTA */}
              {selectedProduct.inventory > 0 && (
                <div className="flex flex-col gap-3 pt-4 border-t border-border-light">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">
                      {isVi ? "Chọn số lượng" : "Select Quantity"}
                    </span>
                    <div className="flex items-center border border-border-light rounded-full overflow-hidden bg-white p-0.5">
                      <button
                        onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                        disabled={detailQuantity <= 1}
                        className="p-1.5 text-text-secondary hover:text-ink hover:bg-surface-soft rounded-full transition-colors shrink-0 disabled:opacity-30 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-4 text-xs font-bold text-ink text-center min-w-[36px]">
                        {detailQuantity}
                      </span>
                      <button
                        onClick={() => setDetailQuantity(Math.min(selectedProduct.inventory, detailQuantity + 1))}
                        disabled={detailQuantity >= selectedProduct.inventory}
                        className="p-1.5 text-text-secondary hover:text-ink hover:bg-surface-soft rounded-full transition-colors shrink-0 disabled:opacity-30 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(selectedProduct, detailQuantity)}
                    className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[50px] shadow-lg shadow-brand-primary/20 rounded-full cursor-pointer mt-1"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>
                      {isVi ? "Thêm vào giỏ" : "Add to Cart"} — ${(((selectedProduct.basePrice + getUnitShippingVND(selectedProduct) + FIXED_PACKAGING) * detailQuantity) / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sliding Cart Drawer Panel (Meta Rounded-32 Card) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-end md:items-stretch md:justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md md:w-[440px] md:max-w-none md:h-full rounded-t-[32px] md:rounded-l-[32px] md:rounded-r-none max-h-[85vh] md:max-h-full flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300 relative shadow-2xl border-l border-border-light">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-light flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-full bg-brand-primary/10 text-brand-primary">
                  <ShoppingBag className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-ink">
                  {isVi ? "Giỏ hàng" : "Shopping Cart"}
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-text-secondary hover:text-ink hover:bg-surface-soft rounded-full cursor-pointer transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3.5">
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
                      className="p-3.5 flex gap-3.5 items-center bg-surface-soft/60 rounded-2xl border border-border-light relative"
                    >
                      {/* Image */}
                      <div className="h-16 w-16 rounded-xl overflow-hidden border border-border-light shrink-0 bg-white">
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
                        <h4 className="text-xs font-bold text-ink truncate pr-2">
                          {translateProductName(item.product.name, lang)}
                        </h4>
                        <span className="text-[10px] text-text-secondary uppercase font-semibold">
                          {translateCategory(item.product.category, lang)}
                        </span>
                        <div className="flex flex-col mt-1">
                          <span className="text-xs font-bold text-brand-primary">
                            ${(item.product.basePrice / EXCHANGE_RATE).toFixed(2)} USD
                          </span>
                          <span className="text-[9px] text-text-secondary">
                            {getProductWeightKg(item.product)} kg • + ${((getUnitShippingVND(item.product) + FIXED_PACKAGING) / EXCHANGE_RATE).toFixed(2)} {isVi ? "phí/sp" : "fees/unit"}
                          </span>
                        </div>
                      </div>

                      {/* Control Panel */}
                      <div className="flex flex-col gap-2 items-end shrink-0 pl-2">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-text-secondary hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title={isVi ? "Xóa sản phẩm" : "Remove item"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        
                        {/* Selector */}
                        <div className="flex items-center border border-border-light rounded-full bg-white overflow-hidden text-xs p-0.5">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1 hover:bg-surface-soft text-text-secondary rounded-full shrink-0 cursor-pointer"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 font-bold text-ink text-center min-w-[20px]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="p-1 hover:bg-surface-soft text-text-secondary rounded-full shrink-0 cursor-pointer"
                            aria-label="Increase"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
                  <ShoppingBag className="h-12 w-12 text-text-secondary opacity-30" />
                  <h3 className="text-sm font-semibold text-ink">
                    {isVi ? "Giỏ hàng đang trống" : "Your cart is empty"}
                  </h3>
                  <p className="text-xs text-text-secondary text-center max-w-xs">
                    {isVi
                      ? "Khám phá danh mục và thêm các sản phẩm Việt Nam chính gốc vào giỏ hàng của bạn."
                      : "Browse our catalog and add authentic Vietnamese products to your cart."}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Summary details */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-border-light bg-surface-soft/40 shrink-0 flex flex-col gap-4">
                {/* Cost Breakdown */}
                <div className="space-y-1.5 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>{isVi ? "Tạm tính tiền hàng:" : "Items Subtotal:"}</span>
                    <span className="text-ink font-semibold">
                      ${(cartSubtotalVND / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? "Phí đóng gói:" : "Packaging Fees:"}</span>
                    <span className="text-ink font-semibold">
                      ${(cartPackagingVND / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {isVi
                        ? `Vận chuyển hàng không (${cartTotalWeightKg.toFixed(2)} kg):`
                        : `International Air Shipping (${cartTotalWeightKg.toFixed(2)} kg):`}
                    </span>
                    <span className="text-ink font-semibold">
                      ${(cartShippingVND / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="border-t border-border-light my-2 pt-2.5 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-ink">
                      {isVi ? "Tổng đơn hàng:" : "Order Total:"}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-brand-primary">
                        ${cartTotalUSD.toFixed(2)} USD
                      </div>
                      <div className="text-xs text-text-secondary leading-none mt-0.5 font-medium">
                        {cartTotalVND.toLocaleString()} VND
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout trigger */}
                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[50px] shadow-lg shadow-brand-primary/20 rounded-full cursor-pointer"
                >
                  <span>{isVi ? "Tiến hành Đặt hàng & Giao nhận" : "Proceed to Delivery Checkout"}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Checkout Delivery Details Overlay Dialog (Meta Rounded-32 Card) */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md md:max-w-lg rounded-t-[32px] md:rounded-[32px] max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative shadow-2xl border border-border-light">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-light flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-ink">
                  {checkoutStep === "details"
                    ? isVi
                      ? "Thông tin Giao hàng"
                      : "Delivery Details"
                    : isVi
                    ? "Thanh toán Thẻ Bảo mật"
                    : "Secure Card Payment"}
                </h2>
                <span className="text-[10px] font-bold text-ink bg-surface-soft border border-border-light px-2.5 py-0.5 rounded-full">
                  {checkoutStep === "details"
                    ? isVi
                      ? "Bước 1 / 2"
                      : "Step 1 of 2"
                    : isVi
                    ? "Bước 2 / 2"
                    : "Step 2 of 2"}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsCheckingOut(false);
                  setCheckoutStep("details");
                  setPaymentIntentData(null);
                }}
                className="p-1.5 text-text-secondary hover:text-ink hover:bg-surface-soft rounded-full cursor-pointer transition-colors"
                aria-label="Close checkout"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {checkoutStep === "details" ? (
              /* STEP 1: Delivery Details Form */
              <form onSubmit={handleStartInPortalPayment} className="p-6 flex flex-col gap-4">
                {submitError && (
                  <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Order total header summary card */}
                <div className="bg-surface-soft border border-border-light rounded-2xl p-4 flex justify-between items-baseline shrink-0">
                  <span className="text-xs text-text-secondary font-medium">
                    {isVi ? "Số tiền cần thanh toán:" : "Amount Due:"}
                  </span>
                  <div className="text-right">
                    <span className="text-base font-bold text-brand-primary">
                      ${cartTotalUSD.toFixed(2)} USD
                    </span>
                    <div className="text-[10px] text-text-secondary mt-0.5 leading-none text-right">
                      {cartTotalVND.toLocaleString()} VND
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkoutName" className="text-xs font-semibold text-ink">
                    {isVi ? "Họ và tên người nhận" : "Recipient Full Name"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="checkoutName"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      className="input-primary w-full pl-11 text-xs min-h-[46px] rounded-xl"
                      placeholder="e.g. John Doe"
                      disabled={isPreparingPayment || isPending}
                      required
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkoutPhone" className="text-xs font-semibold text-ink">
                    {isVi ? "Số điện thoại nhận hàng" : "Delivery Phone Number"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="checkoutPhone"
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      className="input-primary w-full pl-11 text-xs min-h-[46px] rounded-xl"
                      placeholder="e.g. +1 555-123-4567"
                      disabled={isPreparingPayment || isPending}
                      required
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkoutAddress" className="text-xs font-semibold text-ink">
                    {isVi ? "Địa chỉ nhận hàng quốc tế" : "International Shipping Address"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="checkoutAddress"
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      className="input-primary w-full pl-11 text-xs min-h-[85px] py-3 rounded-xl resize-none"
                      placeholder="e.g. 456 Broadway, New York, NY 10012, USA"
                      disabled={isPreparingPayment || isPending}
                      required
                    />
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-text-secondary pointer-events-none" />
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary bg-surface-soft p-3.5 rounded-2xl border border-border-light flex flex-col gap-1 leading-relaxed">
                  <div>
                    💡{" "}
                    {isVi ? (
                      <>
                        <strong>Thông báo Giao nhận Saigon Hub</strong>: Thanh toán bằng USD đã bao gồm phí đóng gói tiêu chuẩn xuất khẩu và chuyển phát nhanh đường hàng không từ Saigon Hub.
                      </>
                    ) : (
                      <>
                        <strong>Saigon Hub Delivery Notice</strong>: Billed in USD for guaranteed export packaging and expedited air courier from Saigon Hub.
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Action Buttons */}
                <div className="flex flex-col gap-2.5 mt-2">
                  {/* Primary: In-Portal Embedded Payment */}
                  <button
                    type="submit"
                    className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[50px] shadow-lg shadow-brand-primary/20 rounded-full cursor-pointer active:scale-98 transition-all"
                    disabled={isPreparingPayment || isPending}
                  >
                    {isPreparingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>
                          {isVi ? "Đang khởi tạo thanh toán..." : "Preparing In-Portal Payment..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>
                          {isVi
                            ? `Thanh toán bằng Thẻ ($${cartTotalUSD.toFixed(2)} USD)`
                            : `Pay in App with Card ($${cartTotalUSD.toFixed(2)} USD)`}
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-2.5 pt-1">
                    {/* Secondary: Hosted Stripe Page */}
                    <button
                      type="button"
                      onClick={handleStripeCheckout}
                      className="btn-secondary flex-1 py-2.5 px-3 text-xs font-semibold text-center cursor-pointer rounded-full"
                      disabled={isPreparingPayment || isStripeRedirecting}
                    >
                      {isStripeRedirecting
                        ? isVi
                          ? "Đang chuyển hướng..."
                          : "Redirecting..."
                        : "Stripe Checkout ↗"}
                    </button>

                    {/* Tertiary: Instant Sandbox Demo */}
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="flex-1 py-2.5 px-3 text-xs font-semibold text-text-secondary hover:text-ink bg-surface-soft hover:bg-zinc-200/70 border border-border-light rounded-full transition-colors text-center cursor-pointer"
                      disabled={isPreparingPayment || isPending}
                    >
                      {isVi ? "Đặt nhanh (Demo)" : "Instant Bypass"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* STEP 2: In-Portal Embedded Stripe Elements Form */
              <div className="p-6 flex flex-col gap-4">
                {/* Delivery summary badge */}
                <div className="bg-surface-soft border border-border-light rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-ink truncate">
                      {isVi ? "Giao đến:" : "Deliver to:"} {checkoutName}
                    </span>
                    <span className="text-[10px] text-text-secondary truncate">
                      {checkoutAddress}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("details")}
                    className="text-[11px] text-brand-primary font-bold hover:underline shrink-0 pl-2 cursor-pointer"
                  >
                    {isVi ? "Thay đổi" : "Change"}
                  </button>
                </div>

                {/* Amount Due Card */}
                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-4 flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-ink">
                    {isVi ? "Tổng thanh toán:" : "Total to Authorise:"}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-brand-primary">
                      ${(paymentIntentData?.amountUSD || cartTotalUSD).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-text-secondary block leading-none mt-0.5">
                      ~ {cartTotalVND.toLocaleString()} VND
                    </span>
                  </div>
                </div>

                {/* Embedded Stripe Elements Component */}
                {paymentIntentData && (
                  <EmbeddedStripeCheckout
                    clientSecret={paymentIntentData.clientSecret}
                    orderId={paymentIntentData.orderId}
                    amountUSD={paymentIntentData.amountUSD}
                    onSuccess={(order) => {
                      setCheckoutSuccessOrderId(order.id);
                      setCart([]);
                      setIsCheckingOut(false);
                      setIsCartOpen(false);
                      setCheckoutStep("details");
                      setPaymentIntentData(null);
                      router.refresh();
                    }}
                    onBack={() => setCheckoutStep("details")}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Checkout Success Modal Dialog (Meta Rounded-32 Card) */}
      {checkoutSuccessOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 flex flex-col items-center text-center gap-4 shadow-2xl border border-border-light animate-in zoom-in-95 duration-300">
            <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Check className="h-7 w-7 stroke-[3px]" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-ink">
                {isVi ? "Đặt hàng Thành công!" : "Order Placed Successfully!"}
              </h3>
              <p className="text-xs text-text-secondary mt-1 px-2 leading-relaxed">
                {isVi
                  ? "Cảm ơn bạn đã ủng hộ các nhà bán hàng và nghệ nhân Việt Nam! Mã đơn hàng của bạn là:"
                  : "Thank you for supporting Vietnamese sellers and artisans! Your order reference is:"}
              </p>
              <div className="mt-3 font-mono text-[11px] bg-surface-soft px-3 py-1.5 rounded-full border border-border-light text-ink font-bold select-all">
                {checkoutSuccessOrderId.toUpperCase()}
              </div>
            </div>

            <div className="w-full border-t border-border-light pt-4 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setCheckoutSuccessOrderId(null);
                  setActiveView("orders");
                }}
                className="btn-primary w-full text-xs font-bold py-3.5 rounded-full cursor-pointer"
              >
                {isVi ? "Xem Lịch sử Đơn hàng" : "View Orders History"}
              </button>
              <button
                onClick={() => {
                  setCheckoutSuccessOrderId(null);
                  setActiveView("browse");
                }}
                className="btn-secondary w-full text-xs font-semibold py-3 rounded-full cursor-pointer"
              >
                {isVi ? "Tiếp tục Mua sắm" : "Continue Shopping"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Bottom Navigation Bar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-border-light grid grid-cols-3 py-3 z-40 px-2">
        <button
          onClick={() => setActiveView("browse")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeView === "browse"
              ? "text-brand-primary font-bold"
              : "text-text-secondary hover:text-ink"
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px] font-medium">
            {isVi ? "Khám phá" : "Explore Products"}
          </span>
        </button>

        <button
          onClick={() => setActiveView("orders")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeView === "orders"
              ? "text-brand-primary font-bold"
              : "text-text-secondary hover:text-ink"
          }`}
        >
          <Clock className="h-5 w-5" />
          <span className="text-[10px] font-medium">
            {isVi ? "Đơn hàng" : "My Orders"}
          </span>
        </button>

        <button
          onClick={() => setActiveView("profile")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeView === "profile"
              ? "text-brand-primary font-bold"
              : "text-text-secondary hover:text-ink"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">
            {isVi ? "Hồ sơ" : "My Profile"}
          </span>
        </button>
      </nav>

      {/* 8. User role testing switcher */}
      <RoleSwitcher currentUser={user} lang={lang} />
    </div>
  );
}
