// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { Account, Transaction, Loan, EmiPayment } from "@/lib/models";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils/emi-calculator";
import Link from "next/link";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Clock,
  CreditCard,
  ArrowRight,
  Plus,
  ArrowLeftRight,
} from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { RecoveryButton } from "@/components/dashboard/recovery-button";
import mongoose from "mongoose";

export default async function DashboardPage() {
  await dbConnect();

  // 1️⃣ Get current user
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const userId = user.id;

  // 🔍 DEBUG INFO
  console.log("========================================");
  console.log("🔍 CURRENT USER INFO:");
  console.log("Clerk ID:", userId);
  console.log("Email:", user.emailAddresses[0]?.emailAddress);
  console.log("========================================");

  // Check what exists in the database
  const allAccountsCount = await Account.countDocuments({});
  const yourAccountsCount = await Account.countDocuments({ userId });
  const allTransactionsCount = await Transaction.countDocuments({});
  const yourTransactionsCount = await Transaction.countDocuments({ userId });

  console.log("📊 DATABASE STATS:");
  console.log("Total accounts in DB:", allAccountsCount);
  console.log("YOUR accounts:", yourAccountsCount);
  console.log("Total transactions in DB:", allTransactionsCount);
  console.log("YOUR transactions:", yourTransactionsCount);

  // Get sample userIds from database
  const sampleAccount = await Account.findOne({}).lean();
  const sampleTransaction = await Transaction.findOne({}).lean();

  console.log("📝 SAMPLE DATA:");
  console.log("Sample account userId:", sampleAccount?.userId);
  console.log("Sample transaction userId:", sampleTransaction?.userId);
  console.log("Sample transaction accountId:", sampleTransaction?.accountId);
  console.log("========================================");

  // ===== FIXED ORPHANED DATA DETECTION =====

  // 1. Check for transactions without accounts
  const orphanedTransactions = await Transaction.countDocuments({
    userId,
    $or: [{ accountId: null }, { accountId: { $exists: false } }],
  });

  // 2. Check for loans without disbursement accounts
  const orphanedLoans = await Loan.countDocuments({
    userId,
    $or: [
      { disbursementAccountId: null },
      { disbursementAccountId: { $exists: false } },
    ],
  });

  // 3. Check for PAID EMIs without transaction links (these are the actual orphans)
  const orphanedEmis = await EmiPayment.countDocuments({
    userId,
    status: "paid", // Only check paid EMIs
    $or: [{ transactionId: null }, { transactionId: { $exists: false } }],
  });

  // 4. Check for accounts with wrong userId (most important!)
  const allYourTransactions = await Transaction.find({ userId }).lean();
  const accountIdsFromTransactions = [
    ...new Set(
      allYourTransactions
        .filter((t) => t.accountId)
        .map((t) => t.accountId.toString())
    ),
  ];

  const orphanedAccountsByTransaction =
    accountIdsFromTransactions.length > 0
      ? await Account.countDocuments({
          _id: {
            $in: accountIdsFromTransactions.map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
          },
          userId: { $ne: userId },
        })
      : 0;

  console.log("🔍 ORPHANED DATA CHECK:");
  console.log("  Orphaned transactions:", orphanedTransactions);
  console.log("  Orphaned loans:", orphanedLoans);
  console.log("  Orphaned PAID EMIs without txn link:", orphanedEmis);
  console.log("  Accounts with wrong userId:", orphanedAccountsByTransaction);
  console.log("========================================");

  // 2️⃣ Fetch user's accounts
  const accounts = await Account.find({ userId, status: "active" }).lean();

  // 3️⃣ Fetch ALL transactions for accurate totals calculation
  const allTransactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  // 3️⃣b Fetch only recent 5 transactions for display
  const recentTransactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("accountId", "accountNumber accountType")
    .lean();

  // 4️⃣ Fetch active loans
  const loans = await Loan.find({
    userId,
    status: { $in: ["active", "disbursed"] },
  }).lean();

  // 5️⃣ Fetch pending EMIs
  const pendingEMIs = await EmiPayment.find({ userId, status: "pending" })
    .sort({ dueDate: 1 })
    .limit(3)
    .lean();

  // 6️⃣ Calculate totals - FIXED to use ALL transactions and match transaction page
  const totalBalance =
    accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  // ✅ FIXED: Use allTransactions and include loan_disbursement
  const totalDeposits =
    allTransactions
      ?.filter((t) =>
        ["deposit", "transfer_in", "loan_disbursement"].includes(t.type)
      )
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  // ✅ FIXED: Use allTransactions and include emi_payment
  const totalWithdrawals =
    allTransactions
      ?.filter((t) =>
        ["withdrawal", "transfer_out", "emi_payment"].includes(t.type)
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

  // Check if recovery is needed
  const needsRecovery =
    orphanedTransactions > 0 ||
    orphanedLoans > 0 ||
    orphanedEmis > 0 ||
    orphanedAccountsByTransaction > 0;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "transfer_in":
      case "loan_disbursement":
        return <ArrowDownLeft className="h-4 w-4 text-accent" />;
      case "withdrawal":
      case "transfer_out":
      case "emi_payment":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      default:
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "transfer_in":
      case "loan_disbursement":
        return "text-accent";
      case "withdrawal":
      case "transfer_out":
      case "emi_payment":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="space-y-8">
      {/* ✅ Show Recovery Button if ANY data needs recovery */}
      {needsRecovery && (
        <RecoveryButton
          transactionCount={orphanedTransactions}
          accountCount={yourAccountsCount}
          loanCount={orphanedLoans}
          emiCount={orphanedEmis}
          accountsWithWrongUserId={orphanedAccountsByTransaction}
        />
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          description={`Across ${accounts?.length || 0} accounts`}
          icon={Wallet}
          iconClassName="bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
        />
        <StatsCard
          title="Total Deposits"
          value={formatCurrency(totalDeposits)}
          description="This month"
          icon={ArrowDownLeft}
          iconClassName="bg-gradient-to-br from-accent/20 to-accent/10 text-accent"
        />
        <StatsCard
          title="Total Withdrawals"
          value={formatCurrency(totalWithdrawals)}
          description="This month"
          icon={ArrowUpRight}
          iconClassName="bg-gradient-to-br from-destructive/20 to-destructive/10 text-destructive"
        />
        <StatsCard
          title="Active Loans"
          value={loans?.length?.toString() || "0"}
          description={
            loans?.length
              ? `${formatCurrency(
                  loans.reduce(
                    (s, l) => s + Number(l.remainingAmount || l.amount),
                    0
                  )
                )} remaining`
              : "No active loans"
          }
          icon={Landmark}
          iconClassName="bg-gradient-to-br from-warning/20 to-warning/10 text-warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accounts Overview */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Your Accounts
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 rounded-lg bg-transparent"
            >
              <Link href="/dashboard/accounts">
                <Plus className="mr-2 h-4 w-4" />
                New Account
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {accounts && accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account._id.toString()}
                    className="group flex items-center justify-between rounded-xl bg-muted/50 p-4 transition-all duration-200 hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold capitalize text-card-foreground">
                          {account.accountType} Account
                        </p>
                        <p className="font-mono text-sm text-muted-foreground">
                          {account.accountNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-card-foreground">
                        {formatCurrency(Number(account.balance))}
                      </p>
                      <Badge
                        variant={
                          account.status === "active" ? "default" : "secondary"
                        }
                        className="mt-1 rounded-md"
                      >
                        {account.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium text-card-foreground">
                  No accounts yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first account to get started
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-lg bg-transparent"
                  asChild
                >
                  <Link href="/dashboard/accounts">
                    Create Your First Account
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Recent Transactions
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 rounded-lg text-primary hover:text-primary"
            >
              <Link href="/dashboard/transactions">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx._id.toString()}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium capitalize text-card-foreground">
                          {tx.type.replace("_", " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-base font-semibold ${getTransactionColor(
                        tx.type
                      )}`}
                    >
                      {["deposit", "transfer_in", "loan_disbursement"].includes(
                        tx.type
                      )
                        ? "+"
                        : "-"}
                      {formatCurrency(Math.abs(Number(tx.amount)))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium text-card-foreground">
                  No transactions yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming EMIs */}
      {pendingEMIs && pendingEMIs.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Upcoming EMI Payments
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 rounded-lg text-primary hover:text-primary"
            >
              <Link href="/dashboard/loans">
                View All Loans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {pendingEMIs.map((emi) => (
                <div
                  key={emi._id.toString()}
                  className="flex items-center justify-between rounded-xl border border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/20">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">
                        EMI #{emi.emiNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(emi.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-warning">
                    {formatCurrency(Number(emi.amount))}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
