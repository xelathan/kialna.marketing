"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, updateFeeAmount } from "@/app/actions/admin";
import RoleSwitcher from "./RoleSwitcher";
import KialnaLogo from "./KialnaLogo";
import {
  Shield,
  Truck,
  PackageCheck,
  Package,
  Search,
  Settings,
  User,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  Layers,
  Check,
  LogOut,
} from "lucide-react";

interface AdminDashboardProps {
  initialOrders: any[];
  initialFees: {
    shipping: number;
    packaging: number;
  };
  currentUser: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
}

const PIPELINE_STAGES = [
  "Ready for Pickup",
  "Driver Assigned",
  "Picked Up",
  "In Packaging",
  "Shipped",
  "Delivered",
] as const;

export default function AdminDashboard({ initialOrders, initialFees, currentUser }: AdminDashboardProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [fees, setFees] = useState(initialFees);
  const [filterStage, setFilterStage] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected Order Manifest Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Fee Config Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [shippingFeeInput, setShippingFeeInput] = useState(String(initialFees.shipping));
  const [packagingFeeInput, setPackagingFeeInput] = useState(String(initialFees.packaging));
  const [feeSubmitError, setFeeSubmitError] = useState("");

  const [isPending, startTransition] = useTransition();
  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);

  const EXCHANGE_RATE = 25000; // 25,000 VND = 1 USD

  // Compute Metrics Overview
  const totalOrdersCount = orders.length;
  const readyCount = orders.filter((o) => o.status === "Ready for Pickup").length;
  const hubPackagingCount = orders.filter((o) => o.status === "Picked Up" || o.status === "In Packaging").length;
  const shippedCount = orders.filter((o) => o.status === "Shipped").length;

  // Total Platform Logistics Revenue collected across all orders (Shipping + Packaging fees)
  const totalLogisticsRevenueVND = orders.reduce((sum, o) => {
    const orderLogisticsFee = o.items.reduce(
      (itemSum: number, item: any) =>
        itemSum + (item.shippingFeeAtPurchase + item.packagingFeeAtPurchase) * item.quantity,
      0
    );
    return sum + orderLogisticsFee;
  }, 0);
  const totalLogisticsRevenueUSD = totalLogisticsRevenueVND / EXCHANGE_RATE;

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStage = filterStage === "All" || o.status === filterStage;
    const queryLower = searchQuery.toLowerCase();

    const matchesId = o.id.toLowerCase().includes(queryLower);
    const matchesBuyer = o.buyer.name.toLowerCase().includes(queryLower);
    const matchesSeller = o.items.some((item: any) =>
      item.product.seller.name.toLowerCase().includes(queryLower)
    );
    const matchesProduct = o.items.some((item: any) =>
      item.product.name.toLowerCase().includes(queryLower)
    );

    return matchesStage && (matchesId || matchesBuyer || matchesSeller || matchesProduct);
  });

  // Handler to advance order status
  const handleAdvanceStatus = (orderId: string, currentStatus: string) => {
    const currentIndex = PIPELINE_STAGES.indexOf(currentStatus as any);
    if (currentIndex === -1 || currentIndex >= PIPELINE_STAGES.length - 1) return;

    const nextStatus = PIPELINE_STAGES[currentIndex + 1];
    handleSetStatus(orderId, nextStatus);
  };

  const handleSetStatus = (orderId: string, nextStatus: string) => {
    setActioningOrderId(orderId);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (result.success && result.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: result.order.status } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => (prev ? { ...prev, status: result.order.status } : null));
        }
      } else {
        alert(result.error || "Failed to update status");
      }
      setActioningOrderId(null);
    });
  };

  // Handler to update fee config
  const handleSaveFees = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedShipping = parseFloat(shippingFeeInput);
    const parsedPackaging = parseFloat(packagingFeeInput);

    if (isNaN(parsedShipping) || parsedShipping < 0) {
      setFeeSubmitError("Please enter a valid shipping fee.");
      return;
    }

    if (isNaN(parsedPackaging) || parsedPackaging < 0) {
      setFeeSubmitError("Please enter a valid packaging fee.");
      return;
    }

    setFeeSubmitError("");
    startTransition(async () => {
      const r1 = await updateFeeAmount("shipping", parsedShipping);
      const r2 = await updateFeeAmount("packaging", parsedPackaging);

      if (r1.success && r2.success) {
        setFees({ shipping: parsedShipping, packaging: parsedPackaging });
        setIsFeeModalOpen(false);
        router.refresh();
      } else {
        setFeeSubmitError(r1.error || r2.error || "Failed to update platform fees.");
      }
    });
  };

  // Helper for status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Ready for Pickup":
        return "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200 dark:border-amber-900";
      case "Driver Assigned":
        return "bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-200 dark:border-blue-900";
      case "Picked Up":
        return "bg-purple-50 dark:bg-purple-950/20 text-purple-600 border-purple-200 dark:border-purple-900";
      case "In Packaging":
        return "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border-indigo-200 dark:border-indigo-900";
      case "Shipped":
        return "bg-teal-50 dark:bg-teal-950/20 text-brand-accent border-teal-200 dark:border-teal-900";
      case "Delivered":
        return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  // Action button title helper
  const getNextActionText = (status: string) => {
    switch (status) {
      case "Ready for Pickup":
        return "Assign Courier Driver";
      case "Driver Assigned":
        return "Mark Picked Up";
      case "Picked Up":
        return "Receive at Hub (Packaging)";
      case "In Packaging":
        return "Dispatch Global Shipment";
      case "Shipped":
        return "Mark Delivered";
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans pb-12 text-text-primary">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-border-light px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KialnaLogo size={36} />
            <div>
              <h1 className="text-base font-bold text-ink tracking-tight leading-tight">Kialna Admin Hub</h1>
              <p className="text-[10px] text-text-secondary font-medium tracking-wide leading-none">District 1 Logistics & Global Export Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFeeModalOpen(true)}
              className="btn-secondary rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Configure Platform Fees"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Fee Settings</span>
            </button>

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
              className="p-2 text-text-secondary hover:text-ink hover:bg-surface-soft rounded-full transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
        {/* Logistics Overview Metrics Grid (Meta Metric Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6">
          <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              Total Orders
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{totalOrdersCount}</span>
          </div>

          <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              Action Needed
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">{readyCount}</span>
          </div>

          <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              In Hub Packaging
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">{hubPackagingCount}</span>
          </div>

          <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              Shipped / Transit
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">{shippedCount}</span>
          </div>
        </div>

        {/* Logistics Revenue Meta Dark Promo Strip */}
        <div className="card-promo-strip p-6 sm:p-8 rounded-[32px] text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">
              Platform Logistics Fees Collected
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">${totalLogisticsRevenueUSD.toFixed(2)} USD</span>
              <span className="text-xs sm:text-sm text-white/60">({totalLogisticsRevenueVND.toLocaleString()} VND)</span>
            </div>
          </div>
          <Truck className="h-16 w-16 text-white/10 absolute right-6 bottom-4 pointer-events-none" />
        </div>

        {/* Search and Pipeline Filter Bar (Meta Pill Controls) */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 md:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Buyer, or Artisan..."
              className="search-pill w-full pl-11 text-xs focus:bg-white transition-all outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          </div>

          {/* Pipeline Stage Meta Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:flex-wrap">
            {["All", ...PIPELINE_STAGES].map((stage) => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-[13px] whitespace-nowrap transition-all cursor-pointer border ${
                  filterStage === stage
                    ? "bg-[#0a1317] text-white border-[#0a1317] font-bold shadow-sm"
                    : "bg-white text-text-primary border-border-hairline hover:bg-surface-soft font-semibold"
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((o) => {
              const isActioning = actioningOrderId === o.id && isPending;
              const nextActionText = getNextActionText(o.status);

              return (
                <div
                  key={o.id}
                  className="card-product rounded-[24px] p-5 flex flex-col gap-4 bg-white border border-border-light shadow-sm hover:border-border-hairline transition-all duration-300 hover:shadow-md relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start border-b border-border-light pb-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono text-text-secondary font-semibold">
                        ORDER: {o.id.substring(0, 8).toUpperCase()}...
                      </span>
                      <span className="text-xs font-bold text-ink">
                        Buyer: {o.buyer.name}
                      </span>
                    </div>

                    <span
                      className="text-[10px] font-bold px-3 py-1 rounded-full bg-surface-soft text-ink border border-border-light uppercase tracking-wide leading-none"
                    >
                      {o.status}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1.5 text-xs">
                    {o.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-text-secondary">
                        <span className="truncate pr-2">
                          <span className="font-bold text-ink">x{item.quantity}</span> {item.product.name}
                        </span>
                        <span className="text-[10px] font-medium shrink-0">
                          Artisan: {item.product.seller.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Locations summary */}
                  <div className="bg-surface-soft p-3 rounded-2xl border border-border-light text-[11px] text-text-secondary flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="truncate">
                        <strong className="text-ink">Pickup:</strong> {o.items[0]?.product.seller.address || "District 1 Hub"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Truck className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
                      <span className="truncate">
                        <strong className="text-ink">Delivery:</strong> {o.buyer.address}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="pt-2 border-t border-border-light flex gap-2 items-center justify-between">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="btn-secondary rounded-full px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                      Manifest
                    </button>

                    {nextActionText ? (
                      <button
                        onClick={() => handleAdvanceStatus(o.id, o.status)}
                        disabled={isPending}
                        className="btn-primary text-xs py-2 px-4 rounded-full font-bold flex items-center gap-1.5 min-h-[38px] shadow-md shadow-brand-primary/20 cursor-pointer"
                      >
                        <span>{nextActionText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Delivered & Completed
                      </span>
                    )}
                  </div>

                  {/* Loading overlay spinner */}
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
              <h3 className="text-base font-bold text-ink">No orders match filter</h3>
              <p className="text-xs text-text-secondary max-w-sm">
                Try selecting a different pipeline tab or clearing your search keywords.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 3. Detailed Logistics Manifest Modal (Meta Rounded-32 Card) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md md:max-w-2xl rounded-t-[32px] md:rounded-[32px] max-h-[85vh] md:max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative shadow-2xl border border-border-light">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-light flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider font-semibold">Logistics Manifest</span>
                <h2 className="text-base font-bold text-ink">
                  Order {selectedOrder.id.substring(0, 8).toUpperCase()}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-text-secondary hover:text-ink hover:bg-surface-soft rounded-full cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-5">
              {/* Visual Supply Chain Timeline */}
              <div className="bg-surface-soft p-4 sm:p-5 rounded-2xl border border-border-light flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Supply Chain Pipeline Progress
                </span>
                <div className="flex items-center justify-between relative mt-1">
                  {PIPELINE_STAGES.map((st, idx) => {
                    const currentIdx = PIPELINE_STAGES.indexOf(selectedOrder.status as any);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={st} className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isCurrent
                              ? "bg-brand-primary text-white shadow-md ring-2 ring-brand-primary/20"
                              : isDone
                              ? "bg-ink text-white"
                              : "bg-white text-text-secondary border border-border-light"
                          }`}
                        >
                          {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </div>
                        <span className="text-[8px] font-semibold text-text-secondary max-w-[45px] text-center leading-none">
                          {st.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status override selection dropdown */}
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <span className="text-xs font-bold text-ink">Manual Status Override</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleSetStatus(selectedOrder.id, e.target.value)}
                  className="input-primary py-1.5 px-3 text-xs min-h-[38px] rounded-xl cursor-pointer"
                  disabled={isPending}
                >
                  {PIPELINE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer & Seller Contact Profiles */}
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                {/* Craftsman Info */}
                <div className="p-3.5 bg-surface-soft rounded-2xl border border-border-light flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
                    <User className="h-3 w-3" /> Artisan / Seller
                  </span>
                  <div className="font-bold text-ink">
                    {selectedOrder.items[0]?.product.seller.name}
                  </div>
                  <div className="text-[10px] text-text-secondary leading-tight">
                    {selectedOrder.items[0]?.product.seller.address}
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    📞 {selectedOrder.items[0]?.product.seller.phone}
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="p-3.5 bg-surface-soft rounded-2xl border border-border-light flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-brand-primary uppercase flex items-center gap-1">
                    <Truck className="h-3 w-3" /> International Buyer
                  </span>
                  <div className="font-bold text-ink">{selectedOrder.buyer.name}</div>
                  <div className="text-[10px] text-text-secondary leading-tight">
                    {selectedOrder.buyer.address}
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    📞 {selectedOrder.buyer.phone}
                  </div>
                </div>
              </div>

              {/* Items Manifest */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Itemized Manifest & Hub Fees
                </span>
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-border-light flex flex-col gap-1 bg-white text-xs">
                    <div className="flex justify-between font-bold text-ink">
                      <span>{item.product.name} (x{item.quantity})</span>
                      <span className="text-brand-primary">${((item.sellerPriceAtPurchase * item.quantity) / EXCHANGE_RATE).toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-text-secondary">
                      <span>Craftsman Price: {(item.sellerPriceAtPurchase * item.quantity).toLocaleString()} VND</span>
                      <span>Fees: {((item.shippingFeeAtPurchase + item.packagingFeeAtPurchase) * item.quantity).toLocaleString()} VND</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Ledger Summary */}
              <div className="p-4 bg-surface-soft rounded-2xl border border-border-light text-xs space-y-1.5">
                <div className="flex justify-between text-text-secondary">
                  <span>Buyer Total Billed:</span>
                  <span className="font-bold text-brand-primary">${selectedOrder.totalPaid.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Craftsman Payout:</span>
                  <span className="font-semibold text-ink">
                    {(
                      selectedOrder.items.reduce(
                        (sum: number, i: any) => sum + i.sellerPriceAtPurchase * i.quantity,
                        0
                      )
                    ).toLocaleString()} VND
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary border-t border-border-light pt-2">
                  <span>Logistics Fees Kept by Kialna:</span>
                  <span className="font-bold text-ink">
                    {(
                      selectedOrder.items.reduce(
                        (sum: number, i: any) =>
                          sum + (i.shippingFeeAtPurchase + i.packagingFeeAtPurchase) * i.quantity,
                        0
                      )
                    ).toLocaleString()} VND
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Platform Fee Configuration Modal (Meta Rounded-32 Card) */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm md:max-w-md rounded-[32px] p-6 sm:p-8 flex flex-col gap-5 shadow-2xl border border-border-light">
            <div className="flex justify-between items-center border-b border-border-light pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-full bg-brand-primary/10 text-brand-primary">
                  <Settings className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-ink">Platform Fee Rates</h3>
              </div>
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="p-1.5 text-text-secondary hover:text-ink hover:bg-surface-soft rounded-full cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFees} className="flex flex-col gap-4">
              {feeSubmitError && (
                <div className="p-3.5 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-xs font-semibold">
                  {feeSubmitError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink">
                  International Shipping Fee (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={shippingFeeInput}
                    onChange={(e) => setShippingFeeInput(e.target.value)}
                    className="input-primary w-full pr-24 text-xs min-h-[46px] rounded-xl"
                    disabled={isPending}
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary pointer-events-none">
                    ${(parseFloat(shippingFeeInput || "0") / EXCHANGE_RATE).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink">
                  Hub Custom Packaging Fee (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={packagingFeeInput}
                    onChange={(e) => setPackagingFeeInput(e.target.value)}
                    className="input-primary w-full pr-24 text-xs min-h-[46px] rounded-xl"
                    disabled={isPending}
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary pointer-events-none">
                    ${(parseFloat(packagingFeeInput || "0") / EXCHANGE_RATE).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full mt-2 text-xs font-bold min-h-[50px] rounded-full shadow-lg shadow-brand-primary/20 cursor-pointer"
                disabled={isPending}
              >
                {isPending ? "Updating Fee Rates..." : "Save Platform Fee Rates"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Role Switcher Widget */}
      <RoleSwitcher currentUser={currentUser} />
    </div>
  );
}
