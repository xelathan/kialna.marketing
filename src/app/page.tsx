import { getCurrentUser } from "@/lib/session";
import { getSellerProducts, getSellerOrders } from "@/app/actions/products";
import { getAdminOrders, getPlatformFees } from "@/app/actions/admin";
import SellerDashboard from "@/components/SellerDashboard";
import BuyerDashboard from "@/components/BuyerDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import RoleSwitcher from "@/components/RoleSwitcher";
import Link from "next/link";
import { Shield, ShoppingBag, User, ArrowRight, Sparkles, Compass, Truck, Globe, CheckCircle2 } from "lucide-react";
import prisma from "@/lib/db";

export default async function Home() {
  const user = await getCurrentUser();

  // If no user found, display a clean Meta-inspired hardware commerce showcase
  if (!user) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col justify-between selection:bg-brand-primary selection:text-white">
        {/* Top Navigation Bar */}
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-border-light sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#0a1317] p-2 rounded-full text-white shadow-sm flex items-center justify-center">
                <Compass className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-text-primary tracking-tight">Kialna</span>
                <span className="text-[11px] text-brand-primary font-bold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                  Craft Store
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-xs sm:text-sm font-bold text-text-primary hover:text-brand-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-ink text-xs sm:text-sm !py-2 !px-5"
              >
                Join Marketplace
              </Link>
            </div>
          </div>
        </header>

        {/* Hero & Commerce Showcase */}
        <main className="flex-1 flex flex-col justify-center py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full gap-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-soft border border-border-light text-text-secondary text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                <span>Authentic Vietnamese Hardware & Craft Commerce</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0a1317] tracking-tight leading-[1.12]">
                Craftsmanship Meets Global Commerce
              </h1>

              <p className="text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
                Experience authentic handcrafted ceramics, organic highland teas, and traditional handwoven textiles with 
                complete dual-currency price transparency and centralized Saigon District 1 logistics.
              </p>

              {/* Meta Dual-CTA Hero Pattern */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-1">
                <Link
                  href="/login"
                  className="btn-ink px-8 py-3.5 text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="btn-secondary px-7 py-3.5 text-sm font-bold text-center"
                >
                  Become an Artisan
                </Link>
              </div>

              {/* 3-Up Feature Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2 pt-6 border-t border-border-light">
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-soft border border-border-light text-left">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-primary shadow-xs">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">Artisan Direct</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">Straight from heritage villages across Vietnam.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-soft border border-border-light text-left">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-accent shadow-xs">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">Transparent Fees</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">Itemized artisan price, packaging, and shipping.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-soft border border-border-light text-left">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-xs">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">District 1 Hub</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">Saigon central inspection and worldwide dispatch.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card / Interactive Demo Column */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              <div className="card-primary rounded-[32px] p-6 sm:p-8 flex flex-col gap-5 border border-border-light shadow-sm">
                <div className="flex items-center justify-between border-b border-border-light pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-brand-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Demo Access</span>
                  </div>
                  <span className="text-[10px] text-white font-bold bg-brand-primary px-3 py-1 rounded-full">
                    Instant Sandbox
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Test the three integrated personas with pre-seeded credentials:
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <Link
                      href="/login"
                      className="p-3.5 rounded-2xl border border-border-light hover:border-brand-primary bg-white hover:bg-surface-soft transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-soft flex items-center justify-center text-brand-primary group-hover:scale-105 transition-transform">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-text-primary">Artisan Seller Studio</div>
                          <div className="text-[10px] text-text-secondary">Manage craft inventory & mobile photo uploads</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-brand-primary transition-colors" />
                    </Link>

                    <Link
                      href="/login"
                      className="p-3.5 rounded-2xl border border-border-light hover:border-brand-primary bg-white hover:bg-surface-soft transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-soft flex items-center justify-center text-brand-accent group-hover:scale-105 transition-transform">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-text-primary">International Buyer Store</div>
                          <div className="text-[10px] text-text-secondary">Browse crafts with transparent VND to USD pricing</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-brand-primary transition-colors" />
                    </Link>

                    <Link
                      href="/login"
                      className="p-3.5 rounded-2xl border border-border-light hover:border-brand-primary bg-white hover:bg-surface-soft transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-soft flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-text-primary">District 1 Logistics Hub</div>
                          <div className="text-[10px] text-text-secondary">Manage 6-stage fulfillment & platform fee rates</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-brand-primary transition-colors" />
                    </Link>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-secondary">
                  <span>Demo password:</span>
                  <span className="font-mono text-text-primary font-bold bg-surface-soft px-2 py-0.5 rounded-md">password123</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Dark Promo Strip Banner */}
          <div className="card-promo-strip p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Fulfillment & Trust Guarantee
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Saigon Hub to Doorstep Worldwide
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Every handicraft is routed through our District 1 fulfillment center for custom protective packaging, customs declaration, and expedited air transit.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/login"
                className="btn-primary !bg-white !text-[#0a1317] hover:!bg-zinc-100 font-bold px-7 py-3 text-sm"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-border-light bg-white py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-brand-primary" />
              <span>&copy; {new Date().getFullYear()} Kialna Marketplace. Inspired by Meta hardware commerce.</span>
            </div>
            <div className="flex gap-6">
              <span>District 1 Hub, Ho Chi Minh City</span>
              <span>Global Express Fulfillment</span>
            </div>
          </div>
        </footer>

        {/* Floating Dev Switcher */}
        <RoleSwitcher currentUser={null} />
      </div>
    );
  }

  // Route: Seller Dashboard
  if (user.role === "seller") {
    const productsResult = await getSellerProducts();
    const ordersResult = await getSellerOrders();

    const products = productsResult.success ? productsResult.products : [];
    const orders = ordersResult.success ? ordersResult.orders : [];

    return (
      <SellerDashboard
        initialProducts={products || []}
        initialOrders={orders || []}
        currentUser={user}
      />
    );
  }

  // Route: Buyer Interface (Phase 3)
  if (user.role === "buyer") {
    const products = await prisma.product.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    });

    return (
      <BuyerDashboard
        initialProducts={products}
        currentUser={user}
      />
    );
  }

  // Route: Admin Logistics Hub (Phase 4)
  if (user.role === "admin") {
    const ordersResult = await getAdminOrders();
    const feesResult = await getPlatformFees();

    const orders = ordersResult.success ? ordersResult.orders : [];
    const fees = {
      shipping: feesResult.shipping ?? 120000,
      packaging: feesResult.packaging ?? 30000,
    };

    return (
      <AdminDashboard
        initialOrders={orders || []}
        initialFees={fees}
        currentUser={user}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">Unknown User Role</h1>
        <p className="text-sm text-text-secondary mt-1">Please sign out and sign in with a valid account.</p>
        <Link href="/login" className="btn-primary mt-4">Go to Login</Link>
      </div>
    </div>
  );
}
