"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SafeProfile } from "@/types/safe-profile";
import {
  Building2,
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Landmark,
  Settings,
  Shield,
  Users,
  BarChart3,
  CreditCard,
  Plus,
  ChevronRight,
} from "lucide-react";

const userNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
  },
  { href: "/dashboard/loans", label: "Loans", icon: Landmark },
  { href: "/dashboard/deposit", label: "Add Funds", icon: Plus },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/loans", label: "Loan Management", icon: Landmark },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/settings", label: "System Settings", icon: Shield },
];

interface DashboardSidebarProps {
  profile: SafeProfile | null;
}

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile?.isAdmin;
  const navItems =
    pathname.startsWith("/admin") && isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            NexBank
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {pathname.startsWith("/admin") ? "Administration" : "Menu"}
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn("h-5 w-5", isActive && "text-primary")}
                  />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Toggle */}
        {isAdmin && (
          <div className="border-t border-sidebar-border p-4">
            <Link
              href={pathname.startsWith("/admin") ? "/dashboard" : "/admin"}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 px-3 py-3 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:from-primary/20 hover:to-accent/20"
            >
              <Shield className="h-5 w-5 text-primary" />
              {pathname.startsWith("/admin") ? "User Dashboard" : "Admin Panel"}
            </Link>
          </div>
        )}

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/30 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground shadow-md">
              {profile?.fullName?.charAt(0)?.toUpperCase() ||
                profile?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {profile?.fullName || "User"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {profile?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
