"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatus,
  updateFeeAmount,
  markOrderSellerPaid,
  resetOrderSellerPayout,
  updateProductServiceFee,
  createHubAdmin,
  updateHubAdmin,
  toggleHubAdminStatus,
  deleteHubAdmin,
} from "@/app/actions/admin";
import RoleSwitcher from "./RoleSwitcher";
import KialnaLogo from "./KialnaLogo";
import LanguageToggle, {
  usePortalLanguage,
  translateOrderStatus,
  translateProductName,
  translateCategory,
} from "./LanguageSwitcher";
import {
  Shield,
  Crown,
  Truck,
  PackageCheck,
  Package,
  ShoppingBag,
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
  Scale,
  Landmark,
  QrCode,
  Users,
  UserPlus,
  Ban,
  Trash2,
  Mail,
  Lock,
  Pencil,
} from "lucide-react";

const BANK_BIN_MAP: Record<string, string> = {
  "Vietcombank (VCB)": "VCB",
  "Techcombank (TCB)": "TCB",
  "MB Bank (MB)": "MB",
  "ACB (Asia Commercial Bank)": "ACB",
  "VietinBank (CTG)": "ICB",
  "BIDV": "BIDV",
  "VPBank": "VPB",
  "TPBank": "TPB",
  "Sacombank (STB)": "STB",
  "Agribank": "VBA",
  "VIB": "VIB",
  "HDBank": "HDB",
};

interface AdminDashboardProps {
  initialOrders: any[];
  initialProducts?: any[];
  initialHubAdmins?: any[];
  initialFees: {
    shipping: number;
    packaging: number;
    service?: number;
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

export default function AdminDashboard({
  initialOrders,
  initialProducts = [],
  initialHubAdmins = [],
  initialFees,
  currentUser,
}: AdminDashboardProps) {
  const router = useRouter();
  const { lang, setLang } = usePortalLanguage("admin");
  const isVi = lang === "vi";
  const isSiteAdmin = currentUser.role === "site_admin";

  const [activeTab, setActiveTab] = useState<"orders" | "listings" | "hub_admins">("orders");
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [hubAdmins, setHubAdmins] = useState<any[]>(initialHubAdmins);

  // Hub Admin Management State (Site Admin only)
  const [isCreatingHubAdmin, setIsCreatingHubAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("password123");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminAddress, setNewAdminAddress] = useState("Saigon Hub");
  const [hubAdminFormError, setHubAdminFormError] = useState("");
  const [actioningHubAdminId, setActioningHubAdminId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit Hub Admin State
  const [editingHubAdminId, setEditingHubAdminId] = useState<string | null>(null);
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [editAdminAddress, setEditAdminAddress] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState("");
  const [editAdminError, setEditAdminError] = useState("");
  const [fees, setFees] = useState({
    shipping: initialFees.shipping,
    packaging: initialFees.packaging,
    service: initialFees.service ?? 0,
  });
  const [filterStage, setFilterStage] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Per-listing service fee input state (productId -> string)
  const [productFeeInputs, setProductFeeInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialProducts.map((p) => [p.id, String(p.serviceFee ?? 0)]))
  );
  const [savingProductFeeId, setSavingProductFeeId] = useState<string | null>(null);
  const [savedProductFeeId, setSavedProductFeeId] = useState<string | null>(null);
  
  // Selected Order Manifest Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [payoutMethodInput, setPayoutMethodInput] = useState("VietQR Napas 247");
  const [payoutRefInput, setPayoutRefInput] = useState("");

  // Fee Config Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [shippingFeeInput, setShippingFeeInput] = useState(String(initialFees.shipping));
  const [packagingFeeInput, setPackagingFeeInput] = useState(String(initialFees.packaging));
  const [serviceFeeInput, setServiceFeeInput] = useState(String(initialFees.service ?? 0));
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

  // Total Additional Service Fees collected across all orders
  const totalServiceFeeRevenueVND = orders.reduce((sum, o) => {
    const orderServiceFee = o.items.reduce(
      (itemSum: number, item: any) => itemSum + (item.serviceFeeAtPurchase || 0) * item.quantity,
      0
    );
    return sum + orderServiceFee;
  }, 0);
  const totalServiceFeeRevenueUSD = totalServiceFeeRevenueVND / EXCHANGE_RATE;

  // Seller Payouts Summary (Saigon Hub VND Float Reconciliation)
  const pendingSellerPayoutVND = orders
    .filter((o) => o.payoutStatus !== "paid_by_hub")
    .reduce(
      (sum, o) =>
        sum +
        o.items.reduce(
          (itemSum: number, item: any) => itemSum + item.sellerPriceAtPurchase * item.quantity,
          0
        ),
      0
    );
  const settledSellerPayoutVND = orders
    .filter((o) => o.payoutStatus === "paid_by_hub")
    .reduce(
      (sum, o) =>
        sum +
        o.items.reduce(
          (itemSum: number, item: any) => itemSum + item.sellerPriceAtPurchase * item.quantity,
          0
        ),
      0
    );

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

  const handleMarkSellerPaid = (orderId: string) => {
    setActioningOrderId(orderId);
    startTransition(async () => {
      const result = await markOrderSellerPaid(orderId, payoutMethodInput, payoutRefInput);
      if (result.success && result.order) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  payoutStatus: result.order.payoutStatus,
                  payoutMethod: result.order.payoutMethod,
                  payoutRef: result.order.payoutRef,
                  payoutAt: result.order.payoutAt,
                }
              : o
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) =>
            prev
              ? {
                  ...prev,
                  payoutStatus: result.order.payoutStatus,
                  payoutMethod: result.order.payoutMethod,
                  payoutRef: result.order.payoutRef,
                  payoutAt: result.order.payoutAt,
                }
              : null
          );
        }
        setPayoutRefInput("");
      } else {
        alert(result.error || "Failed to record seller payout");
      }
      setActioningOrderId(null);
    });
  };

  const handleResetSellerPayout = (orderId: string) => {
    setActioningOrderId(orderId);
    startTransition(async () => {
      const result = await resetOrderSellerPayout(orderId);
      if (result.success && result.order) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  payoutStatus: "unpaid",
                  payoutMethod: null,
                  payoutRef: null,
                  payoutAt: null,
                }
              : o
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) =>
            prev
              ? {
                  ...prev,
                  payoutStatus: "unpaid",
                  payoutMethod: null,
                  payoutRef: null,
                  payoutAt: null,
                }
              : null
          );
        }
      }
      setActioningOrderId(null);
    });
  };

  // Handler to update per-listing additional service fee (Site Admin only)
  const handleSaveProductServiceFee = (productId: string, overrideAmount?: number) => {
    const rawStr = overrideAmount !== undefined ? String(overrideAmount) : productFeeInputs[productId] || "0";
    const parsedFee = parseFloat(rawStr);
    if (isNaN(parsedFee) || parsedFee < 0) {
      alert(isVi ? "Phí dịch vụ không hợp lệ." : "Please enter a valid non-negative service fee.");
      return;
    }

    if (overrideAmount !== undefined) {
      setProductFeeInputs((prev) => ({ ...prev, [productId]: String(overrideAmount) }));
    }

    setSavingProductFeeId(productId);
    startTransition(async () => {
      const res = await updateProductServiceFee(productId, parsedFee);
      if (res.success && res.product) {
        const updatedFee = res.product.serviceFee;
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, serviceFee: updatedFee } : p))
        );
        setSavedProductFeeId(productId);
        setTimeout(() => setSavedProductFeeId(null), 2000);
        router.refresh();
      } else {
        alert(res.error || (isVi ? "Không thể cập nhật phí dịch vụ." : "Failed to update listing service fee."));
      }
      setSavingProductFeeId(null);
    });
  };

  // Handler to update fee config
  const handleSaveFees = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedShipping = parseFloat(shippingFeeInput);
    const parsedPackaging = parseFloat(packagingFeeInput);
    const parsedService = parseFloat(serviceFeeInput || "0");

    if (isNaN(parsedShipping) || parsedShipping < 0) {
      setFeeSubmitError(isVi ? "Vui lòng nhập phí vận chuyển hợp lệ." : "Please enter a valid shipping fee.");
      return;
    }

    if (isNaN(parsedPackaging) || parsedPackaging < 0) {
      setFeeSubmitError(isVi ? "Vui lòng nhập phí đóng gói hợp lệ." : "Please enter a valid packaging fee.");
      return;
    }

    if (isSiteAdmin && (isNaN(parsedService) || parsedService < 0)) {
      setFeeSubmitError(isVi ? "Vui lòng nhập phí dịch vụ hợp lệ." : "Please enter a valid service fee.");
      return;
    }

    setFeeSubmitError("");
    startTransition(async () => {
      const r1 = await updateFeeAmount("shipping", parsedShipping);
      const r2 = await updateFeeAmount("packaging", parsedPackaging);
      const r3 = isSiteAdmin ? await updateFeeAmount("service", parsedService) : { success: true };

      if (r1.success && r2.success && r3.success) {
        setFees({
          shipping: parsedShipping,
          packaging: parsedPackaging,
          service: isSiteAdmin ? parsedService : fees.service,
        });
        setIsFeeModalOpen(false);
        router.refresh();
      } else {
        setFeeSubmitError(
          r1.error || r2.error || (r3 as any).error || "Failed to update platform fees."
        );
      }
    });
  };

  // Handlers for Hub Admin Account Management (Site Admin Only)
  const handleCreateHubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setHubAdminFormError("");

    if (!newAdminName.trim()) {
      setHubAdminFormError(isVi ? "Vui lòng nhập họ tên Hub Admin." : "Please enter Hub Admin name.");
      return;
    }
    if (!newAdminEmail.trim() || !newAdminEmail.includes("@")) {
      setHubAdminFormError(isVi ? "Vui lòng nhập email hợp lệ." : "Please enter a valid email address.");
      return;
    }
    if (newAdminPassword && newAdminPassword.trim().length < 6) {
      setHubAdminFormError(
        isVi ? "Mật khẩu phải có ít nhất 6 ký tự." : "Password must be at least 6 characters."
      );
      return;
    }

    startTransition(async () => {
      const res = await createHubAdmin({
        name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        password: newAdminPassword.trim() || "password123",
        phone: newAdminPhone.trim(),
        address: newAdminAddress.trim() || "Saigon Hub",
      });

      if (res.success && res.hubAdmin) {
        setHubAdmins((prev) => [res.hubAdmin, ...prev]);
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminPassword("password123");
        setNewAdminPhone("");
        setNewAdminAddress("Saigon Hub");
        setIsCreatingHubAdmin(false);
        router.refresh();
      } else {
        setHubAdminFormError(
          res.error || (isVi ? "Không thể tạo tài khoản Hub Admin." : "Failed to create Hub Admin account.")
        );
      }
    });
  };

  const handleToggleHubAdminStatus = (hubAdminId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "disabled" ? "active" : "disabled";
    setActioningHubAdminId(hubAdminId);
    startTransition(async () => {
      const res = await toggleHubAdminStatus(hubAdminId, nextStatus);
      if (res.success && res.hubAdmin) {
        setHubAdmins((prev) =>
          prev.map((a) => (a.id === hubAdminId ? { ...a, status: res.hubAdmin.status } : a))
        );
        router.refresh();
      } else {
        alert(
          res.error ||
            (isVi ? "Không thể cập nhật trạng thái tài khoản." : "Failed to update Hub Admin status.")
        );
      }
      setActioningHubAdminId(null);
    });
  };

  const handleDeleteHubAdmin = (hubAdminId: string) => {
    setActioningHubAdminId(hubAdminId);
    startTransition(async () => {
      const res = await deleteHubAdmin(hubAdminId);
      if (res.success) {
        setHubAdmins((prev) => prev.filter((a) => a.id !== hubAdminId));
        setConfirmDeleteId(null);
        router.refresh();
      } else {
        alert(
          res.error || (isVi ? "Không thể xóa tài khoản Hub Admin." : "Failed to delete Hub Admin account.")
        );
      }
      setActioningHubAdminId(null);
    });
  };

  const handleStartEditHubAdmin = (adminUser: any) => {
    setEditingHubAdminId(adminUser.id);
    setEditAdminName(adminUser.name || "");
    setEditAdminEmail(adminUser.email || "");
    setEditAdminPhone(adminUser.phone || "");
    setEditAdminAddress(adminUser.address || "");
    setEditAdminPassword("");
    setEditAdminError("");
    setConfirmDeleteId(null);
  };

  const handleSaveEditHubAdmin = (e: React.FormEvent, hubAdminId: string) => {
    e.preventDefault();
    setEditAdminError("");

    if (!editAdminName.trim()) {
      setEditAdminError(isVi ? "Vui lòng nhập họ tên Hub Admin." : "Please enter Hub Admin name.");
      return;
    }
    if (!editAdminEmail.trim() || !editAdminEmail.includes("@")) {
      setEditAdminError(isVi ? "Vui lòng nhập email hợp lệ." : "Please enter a valid email address.");
      return;
    }
    if (editAdminPassword.trim() && editAdminPassword.trim().length < 6) {
      setEditAdminError(
        isVi ? "Mật khẩu mới phải có ít nhất 6 ký tự." : "New password must be at least 6 characters."
      );
      return;
    }

    setActioningHubAdminId(hubAdminId);
    startTransition(async () => {
      const res = await updateHubAdmin(hubAdminId, {
        name: editAdminName.trim(),
        email: editAdminEmail.trim(),
        phone: editAdminPhone.trim(),
        address: editAdminAddress.trim(),
        password: editAdminPassword.trim() || undefined,
      });

      if (res.success && res.hubAdmin) {
        const updatedAdmin = res.hubAdmin;
        setHubAdmins((prev) =>
          prev.map((a) => (a.id === hubAdminId ? { ...a, ...updatedAdmin } : a))
        );
        setEditingHubAdminId(null);
        setEditAdminPassword("");
        router.refresh();
      } else {
        setEditAdminError(
          res.error || (isVi ? "Không thể cập nhật thông tin Hub Admin." : "Failed to update Hub Admin.")
        );
      }
      setActioningHubAdminId(null);
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
        return isVi ? "Điều phối Tài xế lấy hàng" : "Assign Courier Driver";
      case "Driver Assigned":
        return isVi ? "Xác nhận Đã lấy hàng" : "Mark Picked Up";
      case "Picked Up":
        return isVi ? "Nhập kho Saigon Hub (Đóng gói)" : "Receive at Hub (Packaging)";
      case "In Packaging":
        return isVi ? "Xuất kho Bay quốc tế" : "Dispatch Global Shipment";
      case "Shipped":
        return isVi ? "Xác nhận Đã giao hàng" : "Mark Delivered";
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
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-ink tracking-tight leading-tight">
                  {isSiteAdmin
                    ? isVi
                      ? "Quản trị Hệ thống Kialna (Site Admin)"
                      : "Kialna Site Admin"
                    : isVi
                    ? "Kialna Saigon Hub"
                    : "Kialna Saigon Hub"}
                </h1>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    isSiteAdmin
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-cyan-50 text-[#164e63] border-cyan-200"
                  }`}
                >
                  {isSiteAdmin
                    ? isVi
                      ? "QUYỀN CAO NHẤT"
                      : "SUPERADMIN"
                    : isVi
                    ? "HUB ADMIN"
                    : "HUB ADMIN"}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary font-medium tracking-wide leading-none mt-0.5">
                {isSiteAdmin
                  ? isVi
                    ? "Giám sát Toàn sàn, Phí Dịch vụ Sản phẩm & Điều hành Saigon Hub"
                    : "Full Platform Oversight, Listing Service Fees & Saigon Hub Logistics"
                  : isVi
                  ? "Vận hành Saigon Hub & Xuất khẩu Quốc tế"
                  : "Saigon Hub Logistics & Global Export"}
              </p>
            </div>
          </div>

          {/* Navigation Switcher: Orders Pipeline vs Listings & Service Fees vs Hub Admins (Site Admin Only) */}
          {isSiteAdmin && (
            <div className="hidden md:flex items-center gap-1 bg-surface-soft p-1 rounded-full border border-border-light">
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                    : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                <span>
                  {isVi ? `Đơn hàng & Hub (${orders.length})` : `Orders & Hub (${orders.length})`}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("listings")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "listings"
                    ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                    : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>
                  {isVi
                    ? `Sản phẩm & Phí (${products.length})`
                    : `Listings & Service Fees (${products.length})`}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("hub_admins")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "hub_admins"
                    ? "bg-gradient-to-r from-[#0c3e5e] to-[#0369a1] text-white shadow-sm font-bold"
                    : "text-text-secondary hover:text-[#164e63] hover:bg-sky-50/70"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>
                  {isVi
                    ? `Tài khoản Hub Admin (${hubAdmins.length})`
                    : `Hub Admins (${hubAdmins.length})`}
                </span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <LanguageToggle lang={lang} onChange={setLang} />

            <button
              onClick={() => setIsFeeModalOpen(true)}
              className="btn-secondary rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title={isVi ? "Cấu hình Phí Vận chuyển & Dịch vụ" : "Configure Platform Fees"}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isVi ? "Cấu hình Phí" : "Fee Settings"}
              </span>
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
              {isVi ? "Tổng đơn hàng" : "Total Orders"}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{totalOrdersCount}</span>
          </div>

          <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              {isVi ? "Chờ lấy hàng" : "Action Needed"}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">{readyCount}</span>
          </div>

          <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              {isVi ? "Đóng gói tại Saigon Hub" : "In Hub Packaging"}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-primary tracking-tight">{hubPackagingCount}</span>
          </div>

          <div className="card-product rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 bg-white border border-border-light shadow-sm">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
              {isVi ? "Đang vận chuyển" : "Shipped / Transit"}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">{shippedCount}</span>
          </div>
        </div>

        {/* Logistics Revenue & Merchant Payout Float Strip */}
        <div className="card-promo-strip p-6 sm:p-8 rounded-[32px] text-white shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">
              {isVi
                ? "Doanh thu Vận chuyển Thu hộ (Cước theo kg + Đóng gói)"
                : "Platform Logistics Fees Collected (Weight Shipping + Packaging)"}
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">${totalLogisticsRevenueUSD.toFixed(2)} USD</span>
              <span className="text-xs sm:text-sm text-white/60">({totalLogisticsRevenueVND.toLocaleString()} VND)</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 sm:gap-4">
            {isSiteAdmin && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  {isVi ? "Phí Dịch vụ Sàn Thu được" : "Site Service Fees Collected"}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-white">
                  {totalServiceFeeRevenueVND.toLocaleString()} VND (${totalServiceFeeRevenueUSD.toFixed(2)})
                </span>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                {isVi ? "Chờ chuyển khoản Người bán (VND)" : "Unpaid Merchant Float (VND)"}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {pendingSellerPayoutVND.toLocaleString()} VND
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                {isVi ? "Đã tất toán qua VietQR / Hub" : "Settled via VietQR / Hub"}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {settledSellerPayoutVND.toLocaleString()} VND
              </span>
            </div>
          </div>
          <Truck className="h-16 w-16 text-white/10 absolute right-6 bottom-4 pointer-events-none" />
        </div>

        {/* Mobile Tab Switcher (Site Admin Only) */}
        {isSiteAdmin && (
          <div className="flex md:hidden items-center gap-1.5 bg-surface-soft p-1 rounded-full border border-border-light">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "orders" ? "bg-[#164e63] text-white" : "text-text-secondary"
              }`}
            >
              {isVi ? `Đơn hàng (${orders.length})` : `Orders (${orders.length})`}
            </button>
            <button
              onClick={() => setActiveTab("listings")}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "listings" ? "bg-[#164e63] text-white" : "text-text-secondary"
              }`}
            >
              {isVi ? `Sản phẩm (${products.length})` : `Listings (${products.length})`}
            </button>
            <button
              onClick={() => setActiveTab("hub_admins")}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "hub_admins" ? "bg-[#164e63] text-white" : "text-text-secondary"
              }`}
            >
              {isVi ? `Hub Admin (${hubAdmins.length})` : `Hub Admins (${hubAdmins.length})`}
            </button>
          </div>
        )}

        {isSiteAdmin && activeTab === "hub_admins" ? (
          /* TAB 3: HUB ADMIN ACCOUNT MANAGEMENT (SITE ADMIN ONLY) */
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="bg-surface-soft/70 border border-border-light rounded-[24px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4.5 w-4.5 text-amber-600" />
                  <h2 className="text-base sm:text-lg font-bold text-ink">
                    {isVi
                      ? "Quản lý Tài khoản Hub Admin (Saigon Hub)"
                      : "Hub Admin Account Management (Saigon Hub)"}
                  </h2>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {isVi
                    ? "Site Admin có toàn quyền tạo mới, tạm khóa (vô hiệu hóa) hoặc xóa vĩnh viễn tài khoản điều hành Hub Admin."
                    : "Site Admin can create new Saigon Hub Admin accounts, disable/enable their login access, or permanently delete them."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreatingHubAdmin((prev) => !prev);
                  setHubAdminFormError("");
                }}
                className="btn-primary rounded-full px-5 py-2.5 text-xs font-bold flex items-center gap-2 self-start md:self-auto cursor-pointer shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>
                  {isCreatingHubAdmin
                    ? isVi
                      ? "Đóng biểu mẫu"
                      : "Cancel"
                    : isVi
                    ? "+ Tạo Tài khoản Hub Admin"
                    : "+ Create Hub Admin"}
                </span>
              </button>
            </div>

            {/* Create Hub Admin Form */}
            {isCreatingHubAdmin && (
              <form
                onSubmit={handleCreateHubAdmin}
                className="card-product rounded-[24px] p-6 bg-white border border-sky-200 shadow-md flex flex-col gap-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-border-light pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-brand-primary" />
                    <h3 className="text-sm font-bold text-ink">
                      {isVi ? "Cấp tài khoản Admin Hub mới" : "Provision New Admin Hub Account"}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Role: ADMIN HUB
                  </span>
                </div>

                {hubAdminFormError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{hubAdminFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-text-secondary" />
                      {isVi ? "Họ và tên Quản lý Hub *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder={isVi ? "VD: Trần Minh Quân" : "e.g. Tran Minh Quan"}
                      className="input-primary w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-text-secondary" />
                      {isVi ? "Email Đăng nhập *" : "Login Email *"}
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="hub2@kialna.shop"
                      className="input-primary w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-text-secondary" />
                      {isVi ? "Mật khẩu khởi tạo *" : "Initial Password *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="password123"
                      className="input-primary w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-text-secondary" />
                      {isVi ? "Số điện thoại liên hệ" : "Phone Number"}
                    </label>
                    <input
                      type="text"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="0909123456"
                      className="input-primary w-full text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-text-secondary" />
                      {isVi ? "Trạm phụ trách / Địa chỉ Hub" : "Assigned Hub Location / Address"}
                    </label>
                    <input
                      type="text"
                      value={newAdminAddress}
                      onChange={(e) => setNewAdminAddress(e.target.value)}
                      placeholder="Saigon Hub - Tan Son Nhat Air Cargo"
                      className="input-primary w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingHubAdmin(false)}
                    className="btn-secondary rounded-full px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    {isVi ? "Hủy" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary rounded-full px-6 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPending ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>{isVi ? "Tạo Tài khoản Hub Admin" : "Create Hub Admin Account"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Hub Admins List */}
            {hubAdmins.length === 0 ? (
              <div className="card-product rounded-[24px] p-12 text-center bg-white border border-border-light">
                <Users className="h-10 w-10 text-text-secondary mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold text-ink">
                  {isVi ? "Chưa có tài khoản Hub Admin nào" : "No Hub Admin Accounts Found"}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {isVi
                    ? "Nhấn '+ Tạo Tài khoản Hub Admin' ở góc trên để cấp quyền vận hành cho nhân sự Saigon Hub."
                    : "Click '+ Create Hub Admin' above to provision an operations account for Saigon Hub."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {hubAdmins.map((adminUser) => {
                  const isDisabled = adminUser.status === "disabled";
                  const isBusy = actioningHubAdminId === adminUser.id && isPending;
                  const isConfirmingDelete = confirmDeleteId === adminUser.id;
                  const isEditingThis = editingHubAdminId === adminUser.id;

                  return (
                    <div
                      key={adminUser.id}
                      className={`card-product rounded-[24px] p-5 sm:p-6 flex flex-col justify-between gap-4 border transition-all ${
                        isDisabled
                          ? "bg-surface-soft/60 border-amber-200/80 opacity-85"
                          : "bg-white border-border-light shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div
                            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm ${
                              isDisabled
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-sky-50 text-[#164e63] border border-sky-200"
                            }`}
                          >
                            <Shield className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-ink truncate">
                                {adminUser.name}
                              </h3>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  isDisabled
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                {isDisabled
                                  ? isVi
                                    ? "Đã vô hiệu hóa"
                                    : "Disabled"
                                  : isVi
                                  ? "Đang hoạt động"
                                  : "Active"}
                              </span>
                            </div>

                            <div className="text-xs text-text-secondary mt-1 space-y-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                                <span className="font-medium text-ink">{adminUser.email}</span>
                              </div>
                              {adminUser.phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                                  <span>{adminUser.phone}</span>
                                </div>
                              )}
                              {adminUser.address && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                                  <span>{adminUser.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Inline Edit Form for this Hub Admin */}
                      {isEditingThis && (
                        <form
                          onSubmit={(e) => handleSaveEditHubAdmin(e, adminUser.id)}
                          className="bg-surface-soft/80 border border-sky-200 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-150"
                        >
                          <div className="flex items-center justify-between border-b border-border-light pb-2">
                            <span className="text-xs font-bold text-[#164e63] flex items-center gap-1.5">
                              <Pencil className="h-3.5 w-3.5" />
                              {isVi ? "Chỉnh sửa thông tin Hub Admin" : "Edit Hub Admin Details"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingHubAdminId(null)}
                              className="text-text-secondary hover:text-ink cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {editAdminError && (
                            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] font-semibold text-red-600 flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              <span>{editAdminError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-ink">
                                {isVi ? "Tên hiển thị / Tên Hub *" : "Name / Hub Title *"}
                              </label>
                              <input
                                type="text"
                                required
                                value={editAdminName}
                                onChange={(e) => setEditAdminName(e.target.value)}
                                className="input-primary w-full text-xs py-1.5 px-3 min-h-[36px] rounded-xl bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-ink">
                                {isVi ? "Email đăng nhập *" : "Login Email *"}
                              </label>
                              <input
                                type="email"
                                required
                                value={editAdminEmail}
                                onChange={(e) => setEditAdminEmail(e.target.value)}
                                className="input-primary w-full text-xs py-1.5 px-3 min-h-[36px] rounded-xl bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-ink">
                                {isVi ? "Số điện thoại" : "Phone Number"}
                              </label>
                              <input
                                type="text"
                                value={editAdminPhone}
                                onChange={(e) => setEditAdminPhone(e.target.value)}
                                placeholder="02838290000"
                                className="input-primary w-full text-xs py-1.5 px-3 min-h-[36px] rounded-xl bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-ink">
                                {isVi
                                  ? "Đổi mật khẩu (để trống nếu giữ nguyên)"
                                  : "New Password (optional)"}
                              </label>
                              <input
                                type="text"
                                value={editAdminPassword}
                                onChange={(e) => setEditAdminPassword(e.target.value)}
                                placeholder={
                                  isVi ? "Nhập mật khẩu mới..." : "Leave blank to keep current"
                                }
                                className="input-primary w-full text-xs py-1.5 px-3 min-h-[36px] rounded-xl bg-white"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[11px] font-bold text-ink">
                                {isVi ? "Địa chỉ Hub" : "Hub Address"}
                              </label>
                              <input
                                type="text"
                                value={editAdminAddress}
                                onChange={(e) => setEditAdminAddress(e.target.value)}
                                className="input-primary w-full text-xs py-1.5 px-3 min-h-[36px] rounded-xl bg-white"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingHubAdminId(null)}
                              className="btn-secondary rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer"
                            >
                              {isVi ? "Hủy" : "Cancel"}
                            </button>
                            <button
                              type="submit"
                              disabled={isBusy}
                              className="btn-primary rounded-full px-5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              {isBusy ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              <span>{isVi ? "Lưu thay đổi" : "Save Changes"}</span>
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="border-t border-border-light pt-3.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-text-secondary">
                          {isVi ? "Vai trò:" : "Role:"}{" "}
                          <strong className="text-ink">Admin Hub</strong>
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Edit Button */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              isEditingThis
                                ? setEditingHubAdminId(null)
                                : handleStartEditHubAdmin(adminUser)
                            }
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isEditingThis
                                ? "bg-[#164e63] text-white border-[#164e63]"
                                : "bg-sky-50 text-[#164e63] border-sky-200 hover:bg-sky-100"
                            }`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>{isVi ? "Chỉnh sửa" : "Edit"}</span>
                          </button>

                          {/* Enable / Disable Toggle Button */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleToggleHubAdminStatus(adminUser.id, adminUser.status || "active")
                            }
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isDisabled
                                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                                : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                            }`}
                          >
                            {isBusy ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : isDisabled ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {isDisabled
                                ? isVi
                                  ? "Kích hoạt lại"
                                  : "Enable Account"
                                : isVi
                                ? "Vô hiệu hóa"
                                : "Disable"}
                            </span>
                          </button>

                          {/* Delete Account Button with Inline Confirmation */}
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                              <span className="text-[11px] font-bold text-red-700">
                                {isVi ? "Xác nhận xóa?" : "Confirm delete?"}
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteHubAdmin(adminUser.id)}
                                className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 cursor-pointer"
                              >
                                {isVi ? "Xóa" : "Yes, Delete"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-text-secondary hover:text-ink cursor-pointer"
                              >
                                {isVi ? "Hủy" : "Cancel"}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeleteId(adminUser.id)}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{isVi ? "Xóa" : "Delete"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : isSiteAdmin && activeTab === "listings" ? (
          /* TAB 2: ALL PRODUCT LISTINGS & SITE ADMIN ADDITIONAL SERVICE FEE MANAGER */
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="bg-surface-soft/70 border border-border-light rounded-[24px] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4.5 w-4.5 text-amber-600" />
                  <h2 className="text-base sm:text-lg font-bold text-ink">
                    {isVi
                      ? "Quản lý Danh sách Sản phẩm & Phí Dịch vụ (Site Admin)"
                      : "Marketplace Listings & Additional Service Fees (Site Admin)"}
                  </h2>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {isVi
                    ? "Site Admin có quyền thiết lập phí dịch vụ cộng thêm (VND) cho từng mặt hàng đăng bán. Người bán vẫn nhận đủ 100% giá gốc."
                    : "Site Admin supersedes Hub Admin and can assign an additional service fee (VND) to any listing item. Sellers still receive 100% of their base price."}
                </p>
              </div>
              <div className="relative md:w-72">
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder={isVi ? "Tìm sản phẩm hoặc người bán..." : "Search listing or seller..."}
                  className="search-pill w-full pl-10 text-xs focus:bg-white transition-all outline-none"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products
                .filter((p) => {
                  const q = productSearchQuery.toLowerCase();
                  return (
                    !q ||
                    p.name.toLowerCase().includes(q) ||
                    translateProductName(p.name, "vi").toLowerCase().includes(q) ||
                    (p.seller?.name && p.seller.name.toLowerCase().includes(q))
                  );
                })
                .map((p) => {
                  let imageList: string[] = [];
                  try {
                    imageList = JSON.parse(p.images);
                  } catch {}
                  const imageUrl = imageList[0] || "/file.svg";
                  const currentInputStr = productFeeInputs[p.id] ?? String(p.serviceFee ?? 0);
                  const currentFeeVal = parseFloat(currentInputStr) || 0;
                  const unitWeight = p.weight && p.weight > 0 ? p.weight : 0.5;
                  const unitShippingVND = Math.round(fees.shipping * unitWeight);
                  const effectiveServiceVND = currentFeeVal > 0 ? currentFeeVal : fees.service;
                  const totalBuyerVND = p.basePrice + effectiveServiceVND + unitShippingVND + fees.packaging;
                  const totalBuyerUSD = totalBuyerVND / EXCHANGE_RATE;
                  const isSavingThis = savingProductFeeId === p.id && isPending;
                  const isSavedThis = savedProductFeeId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="card-product rounded-[24px] p-5 flex flex-col gap-4 bg-white border border-border-light shadow-sm"
                    >
                      <div className="flex gap-3.5 items-center border-b border-border-light pb-3.5">
                        <div className="h-16 w-16 rounded-2xl overflow-hidden border border-border-light bg-surface-soft shrink-0">
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
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                            {translateCategory(p.category, lang)}
                          </span>
                          <h3 className="text-sm font-bold text-ink truncate">
                            {translateProductName(p.name, lang)}
                          </h3>
                          <div className="text-[11px] text-text-secondary mt-0.5 truncate">
                            {isVi ? "Người bán:" : "Seller:"}{" "}
                            <strong className="text-ink">{p.seller?.name || "VN Seller"}</strong> •{" "}
                            <span>{unitWeight} kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Fee Breakdown */}
                      <div className="bg-surface-soft rounded-2xl p-3.5 border border-border-light text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            {isVi ? "Giá gốc người bán:" : "Seller Base Price:"}
                          </span>
                          <span className="font-bold text-ink">{p.basePrice.toLocaleString()} VND</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-700 font-semibold">
                            {isVi ? "+ Phí dịch vụ sản phẩm:" : "+ Listing Service Fee:"}
                          </span>
                          <span className="font-bold text-amber-700">
                            {effectiveServiceVND.toLocaleString()} VND ($
                            {(effectiveServiceVND / EXCHANGE_RATE).toFixed(2)})
                          </span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>
                            {isVi
                              ? `+ Cước bay (${unitWeight}kg) & Đóng gói:`
                              : `+ Shipping (${unitWeight}kg) & Packaging:`}
                          </span>
                          <span>{(unitShippingVND + fees.packaging).toLocaleString()} VND</span>
                        </div>
                        <div className="border-t border-border-light pt-2 flex justify-between items-baseline">
                          <span className="font-bold text-ink">
                            {isVi ? "Tổng giá Khách mua:" : "Buyer Checkout Price:"}
                          </span>
                          <span className="text-sm font-extrabold text-brand-primary">
                            ${totalBuyerUSD.toFixed(2)} USD ({totalBuyerVND.toLocaleString()} VND)
                          </span>
                        </div>
                      </div>

                      {/* Site Admin Additional Service Fee Control */}
                      {isSiteAdmin ? (
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-ink flex items-center gap-1">
                              <Crown className="h-3 w-3 text-amber-600" />
                              {isVi
                                ? "Phí Dịch vụ Cộng thêm (VND / sp)"
                                : "Additional Service Fee (VND / item)"}
                            </label>
                            <span className="text-[10px] font-bold text-brand-primary">
                              ${(currentFeeVal / EXCHANGE_RATE).toFixed(2)} USD
                            </span>
                          </div>

                          {/* Preset Quick Buttons */}
                          <div className="flex gap-1.5 flex-wrap">
                            {[0, 25000, 50000, 100000].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleSaveProductServiceFee(p.id, preset)}
                                disabled={isPending}
                                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                  currentFeeVal === preset
                                    ? "bg-[#164e63] text-white border-[#164e63] font-bold"
                                    : "bg-surface-soft text-text-secondary border-border-light hover:border-brand-primary font-semibold"
                                }`}
                              >
                                {preset === 0
                                  ? isVi
                                    ? "0 VND"
                                    : "0 VND"
                                  : `+${(preset / 1000).toFixed(0)}k ($${(preset / EXCHANGE_RATE).toFixed(0)})`}
                              </button>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="0"
                                step="5000"
                                value={currentInputStr}
                                onChange={(e) =>
                                  setProductFeeInputs((prev) => ({
                                    ...prev,
                                    [p.id]: e.target.value,
                                  }))
                                }
                                className="input-primary w-full pr-12 py-1.5 px-3 text-xs min-h-[38px] rounded-xl"
                                placeholder="0"
                                disabled={isPending}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-secondary">
                                VND
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveProductServiceFee(p.id)}
                              disabled={isSavingThis}
                              className="btn-primary px-4 py-1.5 text-xs font-bold rounded-xl shrink-0 cursor-pointer flex items-center gap-1"
                            >
                              {isSavingThis ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : isSavedThis ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{isVi ? "Đã lưu" : "Saved"}</span>
                                </>
                              ) : (
                                <span>{isVi ? "Lưu phí" : "Save Fee"}</span>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-text-secondary bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>
                            {isVi
                              ? "Chỉ Quản trị Hệ thống (Site Admin) mới có quyền thay đổi phí dịch vụ sản phẩm."
                              : "Only Site Admin can add or modify per-listing service fees."}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <>

        {/* Search and Pipeline Filter Bar (Meta Pill Controls) */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 md:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isVi
                  ? "Tìm Mã đơn, Người mua, hoặc Người bán..."
                  : "Search Order ID, Buyer, or Seller..."
              }
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
                    ? "bg-[#164e63] text-white border-[#164e63] font-bold shadow-sm"
                    : "bg-white text-text-primary border-border-hairline hover:bg-sky-50/60 font-semibold"
                }`}
              >
                {stage === "All" ? (isVi ? "Tất cả" : "All") : translateOrderStatus(stage, lang)}
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
              const totalWeightKg = o.items.reduce(
                (sum: number, item: any) =>
                  sum + (item.weightAtPurchase || item.product.weight || 0.5) * item.quantity,
                0
              );
              const sellerPayoutVND = o.items.reduce(
                (sum: number, item: any) => sum + item.sellerPriceAtPurchase * item.quantity,
                0
              );
              const isSellerPaid = o.payoutStatus === "paid_by_hub";

              return (
                <div
                  key={o.id}
                  className="card-product rounded-[24px] p-5 flex flex-col gap-4 bg-white border border-border-light shadow-sm hover:border-border-hairline transition-all duration-300 hover:shadow-md relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start border-b border-border-light pb-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono text-text-secondary font-semibold">
                        {isVi ? "MÃ ĐƠN:" : "ORDER:"} {o.id.substring(0, 8).toUpperCase()}...
                      </span>
                      <span className="text-xs font-bold text-ink">
                        {isVi ? "Khách mua:" : "Buyer:"} {o.buyer.name}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-[10px] font-bold px-3 py-1 rounded-full bg-surface-soft text-ink border border-border-light uppercase tracking-wide leading-none"
                      >
                        {translateOrderStatus(o.status, lang)}
                      </span>
                      <span className="text-[10px] text-text-secondary inline-flex items-center gap-1">
                        <Scale className="h-3 w-3 text-brand-primary" />
                        <strong className="text-ink">{totalWeightKg.toFixed(2)} kg</strong>
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1.5 text-xs">
                    {o.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-text-secondary">
                        <span className="truncate pr-2">
                          <span className="font-bold text-ink">x{item.quantity}</span>{" "}
                          {translateProductName(item.product.name, lang)}
                          <span className="text-[10px] ml-1">
                            ({((item.weightAtPurchase || item.product.weight || 0.5) * item.quantity).toFixed(2)} kg)
                          </span>
                        </span>
                        <span className="text-[10px] font-medium shrink-0">
                          {isVi ? "Người bán:" : "Seller:"} {item.product.seller.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Seller Payout Status Pill */}
                  <div
                    className={`px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between ${
                      isSellerPaid
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                        : "bg-amber-50/70 border-amber-200 text-amber-800"
                    }`}
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 shrink-0" />
                      {isSellerPaid
                        ? isVi
                          ? `Đã trả Người bán (${o.payoutMethod || "VietQR"})`
                          : `Merchant Paid (${o.payoutMethod || "VietQR"})`
                        : isVi
                        ? "Chờ trả Người bán:"
                        : "Merchant Payout Due:"}
                    </span>
                    <span className="font-extrabold">
                      {sellerPayoutVND.toLocaleString()} VND
                    </span>
                  </div>

                  {/* Locations summary */}
                  <div className="bg-surface-soft p-3 rounded-2xl border border-border-light text-[11px] text-text-secondary flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="truncate">
                        <strong className="text-ink">{isVi ? "Lấy hàng:" : "Pickup:"}</strong>{" "}
                        {o.items[0]?.product.seller.address || "Saigon Hub"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Truck className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
                      <span className="truncate">
                        <strong className="text-ink">{isVi ? "Giao đến:" : "Delivery:"}</strong>{" "}
                        {o.buyer.address}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons footer */}
                  <div className="pt-2 border-t border-border-light flex gap-2 items-center justify-between">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="btn-secondary rounded-full px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                      {isVi ? "Chi tiết & VietQR" : "Manifest"}
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
                        <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                        {isVi ? "Đã giao hoàn tất" : "Delivered & Completed"}
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
              <h3 className="text-base font-bold text-ink">
                {isVi ? "Không tìm thấy đơn hàng phù hợp" : "No orders match filter"}
              </h3>
              <p className="text-xs text-text-secondary max-w-sm">
                {isVi
                  ? "Hãy thử chọn trạng thái vận chuyển khác hoặc xóa từ khóa tìm kiếm."
                  : "Try selecting a different pipeline tab or clearing your search keywords."}
              </p>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {/* 3. Detailed Logistics Manifest Modal (Meta Rounded-32 Card) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[4px] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md md:max-w-2xl rounded-t-[32px] md:rounded-[32px] max-h-[85vh] md:max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative shadow-2xl border border-border-light">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-light flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider font-semibold">
                  {isVi ? "VẬN ĐƠN CHI TIẾT & ĐỐI SOÁT" : "Logistics Manifest"}
                </span>
                <h2 className="text-base font-bold text-ink">
                  {isVi ? "Đơn hàng" : "Order"} {selectedOrder.id.substring(0, 8).toUpperCase()}
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
                  {isVi ? "TIẾN ĐỘ VẬN CHUYỂN CHUỖI CUNG ỨNG" : "Supply Chain Pipeline Progress"}
                </span>
                <div className="flex items-center justify-between relative mt-1">
                  {PIPELINE_STAGES.map((st, idx) => {
                    const currentIdx = PIPELINE_STAGES.indexOf(selectedOrder.status as any);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const shortStageVi: Record<string, string> = {
                      "Ready for Pickup": "Chờ lấy",
                      "Driver Assigned": "Tài xế",
                      "Picked Up": "Đã lấy",
                      "In Packaging": "Đóng gói",
                      Shipped: "Đang bay",
                      Delivered: "Đã giao",
                    };

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
                        <span className="text-[8px] font-semibold text-text-secondary max-w-[54px] text-center leading-none">
                          {isVi ? shortStageVi[st] || st : st.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status override selection dropdown */}
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <span className="text-xs font-bold text-ink">
                  {isVi ? "Cập nhật Trạng thái Vận đơn" : "Manual Status Override"}
                </span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleSetStatus(selectedOrder.id, e.target.value)}
                  className="input-primary py-1.5 px-3 text-xs min-h-[38px] rounded-xl cursor-pointer"
                  disabled={isPending}
                >
                  {PIPELINE_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {translateOrderStatus(st, lang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer & Seller Contact Profiles */}
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                {/* Seller Info */}
                <div className="p-3.5 bg-surface-soft rounded-2xl border border-border-light flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
                    <User className="h-3 w-3" />{" "}
                    {isVi ? "NGƯỜI BÁN VIỆT NAM" : "Vietnamese Seller"}
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
                    <Truck className="h-3 w-3" />{" "}
                    {isVi ? "KHÁCH MUA QUỐC TẾ" : "International Buyer"}
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    {isVi
                      ? "CHI TIẾT KIỆN HÀNG, KHỐI LƯỢNG & CƯỚC HUB"
                      : "Itemized Manifest, Weight & Hub Fees"}
                  </span>
                  <span className="text-[11px] font-bold text-brand-primary flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" />
                    {isVi ? "Tổng khối lượng kiện hàng:" : "Total Parcel Weight:"}{" "}
                    {selectedOrder.items
                      .reduce(
                        (sum: number, i: any) =>
                          sum + (i.weightAtPurchase || i.product.weight || 0.5) * i.quantity,
                        0
                      )
                      .toFixed(2)}{" "}
                    kg
                  </span>
                </div>
                {selectedOrder.items.map((item: any, idx: number) => {
                  const unitWeight = item.weightAtPurchase || item.product.weight || 0.5;
                  const itemServiceFee = item.serviceFeeAtPurchase || 0;
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl border border-border-light flex flex-col gap-1 bg-white text-xs">
                      <div className="flex justify-between font-bold text-ink">
                        <span>
                          {translateProductName(item.product.name, lang)} (x{item.quantity}) •{" "}
                          <span className="text-brand-primary font-semibold">
                            {(unitWeight * item.quantity).toFixed(2)} kg
                          </span>
                        </span>
                        <span className="text-brand-primary">
                          ${(((item.sellerPriceAtPurchase + itemServiceFee) * item.quantity) / EXCHANGE_RATE).toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-text-secondary flex-wrap gap-1">
                        <span>
                          {isVi ? "Giá gốc người bán:" : "Seller Price:"}{" "}
                          {(item.sellerPriceAtPurchase * item.quantity).toLocaleString()} VND
                          {itemServiceFee > 0 && (
                            <strong className="text-amber-700 ml-1.5">
                              • {isVi ? "Phí dịch vụ:" : "Service Fee:"}{" "}
                              {(itemServiceFee * item.quantity).toLocaleString()} VND
                            </strong>
                          )}
                        </span>
                        <span>
                          {isVi
                            ? `Cước bay (${unitWeight}kg/sp): ${(item.shippingFeeAtPurchase * item.quantity).toLocaleString()} VND • Đóng gói: ${(item.packagingFeeAtPurchase * item.quantity).toLocaleString()} VND`
                            : `Air Shipping (${unitWeight}kg/unit): ${(item.shippingFeeAtPurchase * item.quantity).toLocaleString()} VND • Packaging: ${(item.packagingFeeAtPurchase * item.quantity).toLocaleString()} VND`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Saigon Hub Merchant Payout (VietQR / Napas 247) */}
              {(() => {
                const seller = selectedOrder.items[0]?.product?.seller;
                const sellerPayoutVND = selectedOrder.items.reduce(
                  (sum: number, i: any) => sum + i.sellerPriceAtPurchase * i.quantity,
                  0
                );
                const isPaid = selectedOrder.payoutStatus === "paid_by_hub";
                const bankBin = seller?.bankName ? BANK_BIN_MAP[seller.bankName] || "VCB" : "VCB";
                const orderShortCode = selectedOrder.id.substring(0, 8).toUpperCase();
                const autoVietQrUrl =
                  seller?.bankAccountNumber
                    ? `https://img.vietqr.io/image/${bankBin}-${seller.bankAccountNumber}-compact2.png?amount=${sellerPayoutVND}&addInfo=${encodeURIComponent(
                        `KIALNA ${orderShortCode}`
                      )}&accountName=${encodeURIComponent(seller.bankAccountName || seller.name || "")}`
                    : null;
                const qrImageToDisplay = seller?.vietQrImage || autoVietQrUrl;

                return (
                  <div className="p-4 sm:p-5 rounded-2xl border border-border-light bg-surface-soft/80 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between border-b border-border-light pb-2.5">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-brand-primary" />
                        <span className="text-xs font-bold text-ink uppercase tracking-wider">
                          {isVi
                            ? "SAIGON HUB → THANH TOÁN CHO NGƯỜI BÁN VIỆT NAM"
                            : "Saigon Hub → Vietnamese Merchant Payout"}
                        </span>
                      </div>
                      {isPaid ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                          {isVi ? "✓ Đã thanh toán" : "✓ Paid by Hub"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                          {isVi
                            ? `CẦN THANH TOÁN: ${sellerPayoutVND.toLocaleString()} VND`
                            : `Payout Due: ${sellerPayoutVND.toLocaleString()} VND`}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Left: Bank Account Details */}
                      <div className="sm:col-span-7 flex flex-col gap-2 text-xs">
                        <div className="bg-white p-3.5 rounded-xl border border-border-light space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">
                              {isVi ? "Người bán:" : "Merchant:"}
                            </span>
                            <span className="font-bold text-ink">{seller?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">
                              {isVi ? "Ngân hàng VN:" : "VN Bank:"}
                            </span>
                            <span className="font-bold text-ink">
                              {seller?.bankName || (isVi ? "Chưa cập nhật" : "Not configured")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">
                              {isVi ? "Số tài khoản:" : "Account No:"}
                            </span>
                            <span className="font-mono font-bold text-brand-primary select-all">
                              {seller?.bankAccountNumber || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">
                              {isVi ? "Chủ tài khoản:" : "Account Holder:"}
                            </span>
                            <span className="font-bold text-ink uppercase">
                              {seller?.bankAccountName || seller?.name?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-border-light pt-1.5 mt-1">
                            <span className="text-text-secondary">
                              {isVi ? "Số tiền chuyển khoản:" : "Transfer Amount:"}
                            </span>
                            <span className="font-extrabold text-emerald-700">
                              {sellerPayoutVND.toLocaleString()} VND
                            </span>
                          </div>
                        </div>

                        {isPaid ? (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-emerald-900">
                                {isVi
                                  ? `Đã tất toán qua ${selectedOrder.payoutMethod || "VietQR Napas 247"}`
                                  : `Settled via ${selectedOrder.payoutMethod || "VietQR Napas 247"}`}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-mono">
                                {isVi ? "Mã GD:" : "Ref:"} {selectedOrder.payoutRef || "N/A"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleResetSellerPayout(selectedOrder.id)}
                              disabled={isPending}
                              className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                            >
                              {isVi ? "Hoàn tác" : "Undo"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 pt-1">
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={payoutMethodInput}
                                onChange={(e) => setPayoutMethodInput(e.target.value)}
                                className="input-primary py-1.5 px-2.5 text-xs min-h-[38px] rounded-xl cursor-pointer"
                              >
                                <option value="VietQR Napas 247">VietQR Napas 247</option>
                                <option value="Cash on Pickup (COD)">
                                  {isVi ? "Tiền mặt khi lấy hàng (COD)" : "Cash on Pickup (COD)"}
                                </option>
                                <option value="Weekly Bank Batch">
                                  {isVi ? "Đối soát định kỳ hàng tuần" : "Weekly Bank Batch"}
                                </option>
                              </select>
                              <input
                                type="text"
                                value={payoutRefInput}
                                onChange={(e) => setPayoutRefInput(e.target.value)}
                                placeholder={
                                  isVi ? "Mã giao dịch / Ghi chú (tùy chọn)" : "Bank Ref / Note (optional)"
                                }
                                className="input-primary py-1.5 px-3 text-xs min-h-[38px] rounded-xl"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMarkSellerPaid(selectedOrder.id)}
                              disabled={isPending}
                              className="btn-primary w-full py-2.5 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>
                                {isVi
                                  ? `Xác nhận đã chuyển ${sellerPayoutVND.toLocaleString()} VND cho Người bán`
                                  : `Confirm ${sellerPayoutVND.toLocaleString()} VND Paid to Merchant`}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Scannable VietQR Code */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-border-light">
                        {qrImageToDisplay ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qrImageToDisplay}
                              alt="Merchant VietQR"
                              className="w-36 h-36 object-contain rounded-lg"
                            />
                            <span className="text-[10px] font-bold text-text-secondary mt-1.5 flex items-center gap-1">
                              <QrCode className="h-3 w-3 text-brand-primary" />
                              {isVi ? "Quét bằng App Ngân hàng VN" : "Scan with VN Banking App"}
                            </span>
                          </>
                        ) : (
                          <div className="py-6 px-3 text-center text-text-secondary flex flex-col items-center gap-1.5">
                            <QrCode className="h-8 w-8 opacity-40" />
                            <span className="text-[11px] font-semibold">
                              {isVi ? "Chưa có mã VietQR" : "No VietQR on file"}
                            </span>
                            <span className="text-[10px]">
                              {isVi
                                ? "Nhắc người bán thêm Số tài khoản hoặc ảnh mã VietQR trong Hồ sơ Cửa hàng."
                                : "Ask seller to add bank account or VietQR in Store Profile."}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Financial Ledger Summary */}
              <div className="p-4 bg-surface-soft rounded-2xl border border-border-light text-xs space-y-1.5">
                <div className="flex justify-between text-text-secondary">
                  <span>{isVi ? "Tổng khách mua đã thanh toán:" : "Buyer Total Billed:"}</span>
                  <span className="font-bold text-brand-primary">${selectedOrder.totalPaid.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>{isVi ? "Tiền hàng trả Người bán:" : "Seller Payout:"}</span>
                  <span className="font-semibold text-ink">
                    {(
                      selectedOrder.items.reduce(
                        (sum: number, i: any) => sum + i.sellerPriceAtPurchase * i.quantity,
                        0
                      )
                    ).toLocaleString()} VND
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>
                    {isVi ? "Phí dịch vụ sản phẩm (Site Admin):" : "Listing Service Fees (Site Admin):"}
                  </span>
                  <span className="font-semibold text-amber-700">
                    {(
                      selectedOrder.items.reduce(
                        (sum: number, i: any) => sum + (i.serviceFeeAtPurchase || 0) * i.quantity,
                        0
                      )
                    ).toLocaleString()} VND
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary border-t border-border-light pt-2">
                  <span>
                    {isVi ? "Phí vận chuyển & đóng gói Saigon Hub thu:" : "Logistics Fees Kept by Kialna:"}
                  </span>
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
                <h3 className="text-base font-bold text-ink">
                  {isVi ? "Cấu hình Biểu phí Vận chuyển" : "Platform Fee Rates"}
                </h3>
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
                  {isVi
                    ? "Đơn giá Vận chuyển Hàng không Quốc tế (VND / kg)"
                    : "International Air Shipping Rate (VND per kg)"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={shippingFeeInput}
                    onChange={(e) => setShippingFeeInput(e.target.value)}
                    className="input-primary w-full pr-28 text-xs min-h-[46px] rounded-xl"
                    disabled={isPending}
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary pointer-events-none">
                    ${(parseFloat(shippingFeeInput || "0") / EXCHANGE_RATE).toFixed(2)} USD / kg
                  </span>
                </div>
                <span className="text-[10px] text-text-secondary">
                  {isVi
                    ? "Nhân với khối lượng (kg) của từng sản phẩm để tính phí vận chuyển."
                    : "Multiplied by each product's weight (kg) to calculate shipping cost."}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink">
                  {isVi
                    ? "Phí Đóng gói Tiêu chuẩn Xuất khẩu tại Hub (VND)"
                    : "Hub Custom Packaging Fee (VND)"}
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

              {/* Site Admin Only: Global Default Service Fee per Listing Item */}
              {isSiteAdmin && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border-light">
                  <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-600" />
                    {isVi
                      ? "Phí Dịch vụ Mặc định cho Sản phẩm (VND / sp)"
                      : "Default Listing Service Fee (VND per item)"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={serviceFeeInput}
                      onChange={(e) => setServiceFeeInput(e.target.value)}
                      className="input-primary w-full pr-24 text-xs min-h-[46px] rounded-xl"
                      disabled={isPending}
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700 pointer-events-none">
                      ${(parseFloat(serviceFeeInput || "0") / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <span className="text-[10px] text-text-secondary">
                    {isVi
                      ? "Áp dụng cho sản phẩm chưa thiết lập phí dịch vụ riêng ở tab Sản phẩm & Phí Dịch vụ."
                      : "Applied to listings that do not have a custom per-item service fee override."}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full mt-2 text-xs font-bold min-h-[50px] rounded-full shadow-lg shadow-brand-primary/20 cursor-pointer"
                disabled={isPending}
              >
                {isPending
                  ? isVi
                    ? "Đang lưu biểu phí..."
                    : "Updating Fee Rates..."
                  : isVi
                  ? "Lưu Biểu phí Vận chuyển"
                  : "Save Platform Fee Rates"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Role Switcher Widget */}
      <RoleSwitcher currentUser={currentUser} lang={lang} />
    </div>
  );
}
