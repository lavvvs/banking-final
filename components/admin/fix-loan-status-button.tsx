// components/admin/fix-loan-status-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";

export function FixLoanStatusButton() {
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    if (
      !confirm(
        "This will change all 'disbursed' loans to 'active' status. Continue?"
      )
    ) {
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Fixing loan statuses...");

    try {
      const res = await fetch("/api/admin/fix-loan-status", {
        method: "POST",
      });

      const data = await res.json();

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(`Fixed ${data.loansFixed} loans!`, {
          description: `Changed status from "disbursed" to "active"`,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Failed to fix loans", {
          description: data.error || "Unknown error",
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to fix loans", {
        description: "Please check console for details",
      });
      console.error("Fix error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFix}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Fixing...
        </>
      ) : (
        <>
          <Wrench className="h-4 w-4" />
          Fix Loan Status
        </>
      )}
    </Button>
  );
}
