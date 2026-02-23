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

interface UserActionsDropdownProps {
  user: {
    _id: string;
    userId: string;
    clerkId: string;
    hasProfile: boolean;
    fullName: string;
    email: string;
    phone: string;
    isAdmin: boolean;
    kycStatus: string;
  };
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateKYC = async (status: "approved" | "rejected") => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/update-kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          clerkId: user.clerkId,
          hasProfile: user.hasProfile,
          status,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error:", error);
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
    }

    setIsLoading(false);
    router.refresh();
  };

  const toggleAdmin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/toggle-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          clerkId: user.clerkId,
          hasProfile: user.hasProfile,
          isAdmin: !user.isAdmin,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error:", error);
      }
    } catch (error) {
      console.error("Error toggling admin:", error);
    }

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

        {user.kycStatus === "pending" && (
          <>
            <DropdownMenuItem onClick={() => updateKYC("approved")}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Mark as Verified
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => updateKYC("rejected")}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Mark as Unverified
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        {user.kycStatus === "approved" && (
          <>
            <DropdownMenuItem onClick={() => updateKYC("rejected")}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Mark as Unverified
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        {user.kycStatus === "rejected" && (
          <>
            <DropdownMenuItem onClick={() => updateKYC("approved")}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Mark as Verified
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={toggleAdmin}>
          <Shield className="mr-2 h-4 w-4 text-primary" />
          {user.isAdmin ? "Remove Admin" : "Make Admin"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
