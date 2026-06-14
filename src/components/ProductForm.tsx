"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Image as ImageIcon, AlertCircle, DollarSign, Calculator, RefreshCw } from "lucide-react";

interface ProductFormProps {
  initialProduct?: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    basePrice: number;
    inventory: number;
    images: string; // JSON array string
    status: string;
  };
  shippingFee: number;
  packagingFee: number;
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
}

export default function ProductForm({ initialProduct, shippingFee, packagingFee, onSave }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [name, setName] = useState(initialProduct?.name || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [category, setCategory] = useState(initialProduct?.category || "Crafts & Decor");
  const [basePriceStr, setBasePriceStr] = useState(initialProduct ? String(initialProduct.basePrice) : "");
  const [inventoryStr, setInventoryStr] = useState(initialProduct ? String(initialProduct.inventory) : "0");
  const [status, setStatus] = useState(initialProduct?.status || "active");

  // Image URLs State
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageError, setImageError] = useState("");

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // Exchange rate constant
  const VND_TO_USD_RATE = 25000;

  // Categories list
  const categories = ["Crafts & Decor", "Food & Tea", "Apparel & Textiles", "Kitchen & Home", "General"];

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

  // Real-time Fee Calculations
  const basePrice = parseFloat(basePriceStr) || 0;
  const totalVND = basePrice > 0 ? basePrice + shippingFee + packagingFee : 0;
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

  const handleInputChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    // Clear error immediately when typing (non-intrusive UX)
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    if (!newImageUrl.startsWith("http://") && !newImageUrl.startsWith("https://")) {
      setImageError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl("");
    setImageError("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first error
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md mx-auto w-full pb-24 px-4">
      {submitError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{submitError}</span>
        </div>
      )}

      {/* Product Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-semibold text-text-primary">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => handleInputChange("name", e.target.value, setName)}
          onBlur={() => validateField("name", name)}
          className={`input-primary w-full ${errors.name ? "border-red-500 focus:box-shadow-red" : ""}`}
          placeholder="e.g. Handmade Bamboo Basket"
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

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold text-text-primary">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-primary w-full min-h-[100px] py-3 resize-y"
          placeholder="Describe the craft details, materials used, etc..."
          disabled={isPending}
        />
      </div>

      {/* Category Selection */}
      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="text-sm font-semibold text-text-primary">
          Category
        </label>
        <div className="relative">
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-primary w-full bg-none appearance-none pr-10"
            disabled={isPending}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
            ▼
          </div>
        </div>
      </div>

      {/* Base Price in VND */}
      <div className="flex flex-col gap-2">
        <label htmlFor="basePrice" className="text-sm font-semibold text-text-primary">
          Base Price (VND) <span className="text-red-500">*</span>
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
            className={`input-primary w-full pr-14 ${errors.basePrice ? "border-red-500" : ""}`}
            placeholder="e.g. 180000"
            disabled={isPending}
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-sm font-bold text-text-secondary">
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

      {/* Price Transparency Estimator Breakdown */}
      {basePrice > 0 && (
        <div className="card-primary p-4 bg-zinc-50 dark:bg-zinc-900 border border-border-light flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 border-b border-border-light pb-2">
            <Calculator className="h-4 w-4 text-brand-primary" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Dynamic Pricing Breakdown
            </h4>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Your Base Price:</span>
              <span className="font-semibold text-text-primary">
                {basePrice.toLocaleString()} VND
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>+ Packaging Fee:</span>
              <span>{packagingFee.toLocaleString()} VND</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>+ Shipping Hub Fee:</span>
              <span>{shippingFee.toLocaleString()} VND</span>
            </div>
            <div className="border-t border-border-light my-2 pt-2 flex justify-between items-baseline">
              <span className="text-sm font-bold text-text-primary">Estimated Buyer Price:</span>
              <div className="text-right">
                <div className="text-base font-bold text-brand-primary">
                  {totalVND.toLocaleString()} VND
                </div>
                <div className="text-xs font-bold text-brand-accent flex items-center justify-end gap-0.5 mt-0.5">
                  <DollarSign className="h-3.5 w-3.5 shrink-0" />
                  {totalUSD.toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-text-secondary leading-relaxed bg-white dark:bg-zinc-950 p-2.5 rounded-md border border-border-light">
            💡 **Transparency Notice**: The buyer checkout runs in USD. You will receive the full base price of **{basePrice.toLocaleString()} VND** upon delivery, and Kialna will manage shipping and packaging from our District 1 Hub.
          </div>
        </div>
      )}

      {/* Inventory Quantity */}
      <div className="flex flex-col gap-2">
        <label htmlFor="inventory" className="text-sm font-semibold text-text-primary">
          Stock Quantity <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          id="inventory"
          name="inventory"
          value={inventoryStr}
          onChange={(e) => handleInputChange("inventory", e.target.value, setInventoryStr)}
          onBlur={() => validateField("inventory", inventoryStr)}
          className={`input-primary w-full ${errors.inventory ? "border-red-500" : ""}`}
          placeholder="e.g. 25"
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

      {/* Image Gallery & URL Addition */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-text-primary">
          Product Images
        </label>

        {/* URL Inputs */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => {
                setNewImageUrl(e.target.value);
                setImageError("");
              }}
              className={`input-primary w-full pl-10 text-sm ${imageError ? "border-red-500" : ""}`}
              placeholder="Paste Image URL (https://...)"
              disabled={isPending}
            />
            <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          </div>
          <button
            type="button"
            onClick={handleAddImageUrl}
            className="btn-primary min-w-[48px] px-3 flex items-center justify-center shrink-0"
            disabled={isPending}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {imageError && (
          <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {imageError}
          </span>
        )}

        {/* Image Grid Preview */}
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {images.map((url, idx) => (
              <div key={idx} className="relative aspect-square border border-border-light rounded-lg overflow-hidden group bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken image URLs
                    e.currentTarget.src = "/file.svg";
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer shadow-md"
                  title="Remove Image"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 border-2 border-dashed border-border-light rounded-lg text-text-secondary text-xs bg-zinc-50/50">
            No images added. A default placeholder will be assigned on submission.
          </div>
        )}
      </div>

      {/* Listing Status */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-text-primary">
          Listing Status
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="status"
              value="active"
              checked={status === "active"}
              onChange={() => setStatus("active")}
              className="h-4 w-4 accent-brand-primary"
              disabled={isPending}
            />
            <span>Active (Ready for Sale)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
              className="h-4 w-4 accent-brand-primary"
              disabled={isPending}
            />
            <span>Draft</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2 font-bold min-h-[48px]"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Saving Product...</span>
          </>
        ) : (
          <span>{initialProduct ? "Update Listing" : "Create Listing"}</span>
        )}
      </button>
    </form>
  );
}
