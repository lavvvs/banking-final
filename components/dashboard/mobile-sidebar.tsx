"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SafeProfile } from "@/types/safe-profile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/loans", label: "Loan Management", icon: Landmark },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/settings", label: "System Settings", icon: Shield },
];

interface MobileSidebarProps {
  profile: SafeProfile | null;
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ profile, open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile?.isAdmin;
  const navItems =
    pathname.startsWith("/admin") && isAdmin ? adminNavItems : userNavItems;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex h-16 flex-row items-center gap-2 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <SheetTitle className="text-lg font-bold">NexBank</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="border-t p-4">
            <Link
              href={pathname.startsWith("/admin") ? "/dashboard" : "/admin"}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Shield className="h-5 w-5" />
              {pathname.startsWith("/admin") ? "User Dashboard" : "Admin Panel"}
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
