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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils/emi-calculator";
import type { IAccount } from "@/lib/models";
import { Loader2 } from "lucide-react";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: IAccount[];
  userId: string; // current logged-in user id
  onTransferSuccess?: () => void;
  createTransaction: (data: {
    userId: string;
    accountId: string;
    amount: number;
    type: "transfer_in" | "transfer_out";
    description?: string;
    referenceId: string;
    recipientAccountId?: string;
    recipientUserId?: string;
  }) => Promise<void>;
  updateAccountBalance: (
    accountId: string,
    newBalance: number
  ) => Promise<void>;
}

export function TransferDialog({
  open,
  onOpenChange,
  accounts,
  userId,
  onTransferSuccess,
  createTransaction,
  updateAccountBalance,
}: TransferDialogProps) {
  const [transferType, setTransferType] = useState<"internal" | "external">(
    "internal"
  );
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fromAccount = accounts.find((a) => a._id.toString() === fromAccountId);
  const toAccount = accounts.find((a) => a._id.toString() === toAccountId);

  const resetForm = () => {
    setFromAccountId("");
    setToAccountId("");
    setRecipientAccountNumber("");
    setAmount("");
    setDescription("");
    setError(null);
  };

  const handleTransfer = async () => {
    if (!fromAccountId || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    if (transferType === "internal" && !toAccountId) {
      setError("Please select a destination account");
      return;
    }

    if (transferType === "external" && !recipientAccountNumber) {
      setError("Please enter recipient account number");
      return;
    }

    const transferAmount = Number.parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (fromAccount && transferAmount > fromAccount.balance) {
      setError("Insufficient balance");
      return;
    }

    if (transferType === "internal" && fromAccountId === toAccountId) {
      setError("Cannot transfer to the same account");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const referenceId = `TRF-${Date.now()}`;

      if (transferType === "internal") {
        // Debit
        if (fromAccount) {
          await createTransaction({
            userId,
            accountId: fromAccount._id.toString(),
            amount: transferAmount,
            type: "transfer_out",
            description:
              description || `Transfer to ${toAccount?.accountNumber}`,
            referenceId,
            recipientAccountId: toAccount?._id.toString(),
          });
          await updateAccountBalance(
            fromAccount._id.toString(),
            fromAccount.balance - transferAmount
          );
        }

        // Credit
        if (toAccount) {
          await createTransaction({
            userId,
            accountId: toAccount._id.toString(),
            amount: transferAmount,
            type: "transfer_in",
            description:
              description || `Transfer from ${fromAccount?.accountNumber}`,
            referenceId,
          });
          await updateAccountBalance(
            toAccount._id.toString(),
            toAccount.balance + transferAmount
          );
        }
      } else {
        // External transfer
        const recipientAccount = accounts.find(
          (a) => a.accountNumber === recipientAccountNumber
        );
        if (!recipientAccount) {
          setError("Recipient account not found");
          setIsLoading(false);
          return;
        }

        // Debit
        if (fromAccount) {
          await createTransaction({
            userId,
            accountId: fromAccount._id.toString(),
            amount: transferAmount,
            type: "transfer_out",
            description: description || `Transfer to ${recipientAccountNumber}`,
            referenceId,
            recipientAccountId: recipientAccount._id.toString(),
            recipientUserId: recipientAccount.userId.toString(),
          });
          await updateAccountBalance(
            fromAccount._id.toString(),
            fromAccount.balance - transferAmount
          );
        }

        // Credit recipient
        await createTransaction({
          userId: recipientAccount.userId.toString(),
          accountId: recipientAccount._id.toString(),
          amount: transferAmount,
          type: "transfer_in",
          description:
            description || `Transfer from ${fromAccount?.accountNumber}`,
          referenceId,
        });
        await updateAccountBalance(
          recipientAccount._id.toString(),
          recipientAccount.balance + transferAmount
        );
      }

      onOpenChange(false);
      resetForm();
      onTransferSuccess?.();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Transfer failed");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>
            Transfer funds between accounts or to another user.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={transferType}
          onValueChange={(v) => setTransferType(v as "internal" | "external")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal">My Accounts</TabsTrigger>
            <TabsTrigger value="external">Another User</TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account._id.toString()}
                      value={account._id.toString()}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="capitalize">
                          {account.accountType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Account</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a._id.toString() !== fromAccountId)
                    .map((account) => (
                      <SelectItem
                        key={account._id.toString()}
                        value={account._id.toString()}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="capitalize">
                            {account.accountType}
                          </span>
                          <span className="font-mono text-xs">
                            {account.accountNumber}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="external" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account._id.toString()}
                      value={account._id.toString()}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="capitalize">
                          {account.accountType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recipient Account Number</Label>
              <Input
                placeholder="e.g., ACC1234567890"
                value={recipientAccountNumber}
                onChange={(e) => setRecipientAccountNumber(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
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
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(fromAccount.balance)}
              </p>
            )}
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

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Transfer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
