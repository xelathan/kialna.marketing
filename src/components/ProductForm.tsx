"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Plus,
  Image as ImageIcon,
  AlertCircle,
  DollarSign,
  Calculator,
  RefreshCw,
  Camera,
  UploadCloud,
  Loader2,
  Star,
  Link as LinkIcon,
  CheckCircle2,
  Scale,
} from "lucide-react";
import LanguageToggle, { usePortalLanguage, translateCategory } from "./LanguageSwitcher";

interface ProductFormProps {
  initialProduct?: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    basePrice: number;
    weight?: number;
    inventory: number;
    images: string; // JSON array string
    status: string;
  };
  shippingFee: number;
  packagingFee: number;
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
}

interface UploadingState {
  id: string;
  fileName: string;
  previewUrl: string;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

export default function ProductForm({
  initialProduct,
  shippingFee,
  packagingFee,
  onSave,
}: ProductFormProps) {
  const router = useRouter();
  const { lang, setLang } = usePortalLanguage("seller");
  const isVi = lang === "vi";
  const [isPending, startTransition] = useTransition();

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(initialProduct?.name || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [category, setCategory] = useState(initialProduct?.category || "Crafts & Decor");
  const [basePriceStr, setBasePriceStr] = useState(
    initialProduct ? String(initialProduct.basePrice) : ""
  );
  const [weightStr, setWeightStr] = useState(
    initialProduct && initialProduct.weight ? String(initialProduct.weight) : "0.5"
  );
  const [inventoryStr, setInventoryStr] = useState(
    initialProduct ? String(initialProduct.inventory) : "0"
  );
  const [status, setStatus] = useState(initialProduct?.status || "active");

  // Image State
  const [images, setImages] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageError, setImageError] = useState("");

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // Exchange rate constant
  const VND_TO_USD_RATE = 25000;

  // Categories list
  const categories = [
    "Crafts & Decor",
    "Coffee & Tea",
    "Specialty Foods",
    "Apparel & Textiles",
    "Kitchen & Home",
    "Wellness & Lifestyle",
    "General",
  ];

  // Parse initial images if editing
  useEffect(() => {
    if (initialProduct?.images) {
      try {
        const parsed = JSON.parse(initialProduct.images);
        if (Array.isArray(parsed)) {
          setImages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse images:", e);
      }
    }
  }, [initialProduct]);

  // Real-time Fee Calculations (shippingFee is rate per kg)
  const basePrice = parseFloat(basePriceStr) || 0;
  const weightKg = parseFloat(weightStr) > 0 ? parseFloat(weightStr) : 0.5;
  const calculatedShippingFee = Math.round(shippingFee * weightKg);
  const totalVND = basePrice > 0 ? basePrice + calculatedShippingFee + packagingFee : 0;
  const totalUSD = totalVND / VND_TO_USD_RATE;

  // Validation Logic
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === "name") {
      if (!value.trim()) {
        newErrors.name = "Product name is required.";
      } else {
        delete newErrors.name;
      }
    }

    if (field === "basePrice") {
      const parsed = parseFloat(value);
      if (value === "" || isNaN(parsed)) {
        newErrors.basePrice = "Please enter a valid base price.";
      } else if (parsed < 0) {
        newErrors.basePrice = "Price cannot be negative.";
      } else {
        delete newErrors.basePrice;
      }
    }

    if (field === "weight") {
      const parsed = parseFloat(value);
      if (value === "" || isNaN(parsed)) {
        newErrors.weight = "Please enter product weight in kg.";
      } else if (parsed <= 0) {
        newErrors.weight = "Weight must be greater than 0 kg.";
      } else if (parsed > 50) {
        newErrors.weight = "Max single parcel weight is 50 kg.";
      } else {
        delete newErrors.weight;
      }
    }

    if (field === "inventory") {
      const parsed = parseInt(value, 10);
      if (value === "" || isNaN(parsed)) {
        newErrors.inventory = "Please enter quantity.";
      } else if (parsed < 0) {
        newErrors.inventory = "Inventory cannot be negative.";
      } else {
        delete newErrors.inventory;
      }
    }

    setErrors(newErrors);
  };

  const handleInputChange = (
    field: string,
    value: string,
    setter: (val: string) => void
  ) => {
    setter(value);
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // Image Upload Logic
  const uploadSingleFile = async (file: File) => {
    const tempId = Math.random().toString(36).substring(2, 9);
    const previewUrl = URL.createObjectURL(file);

    const uploadItem: UploadingState = {
      id: tempId,
      fileName: file.name,
      previewUrl,
      status: "uploading",
    };

    setUploadingFiles((prev) => [...prev, uploadItem]);
    setImageError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image.");
      }

      // Append saved uploaded URL to images
      setImages((prev) => [...prev, data.url]);

      // Remove from uploading queue
      setUploadingFiles((prev) => prev.filter((item) => item.id !== tempId));
    } catch (err: any) {
      setUploadingFiles((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, status: "error", errorMessage: err.message || "Upload failed" }
            : item
        )
      );
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const validImageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (validImageFiles.length === 0) {
      setImageError("Please select valid image files (JPG, PNG, WebP).");
      return;
    }

    for (const file of validImageFiles) {
      if (file.size > 10 * 1024 * 1024) {
        setImageError(`"${file.name}" exceeds the 10MB limit.`);
        continue;
      }
      await uploadSingleFile(file);
    }

    // Reset inputs
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Manual URL Add
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    if (!newImageUrl.startsWith("http://") && !newImageUrl.startsWith("https://") && !newImageUrl.startsWith("/")) {
      setImageError("Please enter a valid URL starting with https://, http://, or /uploads/");
      return;
    }

    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl("");
    setImageError("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCoverImage = (indexToCover: number) => {
    if (indexToCover === 0) return;
    const updated = [...images];
    const [selected] = updated.splice(indexToCover, 1);
    updated.unshift(selected);
    setImages(updated);
  };

  const handleDismissUploadError = (id: string) => {
    setUploadingFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger validation on all fields
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Product name is required.";

    const parsedPrice = parseFloat(basePriceStr);
    if (basePriceStr === "" || isNaN(parsedPrice)) {
      newErrors.basePrice = "Please enter a valid base price.";
    } else if (parsedPrice < 0) {
      newErrors.basePrice = "Price cannot be negative.";
    }

    const parsedInventory = parseInt(inventoryStr, 10);
    if (inventoryStr === "" || isNaN(parsedInventory)) {
      newErrors.inventory = "Please enter quantity.";
    } else if (parsedInventory < 0) {
      newErrors.inventory = "Inventory cannot be negative.";
    }

    const parsedWeight = parseFloat(weightStr);
    if (weightStr === "" || isNaN(parsedWeight) || parsedWeight <= 0) {
      newErrors.weight = "Please enter a valid weight in kg (e.g. 0.5).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      return;
    }

    setSubmitError("");

    startTransition(async () => {
      // Use placeholder if no images added
      const finalImages = images.length > 0 ? images : ["/file.svg"];

      const payload = {
        name,
        description,
        category,
        basePrice: parseFloat(basePriceStr),
        weight: parseFloat(weightStr),
        inventory: parseInt(inventoryStr, 10),
        images: finalImages,
        status,
      };

      const result = await onSave(payload);
      if (result.success) {
        router.push("/seller");
        router.refresh();
      } else {
        setSubmitError(result.error || "An error occurred while saving the product.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-5xl mx-auto pb-20 md:pb-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-6 text-text-primary"
    >
      {/* Top Language Bar inside Seller Listing Form */}
      <div className="flex items-center justify-between bg-white border border-border-light rounded-2xl px-4 py-2.5 shadow-xs">
        <span className="text-xs font-bold text-ink">
          {initialProduct
            ? isVi
              ? "Chỉnh sửa thông tin sản phẩm"
              : "Edit Product Listing"
            : isVi
            ? "Đăng bán sản phẩm Việt Nam mới"
            : "Create New Vietnamese Product Listing"}
        </span>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      {submitError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Media & Listing Status (Desktop: col-span-5) */}
        <div className="md:col-span-5 flex flex-col gap-6 order-2 md:order-1">
          {/* Enhanced Image Management Section */}
          <div className="card-product rounded-[28px] p-6 bg-white border border-border-light shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border-light pb-3">
              <label className="text-sm font-bold text-ink">
                {isVi ? "Hình ảnh sản phẩm" : "Product Photos"}{" "}
                {images.length > 0 && <span className="text-xs text-text-secondary font-normal">({images.length})</span>}
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline cursor-pointer"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                {showUrlInput ? (isVi ? "Ẩn đường dẫn" : "Hide URL") : isVi ? "Thêm bằng URL" : "Add via URL"}
              </button>
            </div>

            {/* Hidden Camera & Gallery File Inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            {/* Upload Action Cards (Meta Soft Cloud Surface) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Direct Camera Button (Optimized for Mobile Sellers) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isPending}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border-light bg-surface-soft hover:bg-zinc-200/60 transition-all text-ink cursor-pointer active:scale-98"
              >
                <div className="p-2.5 bg-brand-primary text-white rounded-full mb-1.5 shadow-sm">
                  <Camera className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold">{isVi ? "Chụp ảnh" : "Take Photo"}</span>
                <span className="text-[10px] text-text-secondary font-medium">
                  {isVi ? "Mở máy ảnh" : "Instant camera"}
                </span>
              </button>

              {/* Device Gallery / File Picker */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isPending}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border-light bg-surface-soft hover:bg-zinc-200/60 transition-all text-ink cursor-pointer active:scale-98"
              >
                <div className="p-2.5 bg-ink text-white rounded-full mb-1.5 shadow-sm">
                  <UploadCloud className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold">{isVi ? "Tải ảnh lên" : "Upload Files"}</span>
                <span className="text-[10px] text-text-secondary font-medium">
                  {isVi ? "Từ thiết bị" : "From device"}
                </span>
              </button>
            </div>

            {/* Drag & Drop Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => galleryInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-border-light hover:border-zinc-400 bg-surface-soft/40"
              }`}
            >
              <p className="text-xs text-text-secondary">
                {isVi
                  ? "Kéo thả ảnh sản phẩm vào đây hoặc bấm để chọn ảnh (Tối đa 10MB/ảnh)."
                  : "Drag & drop product images here, or click to browse. Max 10MB per photo."}
              </p>
            </div>

            {/* Fallback Manual URL Input Toggle */}
            {showUrlInput && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => {
                      setNewImageUrl(e.target.value);
                      setImageError("");
                    }}
                    className={`input-primary w-full pl-11 text-xs min-h-[44px] rounded-xl ${imageError ? "border-red-500" : ""}`}
                    placeholder="Paste Image URL (https://...)"
                    disabled={isPending}
                  />
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="btn-primary min-w-[44px] px-3 flex items-center justify-center shrink-0 rounded-xl"
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Image Error Alert */}
            {imageError && (
              <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {imageError}
              </span>
            )}

            {/* Active Uploading Spinners */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2 mt-1">
                {uploadingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-surface-soft border border-border-light rounded-xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="w-10 h-10 object-cover rounded-lg border border-border-light shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{item.fileName}</p>
                      {item.status === "uploading" ? (
                        <span className="text-[10px] text-brand-primary flex items-center gap-1 font-semibold">
                          <Loader2 className="h-3 w-3 animate-spin" /> Uploading to server...
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-500 font-medium">
                          {item.errorMessage || "Upload failed"}
                        </span>
                      )}
                    </div>
                    {item.status === "error" && (
                      <button
                        type="button"
                        onClick={() => handleDismissUploadError(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Image Grid with Cover Badge and Reorder Actions */}
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5 mt-2">
                {images.map((url, idx) => {
                  const isCover = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`relative aspect-square border rounded-2xl overflow-hidden group bg-surface-soft ${
                        isCover ? "border-brand-primary ring-2 ring-brand-primary/30" : "border-border-light"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Product photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/file.svg";
                        }}
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <div className="absolute top-1.5 left-1.5 bg-brand-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-current" /> {isVi ? "Ảnh bìa" : "Cover"}
                        </div>
                      )}

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(idx)}
                            className="p-1.5 bg-white hover:bg-white text-ink rounded-full text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
                            title={isVi ? "Đặt làm ảnh bìa" : "Set as Cover photo"}
                          >
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
                          title={isVi ? "Xóa ảnh" : "Delete photo"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-border-light rounded-2xl text-text-secondary text-xs bg-surface-soft/40">
                {isVi
                  ? "Chưa có hình ảnh nào. Hãy dùng nút Chụp ảnh hoặc Tải ảnh lên ở trên."
                  : "No product photos added yet. Use the camera or upload buttons above."}
              </div>
            )}
          </div>

          {/* Listing Status Card */}
          <div className="card-product rounded-[28px] p-6 bg-white border border-border-light shadow-sm flex flex-col gap-3.5">
            <label className="text-sm font-bold text-ink">
              {isVi ? "Trạng thái hiển thị" : "Listing Status"}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="h-4 w-4 accent-brand-primary cursor-pointer"
                  disabled={isPending}
                />
                <span>{isVi ? "Đang bán (Hiển thị trên sàn)" : "Active (Ready for Sale)"}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-secondary">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === "draft"}
                  onChange={() => setStatus("draft")}
                  className="h-4 w-4 accent-brand-primary cursor-pointer"
                  disabled={isPending}
                />
                <span>{isVi ? "Bản nháp (Tạm ẩn)" : "Draft"}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Pricing (Desktop: col-span-7) */}
        <div className="md:col-span-7 flex flex-col gap-5 order-1 md:order-2 card-product rounded-[28px] p-6 sm:p-8 bg-white border border-border-light shadow-sm">
          {/* Product Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-xs font-bold text-ink">
              {isVi ? "Tên sản phẩm" : "Product Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => handleInputChange("name", e.target.value, setName)}
              onBlur={() => validateField("name", name)}
              className={`input-primary w-full text-xs min-h-[46px] rounded-xl ${errors.name ? "border-red-500" : ""}`}
              placeholder={
                isVi
                  ? "VD: Cà phê Đặc sản Buôn Ma Thuột, Bộ ấm trà gốm Bát Tràng..."
                  : "e.g. Buon Ma Thuot Highland Coffee, Bat Trang Ceramic Set..."
              }
              disabled={isPending}
              required
            />
            {errors.name && (
              <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.name}
              </span>
            )}
          </div>

          {/* Category Selection */}
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="text-xs font-bold text-ink">
              {isVi ? "Danh mục ngành hàng" : "Category"}
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-primary w-full pr-10 text-xs min-h-[46px] rounded-xl cursor-pointer"
                disabled={isPending}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {translateCategory(cat, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-xs font-bold text-ink">
              {isVi ? "Mô tả chi tiết sản phẩm" : "Description"}
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-primary w-full min-h-[120px] py-3 rounded-xl resize-y text-xs"
              placeholder={
                isVi
                  ? "Mô tả chất liệu, thành phần, nguồn gốc làng nghề Việt Nam, quy cách đóng gói..."
                  : "Describe the product details, ingredients or materials, Vietnamese origin story..."
              }
              disabled={isPending}
            />
          </div>

          {/* Grid for Inventory, Weight & Base Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Inventory Quantity */}
            <div className="flex flex-col gap-2">
              <label htmlFor="inventory" className="text-xs font-bold text-ink">
                {isVi ? "Số lượng tồn kho" : "Stock Quantity"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="inventory"
                name="inventory"
                value={inventoryStr}
                onChange={(e) => handleInputChange("inventory", e.target.value, setInventoryStr)}
                onBlur={() => validateField("inventory", inventoryStr)}
                className={`input-primary w-full text-xs min-h-[46px] rounded-xl ${errors.inventory ? "border-red-500" : ""}`}
                placeholder="VD: 25"
                disabled={isPending}
                required
              />
              {errors.inventory && (
                <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.inventory}
                </span>
              )}
            </div>

            {/* Shipping Weight in kg */}
            <div className="flex flex-col gap-2">
              <label htmlFor="weight" className="text-xs font-bold text-ink flex items-center justify-between">
                <span>
                  {isVi ? "Khối lượng (kg)" : "Unit Weight (kg)"} <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] font-medium text-text-secondary">
                  {weightKg > 0 ? `${Math.round(weightKg * 1000)}g` : ""}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="50"
                  id="weight"
                  name="weight"
                  value={weightStr}
                  onChange={(e) => handleInputChange("weight", e.target.value, setWeightStr)}
                  onBlur={() => validateField("weight", weightStr)}
                  className={`input-primary w-full pl-9 pr-12 text-xs min-h-[46px] rounded-xl ${errors.weight ? "border-red-500" : ""}`}
                  placeholder="VD: 0.5"
                  disabled={isPending}
                  required
                />
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-xs font-bold text-text-secondary">
                  kg
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[0.25, 0.5, 1.0, 2.0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleInputChange("weight", String(preset), setWeightStr)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      parseFloat(weightStr) === preset
                        ? "bg-brand-primary text-white border-brand-primary font-bold"
                        : "bg-surface-soft text-text-secondary border-border-light hover:border-brand-primary"
                    }`}
                  >
                    {preset < 1 ? `${preset * 1000}g` : `${preset}kg`}
                  </button>
                ))}
              </div>
              {errors.weight && (
                <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.weight}
                </span>
              )}
            </div>

            {/* Base Price in VND */}
            <div className="flex flex-col gap-2">
              <label htmlFor="basePrice" className="text-xs font-bold text-ink">
                {isVi ? "Giá gốc người bán (VND)" : "Base Price (VND)"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  id="basePrice"
                  name="basePrice"
                  value={basePriceStr}
                  onChange={(e) => handleInputChange("basePrice", e.target.value, setBasePriceStr)}
                  onBlur={() => validateField("basePrice", basePriceStr)}
                  className={`input-primary w-full pr-14 text-xs min-h-[46px] rounded-xl ${errors.basePrice ? "border-red-500" : ""}`}
                  placeholder="VD: 180000"
                  disabled={isPending}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-xs font-bold text-text-secondary">
                  VND
                </div>
              </div>
              {errors.basePrice && (
                <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.basePrice}
                </span>
              )}
            </div>
          </div>

          {/* Price Transparency Estimator Breakdown */}
          {basePrice > 0 && (
            <div className="p-5 bg-surface-soft rounded-2xl border border-border-light flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-border-light pb-2.5">
                <Calculator className="h-4 w-4 text-brand-primary" />
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  {isVi
                    ? "Bảng tính Giá & Cước Vận Chuyển theo Khối Lượng (Saigon Hub)"
                    : "Saigon Hub Pricing & Weight Shipping Breakdown"}
                </h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">
                    {isVi ? "Giá gốc của bạn (Nhận đủ 100%):" : "Your Base Price (100% Paid to You):"}
                  </span>
                  <span className="font-bold text-ink">
                    {basePrice.toLocaleString()} VND
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>{isVi ? "+ Phí đóng gói xuất khẩu:" : "+ Export Packaging Fee:"}</span>
                  <span>{packagingFee.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>
                    {isVi
                      ? `+ Cước bay quốc tế (${weightKg} kg × ${shippingFee.toLocaleString()} VND/kg):`
                      : `+ Air Shipping (${weightKg} kg × ${shippingFee.toLocaleString()} VND/kg):`}
                  </span>
                  <span className="font-medium text-ink">
                    {calculatedShippingFee.toLocaleString()} VND
                  </span>
                </div>
                <div className="border-t border-border-light my-2 pt-2.5 flex justify-between items-baseline font-semibold">
                  <span className="text-ink">
                    {isVi ? "Giá hiển thị cho khách Quốc tế:" : "Estimated Buyer Price:"}
                  </span>
                  <div className="text-right">
                    <div className="text-base font-bold text-brand-primary">
                      {totalVND.toLocaleString()} VND
                    </div>
                    <div className="text-xs font-bold text-brand-primary mt-0.5">
                      ${totalUSD.toFixed(2)} USD
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-text-secondary leading-relaxed bg-white p-3 rounded-xl border border-border-light">
                {isVi ? (
                  <>
                    💡 <strong>Cam kết Thanh toán từ Saigon Hub</strong>: Khách quốc tế thanh toán bằng USD. Ngay khi Saigon Hub kiểm nhận kiện hàng ({weightKg} kg) của bạn, Hub sẽ chuyển khoản đủ 100% tiền hàng (<strong>{basePrice.toLocaleString()} VND</strong>) vào tài khoản ngân hàng Việt Nam của bạn qua <strong>VietQR Napas 247</strong>.
                  </>
                ) : (
                  <>
                    💡 <strong>Saigon Hub Payout Guarantee</strong>: Buyer checkout runs in USD. Once the Saigon Hub verifies and checks in your parcel ({weightKg} kg), the hub transfers 100% of your base price (<strong>{basePrice.toLocaleString()} VND</strong>) directly to your Vietnamese bank account via <strong>VietQR Napas 247</strong>.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full mt-2 flex items-center justify-center gap-2 font-bold min-h-[50px] shadow-lg shadow-brand-primary/20 rounded-full cursor-pointer active:scale-98 transition-all text-sm"
            disabled={isPending || uploadingFiles.some((f) => f.status === "uploading")}
          >
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{isVi ? "Đang lưu sản phẩm..." : "Saving Product..."}</span>
              </>
            ) : (
              <span>
                {initialProduct
                  ? isVi
                    ? "Cập nhật sản phẩm"
                    : "Update Listing"
                  : isVi
                  ? "Đăng bán sản phẩm"
                  : "Create Listing"}
              </span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
