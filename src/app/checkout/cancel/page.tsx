"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 font-sans flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-border-light rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-900 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-text-primary">Checkout Cancelled</h1>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Your card was not charged. Your artisanal craft selections are still safely waiting in your shopping cart.
          </p>
        </div>

        <div className="w-full border-t border-border-light pt-3 flex flex-col gap-2.5">
          <Link
            href="/"
            className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[46px] shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Return to Marketplace & Cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
