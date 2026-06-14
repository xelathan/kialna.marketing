"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchRole } from "@/app/actions/auth";
import { User, Shield, ShoppingBag, RefreshCw } from "lucide-react";

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
        router.refresh();
      } else {
        alert(result.error || "Failed to switch role");
      }
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border-light shadow-lg rounded-full text-sm font-semibold hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer text-text-primary"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
        </div>
        <span>Testing: {currentUser ? currentUser.name : "Select Role"}</span>
        {isPending && <RefreshCw className="h-3 w-3 animate-spin text-text-secondary" />}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 bg-white dark:bg-zinc-900 border border-border-light rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Switch User Role
          </h3>
          <div className="space-y-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentUser?.role === r.name;
              return (
                <button
                  key={r.name}
                  onClick={() => handleRoleSwitch(r.name)}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border ${
                    isActive
                      ? "border-brand-primary bg-blue-50/20 dark:bg-blue-950/10 font-semibold"
                      : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  } cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${r.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-text-primary capitalize">{r.label}</div>
                      {isActive && (
                        <div className="text-xs text-text-secondary truncate max-w-[150px]">
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

          <div className="mt-4 pt-3 border-t border-border-light text-[10px] text-text-secondary">
            Logged in as: <span className="font-mono text-text-primary">{currentUser?.email || "None"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
