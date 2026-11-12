import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getFees, createProduct } from "@/app/actions/products";
import ProductForm from "@/components/ProductForm";
import RoleSwitcher from "@/components/RoleSwitcher";

export default async function NewProductPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "seller") {
    redirect("/");
  }

  const feesResult = await getFees();
  const shippingFee = feesResult.shipping;
  const packagingFee = feesResult.packaging;

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 font-sans pb-12">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-text-primary">Đăng Sản Phẩm Mới • Add New Listing</h1>
            <p className="text-xs text-text-secondary">Tạo sản phẩm Việt Nam mới để bán toàn cầu • Create a new Vietnamese product listing</p>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 py-6 sm:py-8 overflow-y-auto">
        <ProductForm
          shippingFee={shippingFee}
          packagingFee={packagingFee}
          onSave={createProduct}
        />
      </main>

      {/* Testing Role Switcher */}
      <RoleSwitcher currentUser={user} />
    </div>
  );
}
