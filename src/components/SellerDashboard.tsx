"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteProduct, toggleProductStatus } from "@/app/actions/products";
import RoleSwitcher from "./RoleSwitcher";
import UserProfileCard from "./UserProfileCard";
import KialnaLogo from "./KialnaLogo";
import LanguageToggle, {
  usePortalLanguage,
  translateCategory,
  translateProductName,
  translateOrderStatus as translateStatusHelper,
} from "./LanguageSwitcher";
import {
  ShoppingBag,
  ClipboardList,
  User,
  Plus,
  Search,
  Package,
  Layers,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  MapPin,
  Mail,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  LogOut,
  Scale,
  Landmark,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface SellerDashboardProps {
  initialProducts: any[];
  initialOrders: any[];
  currentUser: {
    id: string;
    role: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    logo?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    vietQrImage?: string | null;
  };
}

export default function SellerDashboard({ initialProducts, initialOrders, currentUser }: SellerDashboardProps) {
  const { lang, setLang } = usePortalLanguage("seller");
  const isVi = lang === "vi";
  const [user, setUser] = useState(currentUser);
  const [activeTab, setActiveTab] = useState<"listings" | "orders" | "profile">("listings");
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft" | "out_of_stock">("all");
  const [isPending, startTransition] = useTransition();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const translateOrderStatus = (st: string) => translateStatusHelper(st, lang);

  // Quick stats
  const totalListings = products.length;
  const activeListings = products.filter((p) => p.status === "active" && p.inventory > 0).length;
  const lowStockCount = products.filter((p) => p.inventory === 0).length;

  // Filter products based on search and status tab
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      translateProductName(p.name, "vi").toLowerCase().includes(q) ||
      translateCategory(p.category, "vi").toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q));
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "active") return matchesSearch && p.status === "active" && p.inventory > 0;
    if (filterStatus === "draft") return matchesSearch && p.status === "draft";
    if (filterStatus === "out_of_stock") return matchesSearch && p.inventory === 0;
    return matchesSearch;
  });

  const handleToggleStatus = (id: string) => {
    setActioningId(id);
    startTransition(async () => {
      const result = await toggleProductStatus(id);
      if (result.success && result.product) {
        setProducts(
          products.map((p) => (p.id === id ? { ...p, status: result.product.status } : p))
        );
      } else {
        alert(isVi ? "Không thể cập nhật trạng thái sản phẩm" : "Failed to update status");
      }
      setActioningId(null);
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (
      !confirm(
        isVi
          ? "Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác."
          : "Are you sure you want to delete this listing? This action cannot be undone."
      )
    )
      return;

    setActioningId(id);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(result.error || (isVi ? "Không thể xóa sản phẩm" : "Failed to delete product"));
      }
      setActioningId(null);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans pb-20 md:pb-8 text-text-primary">
      {/* Top Header */}
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
              <h1 className="text-base font-bold text-ink tracking-tight leading-tight">
                {user.name || (isVi ? "Nhà bán hàng Kialna" : "Kialna Seller")}
              </h1>
              <p className="text-[10px] text-text-secondary font-medium tracking-wide leading-none">
                {isVi ? "Kênh Người Bán Việt Nam" : "Vietnamese Merchant Studio"}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Switcher (Meta Pill Group) */}
          <div className="hidden md:flex items-center gap-1 bg-surface-soft p-1 rounded-full border border-border-light">
            <button
              onClick={() => setActiveTab("listings")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "listings"
                  ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                  : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isVi ? `Sản phẩm (${totalListings})` : `Listings (${totalListings})`}</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                  : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>{isVi ? `Đơn hàng (${orders.length})` : `Orders (${orders.length})`}</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                  : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
              }`}
            >
              <User className="h-4 w-4" />
              <span>{isVi ? "Hồ sơ cửa hàng" : "Store Profile"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher (Default VI for Seller) */}
            <LanguageToggle lang={lang} onChange={setLang} />

            {/* Sign Out Button */}
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
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            <Link
              href="/seller/products/new"
              className="btn-primary text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md shadow-brand-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span>{isVi ? "Đăng sản phẩm" : "Add Listing"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* TAB 1: LISTINGS */}
        {activeTab === "listings" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Quick Stats Grid (Meta Metric Cards) */}
            <div className="grid grid-cols-3 gap-3.5 sm:gap-6">
              <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {isVi ? "Tổng sản phẩm" : "Total Listings"}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{totalListings}</span>
              </div>
              <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {isVi ? "Đang bán" : "Active"}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">{activeListings}</span>
              </div>
              <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {isVi ? "Hết hàng" : "Low Stock"}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-red-500 tracking-tight">{lowStockCount}</span>
              </div>
            </div>

            {/* Search and Filters Bar (Meta Pill Controls) */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 md:max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isVi ? "Tìm kiếm sản phẩm của bạn..." : "Search your product listings..."}
                  className="search-pill w-full pl-11 text-xs focus:bg-white transition-all outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>

              {/* Filter Tabs Meta Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {(["all", "active", "draft", "out_of_stock"] as const).map((tab) => {
                  const tabLabel = isVi
                    ? tab === "all"
                      ? "Tất cả"
                      : tab === "active"
                      ? "Đang bán"
                      : tab === "draft"
                      ? "Bản nháp"
                      : "Hết hàng"
                    : tab === "out_of_stock"
                    ? "Out of Stock"
                    : tab.charAt(0).toUpperCase() + tab.slice(1);

                  return (
                    <button
                      key={tab}
                      onClick={() => setFilterStatus(tab)}
                      className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-[13px] whitespace-nowrap transition-all cursor-pointer border ${
                        filterStatus === tab
                          ? "bg-[#164e63] text-white border-[#164e63] font-bold shadow-sm"
                          : "bg-white text-text-primary border-border-hairline hover:bg-sky-50/60 font-semibold"
                      }`}
                    >
                      {tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  let imageList = [];
                  try {
                    imageList = JSON.parse(p.images);
                  } catch (e) {}
                  const imageUrl = imageList[0] || "/file.svg";

                  const isLowStock = p.inventory === 0;
                  const isDraft = p.status === "draft";
                  const isActioning = actioningId === p.id && isPending;

                  return (
                    <div
                      key={p.id}
                      className="card-product rounded-[24px] p-4 sm:p-5 flex gap-4 items-center bg-white border border-border-light hover:border-border-hairline transition-all duration-300 hover:shadow-md relative"
                    >
                      {/* Product Thumbnail on Soft Surface */}
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border border-border-light shrink-0 bg-surface-soft relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/file.svg";
                          }}
                        />
                      </div>

                      {/* Info & Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h3 className="text-sm font-bold text-ink truncate pr-1">
                            {translateProductName(p.name, lang)}
                          </h3>
                        </div>

                        <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                          {translateCategory(p.category, lang)}
                        </span>

                        <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                          <span className="text-sm font-bold text-brand-primary">
                            {p.basePrice.toLocaleString()} VND
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            {isVi ? "Kho:" : "Stock:"} <span className="font-semibold text-ink">{p.inventory}</span>
                          </span>
                          <span className="text-[10px] text-text-secondary inline-flex items-center gap-0.5 bg-surface-soft px-1.5 py-0.5 rounded-md border border-border-light">
                            <Scale className="h-2.5 w-2.5 text-brand-primary" />
                            <span className="font-semibold text-ink">{p.weight || 0.5} kg</span>
                          </span>
                        </div>

                        <div className="mt-1">
                          {isDraft ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-soft text-text-secondary border border-border-light leading-none uppercase">
                              {isVi ? "Bản nháp" : "Draft"}
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 leading-none uppercase">
                              {isVi ? "Hết hàng" : "Out of Stock"}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none uppercase">
                              {isVi ? "Đang bán" : "Active"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions Panel */}
                      <div className="flex flex-col gap-1.5 items-end shrink-0 border-l border-border-light pl-3.5">
                        <Link
                          href={`/seller/products/${p.id}/edit`}
                          className="p-1.5 text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-soft rounded-full"
                          title={isVi ? "Chỉnh sửa sản phẩm" : "Edit product"}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleToggleStatus(p.id)}
                          disabled={isPending}
                          className="p-1.5 text-text-secondary hover:text-ink transition-colors hover:bg-surface-soft rounded-full cursor-pointer"
                          title={
                            isDraft
                              ? isVi
                                ? "Đăng bán lại"
                                : "Activate Listing"
                              : isVi
                              ? "Tạm ẩn (Chuyển sang Bản nháp)"
                              : "Deactivate to Draft"
                          }
                        >
                          {isDraft ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={isPending}
                          className="p-1.5 text-text-secondary hover:text-red-500 transition-colors hover:bg-surface-soft rounded-full cursor-pointer"
                          title={isVi ? "Xóa sản phẩm" : "Delete product"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Spinner Overlay */}
                      {isActioning && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-[24px]">
                          <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-12 text-center flex flex-col items-center gap-3 bg-white border-2 border-dashed border-border-light rounded-[32px]">
                  <div className="h-12 w-12 rounded-full bg-surface-soft flex items-center justify-center text-text-secondary">
                    <Package className="h-6 w-6 opacity-60" />
                  </div>
                  <h3 className="text-base font-bold text-ink">
                    {isVi ? "Chưa có sản phẩm nào" : "No product listings found"}
                  </h3>
                  <p className="text-xs text-text-secondary max-w-sm">
                    {isVi
                      ? "Hãy đăng sản phẩm hoặc mặt hàng thủ công Việt Nam để bắt đầu bán cho khách hàng tại Mỹ và toàn cầu."
                      : "Add an authentic Vietnamese product or craft listing to start offering your goods to U.S. and global buyers."}
                  </p>
                  <Link href="/seller/products/new" className="btn-primary mt-2 text-xs">
                    {isVi ? "Đăng sản phẩm mới" : "Create a Listing"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === "orders" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-light pb-4">
              <div>
                <h2 className="text-xl font-bold text-ink tracking-tight">
                  {isVi ? "Đơn hàng Quốc tế & Thanh toán từ Saigon Hub" : "Global Orders & Saigon Hub Payouts"}
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {isVi
                    ? "Đơn hàng từ khách Mỹ & quốc tế được kiểm định tại Saigon Hub và chuyển khoản VND qua VietQR."
                    : "Orders from U.S. & global buyers inspected at Saigon Hub and settled to your Vietnamese bank via VietQR."}
                </p>
              </div>
              {user.bankAccountNumber ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <Landmark className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold leading-tight">{user.bankName || "VN Bank"} • {user.bankAccountNumber}</div>
                    <div className="text-[10px] text-emerald-700 leading-tight">{user.bankAccountName || user.name.toUpperCase()}</div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab("profile")}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    {isVi
                      ? "Cập nhật Tài khoản Ngân hàng / VietQR trong Hồ sơ để nhận tiền →"
                      : "Add VN Bank / VietQR in Profile for Hub Payouts →"}
                  </span>
                </button>
              )}
            </div>

            {/* Seller Payout Metrics Summary */}
            {orders.length > 0 && (() => {
              const totalEarnedVND = orders.reduce(
                (sum, o) => sum + o.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
                0
              );
              const paidOutVND = orders
                .filter((o) => o.payoutStatus === "paid_by_hub")
                .reduce(
                  (sum, o) => sum + o.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
                  0
                );
              const pendingPayoutVND = totalEarnedVND - paidOutVND;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
                  <div className="card-product rounded-[24px] p-5 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {isVi ? "Tổng doanh thu tiền hàng" : "Total Seller Revenue"}
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                      {totalEarnedVND.toLocaleString()} VND
                    </span>
                  </div>
                  <div className="card-product rounded-[24px] p-5 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {isVi ? "Chờ Saigon Hub thanh toán" : "Pending Saigon Hub Payout"}
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-amber-600 tracking-tight">
                      {pendingPayoutVND.toLocaleString()} VND
                    </span>
                  </div>
                  <div className="card-product rounded-[24px] p-5 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {isVi ? "Đã nhận qua VietQR / Hub" : "Settled via VietQR / Hub"}
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 tracking-tight">
                      {paidOutVND.toLocaleString()} VND
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {orders.length > 0 ? (
                orders.map((o) => {
                  const sellerOrderTotalVND = o.items.reduce(
                    (sum: number, item: any) => sum + item.price * item.quantity,
                    0
                  );
                  const totalParcelWeightKg = o.items.reduce(
                    (sum: number, item: any) => sum + (item.weight || 0.5) * item.quantity,
                    0
                  );
                  const isPaidByHub = o.payoutStatus === "paid_by_hub";
                  const isCheckedInAtHub = ["Picked Up", "In Packaging", "Shipped", "Delivered"].includes(o.status);

                  return (
                    <div
                      key={o.id}
                      className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-4 bg-white border border-border-light shadow-sm"
                    >
                      <div className="flex justify-between items-start border-b border-border-light pb-3">
                        <div>
                          <span className="text-[10px] font-mono text-text-secondary font-semibold">
                            {isVi ? "MÃ ĐƠN:" : "ORDER ID:"} {o.id.substring(0, 8).toUpperCase()}...
                          </span>
                          <h3 className="text-xs text-text-secondary mt-0.5">
                            {isVi ? "Khách mua:" : "Buyer:"} <span className="font-bold text-ink">{o.buyerName}</span>
                          </h3>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-surface-soft text-ink border border-border-light uppercase tracking-wide">
                            {translateOrderStatus(o.status)}
                          </span>
                          <span className="text-[10px] text-text-secondary flex items-center gap-1">
                            <Scale className="h-3 w-3 text-brand-primary" />
                            {isVi ? "Khối lượng:" : "Parcel:"} <strong className="text-ink">{totalParcelWeightKg.toFixed(2)} kg</strong>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          {isVi ? "Sản phẩm đã đặt" : "Ordered Items"}
                        </h4>
                        {o.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-ink font-semibold">
                              {translateProductName(item.name, lang)}{" "}
                              <span className="text-text-secondary font-bold">x{item.quantity}</span>
                              <span className="text-[10px] text-text-secondary ml-1.5">
                                ({((item.weight || 0.5) * item.quantity).toFixed(2)} kg)
                              </span>
                            </span>
                            <span className="font-bold text-ink">
                              {(item.price * item.quantity).toLocaleString()} VND
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Saigon Hub Payout Status Banner */}
                      <div
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                          isPaidByHub
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                            : isCheckedInAtHub
                            ? "bg-sky-50/70 border-sky-200 text-sky-900"
                            : "bg-amber-50/60 border-amber-200 text-amber-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isPaidByHub ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold">
                              {isPaidByHub
                                ? isVi
                                  ? `Saigon Hub đã thanh toán (${o.payoutMethod || "VietQR"})`
                                  : `Paid by Saigon Hub (${o.payoutMethod || "VietQR"})`
                                : isCheckedInAtHub
                                ? isVi
                                  ? "Đã nhận tại Hub • Sẵn sàng chuyển khoản VietQR"
                                  : "Verified at Hub • Ready for VietQR Payout"
                                : isVi
                                ? "Đang chờ lấy hàng / Bàn giao về Saigon Hub"
                                : "Awaiting Parcel Pickup / Hub Check-In"}
                            </div>
                            {isPaidByHub && o.payoutRef && (
                              <div className="text-[10px] opacity-80 font-mono">
                                {isVi ? "Mã GD:" : "Ref:"} {o.payoutRef}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-extrabold text-sm shrink-0">
                          {sellerOrderTotalVND.toLocaleString()} VND
                        </span>
                      </div>

                      <div className="border-t border-border-light pt-3 flex flex-col gap-1.5 text-xs text-text-secondary bg-surface-soft/60 p-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                          <span className="truncate">{o.buyerAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                          <span>{o.buyerPhone}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-12 text-center flex flex-col items-center gap-3 bg-white border-2 border-dashed border-border-light rounded-[32px]">
                  <div className="h-12 w-12 rounded-full bg-surface-soft flex items-center justify-center text-text-secondary">
                    <ClipboardList className="h-6 w-6 opacity-60" />
                  </div>
                  <h3 className="text-base font-bold text-ink">
                    {isVi ? "Chưa có đơn đặt hàng nào" : "No customer orders yet"}
                  </h3>
                  <p className="text-xs text-text-secondary max-w-sm">
                    {isVi
                      ? "Các đơn hàng từ khách quốc tế sẽ hiển thị tại đây ngay khi khách thanh toán."
                      : "Orders for your product listings will appear here once purchased by global buyers."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
            <UserProfileCard
              currentUser={user}
              onUserUpdate={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
              roleLabel={isVi ? "Nhà bán hàng Việt Nam" : "Vietnamese Seller"}
              addressLabel={isVi ? "Địa chỉ Cửa hàng / Xưởng lấy hàng (Việt Nam)" : "Store / Workshop Location (Vietnam)"}
              addressPlaceholder="VD: 123 Lê Lợi, Quận 1, TP. Hồ Chí Minh"
              logoLabel={isVi ? "Logo Cửa hàng" : "Store / Brand Logo"}
              lang={lang}
            />

            {/* Shipping Hub & VietQR Payout Info Card */}
            <div className="card-product rounded-[28px] p-6 sm:p-8 bg-surface-soft/60 border border-border-light flex flex-col gap-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-brand-primary" />
                {isVi ? "Cam kết Vận chuyển & Thanh toán VietQR tại Saigon Hub" : "Saigon Hub & VietQR Payout Guarantee"}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {isVi ? (
                  <>
                    Là đối tác bán hàng tại Việt Nam, bạn niêm yết giá bằng <strong>VND</strong> và nhập <strong>khối lượng (kg)</strong> cho từng sản phẩm. Khi khách tại Mỹ và quốc tế đặt mua, Kialna sẽ điều phối lấy hàng về <strong>Saigon Hub</strong> và chuyển khoản tiền hàng trực tiếp bằng VND cho bạn.
                  </>
                ) : (
                  <>
                    As a verified Vietnamese seller, you list your prices in <strong>VND</strong> and enter each product&apos;s <strong>weight (kg)</strong>. When customers in the U.S. and worldwide order, Kialna coordinates local pickup to the <strong>Saigon Hub</strong> and settles your payout directly in VND.
                  </>
                )}
              </p>
              <div className="bg-white p-4 rounded-2xl border border-border-light flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    {isVi ? "Phí đóng gói xuất khẩu:" : "Export Custom Packaging:"}
                  </span>
                  <span className="font-semibold text-ink">
                    {isVi ? "30,000 VND / sp (Khách mua trả)" : "30,000 VND / unit (Covered by Buyer)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    {isVi ? "Cước bay quốc tế:" : "Global Air Express Rate:"}
                  </span>
                  <span className="font-semibold text-ink">
                    {isVi ? "120,000 VND / kg (Tính theo khối lượng)" : "120,000 VND / kg (Calculated by Weight)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    {isVi ? "Phương thức thanh toán:" : "Merchant Payout Method:"}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {isVi ? "Chuyển khoản nhanh VietQR Napas 247 / COD" : "Instant VietQR Napas 247 / COD at Hub"}
                  </span>
                </div>
                <div className="border-t border-border-light pt-2 mt-1 text-[11px] text-brand-primary font-semibold">
                  {isVi
                    ? "Người bán nhận đủ 100% giá gốc (VND) ngay khi Saigon Hub kiểm nhận hàng."
                    : "Sellers receive 100% of their listed VND base price upon Saigon Hub check-in."}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Mobile Bottom Navigation Bar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-border-light grid grid-cols-3 py-3 z-40 px-2">
        <button
          onClick={() => setActiveTab("listings")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === "listings" ? "text-brand-primary font-bold" : "text-text-secondary hover:text-ink"
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] font-medium">{isVi ? "Sản phẩm" : "Listings"}</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === "orders" ? "text-brand-primary font-bold" : "text-text-secondary hover:text-ink"
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-[10px] font-medium">{isVi ? "Đơn hàng" : "Orders"}</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === "profile" ? "text-brand-primary font-bold" : "text-text-secondary hover:text-ink"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">{isVi ? "Hồ sơ" : "Profile"}</span>
        </button>
      </nav>

      {/* Inject testing RoleSwitcher widget at the bottom right */}
      <RoleSwitcher currentUser={user} lang={lang} />
    </div>
  );
}
