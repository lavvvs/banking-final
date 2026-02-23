"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
} from "lucide-react";

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

interface LoanActionsDropdownProps {
  loanId: string;
  loanStatus: string;
  userAccounts: Account[];
}

export function LoanActionsDropdown({
  loanId,
  loanStatus,
  userAccounts,
}: LoanActionsDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/loans/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve loan");
      }

      setShowApproveDialog(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to approve loan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/loans/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject loan");
      }

      setShowRejectDialog(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to reject loan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisburse = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/loans/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disburse loan");
      }

      setShowDisburseDialog(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to disburse loan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {loanStatus === "pending" && (
            <>
              <DropdownMenuItem onClick={() => setShowApproveDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4 text-accent" />
                Approve Loan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                <XCircle className="mr-2 h-4 w-4 text-destructive" />
                Reject Loan
              </DropdownMenuItem>
            </>
          )}

          {loanStatus === "approved" && (
            <DropdownMenuItem onClick={() => setShowDisburseDialog(true)}>
              <Send className="mr-2 h-4 w-4 text-primary" />
              Disburse Loan
            </DropdownMenuItem>
          )}

          {!["pending", "approved"].includes(loanStatus) && (
            <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Loan Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the loan application. The user will be notified
              and the loan will be ready for disbursement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Loan Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the loan application. The user will be notified.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disburse Dialog */}
      <AlertDialog
        open={showDisburseDialog}
        onOpenChange={setShowDisburseDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disburse Loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disburse the loan amount to the user's account and
              create the EMI payment schedule. Make sure the user has an active
              account.
              {userAccounts.length === 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: User has no active accounts!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisburse}
              disabled={isLoading || userAccounts.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disbursing...
                </>
              ) : (
                "Disburse"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
