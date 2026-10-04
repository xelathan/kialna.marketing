import { getCurrentUser } from "@/lib/session";
import { getSellerProducts, getSellerOrders } from "@/app/actions/products";
import { getAdminOrders, getPlatformFees } from "@/app/actions/admin";
import SellerDashboard from "@/components/SellerDashboard";
import BuyerDashboard from "@/components/BuyerDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import RoleSwitcher from "@/components/RoleSwitcher";
import Link from "next/link";
import { Shield, ShoppingBag, User, ArrowRight, Sparkles, Compass, Truck } from "lucide-react";
import prisma from "@/lib/db";

export default async function Home() {
  const user = await getCurrentUser();

  // If no user found, display a clean welcome/sign-in screen
  if (!user) {
    return (
      <div className="min-h-screen bg-bg-primary font-sans flex flex-col justify-between">
        {/* Navigation Bar */}
        <header className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-primary p-2 rounded-xl text-white shadow-md">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-text-primary tracking-tight">Kialna</span>
                <span className="text-xs text-brand-primary font-semibold ml-1.5 hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40">Marketplace</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-text-primary hover:text-brand-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary text-xs sm:text-sm px-4 py-2 shadow-sm"
              >
                Join Marketplace
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col justify-center py-10 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-brand-primary text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Vietnamese Artisanal Craft Marketplace</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.15]">
                Direct from Vietnamese Artisans to the World
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed">
                Experience authentic handcrafted ceramics, organic highland teas, and traditional textiles with 
                complete price transparency and centralized District 1 Saigon shipping logistics.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
                <Link
                  href="/login"
                  className="btn-primary px-7 py-3.5 text-sm font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-lg border border-border-light bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-sm font-semibold text-text-primary transition-colors text-center shadow-sm"
                >
                  Become a Seller
                </Link>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full mt-4 pt-6 border-t border-border-light">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-border-light">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-brand-primary rounded-lg shrink-0">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-text-primary">100% Artisan Direct</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">Sourced straight from craft villages in Vietnam.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-border-light">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-text-primary">Price Transparency</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">Exact breakdown of artisan price, packaging, and shipping.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-border-light">
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg shrink-0">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-text-primary">D1 Logistics Hub</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">Quality inspection and global fulfillment from Saigon.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card / Demo Preview Column */}
            <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              <div className="bg-white dark:bg-zinc-900 border border-border-light rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-border-light pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-brand-accent animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Demo Access</span>
                  </div>
                  <span className="text-[10px] text-brand-primary font-semibold bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded">
                    Instant Preview
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Test all three platform workflows instantly with pre-seeded demo accounts:
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <Link
                      href="/login"
                      className="p-3.5 rounded-xl border border-border-light hover:border-brand-primary bg-zinc-50 hover:bg-blue-50/40 dark:bg-zinc-800 dark:hover:bg-zinc-700/40 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-brand-primary rounded-lg group-hover:scale-105 transition-transform">
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
                      className="p-3.5 rounded-xl border border-border-light hover:border-brand-primary bg-zinc-50 hover:bg-blue-50/40 dark:bg-zinc-800 dark:hover:bg-zinc-700/40 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
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
                      className="p-3.5 rounded-xl border border-border-light hover:border-brand-primary bg-zinc-50 hover:bg-blue-50/40 dark:bg-zinc-800 dark:hover:bg-zinc-700/40 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-lg group-hover:scale-105 transition-transform">
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

                <div className="pt-2 border-t border-border-light flex items-center justify-between text-xs text-text-secondary">
                  <span>Sign in credentials:</span>
                  <span className="font-mono text-text-primary font-semibold">password123</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-border-light bg-white dark:bg-zinc-900 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-brand-primary" />
              <span>&copy; {new Date().getFullYear()} Kialna Marketplace. Authentic Vietnamese Crafts.</span>
            </div>
            <div className="flex gap-6">
              <span>District 1 Hub, Ho Chi Minh City</span>
              <span>Global Express Fulfillment</span>
            </div>
          </div>
        </footer>

        {/* Dev switcher */}
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
    // Fetch all active products
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
      shipping: feesResult.shipping,
      packaging: feesResult.packaging,
    };

    return (
      <AdminDashboard
        initialOrders={orders || []}
        initialFees={fees}
        currentUser={user}
      />
    );
  }

  return null;
}

