"use client";

import { useState, useRef } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Smartphone, 
  Truck, 
  ShieldCheck, 
  Zap, 
  Mail, 
  User, 
  Briefcase, 
  Tag 
} from "lucide-react";
import { submitWaitlist } from "./actions";

// ==========================================
// CENTRAL TRANSLATION DICTIONARY
// ==========================================
const content = {
  en: {
    nav: {
      sublabel: "GLOBAL MARKETPLACE",
      toggleEn: "EN",
      toggleVi: "VI"
    },
    hero: {
      tag: "PRE-LAUNCH PARTNER PROGRAM",
      headline: "Bringing Vietnam’s Finest to the Global Stage.",
      subheadline: "A premium cross-border marketplace connecting global buyers with authentic Vietnamese craft, built on automated mobile logistics.",
      cta: "Join the Exclusive Waitlist"
    },
    valueProp: {
      title: "Engineered for Cross-Border Commerce",
      subtitle: "DUAL-TRACK ECOSYSTEM",
      buyers: {
        tag: "AUTHENTIC DISCOVERY & COMFORT",
        title: "For Global Buyers",
        desc: "Experience seamless, direct access to premium Vietnamese artisans with all-inclusive pricing.",
        bullets: [
          { label: "Direct-from-Source Verification", text: "Only certified local artisans and original craft makers." },
          { label: "Transparent All-Inclusive Pricing", text: "Custom duties, shipping, and handling calculated instantly at checkout." },
          { label: "Secure Global Payments", text: "Localized checkouts, credit cards, and multi-currency processing." },
          { label: "Full Tracking & Guarantees", text: "Door-to-door transit transparency with standard refund policies." }
        ]
      },
      sellers: {
        tag: "LOCAL LOGISTICS & GLOBAL REACH",
        title: "For Vietnamese Sellers",
        desc: "Turn your local craft business into a global brand without worrying about export logistics.",
        bullets: [
          { label: "1-Click Mobile Setup", text: "Create your global catalog straight from your smartphone within minutes." },
          { label: "Door-to-Door Pickup", text: "Local couriers pick up items directly from your home, workshop, or warehouse." },
          { label: "Packaging & Prep Assistance", text: "Dedicated logistics centers manage standard international packaging." },
          { label: "Instant Local Payouts", text: "Fast, automated domestic payments in VND upon delivery verification." }
        ]
      }
    },
    waitlist: {
      title: "Secure Your Early Access",
      subtitle: "EXCLUSIVE REGISTRATION",
      roleShop: "I Want to Shop / Người Mua",
      roleSell: "I Want to Sell / Nhà Bán Hàng",
      descBuyer: "Join as an early shopper to receive access to limited craft drops, zero international shipping markups on your first 3 orders, and direct messaging with makers.",
      descSeller: "Join as a founding seller. Get hands-free onboarding, first-month free international logistics fulfillment, and localized customer service support.",
      labelEmail: "Email Address",
      placeholderEmail: "enter your email address...",
      labelName: "Full Name",
      placeholderName: "enter your full name...",
      labelCompany: "Company Name (Optional)",
      placeholderCompany: "enter company name if applicable...",
      labelProductType: "Interested Product Categories",
      placeholderProductType: "e.g., ceramics, lacquerware, textiles, coffee...",
      btnSubmit: "Request Invitation",
      successTitle: "Access Requested Successfully",
      successDesc: "Thank you! You have been added to the KIALNA queue. A confirmation has been sent to your email. We will reach out shortly with next steps.",
      btnBack: "Submit Another Request"
    },
    features: [
      { code: "CUSTOMS.SYS", title: "Smart Border Customs", desc: "Automated HS-code classification and paperless customs clearance." },
      { code: "SETTLE.SYS", title: "Direct Settlement", desc: "Buyers pay in USD; sellers receive payouts directly in VND." },
      { code: "PRICING.SYS", title: "Zero Surprise Pricing", desc: "Total landed cost calculations mean no COD surprises at the door." }
    ],
    footer: {
      copy: "© 2026 KIALNA Technologies. All rights reserved.",
      legal: "Privacy Policy | Terms of Service",
      status: "System Operational"
    }
  },
  vi: {
    nav: {
      sublabel: "THƯƠNG MẠI TOÀN CẦU",
      toggleEn: "EN",
      toggleVi: "VI"
    },
    hero: {
      tag: "CHƯƠNG TRÌNH ĐỐI TÁC TIỀN RA MẮT",
      headline: "Đưa Sản Phẩm Việt Vươn Tầm Thế Giới.",
      subheadline: "Nền tảng thương mại điện tử kết nối nhà bán hàng Việt Nam với thị trường toàn cầu. Đăng ký tiện lợi qua di động, vận chuyển quốc tế trọn gói.",
      cta: "Tham Gia Danh Sách Chờ Ngay"
    },
    valueProp: {
      title: "Thiết Kế Cho Thương Mại Xuyên Biên Giới",
      subtitle: "HỆ SINH THÁI SONG SONG",
      buyers: {
        tag: "TRẢI NGHIỆM ĐỘC BẢN & AN TÂM",
        title: "Dành Cho Khách Hàng Quốc Tế",
        desc: "Trải nghiệm mua sắm trực tiếp, liền mạch từ các nghệ nhân Việt Nam với giá bán trọn gói.",
        bullets: [
          { label: "Xác Thực Nguồn Gốc Trực Tiếp", text: "Chỉ kết nối với các nghệ nhân được chứng nhận và nhà làm thủ công bản địa." },
          { label: "Giá Trọn Gói Minh Bạch", text: "Thuế nhập khẩu, phí vận chuyển và đóng gói được tính toán tức thì khi thanh toán." },
          { label: "Thanh Toán Quốc Tế An Toàn", text: "Hỗ trợ thanh toán nội địa hóa, thẻ tín dụng và xử lý đa tiền tệ." },
          { label: "Theo Dõi Toàn Trình & Cam Kết", text: "Minh bạch lộ trình vận chuyển tận tay cùng chính sách hoàn tiền chuẩn mực." }
        ]
      },
      sellers: {
        tag: "KHO VẬN BẢN ĐỊA & TIẾP CẬN TOÀN CẦU",
        title: "Dành Cho Nhà Bán Việt Nam",
        desc: "Đưa thương hiệu thủ công của bạn ra thế giới mà không cần lo lắng về thủ tục xuất khẩu.",
        bullets: [
          { label: "Thiết Lập Di Động 1-Chạm", text: "Tạo danh mục sản phẩm toàn cầu trực tiếp từ điện thoại chỉ trong vài phút." },
          { label: "Lấy Hàng Tận Nơi (Door-to-Door)", text: "Bưu tá lấy hàng trực tiếp từ nhà, xưởng hoặc kho của bạn." },
          { label: "Hỗ Trợ Đóng Gói & Chuẩn Bị", text: "Trung tâm xử lý kho vận chuyên biệt quản lý quy trình đóng gói chuẩn quốc tế." },
          { label: "Thanh Toán Nội Địa Tức Thì", text: "Nhận tiền VNĐ nhanh chóng và tự động ngay sau khi xác thực giao hàng thành công." }
        ]
      }
    },
    waitlist: {
      title: "Đăng Ký Trải Nghiệm Sớm",
      subtitle: "ĐĂNG KÝ THÀNH VIÊN",
      roleShop: "Người Mua / I Want to Shop",
      roleSell: "Nhà Bán Hàng / I Want to Sell",
      descBuyer: "Đăng ký làm người mua sớm để nhận quyền tiếp cận các bộ sưu tập thủ công giới hạn, miễn phí vận chuyển quốc tế 3 đơn hàng đầu tiên và chat trực tiếp với người làm.",
      descSeller: "Đăng ký làm nhà bán hàng sáng lập. Miễn phí tháng đầu tiên xử lý kho vận quốc tế, hỗ trợ thiết lập gian hàng tự động và chăm sóc khách hàng đa ngôn ngữ.",
      labelEmail: "Địa chỉ Email",
      placeholderEmail: "nhập địa chỉ email của bạn...",
      labelName: "Họ và Tên",
      placeholderName: "nhập họ và tên...",
      labelCompany: "Tên Doanh Nghiệp (Không bắt buộc)",
      placeholderCompany: "nhập tên công ty nếu có...",
      labelProductType: "Danh Mục Sản Phẩm Quan Tâm",
      placeholderProductType: "ví dụ: gốm sứ, sơn mài, dệt may, cà phê...",
      btnSubmit: "Gửi Yêu Cầu Tham Gia",
      successTitle: "Gửi Yêu Cầu Thành Công",
      successDesc: "Cảm ơn bạn! Bạn đã được thêm vào hàng đợi của KIALNA. Một email xác nhận đã được gửi. Chúng tôi sẽ liên hệ lại sớm nhất.",
      btnBack: "Gửi Yêu Cầu Khác"
    },
    features: [
      { code: "CUSTOMS.SYS", title: "Thông Quan Tự Động", desc: "Tự động phân loại mã HS và xử lý hồ sơ hải quan không giấy tờ." },
      { code: "SETTLE.SYS", title: "Thanh Toán Trực Tiếp", desc: "Người mua trả USD; người bán nhận VNĐ nhanh chóng và an toàn." },
      { code: "PRICING.SYS", title: "Giá Landed Cost Chuẩn", desc: "Tính toán trọn gói thuế phí, không phát sinh chi phí khi nhận hàng." }
    ],
    footer: {
      copy: "© 2026 KIALNA Technologies. Bảo lưu mọi quyền.",
      legal: "Chính sách bảo mật | Điều khoản dịch vụ",
      status: "Hệ Thống Hoạt Động"
    }
  }
};

interface WaitlistEntry {
  email: string;
  name: string;
  role: "shop" | "sell";
  company?: string;
  productType?: string;
  timestamp: string;
}

export default function Home() {
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [role, setRole] = useState<"shop" | "sell">("shop");
  
  // Form input states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [productType, setProductType] = useState("");
  
  // Submit state triggers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<WaitlistEntry | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Scroll reference for CTA navigation
  const waitlistRef = useRef<HTMLDivElement>(null);

  const t = content[lang];

  const handleScrollToWaitlist = () => {
    waitlistRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      email,
      name,
      role,
      company: role === "sell" ? company : undefined,
      productType: productType || undefined,
    };

    try {
      const result = await submitWaitlist(payload);

      if (result.success) {
        const entry: WaitlistEntry = {
          ...payload,
          timestamp: new Date().toISOString()
        };
        setSubmittedData(entry);
        setIsSubmitted(true);
        
        // Clear inputs
        setEmail("");
        setName("");
        setCompany("");
        setProductType("");
      } else {
        setSubmitError(result.error || "Submission failed.");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setSubmittedData(null);
    setSubmitError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-text-primary selection:bg-brand-orange/30 selection:text-text-primary">
      
      {/* ==========================================
          1. NAVIGATION HEADER BLOCK
          ========================================== */}
      <header className="border-b border-muted bg-canvas/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* Logo element with inline SVG */}
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 500 120" 
              className="h-14 w-auto shrink-0"
              aria-label="KIALNA Logo"
            >
              {/* Geometric Logomark (Interlocking Global Connection & 'K') */}
              <g transform="translate(30, 25)">
                {/* Base Vertical Pillar (The Local Seller / Outlet base) */}
                <rect x="10" y="10" width="14" height="50" rx="4" fill="var(--text-primary)" />
                
                {/* Upper Forward Arrow (Global Outbound Route) */}
                <path d="M 34 10 L 58 32 C 61 35, 61 39, 58 42 L 48 52" stroke="var(--brand-orange)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                
                {/* Lower Inbound Connector (Dynamic Package Collection) */}
                <path d="M 24 45 L 48 21" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.4" />
                
                {/* Core Connection Dot */}
                <circle cx="34" cy="35" r="7" fill="var(--brand-orange)" />
              </g>

              {/* Typography: Clean, Wide-Tracked Brand Name */}
              <text x="120" y="68" fontFamily="'Inter', system-ui, sans-serif" fontSize="48" fontWeight="800" fill="currentColor" letterSpacing="4">KIALNA</text>
              
              {/* Sub-label: Logistics Engine Indicator */}
              <text x="122" y="96" fontFamily="'Inter', system-ui, sans-serif" fontSize="18" fontWeight="600" fill="var(--text-secondary)" letterSpacing="1.5">
                {t.nav.sublabel}
              </text>
            </svg>
          </div>

          {/* Language Toggle capsule styled with border-muted */}
          <div className="flex items-center space-x-1 border border-muted rounded-full p-0.5 bg-surface/50 font-mono text-xs">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                lang === "en"
                  ? "bg-text-primary text-canvas font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              aria-label="Switch interface to English"
            >
              {t.nav.toggleEn}
            </button>
            <div className="h-4 w-[1px] bg-muted" />
            <button
              onClick={() => setLang("vi")}
              className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                lang === "vi"
                  ? "bg-text-primary text-canvas font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              aria-label="Chuyển giao diện sang Tiếng Việt"
            >
              {t.nav.toggleVi}
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
          2. HERO SECTION BLOCK
          ========================================== */}
      <section className="border-b border-muted bg-gradient-to-b from-hero-sky-from/20 via-hero-sky-to/15 to-canvas">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-2 border border-muted bg-canvas/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase">
              {t.hero.tag}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-text-primary max-w-5xl leading-[1.1] mb-8">
            {lang === "en" ? (
              <>
                Bringing Vietnam’s <span className="text-brand-green">Finest</span> to the Global Stage.
              </>
            ) : (
              <>
                Đưa Sản Phẩm Việt <span className="text-brand-green">Vươn Tầm</span> Thế Giới.
              </>
            )}
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed mb-12">
            {t.hero.subheadline}
          </p>

          {/* Action CTA */}
          <button
            onClick={handleScrollToWaitlist}
            className="group h-14 px-8 rounded-full bg-text-primary hover:bg-[#1c1c1e] text-canvas font-semibold transition-all duration-200 flex items-center justify-center space-x-3 max-w-xs border border-text-primary hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
          >
            <span>{t.hero.cta}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ==========================================
          3. DUAL VALUE PROPOSITION BLOCK
          ========================================== */}
      <section className="border-b border-muted bg-canvas">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          
          <div className="text-center mb-16">
            <span className="text-xs font-mono tracking-widest text-brand-green uppercase block mb-3">
              {t.valueProp.subtitle}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
              {t.valueProp.title}
            </h2>
          </div>

          {/* Side-by-side Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Card: Global Buyers */}
            <div className="bg-canvas border border-muted rounded-lg p-8 md:p-10 flex flex-col justify-between transition-all duration-300 hover:border-brand-orange/60 hover:shadow-lg hover:shadow-brand-orange/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-text-muted select-none">
                [ BUY-TRACK.LOGIC ]
              </div>
              
              <div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md border border-brand-orange/20 bg-brand-orange/10 text-brand-green font-mono text-[10px] sm:text-xs tracking-wider uppercase mb-6">
                  {t.valueProp.buyers.tag}
                </div>
                
                <h3 className="text-2xl font-bold text-text-primary mb-3 flex items-center gap-3">
                  <Globe className="w-7 h-7 text-brand-green shrink-0" strokeWidth={2.25} />
                  <span>{t.valueProp.buyers.title}</span>
                </h3>
                
                <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                  {t.valueProp.buyers.desc}
                </p>
                
                {/* Custom Styled Bullet Points */}
                <ul className="space-y-5 text-sm">
                  {t.valueProp.buyers.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start space-x-3.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-orange/10 text-brand-green border border-brand-orange/20 mt-0.5">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                      <div className="text-text-secondary leading-relaxed">
                        <strong className="font-bold text-text-primary mr-1">
                          {bullet.label}:
                        </strong>
                        {bullet.text}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-muted flex items-center space-x-3 text-xs font-mono text-text-secondary/80">
                <Check className="text-brand-green shrink-0" />
                <span>Zero Pricing Surprises (Landed Costs Included)</span>
              </div>
            </div>

            {/* Right Card: Vietnamese Sellers */}
            <div className="bg-canvas border border-muted rounded-lg p-8 md:p-10 flex flex-col justify-between transition-all duration-300 hover:border-brand-tag/60 hover:shadow-lg hover:shadow-brand-tag/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-text-muted select-none">
                [ SELL-FULFILL.SYS ]
              </div>

              <div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md border border-brand-tag/20 bg-brand-tag/10 text-brand-tag font-mono text-[10px] sm:text-xs tracking-wider uppercase mb-6">
                  {t.valueProp.sellers.tag}
                </div>
                
                <h3 className="text-2xl font-bold text-text-primary mb-3 flex items-center gap-3">
                  <Truck className="w-7 h-7 text-brand-tag shrink-0" strokeWidth={2.25} />
                  <span>{t.valueProp.sellers.title}</span>
                </h3>
                
                <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                  {t.valueProp.sellers.desc}
                </p>
                
                {/* Custom Styled Bullet Points */}
                <ul className="space-y-5 text-sm">
                  {t.valueProp.sellers.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start space-x-3.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-tag/10 text-brand-tag border border-brand-tag/20 mt-0.5">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                      <div className="text-text-secondary leading-relaxed">
                        <strong className="font-bold text-text-primary mr-1">
                          {bullet.label}:
                        </strong>
                        {bullet.text}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-muted flex items-center space-x-3 text-xs font-mono text-text-secondary/80">
                <Check className="text-brand-tag shrink-0" />
                <span>100% Hands-Free Local Pickup & International Logistics</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==========================================
          4. THE INTERACTIVE WAITLIST FORM BLOCK
          ========================================== */}
      <section ref={waitlistRef} className="border-b border-muted bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-28 flex flex-col items-center">
          
          <div className="text-center mb-10">
            <span className="text-xs font-mono tracking-widest text-brand-green uppercase block mb-3">
              {t.waitlist.subtitle}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-4">
              {t.waitlist.title}
            </h2>
          </div>

          {/* Form Container (Flat elevated panel surface with sharp border) */}
          <div className="w-full bg-canvas border border-muted rounded-lg p-6 sm:p-8 md:p-12 relative shadow-md shadow-[#00d4a4]/5">
            
            {/* Card edge decorative identifier */}
            <div className="absolute top-0 left-6 transform -translate-y-1/2 bg-surface px-3 border-x border-muted font-mono text-[9px] text-text-secondary/80">
              KIALNA.REG_PORTAL_V1
            </div>

            {/* Segmented switches at the top */}
            <div className="grid grid-cols-2 p-1 bg-surface border border-muted rounded-full mb-8">
              <button
                type="button"
                onClick={() => {
                  setRole("shop");
                  if (isSubmitted) handleResetForm();
                }}
                className={`py-3 text-center text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                  role === "shop"
                    ? "bg-text-primary text-canvas shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.waitlist.roleShop}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("sell");
                  if (isSubmitted) handleResetForm();
                }}
                className={`py-3 text-center text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                  role === "sell"
                    ? "bg-brand-orange text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.waitlist.roleSell}
              </button>
            </div>

            {/* Dynamic Role Description */}
            <p className="text-sm text-text-secondary bg-surface border-l-2 border-brand-orange p-4 mb-8 font-mono leading-relaxed rounded-r-md">
              {role === "shop" ? t.waitlist.descBuyer : t.waitlist.descSeller}
            </p>

            {/* Conditional Form / Success View */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Name Input */}
                <div className="flex flex-col space-y-2">
                  <label htmlFor="name-input" className="text-xs font-mono text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-text-secondary" />
                    <span>{t.waitlist.labelName} <span className="text-brand-error">*</span></span>
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.waitlist.placeholderName}
                    className="w-full min-h-[48px] px-4 rounded-md bg-canvas border border-muted text-text-primary text-base placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200"
                  />
                </div>

                {/* 2. Email Input */}
                <div className="flex flex-col space-y-2">
                  <label htmlFor="email-input" className="text-xs font-mono text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-text-secondary" />
                    <span>{t.waitlist.labelEmail} <span className="text-brand-error">*</span></span>
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.waitlist.placeholderEmail}
                    className="w-full min-h-[48px] px-4 rounded-md bg-canvas border border-muted text-text-primary text-base placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200"
                  />
                </div>

                {/* 3. Company Input (Conditional for Sellers) */}
                {role === "sell" && (
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="company-input" className="text-xs font-mono text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{t.waitlist.labelCompany}</span>
                    </label>
                    <input
                      id="company-input"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={t.waitlist.placeholderCompany}
                      className="w-full min-h-[48px] px-4 rounded-md bg-canvas border border-muted text-text-primary text-base placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200"
                    />
                  </div>
                )}

                {/* 4. Product Category/Category Interest Input */}
                <div className="flex flex-col space-y-2">
                  <label htmlFor="product-type-input" className="text-xs font-mono text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-text-secondary" />
                    <span>{t.waitlist.labelProductType}</span>
                  </label>
                  <input
                    id="product-type-input"
                    type="text"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder={t.waitlist.placeholderProductType}
                    className="w-full min-h-[48px] px-4 rounded-md bg-canvas border border-muted text-text-primary text-base placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200"
                  />
                </div>

                {submitError && (
                  <div className="p-4 bg-brand-error/10 border border-brand-error/20 rounded-md text-brand-error text-xs font-mono">
                    [ ERROR: {submitError.toUpperCase()} ]
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full min-h-[48px] rounded-full font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 border ${
                      role === "shop"
                        ? "bg-text-primary border-text-primary hover:bg-[#1c1c1e] text-canvas hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                        : "bg-brand-orange border-brand-orange hover:bg-brand-green text-text-primary hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                    } disabled:opacity-50 disabled:pointer-events-none`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <span className="inline-block w-4 h-4 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin"></span>
                        <span className="font-mono text-xs uppercase tracking-widest">Processing...</span>
                      </div>
                    ) : (
                      <>
                        <span>{t.waitlist.btnSubmit}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Panel View */
              <div className="py-8 text-center flex flex-col items-center">
                <CheckCircle2 className="w-16 h-16 text-brand-green mb-6 animate-pulse" />
                
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  {t.waitlist.successTitle}
                </h3>
                
                <p className="text-text-secondary text-sm max-w-md leading-relaxed mb-8">
                  {t.waitlist.successDesc}
                </p>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs font-mono text-brand-green underline hover:text-brand-green/80 cursor-pointer"
                >
                  {t.waitlist.btnBack}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          5. TECHNICAL EDGE FEATURES BLOCK (3 Columns)
          ========================================== */}
      <section className="border-b border-muted bg-canvas">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.features.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-surface border border-muted rounded-lg p-6 flex flex-col space-y-3 hover:border-brand-orange/40 hover:shadow-md transition-all duration-200"
              >
                <div className="inline-flex items-center space-x-2 text-brand-green font-mono text-[10px] tracking-widest uppercase">
                  <Zap className="w-3.5 h-3.5 shrink-0 text-brand-green" />
                  <span>{item.code}</span>
                </div>
                <h4 className="text-lg font-bold text-text-primary">
                  {item.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          6. FOOTER BLOCK
          ========================================== */}
      <footer className="bg-canvas mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-10 border-t border-muted flex flex-col md:flex-row justify-between items-center text-xs text-text-secondary/70 font-mono gap-4">
          <div>{t.footer.copy}</div>
          <div className="flex space-x-4">
            <span className="hover:text-text-primary transition-colors cursor-pointer">{t.footer.legal}</span>
          </div>
          
          {/* Operational Status Dot */}
          <div className="flex items-center space-x-2 border border-muted rounded-full px-3 py-1 bg-surface">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            <span className="text-[10px] text-brand-green">{t.footer.status}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Decorative check icon
function Check({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      width={14}
      height={14}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
