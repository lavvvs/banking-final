"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ILoan, IEmiPayment, IAccount } from "@/lib/models";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

interface LoanDetailsDialogProps {
  loan: ILoan & { emi_payments?: IEmiPayment[] };
  accounts: IAccount[];
}

export function LoanDetailsDialog({ loan, accounts }: LoanDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
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

  const handlePayEMI = async (emi: IEmiPayment) => {
    if (!user) return alert("You must be logged in");

    setIsLoading(emi._id.toString());

    try {
      // Find payment account
      const paymentAccount =
        accounts.find(
          (a) => a._id.toString() === loan.disbursementAccountId?.toString()
        ) || accounts[0];
      if (!paymentAccount) throw new Error("No payment account found");
      if (paymentAccount.balance < emi.amount)
        throw new Error("Insufficient balance");

      // Call your backend API to handle EMI payment (MongoDB updates)
      await axios.post("/api/loans/pay-emi", {
        loanId: loan._id,
        emiId: emi._id,
        userId: user.id,
        accountId: paymentAccount._id.toString(),
      });

      setIsLoading(null);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to pay EMI");
      setIsLoading(null);
    }
  };

  const sortedEMIs =
    loan.emi_payments?.sort((a, b) => a.emiNumber - b.emiNumber) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Eye className="mr-2 h-4 w-4" />
          View Details & Pay EMI
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {loan.loanType} Loan Details
          </DialogTitle>
          <DialogDescription>
            View your EMI schedule and make payments.
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
                {(loan.remainingAmount ?? loan.totalPayable).toLocaleString(
                  "en-US",
                  { style: "currency", currency: "USD" }
                )}
              </p>
            </div>
          </div>

          {/* EMI Schedule */}
          <div className="rounded-lg border border-border">
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
                    <TableRow key={emi._id.toString()}>
                      <TableCell>{emi.emiNumber}</TableCell>
                      <TableCell>
                        {new Date(emi.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
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
                        {emi.status === "pending" ? (
                          <Button
                            size="sm"
                            onClick={() => handlePayEMI(emi)}
                            disabled={isLoading === emi._id.toString()}
                          >
                            {isLoading === emi._id.toString() ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Pay Now"
                            )}
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
                      EMI schedule will be generated after loan disbursement.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
