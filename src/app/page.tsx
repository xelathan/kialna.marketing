import { getCurrentUser } from "@/lib/session";
import { getSellerProducts, getSellerOrders } from "@/app/actions/products";
import SellerDashboard from "@/components/SellerDashboard";
import RoleSwitcher from "@/components/RoleSwitcher";
import Link from "next/link";
import { Shield, ShoppingBag, User, ArrowRight, Sparkles, Compass, Truck } from "lucide-react";
import prisma from "@/lib/db";

export default async function Home() {
  const user = await getCurrentUser();

  // If no user found, display a clean fallback selection screen
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary font-sans p-6 text-center max-w-md mx-auto border-x border-border-light shadow-xl">
        <div className="flex flex-col items-center gap-6">
          <div className="bg-brand-primary p-4 rounded-full text-white animate-pulse shadow-md">
            <Sparkles className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome to Kialna</h1>
            <p className="text-sm text-text-secondary mt-2">
              Premium Vietnamese craft marketplace. Select a role below to get started.
            </p>
          </div>
          <div className="w-full mt-4">
            <RoleSwitcher currentUser={null} />
          </div>
        </div>
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

  // Route: Buyer Interface Placeholder (Phase 3)
  if (user.role === "buyer") {
    // Fetch some products to display a premium placeholder catalog
    const products = await prisma.product.findMany({
      where: { status: "active" },
      take: 4,
    });

    return (
      <div className="flex flex-col min-h-screen bg-bg-primary font-sans max-w-md mx-auto border-x border-border-light shadow-xl pb-24">
        {/* Buyer Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-brand-primary" />
            <h1 className="text-base font-bold text-text-primary">Kialna Shop</h1>
          </div>
          <div className="text-xs font-semibold text-text-secondary bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
            🇻🇳 Ho Chi Minh City
          </div>
        </header>

        {/* Hero Section */}
        <main className="p-4 flex flex-col gap-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-800 text-white p-6 shadow-md">
            <div className="relative z-10 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Phase 3 Sneak Peek
              </span>
              <h2 className="text-xl font-bold leading-tight">International Craft Market</h2>
              <p className="text-xs text-blue-100 leading-relaxed max-w-[280px]">
                Authentic, hand-made Vietnamese textiles, teas, and decor shipped globally with full price transparency.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 translate-y-6 translate-x-4 opacity-10">
              <Compass className="h-44 w-44" />
            </div>
          </div>

          {/* Seeded Products Preview */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Featured Crafts
              </h3>
              <span className="text-xs font-bold text-brand-primary flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => {
                let images = [];
                try {
                  images = JSON.parse(p.images);
                } catch (e) {}
                const imageUrl = images[0] || "/file.svg";

                return (
                  <div key={p.id} className="card-primary overflow-hidden flex flex-col bg-white dark:bg-zinc-900">
                    <div className="aspect-square bg-zinc-100 border-b border-border-light overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl || "/file.svg"}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <h4 className="text-xs font-semibold text-text-primary truncate">{p.name}</h4>
                      <div className="text-[10px] text-text-secondary uppercase font-medium">
                        {p.category}
                      </div>
                      <div className="text-xs font-bold text-brand-primary mt-1">
                        {p.basePrice.toLocaleString()} VND
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Developer Notice */}
          <div className="card-primary p-4 bg-zinc-50 dark:bg-zinc-900 border border-border-light flex flex-col gap-2">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-primary" />
              Developer Notice
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              This is the **Buyer Interface placeholder** for Phase 3. 
              Use the interactive testing control panel at the bottom right to switch to the **Seller** role and test the mobile-first seller interface.
            </p>
          </div>
        </main>

        <RoleSwitcher currentUser={user} />
      </div>
    );
  }

  // Route: Admin Hub Placeholder (Phase 4)
  if (user.role === "admin") {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary font-sans max-w-md mx-auto border-x border-border-light shadow-xl pb-24">
        {/* Admin Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light px-4 py-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-primary" />
          <h1 className="text-base font-bold text-text-primary">Kialna Admin Hub</h1>
        </header>

        <main className="p-4 flex flex-col gap-6">
          {/* Status Overview Card */}
          <div className="card-primary p-5 bg-gradient-to-tr from-emerald-600 to-teal-800 text-white rounded-2xl flex flex-col gap-3 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Phase 4 Sneak Peek
              </span>
              <h2 className="text-xl font-bold leading-tight">Hub Logistics Dashboard</h2>
              <p className="text-xs text-emerald-100 leading-relaxed max-w-[280px]">
                Manage packaging, assign local drivers, track deliveries, and oversee global shipments.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 translate-y-6 translate-x-4 opacity-10">
              <Truck className="h-44 w-44" />
            </div>
          </div>

          {/* Dev Info */}
          <div className="card-primary p-4 bg-zinc-50 dark:bg-zinc-900 border border-border-light flex flex-col gap-2">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-brand-primary" />
              Administrative View
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              This is the **Admin Logistics Hub placeholder** for Phase 4. 
              Use the testing controller below to switch back to the **Seller** dashboard to review Phase 2 implementation.
            </p>
          </div>
        </main>

        <RoleSwitcher currentUser={user} />
      </div>
    );
  }

  return null;
}
