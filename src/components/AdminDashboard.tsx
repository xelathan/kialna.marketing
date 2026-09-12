"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, updateFeeAmount } from "@/app/actions/admin";
import RoleSwitcher from "./RoleSwitcher";
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
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 font-sans max-w-md mx-auto relative border-x border-border-light shadow-xl pb-24">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">Kialna Admin Hub</h1>
            <p className="text-[10px] text-text-secondary leading-none">District 1 Logistics & Global Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              const { signOut } = await import("@/app/actions/auth");
              await signOut();
              window.location.href = "/login";
            }}
            className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsFeeModalOpen(true)}
            className="p-2 text-text-secondary hover:text-brand-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
            title="Configure Platform Fees"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 2. Main Canvas */}
      <main className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto">
        {/* Logistics Overview Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-primary p-3.5 flex flex-col gap-1 bg-white dark:bg-zinc-900 border-l-4 border-l-brand-primary">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Total Orders
            </span>
            <span className="text-2xl font-bold text-text-primary">{totalOrdersCount}</span>
          </div>

          <div className="card-primary p-3.5 flex flex-col gap-1 bg-white dark:bg-zinc-900 border-l-4 border-l-amber-500">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Action Needed
            </span>
            <span className="text-2xl font-bold text-amber-600">{readyCount}</span>
          </div>

          <div className="card-primary p-3.5 flex flex-col gap-1 bg-white dark:bg-zinc-900 border-l-4 border-l-purple-500">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              In Hub Packaging
            </span>
            <span className="text-2xl font-bold text-purple-600">{hubPackagingCount}</span>
          </div>

          <div className="card-primary p-3.5 flex flex-col gap-1 bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Shipped / Transit
            </span>
            <span className="text-2xl font-bold text-emerald-600">{shippedCount}</span>
          </div>
        </div>

        {/* Logistics Revenue Banner */}
        <div className="card-primary p-4 bg-gradient-to-tr from-emerald-700 to-teal-900 text-white rounded-xl shadow-md flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Platform Logistics Fees Collected
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">${totalLogisticsRevenueUSD.toFixed(2)} USD</span>
              <span className="text-xs text-emerald-200">({totalLogisticsRevenueVND.toLocaleString()} VND)</span>
            </div>
          </div>
          <Truck className="h-12 w-12 text-white/15 absolute right-2 bottom-1" />
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, Buyer, or Craftsman..."
            className="input-primary w-full pl-11 text-xs"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
        </div>

        {/* Pipeline Stage Slider Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {["All", ...PIPELINE_STAGES].map((stage) => (
            <button
              key={stage}
              onClick={() => setFilterStage(stage)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                filterStage === stage
                  ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                  : "bg-white dark:bg-zinc-900 border-border-light text-text-secondary hover:text-text-primary"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Orders Pipeline List */}
        <div className="flex flex-col gap-3.5">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((o) => {
              const isActioning = actioningOrderId === o.id && isPending;
              const nextActionText = getNextActionText(o.status);

              return (
                <div
                  key={o.id}
                  className="card-primary p-4 flex flex-col gap-3 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start border-b border-border-light pb-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono text-text-secondary">
                        ORDER: {o.id.substring(0, 8).toUpperCase()}...
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        Buyer: {o.buyer.name}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase leading-none ${getStatusBadgeStyle(
                        o.status
                      )}`}
                    >
                      {o.status}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1 text-xs">
                    {o.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-text-secondary">
                        <span className="truncate pr-2">
                          <span className="font-bold text-text-primary">x{item.quantity}</span> {item.product.name}
                        </span>
                        <span className="text-[10px] font-mono shrink-0">
                          Seller: {item.product.seller.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Locations summary */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-border-light text-[10px] text-text-secondary flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
                      <span className="truncate">
                        <strong>Pickup:</strong> {o.items[0]?.product.seller.address || "District 1 Hub"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Truck className="h-3 w-3 shrink-0 text-brand-primary" />
                      <span className="truncate">
                        <strong>Delivery:</strong> {o.buyer.address}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="pt-2 border-t border-border-light flex gap-2 items-center justify-between">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-3 py-1.5 rounded-lg border border-border-light text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      View Manifest
                    </button>

                    {nextActionText ? (
                      <button
                        onClick={() => handleAdvanceStatus(o.id, o.status)}
                        disabled={isPending}
                        className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 font-bold flex items-center gap-1 min-h-[34px]"
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
                    <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-[1px] flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="card-primary p-8 text-center flex flex-col items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-dashed border-border-light">
              <Package className="h-10 w-10 text-text-secondary opacity-50" />
              <h3 className="text-sm font-semibold text-text-primary">No orders match filters</h3>
              <p className="text-xs text-text-secondary">
                Try selecting a different pipeline tab or clearing your search.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 3. Detailed Logistics Manifest Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl max-h-[85vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300 relative">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border-light flex items-center justify-between shrink-0">
              <div>
                <span className="text-[9px] font-mono text-text-secondary uppercase">Logistics Manifest</span>
                <h2 className="text-base font-bold text-text-primary">
                  Order {selectedOrder.id.substring(0, 8).toUpperCase()}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-text-secondary hover:text-text-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4">
              {/* Visual Supply Chain Timeline */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-border-light flex flex-col gap-2">
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
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isCurrent
                              ? "bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md"
                              : isDone
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
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
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <span className="text-xs font-bold text-text-primary">Manual Status Override</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleSetStatus(selectedOrder.id, e.target.value)}
                  className="input-primary py-1 px-3 text-xs min-h-[36px]"
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
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Craftsman Info */}
                <div className="card-primary p-3 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
                    <User className="h-3 w-3" /> Craftsman / Seller
                  </span>
                  <div className="font-bold text-text-primary">
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
                <div className="card-primary p-3 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-brand-primary uppercase flex items-center gap-1">
                    <Truck className="h-3 w-3" /> International Buyer
                  </span>
                  <div className="font-bold text-text-primary">{selectedOrder.buyer.name}</div>
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
                  <div key={idx} className="card-primary p-3 flex flex-col gap-1 bg-white dark:bg-zinc-900 text-xs">
                    <div className="flex justify-between font-bold text-text-primary">
                      <span>{item.product.name} (x{item.quantity})</span>
                      <span>${((item.sellerPriceAtPurchase * item.quantity) / EXCHANGE_RATE).toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-text-secondary">
                      <span>Craftsman Price: {(item.sellerPriceAtPurchase * item.quantity).toLocaleString()} VND</span>
                      <span>Fees: {((item.shippingFeeAtPurchase + item.packagingFeeAtPurchase) * item.quantity).toLocaleString()} VND</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Ledger Summary */}
              <div className="card-primary p-3.5 bg-zinc-50 dark:bg-zinc-950 text-xs space-y-1.5">
                <div className="flex justify-between text-text-secondary">
                  <span>Buyer Total Billed:</span>
                  <span className="font-bold text-brand-primary">${selectedOrder.totalPaid.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Craftsman Payout:</span>
                  <span className="font-semibold text-text-primary">
                    {(
                      selectedOrder.items.reduce(
                        (sum: number, i: any) => sum + i.sellerPriceAtPurchase * i.quantity,
                        0
                      )
                    ).toLocaleString()} VND
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary border-t border-border-light pt-1.5">
                  <span>Logistics Fees Kept by Kialna:</span>
                  <span className="font-bold text-emerald-600">
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

      {/* 4. Platform Fee Configuration Modal */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4 shadow-2xl border border-border-light">
            <div className="flex justify-between items-center border-b border-border-light pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-brand-primary" />
                <h3 className="text-base font-bold text-text-primary">Platform Fee Rates</h3>
              </div>
              <button
                onClick={() => setIsFeeModalOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFees} className="flex flex-col gap-4">
              {feeSubmitError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold">
                  {feeSubmitError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">
                  International Shipping Fee (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={shippingFeeInput}
                    onChange={(e) => setShippingFeeInput(e.target.value)}
                    className="input-primary w-full pr-24 text-xs min-h-[44px]"
                    disabled={isPending}
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary pointer-events-none">
                    ${(parseFloat(shippingFeeInput || "0") / EXCHANGE_RATE).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Hub Custom Packaging Fee (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={packagingFeeInput}
                    onChange={(e) => setPackagingFeeInput(e.target.value)}
                    className="input-primary w-full pr-24 text-xs min-h-[44px]"
                    disabled={isPending}
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary pointer-events-none">
                    ${(parseFloat(packagingFeeInput || "0") / EXCHANGE_RATE).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full mt-2 text-xs font-bold min-h-[44px]"
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
