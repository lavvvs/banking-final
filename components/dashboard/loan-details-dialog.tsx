"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

interface SerializedEmiPayment {
  id: string;
  emiNumber: number;
  dueDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  status: string;
  paidDate?: string;
}

interface SerializedLoan {
  id: string;
  userId: string;
  loanType: string;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalPayable: number;
  amountPaid: number;
  remainingAmount: number;
  status: string;
  disbursementAccountId?: string;
  emiPayments?: SerializedEmiPayment[];
}

interface SerializedAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: string;
}

interface LoanDetailsDialogProps {
  loan: SerializedLoan;
  accounts: SerializedAccount[];
}

export function LoanDetailsDialog({ loan, accounts }: LoanDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState<SerializedEmiPayment | null>(
    null
  );
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const router = useRouter();
  const { user } = useUser();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-accent text-accent-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLoanStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "secondary",
      approved: "default",
      active: "default",
      rejected: "destructive",
      completed: "outline",
      disbursed: "default",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const handleOpenPaymentDialog = (emi: SerializedEmiPayment) => {
    // Check if loan is active or disbursed before allowing payment
    if (loan.status !== "active" && loan.status !== "disbursed") {
      let message = "Loan must be approved and disbursed first.";

      if (loan.status === "pending") {
        message = "Loan is still pending approval.";
      } else if (loan.status === "approved") {
        message =
          "Loan is approved but not yet disbursed. Please wait for disbursement.";
      } else if (loan.status === "rejected") {
        message = "This loan has been rejected.";
      } else if (loan.status === "completed") {
        message = "This loan has been fully paid.";
      }

      toast.error("Cannot Pay EMI", {
        description: `${message} Current status: ${loan.status}`,
      });
      return;
    }

    setSelectedEmi(emi);
    // Pre-select the default account or first account
    const defaultAccount =
      accounts.find((a) => a.id === loan.disbursementAccountId) || accounts[0];
    if (defaultAccount) {
      setSelectedAccountId(defaultAccount.id);
    }
    setShowPaymentDialog(true);
  };

  const handlePayEMI = async () => {
    if (!user || !selectedEmi || !selectedAccountId) {
      toast.error("Missing Information", {
        description: "Please select an account to proceed with payment.",
      });
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
    if (!selectedAccount) {
      toast.error("Account Not Found", {
        description: "The selected account could not be found.",
      });
      return;
    }

    if (selectedAccount.balance < selectedEmi.amount) {
      toast.error("Insufficient Balance", {
        description: `You need ${selectedEmi.amount.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })} but only have ${selectedAccount.balance.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })} in your account.`,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/api/loans/pay-emi", {
        loanId: loan.id,
        emiId: selectedEmi.id,
        accountId: selectedAccountId,
      });

      if (response.data.success) {
        toast.success("Payment Successful! 🎉", {
          description: `EMI #${
            selectedEmi.emiNumber
          } has been paid successfully. Your new balance is ${response.data.data.newBalance.toLocaleString(
            "en-US",
            { style: "currency", currency: "USD" }
          )}.`,
        });
        setShowPaymentDialog(false);
        setOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Payment Failed", {
        description:
          err.response?.data?.error ||
          err.message ||
          "Failed to process EMI payment. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sortedEMIs =
    loan.emiPayments?.sort((a, b) => a.emiNumber - b.emiNumber) || [];

  // Check if loan can accept EMI payments
  const canPayEMI = loan.status === "active" || loan.status === "disbursed";
  const hasEMISchedule = sortedEMIs.length > 0;

  // Get status message
  const getStatusMessage = () => {
    if (loan.status === "pending") {
      return "⏳ Loan is pending approval from admin.";
    }
    if (loan.status === "approved") {
      return "✓ Loan is approved! Waiting for disbursement.";
    }
    if (loan.status === "rejected") {
      return "❌ Loan has been rejected.";
    }
    if (loan.status === "completed") {
      return "🎉 Congratulations! You have successfully paid all EMIs.";
    }
    if (!hasEMISchedule) {
      return "📋 EMI schedule will be generated after loan disbursement.";
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full bg-transparent">
            <Eye className="mr-2 h-4 w-4" />
            View Details & Pay EMI
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="capitalize">
                {loan.loanType} Loan Details
              </DialogTitle>
              {getLoanStatusBadge(loan.status)}
            </div>
            <DialogDescription>
              View your EMI schedule and make payments from your accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Loan Summary */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Loan Amount</p>
                <p className="font-semibold text-card-foreground">
                  {loan.amount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="font-semibold text-card-foreground">
                  {loan.interestRate}% p.a.
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount Paid</p>
                <p className="font-semibold text-accent">
                  {loan.amountPaid.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold text-warning">
                  {loan.remainingAmount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
              </div>
            </div>

            {/* Status Message Banner */}
            {statusMessage && (
              <div
                className={`rounded-lg p-4 ${
                  loan.status === "pending"
                    ? "bg-yellow-50 border border-yellow-200"
                    : loan.status === "approved"
                    ? "bg-blue-50 border border-blue-200"
                    : loan.status === "rejected"
                    ? "bg-red-50 border border-red-200"
                    : loan.status === "completed"
                    ? "bg-green-50 border border-green-200"
                    : "bg-muted/50 border"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    loan.status === "pending"
                      ? "text-yellow-900"
                      : loan.status === "approved"
                      ? "text-blue-900"
                      : loan.status === "rejected"
                      ? "text-red-900"
                      : loan.status === "completed"
                      ? "text-green-900"
                      : "text-muted-foreground"
                  }`}
                >
                  {statusMessage}
                </p>
              </div>
            )}

            {/* EMI Schedule */}
            <div className="rounded-lg border border-border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">EMI Schedule</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {canPayEMI && hasEMISchedule
                    ? "Click 'Pay Now' to pay any pending EMI"
                    : "EMI payments will be available after disbursement"}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>EMI Amount</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEMIs.length ? (
                    sortedEMIs.map((emi) => (
                      <TableRow key={emi.id}>
                        <TableCell className="font-medium">
                          {emi.emiNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(emi.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {emi.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </TableCell>
                        <TableCell>
                          {emi.principalAmount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </TableCell>
                        <TableCell>
                          {emi.interestAmount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(emi.status)}</TableCell>
                        <TableCell className="text-right">
                          {emi.status === "pending" ||
                          emi.status === "overdue" ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPaymentDialog(emi)}
                              disabled={!canPayEMI}
                            >
                              Pay Now
                            </Button>
                          ) : (
                            emi.paidDate && (
                              <span className="text-xs text-muted-foreground">
                                Paid on{" "}
                                {new Date(emi.paidDate).toLocaleDateString()}
                              </span>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        {loan.status === "active" || loan.status === "disbursed"
                          ? "Loading EMI schedule..."
                          : "EMI schedule will be generated after loan disbursement."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Pay EMI #{selectedEmi?.emiNumber}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EMI Amount:</span>
                    <span className="font-semibold">
                      {selectedEmi?.amount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-semibold">
                      {selectedEmi?.dueDate &&
                        new Date(selectedEmi.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Payment Account</Label>
                  <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-medium">
                                {account.accountType}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {account.accountNumber}
                              </span>
                            </div>
                            <span
                              className={`text-sm ${
                                account.balance < (selectedEmi?.amount || 0)
                                  ? "text-destructive"
                                  : "text-accent"
                              }`}
                            >
                              Balance:{" "}
                              {account.balance.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAccountId && selectedEmi && (
                  <div className="text-sm">
                    {accounts.find((a) => a.id === selectedAccountId)
                      ?.balance! < selectedEmi.amount ? (
                      <div className="text-destructive bg-destructive/10 p-2 rounded">
                        ⚠️ Insufficient balance in selected account
                      </div>
                    ) : (
                      <div className="text-accent bg-accent/10 p-2 rounded">
                        ✓ Payment will be deducted from this account
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePayEMI}
              disabled={(() => {
                if (isLoading || !selectedAccountId || !selectedEmi)
                  return true;
                const selectedAccount = accounts.find(
                  (a) => a.id === selectedAccountId
                );
                if (!selectedAccount) return true;
                return selectedAccount.balance < selectedEmi.amount;
              })()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
