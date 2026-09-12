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
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary font-sans p-6 text-center max-w-md mx-auto border-x border-border-light shadow-xl">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="bg-brand-primary p-4 rounded-2xl text-white shadow-lg">
            <Compass className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Kialna Marketplace</h1>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Authentic Vietnamese craft marketplace with complete price transparency and global delivery.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-2">
            <Link
              href="/login"
              className="btn-primary w-full flex items-center justify-center gap-2 font-bold py-3 text-sm shadow-md"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="w-full py-3 px-4 rounded-lg border border-border-light bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-sm font-semibold text-text-primary transition-colors text-center shadow-sm"
            >
              Create Account
            </Link>
          </div>

          <div className="w-full pt-2">
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

