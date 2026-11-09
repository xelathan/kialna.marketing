"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, switchRole } from "@/app/actions/auth";
import KialnaLogo from "@/components/KialnaLogo";
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  ShoppingBag,
  Store,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDemoPending, setIsDemoPending] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await signIn({ email, password });
      if (res.success) {
        window.location.href = "/";
      } else {
        setError(res.error || "Login failed.");
      }
    });
  };

  const handleDemoLogin = (role: "seller" | "buyer" | "admin") => {
    setIsDemoPending(role);
    setError("");
    startTransition(async () => {
      const res = await switchRole(role);
      if (res.success) {
        window.location.href = "/";
      } else {
        setError(res.error || "Demo login failed.");
      }
      setIsDemoPending(null);
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary font-sans flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-border-light rounded-[32px] shadow-xl p-6 sm:p-8 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-1.5">
          <KialnaLogo size={68} className="mb-1" />
          <span className="font-black text-2xl tracking-[0.24em] uppercase bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent ml-[0.24em]">
            KIALNA
          </span>
          <p className="text-xs text-text-secondary mt-1">
            Sign in to access your craft marketplace account
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-primary w-full pl-11 rounded-full text-sm"
                disabled={isPending}
                required
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text-primary">Password</label>
              <span className="text-[11px] text-text-secondary">Demo password: password123</span>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary w-full pl-11 rounded-full text-sm"
                disabled={isPending}
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full mt-2 flex items-center justify-center gap-2 font-bold min-h-[48px] cursor-pointer shadow-sm active:scale-98 transition-all"
          >
            {isPending && !isDemoPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border-light"></div>
          <span className="flex-shrink mx-3 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Quick One-Click Demo
          </span>
          <div className="flex-grow border-t border-border-light"></div>
        </div>

        {/* Demo Fast Logins */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleDemoLogin("seller")}
            disabled={isPending}
            className="flex flex-col items-center justify-center p-3 rounded-[20px] border border-border-light hover:border-brand-primary bg-bg-surface-soft hover:bg-white text-center transition-all cursor-pointer group"
          >
            <div className="p-2 bg-blue-100 text-brand-primary rounded-full mb-1 group-hover:scale-105 transition-transform">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-text-primary">Seller</span>
            <span className="text-[10px] text-text-secondary">Artisan</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin("buyer")}
            disabled={isPending}
            className="flex flex-col items-center justify-center p-3 rounded-[20px] border border-border-light hover:border-brand-primary bg-bg-surface-soft hover:bg-white text-center transition-all cursor-pointer group"
          >
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full mb-1 group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-text-primary">Buyer</span>
            <span className="text-[10px] text-text-secondary">Customer</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin("admin")}
            disabled={isPending}
            className="flex flex-col items-center justify-center p-3 rounded-[20px] border border-border-light hover:border-brand-primary bg-bg-surface-soft hover:bg-white text-center transition-all cursor-pointer group"
          >
            <div className="p-2 bg-zinc-200 text-ink-deep rounded-full mb-1 group-hover:scale-105 transition-transform">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-text-primary">Admin</span>
            <span className="text-[10px] text-text-secondary">Logistics</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-text-secondary border-t border-border-light pt-4">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-bold text-brand-primary hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
