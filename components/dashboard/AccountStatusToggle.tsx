"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccountStatusToggleProps {
  accountId: string;
  currentStatus: "active" | "inactive";
  accountNumber: string;
  accountType: string;
}

export function AccountStatusToggle({
  accountId,
  currentStatus,
  accountNumber,
  accountType,
}: AccountStatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    "active" | "inactive" | null
  >(null);
  const router = useRouter();

  const isActive = currentStatus === "active";

  const handleToggle = (checked: boolean) => {
    const newStatus = checked ? "active" : "inactive";
    setPendingStatus(newStatus);
    setShowDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/accounts/${accountId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update account status");
      }

      setShowDialog(false);
      setPendingStatus(null);

      // Refresh the page to show updated status
      router.refresh();
    } catch (error: any) {
      console.error("Status update error:", error);
      alert(error.message || "Failed to update account status");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelStatusChange = () => {
    setShowDialog(false);
    setPendingStatus(null);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          id={`status-${accountId}`}
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
        <Label htmlFor={`status-${accountId}`} className="cursor-pointer">
          {isActive ? (
            <span className="text-sm font-medium text-green-600">Active</span>
          ) : (
            <span className="text-sm font-medium text-gray-500">Inactive</span>
          )}
        </Label>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === "active" ? "Activate" : "Deactivate"} Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === "active" ? (
                <>
                  Are you sure you want to activate account{" "}
                  <strong>{accountNumber}</strong> ({accountType})? This will
                  allow transactions on this account.
                </>
              ) : (
                <>
                  Are you sure you want to deactivate account{" "}
                  <strong>{accountNumber}</strong> ({accountType})? This will
                  prevent any new transactions on this account.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelStatusChange}
              disabled={isLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
