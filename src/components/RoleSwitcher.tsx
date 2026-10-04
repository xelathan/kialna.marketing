"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { switchRole, signOut } from "@/app/actions/auth";
import { User, Shield, ShoppingBag, RefreshCw, LogOut, LogIn, UserPlus } from "lucide-react";

interface RoleSwitcherProps {
  currentUser: {
    id: string;
    role: string;
    name: string;
    email: string;
  } | null;
}

export default function RoleSwitcher({ currentUser }: RoleSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { name: "seller", label: "Seller", icon: ShoppingBag, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
    { name: "buyer", label: "Buyer", icon: User, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { name: "admin", label: "Admin Hub", icon: Shield, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
  ];

  const handleRoleSwitch = async (roleName: string) => {
    if (currentUser?.role === roleName) return;

    startTransition(async () => {
      const result = await switchRole(roleName);
      if (result.success) {
        window.location.href = "/";
      } else {
        alert(result.error || "Failed to switch role");
      }
    });
  };

  const handleSignOut = async () => {
    startTransition(async () => {
      await signOut();
      window.location.href = "/login";
    });
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-border-light shadow-xl rounded-full text-xs font-semibold hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer text-text-primary"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
        </div>
        <span>{currentUser ? `${currentUser.role.toUpperCase()}: ${currentUser.name.split(" ")[0]}` : "Sign In / Switch"}</span>
        {isPending && <RefreshCw className="h-3 w-3 animate-spin text-text-secondary" />}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white dark:bg-zinc-900 border border-border-light rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Demo Switcher & Auth
            </h3>
            {currentUser && (
              <button
                onClick={handleSignOut}
                disabled={isPending}
                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            )}
          </div>

          {/* Quick Demo Switch Options */}
          <div className="space-y-1.5 mb-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentUser?.role === r.name;
              return (
                <button
                  key={r.name}
                  onClick={() => handleRoleSwitch(r.name)}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                    isActive
                      ? "border-brand-primary bg-blue-50/30 dark:bg-blue-950/20 font-semibold"
                      : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  } cursor-pointer`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${r.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-text-primary capitalize font-bold">{r.label}</div>
                      {isActive && (
                        <div className="text-[10px] text-text-secondary truncate max-w-[150px]">
                          {currentUser.name}
                        </div>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-brand-primary"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Direct Auth Navigation */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-light">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-semibold text-text-primary transition-colors text-center"
              onClick={() => setIsOpen(false)}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-brand-primary hover:bg-blue-600 text-xs font-semibold text-white transition-colors text-center shadow-sm"
              onClick={() => setIsOpen(false)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register
            </Link>
          </div>

          {currentUser && (
            <div className="mt-3 pt-2.5 border-t border-border-light text-[10px] text-text-secondary">
              Active: <span className="font-mono text-text-primary">{currentUser.email}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
