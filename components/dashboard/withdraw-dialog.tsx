"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils/emi-calculator";
import { Loader2 } from "lucide-react";

type AccountData = {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
};

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountData[];
  userId: string;
  onWithdrawSuccess?: () => void;
  createTransaction: (data: {
    userId: string;
    accountId: string;
    amount: number;
    type: "withdrawal";
    description?: string;
    referenceId: string;
  }) => Promise<void>;
  updateAccountBalance: (
    accountId: string,
    newBalance: number
  ) => Promise<void>;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  accounts,
  userId,
  onWithdrawSuccess,
  createTransaction,
  updateAccountBalance,
}: WithdrawDialogProps) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const resetForm = () => {
    setAccountId("");
    setAmount("");
    setDescription("");
    setError(null);
  };

  const handleWithdraw = async () => {
    if (!accountId || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    const withdrawAmount = Number.parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (selectedAccount && withdrawAmount > selectedAccount.balance) {
      setError("Insufficient balance");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const referenceId = `WTH-${Date.now()}`;

      if (!selectedAccount) {
        throw new Error("Account not found");
      }

      // First create the transaction
      await createTransaction({
        userId,
        accountId: selectedAccount.id,
        amount: withdrawAmount,
        type: "withdrawal",
        description: description || "Withdrawal",
        referenceId,
      });

      // Then update the account balance
      const newBalance = selectedAccount.balance - withdrawAmount;
      await updateAccountBalance(selectedAccount.id, newBalance);

      // Close dialog and reset form
      onOpenChange(false);
      resetForm();

      // Force a full page reload to show updated balance
      // This ensures the balance is refreshed from the database
      window.location.reload();
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      setError(err.message || "Withdrawal failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Money</DialogTitle>
          <DialogDescription>
            Withdraw funds from your account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="capitalize">{account.accountType}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">
                Available balance: {formatCurrency(selectedAccount.balance)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Amount (USD)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Add a note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Withdraw"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
