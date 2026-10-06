"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteProduct, toggleProductStatus } from "@/app/actions/products";
import RoleSwitcher from "./RoleSwitcher";
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
  };
}

export default function SellerDashboard({ initialProducts, initialOrders, currentUser }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "orders" | "profile">("listings");
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft" | "out_of_stock">("all");
  const [isPending, startTransition] = useTransition();
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Quick stats
  const totalListings = products.length;
  const activeListings = products.filter((p) => p.status === "active" && p.inventory > 0).length;
  const lowStockCount = products.filter((p) => p.inventory === 0).length;

  // Filter products based on search and status tab
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
        alert("Failed to update status");
      }
      setActioningId(null);
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

    setActioningId(id);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(result.error || "Failed to delete product");
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
            <div className="bg-ink p-2 rounded-full text-white shadow-sm flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-ink tracking-tight leading-tight">Kialna Seller</h1>
              <p className="text-[10px] text-text-secondary font-medium tracking-wide leading-none">Artisan Creator Studio</p>
            </div>
          </div>

          {/* Desktop Navigation Switcher (Meta Pill Group) */}
          <div className="hidden md:flex items-center gap-1 bg-surface-soft p-1 rounded-full border border-border-light">
            <button
              onClick={() => setActiveTab("listings")}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "listings"
                  ? "bg-ink text-white shadow-sm"
                  : "text-text-secondary hover:text-ink hover:bg-white/60"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Listings ({totalListings})</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-ink text-white shadow-sm"
                  : "text-text-secondary hover:text-ink hover:bg-white/60"
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-ink text-white shadow-sm"
                  : "text-text-secondary hover:text-ink hover:bg-white/60"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Store Profile</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Sign Out Button */}
            <button
              onClick={async () => {
                const { signOut } = await import("@/app/actions/auth");
                await signOut();
                window.location.href = "/login";
              }}
              className="p-2 text-text-secondary hover:text-ink transition-colors hover:bg-surface-soft rounded-full cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            <Link
              href="/seller/products/new"
              className="btn-primary text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md shadow-brand-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Listing</span>
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
                  Total Listings
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{totalListings}</span>
              </div>
              <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Active
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">{activeListings}</span>
              </div>
              <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Low Stock
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
                  placeholder="Search your artisan listings..."
                  className="search-pill w-full pl-11 text-xs focus:bg-white transition-all outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>

              {/* Filter Tabs Meta Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {(["all", "active", "draft", "out_of_stock"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`cursor-pointer transition-all ${
                      filterStatus === tab
                        ? "btn-pill-tab-active"
                        : "btn-pill-tab"
                    }`}
                  >
                    {tab === "out_of_stock" ? "Out of Stock" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
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
                            {p.name}
                          </h3>
                        </div>

                        <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                          {p.category}
                        </span>

                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-sm font-bold text-brand-primary">
                            {p.basePrice.toLocaleString()} VND
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            Stock: <span className="font-semibold text-ink">{p.inventory}</span>
                          </span>
                        </div>

                        <div className="mt-1">
                          {isDraft ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-soft text-text-secondary border border-border-light leading-none uppercase">
                              Draft
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 leading-none uppercase">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none uppercase">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions Panel */}
                      <div className="flex flex-col gap-1.5 items-end shrink-0 border-l border-border-light pl-3.5">
                        <Link
                          href={`/seller/products/${p.id}/edit`}
                          className="p-1.5 text-text-secondary hover:text-brand-primary transition-colors hover:bg-surface-soft rounded-full"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleToggleStatus(p.id)}
                          disabled={isPending}
                          className="p-1.5 text-text-secondary hover:text-ink transition-colors hover:bg-surface-soft rounded-full cursor-pointer"
                          title={isDraft ? "Activate Listing" : "Deactivate to Draft"}
                        >
                          {isDraft ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={isPending}
                          className="p-1.5 text-text-secondary hover:text-red-500 transition-colors hover:bg-surface-soft rounded-full cursor-pointer"
                          title="Delete product"
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
                  <h3 className="text-base font-bold text-ink">No craft listings found</h3>
                  <p className="text-xs text-text-secondary max-w-sm">
                    Add an authentic craft product listing to start offering your handcrafted goods.
                  </p>
                  <Link href="/seller/products/new" className="btn-primary mt-2 text-xs">
                    Create a Listing
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === "orders" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="border-b border-border-light pb-4">
              <h2 className="text-xl font-bold text-ink tracking-tight">
                Craft Orders & Dispatches
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Orders containing your handcrafted items routed through the Saigon Logistics Hub.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {orders.length > 0 ? (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-4 bg-white border border-border-light shadow-sm"
                  >
                    <div className="flex justify-between items-start border-b border-border-light pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-text-secondary font-semibold">
                          ORDER ID: {o.id.substring(0, 8).toUpperCase()}...
                        </span>
                        <h3 className="text-xs text-text-secondary mt-0.5">
                          Buyer: <span className="font-bold text-ink">{o.buyerName}</span>
                        </h3>
                      </div>
                      
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-surface-soft text-ink border border-border-light uppercase tracking-wide">
                        {o.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        Ordered Items
                      </h4>
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-ink font-semibold">
                            {item.name} <span className="text-text-secondary font-bold">x{item.quantity}</span>
                          </span>
                          <span className="font-bold text-ink">
                            {(item.price * item.quantity).toLocaleString()} VND
                          </span>
                        </div>
                      ))}
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
                ))
              ) : (
                <div className="col-span-full p-12 text-center flex flex-col items-center gap-3 bg-white border-2 border-dashed border-border-light rounded-[32px]">
                  <div className="h-12 w-12 rounded-full bg-surface-soft flex items-center justify-center text-text-secondary">
                    <ClipboardList className="h-6 w-6 opacity-60" />
                  </div>
                  <h3 className="text-base font-bold text-ink">No customer orders yet</h3>
                  <p className="text-xs text-text-secondary max-w-sm">
                    Orders for your craft listings will appear here once purchased by buyers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
            {/* Craftsman Profile Card */}
            <div className="card-product rounded-[28px] p-6 sm:p-8 bg-white border border-border-light shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-surface-soft text-ink rounded-full flex items-center justify-center font-bold text-xl border border-border-light">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">{currentUser.name}</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-soft text-ink border border-border-light uppercase tracking-wide">
                    Artisan Seller
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 pt-4 border-t border-border-light text-xs text-text-secondary">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5 text-text-secondary" />
                  <div>
                    <div className="font-bold text-ink text-[10px] uppercase tracking-wider">Email Address</div>
                    <div className="text-text-primary">{currentUser.email}</div>
                  </div>
                </div>
                {currentUser.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 shrink-0 mt-0.5 text-text-secondary" />
                    <div>
                      <div className="font-bold text-ink text-[10px] uppercase tracking-wider">Contact Phone</div>
                      <div className="text-text-primary">{currentUser.phone}</div>
                    </div>
                  </div>
                )}
                {currentUser.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-text-secondary" />
                    <div>
                      <div className="font-bold text-ink text-[10px] uppercase tracking-wider">Craft Workshop Location</div>
                      <div className="text-text-primary">{currentUser.address}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                onClick={async () => {
                  const { signOut } = await import("@/app/actions/auth");
                  await signOut();
                  window.location.href = "/login";
                }}
                className="w-full mt-2 py-3 px-4 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Shipping Hub Info Card */}
            <div className="card-product rounded-[28px] p-6 sm:p-8 bg-surface-soft/60 border border-border-light flex flex-col gap-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-brand-primary" />
                Saigon District 1 Hub Logistics Guarantee
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                As a verified artisan creator, you list your craft prices in <strong>VND</strong>. When customers order internationally, Kialna coordinates pickup and transfers items to the <strong>District 1 Saigon Export Hub</strong>.
              </p>
              <div className="bg-white p-4 rounded-2xl border border-border-light flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Export Custom Packaging:</span>
                  <span className="font-semibold text-ink">30,000 VND (Covered by Buyer)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Global Air Express Freight:</span>
                  <span className="font-semibold text-ink">120,000 VND (Covered by Buyer)</span>
                </div>
                <div className="border-t border-border-light pt-2 mt-1 text-[11px] text-brand-primary font-semibold">
                  Artisans receive 100% of their listed base price upon fulfillment completion.
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
          <span className="text-[10px] font-medium">Listings</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === "orders" ? "text-brand-primary font-bold" : "text-text-secondary hover:text-ink"
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-[10px] font-medium">Orders</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === "profile" ? "text-brand-primary font-bold" : "text-text-secondary hover:text-ink"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>

      {/* Inject testing RoleSwitcher widget at the bottom right */}
      <RoleSwitcher currentUser={currentUser} />
    </div>
  );
}
