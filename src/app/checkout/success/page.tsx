"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmStripeOrder } from "@/app/actions/orders";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Loader2,
  AlertCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const orderIdParam = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No checkout session found.");
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await confirmStripeOrder(sessionId!);
        if (res.success && res.order) {
          setOrder(res.order);
        } else {
          setError(res.error || "Could not verify order confirmation.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-border-light rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center text-center gap-4 animate-in fade-in">
          <Loader2 className="h-10 w-10 text-brand-primary animate-spin" />
          <h2 className="text-base font-bold text-text-primary">Confirming Stripe Payment...</h2>
          <p className="text-xs text-text-secondary">
            Verifying your transaction with Stripe and securing product inventory.
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-border-light rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-text-primary">Payment Verification Issue</h2>
          <p className="text-xs text-text-secondary">{error || "Unable to retrieve order details."}</p>
          <Link
            href="/"
            className="btn-primary w-full mt-2 flex items-center justify-center gap-2 font-bold min-h-[44px]"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Return to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const EXCHANGE_RATE = 25000;
  const totalVND = Math.round(order.totalPaid * EXCHANGE_RATE);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Success Header Card */}
        <div className="bg-white dark:bg-zinc-900 border border-border-light rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/20 text-brand-accent border border-teal-200 dark:border-teal-900 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent bg-teal-50 dark:bg-teal-950/30 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-900">
              Payment Confirmed via Stripe
            </span>
            <h1 className="text-2xl font-bold text-text-primary mt-2">Order Confirmed!</h1>
            <p className="text-xs text-text-secondary mt-1 max-w-md">
              Thank you for supporting Vietnamese sellers and artisans. Your order has been placed in our Saigon District 1 export fulfillment pipeline.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 rounded-xl border border-border-light w-full justify-between text-xs">
            <span className="text-text-secondary">Order Reference:</span>
            <span className="font-mono font-bold text-text-primary select-all">
              {order.id.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Fulfillment Pipeline Banner */}
        <div className="card-primary p-5 bg-white dark:bg-zinc-900 border border-border-light flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <Truck className="h-4 w-4 text-brand-primary" />
            <span>Fulfillment Pipeline Status</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-brand-accent font-bold">
              1. Paid via Stripe
            </div>
            <div className="p-2.5 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-brand-primary font-bold">
              2. Ready for Pickup
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-border-light text-text-secondary">
              3. District 1 Hub Dispatch
            </div>
          </div>
        </div>

        {/* Order Breakdown Card */}
        <div className="card-primary p-6 bg-white dark:bg-zinc-900 border border-border-light flex flex-col gap-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-primary" />
            <span>Items Purchased</span>
          </h2>

          <div className="divide-y divide-border-light">
            {items.map((item: any) => {
              let images = [];
              try {
                images = JSON.parse(item.product?.images || "[]");
              } catch (e) {}
              const imgUrl = images[0] || "/file.svg";

              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-border-light overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={item.product?.name || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/file.svg";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">
                        {item.product?.name || "Vietnamese Product"}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        Qty: {item.quantity} • ${(item.sellerPriceAtPurchase / EXCHANGE_RATE).toFixed(2)} USD base
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-text-primary">
                      ${(( (item.sellerPriceAtPurchase + item.shippingFeeAtPurchase + item.packagingFeeAtPurchase) * item.quantity ) / EXCHANGE_RATE).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparent Cost Summary */}
          <div className="border-t border-border-light pt-3 space-y-1.5 text-xs text-text-secondary">
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-bold text-text-primary text-sm">Total Paid:</span>
              <div className="text-right">
                <span className="text-base font-bold text-brand-primary">
                  ${order.totalPaid.toFixed(2)} USD
                </span>
                <p className="text-[10px] text-text-secondary leading-none">
                  ~ {totalVND.toLocaleString()} VND
                </p>
              </div>
            </div>
          </div>

          {/* Delivery destination */}
          {order.deliveryAddress && (
            <div className="border-t border-border-light pt-3 flex items-start gap-2 text-xs text-text-secondary">
              <MapPin className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">
                  Ship To: {order.deliveryName || "Customer"}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{order.deliveryAddress}</p>
                {order.deliveryPhone && (
                  <p className="text-[10px] text-text-secondary mt-0.5">Contact: {order.deliveryPhone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="btn-primary flex-1 flex items-center justify-center gap-2 font-bold min-h-[48px] shadow-md"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
