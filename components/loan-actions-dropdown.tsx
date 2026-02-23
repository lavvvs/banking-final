"use client";

import { useState } from "react";
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
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Banknote,
  Loader2,
} from "lucide-react";

interface LoanActionsDropdownProps {
  loanId: string;
  loanStatus: string;
  userAccounts: { id: string; balance: number }[];
  actions: {
    approve: (loanId: string) => Promise<void>;
    reject: (loanId: string) => Promise<void>;
    disburse: (loanId: string) => Promise<void>;
  };
}

export function LoanActionsDropdown({
  loanId,
  loanStatus,
  userAccounts,
  actions,
}: LoanActionsDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (actionFn: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await actionFn();
    } catch (err: any) {
      alert(err.message);
    }
    setIsLoading(false);
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
        {loanStatus === "pending" && (
          <>
            <DropdownMenuItem
              onClick={() => handleAction(() => actions.approve(loanId))}
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-accent" /> Approve Loan
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction(() => actions.reject(loanId))}
            >
              <XCircle className="mr-2 h-4 w-4 text-destructive" /> Reject Loan
            </DropdownMenuItem>
          </>
        )}
        {loanStatus === "approved" && (
          <DropdownMenuItem
            onClick={() => handleAction(() => actions.disburse(loanId))}
          >
            <Banknote className="mr-2 h-4 w-4 text-accent" /> Disburse Loan
          </DropdownMenuItem>
        )}
        {["pending", "approved"].every((s) => s !== loanStatus) && (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No actions available</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
