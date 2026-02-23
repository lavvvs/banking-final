// app/dashboard/loans/page.tsx
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { Account, Loan, EmiPayment, BankSetting } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils/emi-calculator";
import { ApplyLoanDialog } from "@/components/dashboard/apply-loan-dialog";
import { LoanDetailsDialog } from "@/components/dashboard/loan-details-dialog";
import {
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import mongoose from "mongoose";

export default async function LoansPage() {
  await dbConnect();

  // Get current user
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const userId = user.id; // Clerk ID string

  // ✅ FIX: Fetch user accounts using Clerk ID
  const accountsDocs = await Account.find({
    userId, // Use Clerk ID directly
    status: "active",
  }).lean();

  // Serialize accounts for client components
  const accounts = accountsDocs.map((acc: any) => ({
    id: acc._id.toString(),
    userId: acc.userId,
    accountNumber: acc.accountNumber,
    accountType: acc.accountType,
    balance: acc.balance || 0,
    status: acc.status,
  }));

  // ✅ FIX: Fetch loans using Clerk ID
  const loansDocs = await Loan.find({ userId }).sort({ createdAt: -1 }).lean();

  // ✅ FIX: Fetch bank settings using Mongoose model (not client.collection)
  const settingsDocs = await BankSetting.find({}).lean();
  const interestRates: Record<string, number> = {};

  settingsDocs?.forEach((s: any) => {
    if (s.settingKey?.endsWith("_loan_rate")) {
      const type = s.settingKey.replace("_loan_rate", "");
      interestRates[type] = parseFloat(s.settingValue);
    }
  });

  // Default interest rates if not found in settings
  if (Object.keys(interestRates).length === 0) {
    interestRates.personal = 12;
    interestRates.home = 8;
    interestRates.education = 10;
    interestRates.vehicle = 11;
    interestRates.business = 14;
  }

  // Helper to get pending EMIs count
  const getPendingEmisCount = async (loanId: mongoose.Types.ObjectId) => {
    return EmiPayment.countDocuments({ loanId, status: "pending" }).exec();
  };

  // Prepare loans with dynamic pending EMIs and EMI payments
  const loansWithDetails = await Promise.all(
    loansDocs.map(async (loan: any) => {
      const pendingEMIs = await getPendingEmisCount(loan._id);

      // Fetch EMI payments for this loan
      const emiPaymentsDocs = await EmiPayment.find({ loanId: loan._id })
        .sort({ emiNumber: 1 })
        .lean();

      const emiPayments = emiPaymentsDocs.map((emi: any) => ({
        id: emi._id.toString(),
        emiNumber: emi.emiNumber,
        dueDate: emi.dueDate.toISOString(),
        amount: emi.amount,
        principalAmount: emi.principalAmount,
        interestAmount: emi.interestAmount,
        status: emi.status,
        paidDate: emi.paidDate?.toISOString(),
      }));

      return {
        id: loan._id.toString(),
        userId: loan.userId,
        loanType: loan.loanType,
        amount: loan.amount,
        interestRate: loan.interestRate,
        tenureMonths: loan.tenureMonths,
        emiAmount: loan.emiAmount,
        totalPayable: loan.totalPayable,
        amountPaid: loan.amountPaid || 0,
        remainingAmount: loan.remainingAmount || loan.totalPayable,
        status: loan.status,
        disbursementAccountId: loan.disbursementAccountId?.toString(),
        nextEmiDate: loan.nextEmiDate?.toISOString(),
        createdAt: loan.createdAt.toISOString(),
        pendingEMIs,
        emiPayments,
      };
    })
  );

  // Totals
  const activeLoans = loansWithDetails.filter((l) =>
    ["active", "disbursed"].includes(l.status)
  );
  const totalBorrowed = activeLoans.reduce(
    (sum, l) => sum + Number(l.amount),
    0
  );
  const totalRemaining = activeLoans.reduce(
    (sum, l) => sum + Number(l.remainingAmount),
    0
  );
  const totalPaid = activeLoans.reduce(
    (sum, l) => sum + Number(l.amountPaid),
    0
  );

  // Badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-primary">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "disbursed":
      case "active":
        return (
          <Badge className="bg-accent text-accent-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Closed
          </Badge>
        );
      case "defaulted":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Defaulted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loan type icon
  const getLoanTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return "🏠";
      case "vehicle":
        return "🚗";
      case "education":
        return "🎓";
      case "business":
        return "💼";
      default:
        return "💰";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loans</h1>
          <p className="text-muted-foreground">
            Manage your loans and track EMI payments
          </p>
        </div>
        <ApplyLoanDialog accounts={accounts} interestRates={interestRates} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Borrowed</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(totalBorrowed)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold text-accent">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-bold text-warning">
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      {loansWithDetails.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {loansWithDetails.map((loan) => {
            const progress =
              loan.totalPayable > 0
                ? (Number(loan.amountPaid) / Number(loan.totalPayable)) * 100
                : 0;

            return (
              <Card key={loan.id} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                        {getLoanTypeIcon(loan.loanType)}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold capitalize">
                          {loan.loanType} Loan
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {loan.tenureMonths} months @ {loan.interestRate}%
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(loan.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Loan Amount
                      </p>
                      <p className="text-lg font-semibold text-card-foreground">
                        {formatCurrency(loan.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        EMI Amount
                      </p>
                      <p className="text-lg font-semibold text-card-foreground">
                        {formatCurrency(loan.emiAmount)}
                      </p>
                    </div>
                  </div>

                  {["active", "disbursed"].includes(loan.status) && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Repayment Progress
                          </span>
                          <span className="font-medium text-card-foreground">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Remaining
                          </p>
                          <p className="font-semibold text-card-foreground">
                            {formatCurrency(loan.remainingAmount)}
                          </p>
                        </div>
                        {loan.nextEmiDate && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Next EMI
                            </p>
                            <p className="font-semibold text-warning">
                              {formatDate(new Date(loan.nextEmiDate))}
                            </p>
                          </div>
                        )}
                      </div>

                      {loan.pendingEMIs > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {loan.pendingEMIs} EMI
                          {loan.pendingEMIs > 1 ? "s" : ""} pending
                        </p>
                      )}
                    </>
                  )}

                  {loan.status === "pending" && (
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-sm text-muted-foreground">
                        Your loan application is being reviewed.
                      </p>
                    </div>
                  )}

                  {loan.status === "approved" && (
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-sm text-primary">
                        Your loan has been approved! Disbursement will be
                        processed soon.
                      </p>
                    </div>
                  )}

                  {["active", "disbursed"].includes(loan.status) && (
                    <LoanDetailsDialog loan={loan} accounts={accounts} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Landmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">
              No loans yet
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              Apply for a loan to get started. We offer competitive rates.
            </p>
            <div className="mt-6">
              <ApplyLoanDialog
                accounts={accounts}
                interestRates={interestRates}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
