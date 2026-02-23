"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
} from "lucide-react";
import type { IProfile } from "@/lib/models";

interface UserActionsDropdownProps {
  user: IProfile;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateKYC = async (status: "approved" | "rejected") => {
    setIsLoading(true);

    await fetch("/api/users/update-kyc", {
      method: "POST",
      body: JSON.stringify({
        userId: user._id,
        status,
      }),
    });

    setIsLoading(false);
    router.refresh();
  };

  const toggleAdmin = async () => {
    setIsLoading(true);

    await fetch("/api/users/toggle-admin", {
      method: "POST",
      body: JSON.stringify({
        userId: user._id,
        isAdmin: !user.isAdmin,
      }),
    });

    setIsLoading(false);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* PENDING → Show Approve / Reject */}
        {user.kycStatus === "pending" && (
          <>
            <DropdownMenuItem onClick={() => updateKYC("approved")}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-accent" />
              Approve KYC
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => updateKYC("rejected")}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Reject KYC
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        {/* REJECTED → Show Approve Again */}
        {user.kycStatus === "rejected" && (
          <DropdownMenuItem onClick={() => updateKYC("approved")}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-accent" />
            Approve KYC
          </DropdownMenuItem>
        )}

        {/* ADMIN TOGGLE */}
        <DropdownMenuItem onClick={toggleAdmin}>
          <Shield className="mr-2 h-4 w-4 text-primary" />
          {user.isAdmin ? "Remove Admin" : "Make Admin"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
