"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import KialnaLogo from "@/components/KialnaLogo";
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  MapPin,
  Store,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await signUp({
        name,
        email,
        password,
        role,
        phone,
        address,
      });

      if (res.success) {
        window.location.href = "/";
      } else {
        setError(res.error || "Registration failed.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary font-sans flex flex-col justify-center items-center p-4 py-12">
      <div className="w-full max-w-md bg-white border border-border-light rounded-[32px] shadow-xl p-6 sm:p-8 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <KialnaLogo size={52} className="mb-1" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-text-secondary">
            Join the Vietnamese artisanal craft marketplace
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Picker Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-primary">I want to:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`flex flex-col items-center justify-center p-3 rounded-[20px] border transition-all cursor-pointer ${
                role === "buyer"
                  ? "border-brand-primary bg-blue-50/70 text-brand-primary ring-1 ring-brand-primary"
                  : "border-border-light bg-bg-surface-soft text-text-secondary hover:text-text-primary"
              }`}
            >
              <ShoppingBag className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold">Buy Crafts</span>
              <span className="text-[10px] opacity-75">International Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`flex flex-col items-center justify-center p-3 rounded-[20px] border transition-all cursor-pointer ${
                role === "seller"
                  ? "border-brand-primary bg-blue-50/70 text-brand-primary ring-1 ring-brand-primary"
                  : "border-border-light bg-bg-surface-soft text-text-secondary hover:text-text-primary"
              }`}
            >
              <Store className="h-5 w-5 mb-1" />
              <span className="text-xs font-bold">Sell Crafts</span>
              <span className="text-[10px] opacity-75">Artisan / Producer</span>
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linh Nguyen or Sarah Jenkins"
                className="input-primary w-full pl-11 rounded-full text-sm"
                disabled={isPending}
                required
              />
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-primary w-full pl-11 rounded-full text-sm"
                disabled={isPending}
                required
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="input-primary w-full pl-11 rounded-full text-sm"
                disabled={isPending}
                required
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Phone Number <span className="text-text-secondary font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={role === "seller" ? "0901234567" : "+1 (555) 000-0000"}
                className="input-primary w-full pl-11 rounded-full text-sm"
                disabled={isPending}
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              {role === "seller" ? "Workshop / Pickup Address" : "Shipping Destination Address"}{" "}
              <span className="text-text-secondary font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={
                  role === "seller"
                    ? "e.g. 123 Le Loi, District 1, Ho Chi Minh City"
                    : "e.g. 123 Main St, Austin, TX, USA"
                }
                className="input-primary w-full pl-11 rounded-full text-sm"
                disabled={isPending}
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full mt-2 flex items-center justify-center gap-2 font-bold min-h-[48px] cursor-pointer shadow-sm active:scale-98 transition-all"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-text-secondary border-t border-border-light pt-4">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
