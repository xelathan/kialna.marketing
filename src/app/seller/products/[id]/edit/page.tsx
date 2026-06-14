import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getFees, updateProduct } from "@/app/actions/products";
import ProductForm from "@/components/ProductForm";
import RoleSwitcher from "@/components/RoleSwitcher";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    redirect("/");
  }

  const { id } = await params;

  // Retrieve existing product
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  // Ensure seller owns this product
  if (product.sellerId !== user.id) {
    redirect("/");
  }

  const feesResult = await getFees();
  const shippingFee = feesResult.shipping;
  const packagingFee = feesResult.packaging;

  // Bind the updateProduct action to this specific product ID
  const handleUpdate = async (data: any) => {
    "use server";
    return await updateProduct(id, data);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 max-w-md mx-auto border-x border-border-light shadow-xl">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border-light px-4 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-base font-bold text-text-primary">Edit Product</h1>
          <p className="text-[10px] text-text-secondary">Update your craft listing details</p>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 py-6 overflow-y-auto">
        <ProductForm
          initialProduct={product}
          shippingFee={shippingFee}
          packagingFee={packagingFee}
          onSave={handleUpdate}
        />
      </main>

      {/* Testing Role Switcher */}
      <RoleSwitcher currentUser={user} />
    </div>
  );
}
