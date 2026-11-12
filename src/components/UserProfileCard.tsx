"use client";

import { useState, useRef, useTransition } from "react";
import { updateUserProfile, signOut } from "@/app/actions/auth";
import {
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  LogOut,
  Landmark,
  CreditCard,
  QrCode,
} from "lucide-react";

const VIETNAMESE_BANKS = [
  "Vietcombank (VCB)",
  "Techcombank (TCB)",
  "MB Bank (MB)",
  "ACB (Asia Commercial Bank)",
  "VietinBank (CTG)",
  "BIDV",
  "VPBank",
  "TPBank",
  "Sacombank (STB)",
  "Agribank",
  "VIB",
  "HDBank",
];

interface UserProfileCardProps {
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
  onUserUpdate?: (updatedUser: any) => void;
  roleLabel: string;
  addressLabel: string;
  addressPlaceholder: string;
  logoLabel?: string;
  lang?: "en" | "vi";
}

export default function UserProfileCard({
  currentUser,
  onUserUpdate,
  roleLabel,
  addressLabel,
  addressPlaceholder,
  logoLabel = "Profile Logo",
  lang,
}: UserProfileCardProps) {
  const activeLang: "en" | "vi" = lang || (currentUser.role === "seller" ? "vi" : "en");
  const isVi = activeLang === "vi";
  const [name, setName] = useState(currentUser.name || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [address, setAddress] = useState(currentUser.address || "");
  const [logo, setLogo] = useState<string | null>(currentUser.logo || null);
  const [bankName, setBankName] = useState(currentUser.bankName || "Vietcombank (VCB)");
  const [bankAccountNumber, setBankAccountNumber] = useState(currentUser.bankAccountNumber || "");
  const [bankAccountName, setBankAccountName] = useState(
    currentUser.bankAccountName || (currentUser.role === "seller" ? currentUser.name.toUpperCase() : "")
  );
  const [vietQrImage, setVietQrImage] = useState<string | null>(currentUser.vietQrImage || null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Image size must be under 10MB." });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload logo.");
      }

      const uploadedUrl = data.url;
      setLogo(uploadedUrl);

      // Save to database immediately
      const updateRes = await updateUserProfile({ logo: uploadedUrl });
      if (updateRes.success && updateRes.user) {
        onUserUpdate?.(updateRes.user);
        setStatusMessage({ type: "success", text: "Logo updated successfully!" });
      } else {
        throw new Error(updateRes.error || "Failed to save logo to profile.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to upload logo." });
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Are you sure you want to remove your logo?")) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const updateRes = await updateUserProfile({ logo: null });
      if (updateRes.success && updateRes.user) {
        setLogo(null);
        onUserUpdate?.(updateRes.user);
        setStatusMessage({ type: "success", text: "Logo removed successfully." });
      } else {
        throw new Error(updateRes.error || "Failed to remove logo.");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to remove logo." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "VietQR image must be under 10MB." });
      return;
    }

    setIsUploadingQr(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload VietQR image.");
      }

      setVietQrImage(data.url);
      const updateRes = await updateUserProfile({ vietQrImage: data.url });
      if (updateRes.success && updateRes.user) {
        onUserUpdate?.(updateRes.user);
        setStatusMessage({ type: "success", text: "VietQR code image uploaded!" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to upload VietQR." });
    } finally {
      setIsUploadingQr(false);
      if (qrInputRef.current) qrInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }

    setStatusMessage(null);
    startTransition(async () => {
      const res = await updateUserProfile({
        name,
        phone,
        address,
        ...(currentUser.role === "seller" && {
          bankName,
          bankAccountNumber,
          bankAccountName,
          vietQrImage,
        }),
      });

      if (res.success && res.user) {
        onUserUpdate?.(res.user);
        setStatusMessage({
          type: "success",
          text: isVi
            ? "Đã lưu thông tin hồ sơ & tài khoản nhận tiền!"
            : "Profile & payout details saved successfully!",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || (isVi ? "Không thể cập nhật hồ sơ." : "Failed to update profile."),
        });
      }
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="card-product rounded-[28px] p-6 sm:p-8 bg-white border border-border-light shadow-sm flex flex-col gap-6">
      {/* Header Info & Logo Upload Area */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-border-light">
        {/* Logo Avatar Circle with Hover Overlay */}
        <div className="relative group shrink-0">
          <div
            onClick={handleAvatarClick}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-border-light overflow-hidden bg-surface-soft flex items-center justify-center cursor-pointer shadow-sm relative transition-transform active:scale-95 group-hover:border-brand-primary"
            title="Click to upload logo"
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={name || "Profile logo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="text-3xl font-extrabold text-ink select-none">
                {name ? name.charAt(0).toUpperCase() : <UserIcon className="h-10 w-10 text-text-secondary" />}
              </span>
            )}

            {/* Hover overlay with camera icon */}
            <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[2px]">
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {isVi ? "Tải ảnh" : "Upload"}
              </span>
            </div>

            {/* Spinner when uploading */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center rounded-full backdrop-blur-xs">
                <Loader2 className="h-7 w-7 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Quick Camera Badge at bottom-right corner */}
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-primary text-white shadow-md hover:bg-brand-primary-deep transition-all cursor-pointer border-2 border-white"
            title="Upload new logo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* User Identity and Logo Actions */}
        <div className="flex-1 text-center sm:text-left flex flex-col items-center sm:items-start justify-center gap-1.5">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <h2 className="text-xl font-bold text-ink tracking-tight">{name || "Your Name"}</h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-soft text-ink border border-border-light uppercase tracking-wide">
              {roleLabel}
            </span>
          </div>
          <p className="text-xs text-text-secondary">{currentUser.email}</p>

          {/* Action buttons for logo */}
          <div className="flex items-center gap-2 pt-2 flex-wrap justify-center sm:justify-start">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="btn-secondary !min-h-[34px] !py-1.5 !px-3.5 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>
                {logo
                  ? isVi
                    ? "Đổi ảnh đại diện"
                    : "Change Logo"
                  : isVi
                  ? "Tải ảnh đại diện"
                  : "Upload Logo"}
              </span>
            </button>

            {logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={isUploading}
                className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1.5 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isVi ? "Xóa ảnh" : "Remove"}</span>
              </button>
            )}
          </div>
          <span className="text-[10px] text-text-secondary mt-0.5">
            {isVi ? "Hỗ trợ JPG, PNG, WebP hoặc GIF tối đa 10MB" : "JPG, PNG, WebP or GIF up to 10MB"}
          </span>
        </div>
      </div>

      {/* Status Notification Message */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Editable Details Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-ink uppercase tracking-wider">
            {isVi ? "Họ và Tên / Tên Cửa Hàng" : "Full Name"} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isVi ? "VD: Nguyễn Văn A" : "e.g. Nguyen Van A"}
              className="input-primary w-full pl-11 rounded-full text-xs font-medium"
              disabled={isPending}
              required
            />
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          </div>
        </div>

        {/* Email (Read Only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-ink uppercase tracking-wider">
            {isVi ? "Địa chỉ Email" : "Email Address"}
          </label>
          <div className="relative">
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="input-primary w-full pl-11 rounded-full text-xs font-medium bg-surface-soft text-text-secondary cursor-not-allowed border-border-hairline opacity-80"
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          </div>
          <span className="text-[10px] text-text-secondary px-1">
            {isVi
              ? "Email được liên kết với tài khoản đăng nhập và không thể thay đổi."
              : "Email address is tied to your account login and cannot be altered directly."}
          </span>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-ink uppercase tracking-wider">
            {isVi ? "Số điện thoại liên hệ" : "Contact Phone Number"}
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={isVi ? "VD: 0901234567" : "e.g. 0901234567 or +1 (555) 123-4567"}
              className="input-primary w-full pl-11 rounded-full text-xs font-medium"
              disabled={isPending}
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          </div>
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-ink uppercase tracking-wider">
            {addressLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={addressPlaceholder}
              className="input-primary w-full pl-11 rounded-full text-xs font-medium"
              disabled={isPending}
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          </div>
        </div>

        {/* Vietnamese Seller Bank & VietQR Payout Section */}
        {currentUser.role === "seller" && (
          <div className="mt-2 pt-5 border-t border-border-light flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-brand-primary" />
                  {isVi
                    ? "Tài khoản Ngân hàng & VietQR Nhận Tiền (Saigon Hub)"
                    : "Vietnam Bank & VietQR Payout (Saigon Hub)"}
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {isVi
                    ? "Saigon Hub dùng thông tin này để chuyển khoản 100% tiền hàng (VND) qua Napas 247 ngay khi nhận hàng."
                    : "Used by the Saigon Hub to transfer 100% of your VND base price via Napas 247 upon parcel check-in."}
                </p>
              </div>
            </div>

            {/* Bank Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                {isVi ? "Ngân hàng tại Việt Nam (Napas 247)" : "Vietnamese Bank (Napas 247)"}
              </label>
              <div className="relative">
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="input-primary w-full pl-11 pr-8 rounded-full text-xs font-medium cursor-pointer"
                  disabled={isPending}
                >
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Account Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  {isVi ? "Số tài khoản ngân hàng" : "Bank Account Number"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="VD: 0071001234567"
                    className="input-primary w-full pl-11 rounded-full text-xs font-mono font-semibold"
                    disabled={isPending}
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                </div>
              </div>

              {/* Account Holder Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  {isVi ? "Tên chủ tài khoản (Không dấu)" : "Account Holder Name (No Accents)"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN A"
                    className="input-primary w-full pl-11 rounded-full text-xs font-semibold uppercase"
                    disabled={isPending}
                  />
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Optional Custom VietQR Image Upload */}
            <div className="p-3.5 rounded-2xl bg-surface-soft border border-border-light flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {vietQrImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vietQrImage}
                    alt="Merchant VietQR"
                    className="h-12 w-12 rounded-xl object-contain bg-white border border-border-light shrink-0 p-0.5"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-white border border-border-light flex items-center justify-center text-brand-primary shrink-0">
                    <QrCode className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ink">
                    {vietQrImage
                      ? isVi
                        ? "Đã tải lên mã VietQR"
                        : "Custom VietQR Code Uploaded"
                      : isVi
                      ? "Tải ảnh mã VietQR (Tùy chọn)"
                      : "Upload VietQR Code (Optional)"}
                  </div>
                  <div className="text-[10px] text-text-secondary leading-snug">
                    {isVi
                      ? "Nhân viên Saigon Hub có thể quét mã VietQR để chuyển khoản nhanh khi lấy hàng."
                      : "Saigon Hub staff can scan your VietQR directly on pickup or check-in."}
                  </div>
                </div>
              </div>

              <input
                ref={qrInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleQrFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={isUploadingQr || isPending}
                  className="btn-secondary !min-h-[34px] !py-1.5 !px-3 text-xs font-semibold rounded-full cursor-pointer"
                >
                  {isUploadingQr
                    ? isVi
                      ? "Đang tải..."
                      : "Uploading..."
                    : vietQrImage
                    ? isVi
                      ? "Đổi mã QR"
                      : "Replace QR"
                    : isVi
                    ? "Tải mã QR"
                    : "Upload QR"}
                </button>
                {vietQrImage && (
                  <button
                    type="button"
                    onClick={() => setVietQrImage(null)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full cursor-pointer"
                    title={isVi ? "Xóa mã QR" : "Remove QR"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save Changes Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="btn-primary w-full rounded-full min-h-[46px] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isVi ? "Đang lưu hồ sơ..." : "Saving Profile..."}</span>
              </>
            ) : (
              <span>{isVi ? "Lưu thông tin hồ sơ" : "Save Profile Details"}</span>
            )}
          </button>
        </div>
      </form>

      {/* Account Sign Out Button */}
      <div className="pt-2 border-t border-border-light">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-2.5 px-4 rounded-full border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{isVi ? "Đăng xuất tài khoản" : "Sign Out of Account"}</span>
        </button>
      </div>
    </div>
  );
}
