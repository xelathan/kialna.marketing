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
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 font-sans max-w-md mx-auto relative border-x border-border-light shadow-xl">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-primary p-1.5 rounded-lg text-white">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">Kialna Seller</h1>
            <p className="text-[10px] text-text-secondary leading-none">Craftsman Hub</p>
          </div>
        </div>

        <Link
          href="/seller/products/new"
          className="bg-brand-primary hover:opacity-90 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 min-h-[38px] transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {/* TAB 1: LISTINGS */}
        {activeTab === "listings" && (
          <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card-primary p-3 flex flex-col gap-1 bg-white dark:bg-zinc-900">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Listings
                </span>
                <span className="text-xl font-bold text-text-primary">{totalListings}</span>
              </div>
              <div className="card-primary p-3 flex flex-col gap-1 bg-white dark:bg-zinc-900 border-l-4 border-l-brand-accent">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Active
                </span>
                <span className="text-xl font-bold text-brand-primary">{activeListings}</span>
              </div>
              <div className="card-primary p-3 flex flex-col gap-1 bg-white dark:bg-zinc-900 border-l-4 border-l-red-500">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Low Stock
                </span>
                <span className="text-xl font-bold text-red-500">{lowStockCount}</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your listings..."
                className="input-primary w-full pl-11 text-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>

            {/* Filter Tabs Segmented Control */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg text-xs font-semibold">
              {(["all", "active", "draft", "out_of_stock"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`flex-1 py-1.5 rounded-md capitalize transition-all cursor-pointer ${
                    filterStatus === tab
                      ? "bg-white dark:bg-zinc-800 text-text-primary shadow-sm font-bold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab === "out_of_stock" ? "Out of Stock" : tab}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="flex flex-col gap-3">
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
                      className="card-primary p-3 flex gap-3 items-center hover:shadow-md transition-shadow relative bg-white dark:bg-zinc-900"
                    >
                      {/* Product Thumbnail */}
                      <div className="h-16 w-16 rounded-lg overflow-hidden border border-border-light shrink-0 bg-zinc-100 relative">
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
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h3 className="text-sm font-semibold text-text-primary truncate pr-1">
                            {p.name}
                          </h3>
                          {/* Status Badge */}
                          {isDraft ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-text-secondary border border-border-light leading-none">
                              Draft
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 leading-none">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/20 text-brand-accent border border-teal-200 dark:border-teal-900 leading-none">
                              Active
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                          {p.category}
                        </span>

                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-sm font-bold text-brand-primary">
                            {p.basePrice.toLocaleString()} VND
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            Qty: <span className="font-semibold text-text-primary">{p.inventory}</span>
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions Panel */}
                      <div className="flex flex-col gap-1 items-end shrink-0 border-l border-border-light pl-3.5">
                        <Link
                          href={`/seller/products/${p.id}/edit`}
                          className="p-1.5 text-text-secondary hover:text-brand-primary transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleToggleStatus(p.id)}
                          disabled={isPending}
                          className="p-1.5 text-text-secondary hover:text-brand-accent transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title={isDraft ? "Activate Listing" : "Deactivate to Draft"}
                        >
                          {isDraft ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={isPending}
                          className="p-1.5 text-text-secondary hover:text-red-500 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Spinner Overlay */}
                      {isActioning && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                          <RefreshCw className="h-6 w-6 animate-spin text-brand-primary" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="card-primary p-8 text-center flex flex-col items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-dashed border-border-light">
                  <Package className="h-10 w-10 text-text-secondary opacity-50" />
                  <h3 className="text-sm font-semibold text-text-primary">No products found</h3>
                  <p className="text-xs text-text-secondary">
                    Add a product listing to start selling craft items.
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
          <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-light pb-2">
              Orders Involving Your Products
            </h2>

            <div className="flex flex-col gap-3">
              {orders.length > 0 ? (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="card-primary p-4 flex flex-col gap-3 bg-white dark:bg-zinc-900"
                  >
                    <div className="flex justify-between items-start border-b border-border-light pb-2">
                      <div>
                        <span className="text-[10px] font-mono text-text-secondary">
                          ORDER ID: {o.id.substring(0, 8)}...
                        </span>
                        <h3 className="text-xs text-text-secondary mt-0.5">
                          Buyer: <span className="font-semibold text-text-primary">{o.buyerName}</span>
                        </h3>
                      </div>
                      
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-brand-primary border border-blue-200 dark:border-blue-900 uppercase">
                        {o.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-text-secondary uppercase">
                        Ordered Items
                      </h4>
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-text-primary">
                            {item.name} <span className="text-text-secondary font-semibold">x{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-text-primary">
                            {(item.price * item.quantity).toLocaleString()} VND
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border-light pt-2 flex flex-col gap-1.5 text-xs text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                        <span className="truncate">{o.buyerAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                        <span>{o.buyerPhone}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card-primary p-8 text-center flex flex-col items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-dashed border-border-light">
                  <ClipboardList className="h-10 w-10 text-text-secondary opacity-50" />
                  <h3 className="text-sm font-semibold text-text-primary">No orders yet</h3>
                  <p className="text-xs text-text-secondary">
                    Your listings will show orders here when purchased by buyers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === "profile" && (
          <div className="p-4 flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Craftsman Profile Card */}
            <div className="card-primary p-5 bg-white dark:bg-zinc-900 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-amber-100 dark:bg-amber-950/20 text-amber-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">{currentUser.name}</h2>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-900 uppercase">
                    Seller Account
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-border-light text-xs text-text-secondary">
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5 text-text-secondary" />
                  <div>
                    <div className="font-bold text-text-primary text-[10px] uppercase">Email</div>
                    <div>{currentUser.email}</div>
                  </div>
                </div>
                {currentUser.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 mt-0.5 text-text-secondary" />
                    <div>
                      <div className="font-bold text-text-primary text-[10px] uppercase">Phone</div>
                      <div>{currentUser.phone}</div>
                    </div>
                  </div>
                )}
                {currentUser.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-text-secondary" />
                    <div>
                      <div className="font-bold text-text-primary text-[10px] uppercase">Craft Shop Location</div>
                      <div>{currentUser.address}</div>
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
                className="w-full mt-2 py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Shipping Hub Info Card */}
            <div className="card-primary p-4 bg-zinc-50 dark:bg-zinc-900 border border-border-light flex flex-col gap-2">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-brand-primary" />
                Shipping Hub Logistics
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                As a seller, you list your craft items in **VND**. When orders occur, you hand over items to
                the **Kialna District 1 Shipping Hub** (handled in Phase 4). 
                Buyers cover the fixed packaging fee (30,000 VND) and shipping fee (120,000 VND).
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-border-light grid grid-cols-3 py-2 z-40 px-2 shadow-inner">
        <button
          onClick={() => setActiveTab("listings")}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-all ${
            activeTab === "listings" ? "text-brand-primary font-boldScale" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px]">Listings</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-all ${
            activeTab === "orders" ? "text-brand-primary font-boldScale" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-[10px]">Orders</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-all ${
            activeTab === "profile" ? "text-brand-primary font-boldScale" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* Inject testing RoleSwitcher widget at the bottom right */}
      <RoleSwitcher currentUser={currentUser} />
    </div>
  );
}
