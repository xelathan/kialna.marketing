"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";

export type Language = "en" | "vi";

/**
 * Custom hook that manages language per portal role:
 * - "seller" defaults to "vi" (Tiếng Việt)
 * - "admin" (Saigon Hub) defaults to "vi" (Tiếng Việt)
 * - "buyer" defaults to "en" (English)
 */
export function usePortalLanguage(role: "seller" | "buyer" | "admin" = "buyer") {
  const defaultLang: Language = role === "buyer" ? "en" : "vi";
  const storageKey = `kialna_lang_${role}`;

  const [lang, setLangState] = useState<Language>(defaultLang);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey) as Language | null;
      if (saved === "en" || saved === "vi") {
        setLangState(saved);
      } else {
        setLangState(defaultLang);
      }
    } catch {
      setLangState(defaultLang);
    }

    const handleLangEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.role === role && (detail.lang === "en" || detail.lang === "vi")) {
        setLangState(detail.lang);
      }
    };

    window.addEventListener("kialna-lang-change", handleLangEvent);
    return () => window.removeEventListener("kialna-lang-change", handleLangEvent);
  }, [role, defaultLang, storageKey]);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    try {
      window.localStorage.setItem(storageKey, nextLang);
      window.dispatchEvent(
        new CustomEvent("kialna-lang-change", { detail: { role, lang: nextLang } })
      );
    } catch {}
  };

  return { lang, setLang };
}

interface LanguageToggleProps {
  lang: Language;
  onChange: (lang: Language) => void;
}

export default function LanguageToggle({ lang, onChange }: LanguageToggleProps) {
  return (
    <div
      className="inline-flex items-center bg-surface-soft p-0.5 rounded-full border border-border-light text-[11px] font-bold shrink-0"
      title={lang === "vi" ? "Chuyển ngôn ngữ / Switch Language" : "Switch Language / Chuyển ngôn ngữ"}
    >
      <button
        type="button"
        onClick={() => onChange("vi")}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
          lang === "vi"
            ? "bg-[#164e63] text-white shadow-xs"
            : "text-text-secondary hover:text-ink"
        }`}
      >
        <span>🇻🇳</span>
        <span>VI</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
          lang === "en"
            ? "bg-[#164e63] text-white shadow-xs"
            : "text-text-secondary hover:text-ink"
        }`}
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}

const CATEGORY_VI_MAP: Record<string, string> = {
  All: "Tất cả",
  "Crafts & Decor": "Thủ công & Trang trí",
  "Food & Tea": "Thực phẩm & Trà",
  "Coffee & Tea": "Cà phê & Trà",
  "Specialty Foods": "Đặc sản Thực phẩm",
  "Apparel & Textiles": "Thời trang & Dệt may",
  "Kitchen & Home": "Nhà bếp & Gia dụng",
  "Wellness & Lifestyle": "Sức khỏe & Đời sống",
  "Beauty & Wellness": "Làm đẹp & Sức khỏe",
  General: "Tổng hợp",
};

const PRODUCT_NAME_VI_MAP: Record<string, string> = {
  "Handmade Bamboo Gift Basket": "Giỏ Quà Mây Tre Đan Thủ Công",
  "Organic Lotus Leaf Tea": "Trà Lá Sen Hữu Cơ Đồng Tháp",
  "Traditional Silk Ao Dai (Blue)": "Áo Dài Lụa Hà Đông Truyền Thống (Xanh)",
  "Ceramic Coffee Phin Filter": "Phin Pha Cà Phê Gốm Bát Tràng",
};

const PRODUCT_NAME_EN_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PRODUCT_NAME_VI_MAP).map(([en, vi]) => [vi, en])
);

const PRODUCT_DESC_VI_MAP: Record<string, string> = {
  "Artisanal bamboo basket woven by hand in Chuong My craft village. Eco-friendly, sturdy, and elegant for home decor or gifting.":
    "Giỏ mây tre đan thủ công từ làng nghề Chương Mỹ. Thân thiện môi trường, bền chắc và sang trọng dùng trang trí nhà cửa hoặc làm quà biếu.",
  "Premium sun-dried lotus leaf tea from Dong Thap province. Helps support healthy metabolism and quality sleep. 100% natural.":
    "Trà lá sen phơi sương thượng hạng từ vùng sen Đồng Tháp. Hỗ trợ thanh nhiệt, tốt cho sức khỏe và giấc ngủ. 100% tự nhiên.",
  "Authentic hand-tailored Vietnamese Ao Dai made from luxury Ha Dong silk. Vibrant blue color with elegant patterns. Sized Medium.":
    "Áo dài Việt Nam may đo thủ công từ lụa tơ tằm Hà Đông cao cấp. Sắc xanh thanh lịch với họa tiết tinh tế. Cỡ vừa (Size M).",
  "Premium Bat Trang ceramic Vietnamese coffee filter (phin). Heat-retaining, beautiful design for brewing slow drip coffee at home.":
    "Phin pha cà phê gốm sứ Bát Tràng cao cấp. Giữ nhiệt tốt, men gốm thủ công tinh xảo giúp pha cà phê phin đậm đà chuẩn vị Việt.",
};

const PRODUCT_DESC_EN_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PRODUCT_DESC_VI_MAP).map(([en, vi]) => [vi, en])
);

const ORDER_STATUS_VI_MAP: Record<string, string> = {
  "Ready for Pickup": "Chờ lấy hàng",
  "Driver Assigned": "Đã điều tài xế",
  "Picked Up": "Đã lấy hàng",
  "In Packaging": "Đang đóng gói tại Hub",
  Shipped: "Đang vận chuyển quốc tế",
  Delivered: "Đã giao thành công",
};

export function translateCategory(cat: string, lang: Language): string {
  if (!cat) return "";
  if (lang === "vi") {
    return CATEGORY_VI_MAP[cat] || cat;
  }
  return cat;
}

export function translateProductName(name: string, lang: Language): string {
  if (!name) return "";
  if (lang === "vi") {
    return PRODUCT_NAME_VI_MAP[name] || name;
  }
  return PRODUCT_NAME_EN_MAP[name] || name;
}

export function translateProductDesc(desc: string | null | undefined, lang: Language): string {
  if (!desc) return "";
  if (lang === "vi") {
    return PRODUCT_DESC_VI_MAP[desc] || desc;
  }
  return PRODUCT_DESC_EN_MAP[desc] || desc;
}

export function translateOrderStatus(status: string, lang: Language): string {
  if (!status) return "";
  if (lang === "vi") {
    return ORDER_STATUS_VI_MAP[status] || status;
  }
  return status;
}


