import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { Account, Transaction } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils/emi-calculator";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { WithdrawDialogWrapper } from "@/components/dashboard/WithdrawDialogWrapper";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Landmark,
} from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// ✅ FIX: Define proper types for Next.js 15+
interface TransactionsPageProps {
  searchParams: Promise<{
    type?: string;
    account?: string;
  }>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  await dbConnect();

  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const userId = user.id;

  // ✅ FIX: Await searchParams in Next.js 15+
  const params = await searchParams;

  // Fetch only active accounts for transactions
  const accountsDocs = await Account.find({
    userId,
    status: "active",
  }).lean();

  // ✅ FIXED: Properly serialize accounts for Client Component
  const accounts = accountsDocs.map((acc: any) => {
    console.log("🔍 Processing account:", acc);
    console.log("🔍 Account _id:", acc._id);

    return {
      id: acc._id ? acc._id.toString() : "",
      userId: acc.userId || "",
      accountNumber: acc.accountNumber || "",
      accountType: acc.accountType || "",
      balance: acc.balance || 0,
      currency: acc.currency || "USD",
      status: acc.status || "active",
    };
  });

  console.log("✅ Serialized accounts:", accounts);

  // ✅ Safe query building using awaited params
  let txQuery: any = { userId };

  const typeParam = params.type;
  if (typeParam && typeParam !== "all") {
    txQuery.type = typeParam;
  }

  const accountParam = params.account;
  if (accountParam && accountParam !== "all") {
    try {
      txQuery.accountId = new mongoose.Types.ObjectId(accountParam);
    } catch {
      console.warn("Invalid accountId in searchParams:", accountParam);
    }
  }

  const transactionsDocs = await Transaction.find(txQuery)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("accountId", "accountNumber accountType")
    .lean();

  // ✅ FIXED: Serialize transactions
  const transactions = transactionsDocs.map((tx) => ({
    id: tx._id.toString(),
    userId: tx.userId,
    accountId: tx.accountId
      ? {
          id:
            typeof tx.accountId === "object"
              ? tx.accountId._id.toString()
              : tx.accountId.toString(),
          accountNumber:
            typeof tx.accountId === "object"
              ? tx.accountId.accountNumber
              : null,
          accountType:
            typeof tx.accountId === "object" ? tx.accountId.accountType : null,
        }
      : null,
    amount: tx.amount,
    type: tx.type,
    status: tx.status,
    description: tx.description || "",
    referenceId: tx.referenceId || "",
    createdAt: tx.createdAt.toISOString(),
  }));

  const totalDeposits =
    transactions
      .filter((t) =>
        ["deposit", "transfer_in", "loan_disbursement"].includes(t.type)
      )
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalWithdrawals =
    transactions
      .filter((t) =>
        ["withdrawal", "transfer_out", "emi_payment"].includes(t.type)
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-accent" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "transfer_in":
        return <ArrowDownLeft className="h-4 w-4 text-primary" />;
      case "transfer_out":
        return <ArrowUpRight className="h-4 w-4 text-warning" />;
      case "emi_payment":
        return <Landmark className="h-4 w-4 text-destructive" />;
      case "loan_disbursement":
        return <Landmark className="h-4 w-4 text-accent" />;
      default:
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-accent text-accent-foreground">
            Completed
          </Badge>
        );
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Withdraw Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        {/* ✅ FIXED: Now passing serialized accounts */}
        <WithdrawDialogWrapper accounts={accounts} userId={userId} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <ArrowDownLeft className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Deposits</p>
              <p className="text-xl font-bold text-accent">
                {formatCurrency(totalDeposits)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <ArrowUpRight className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawals</p>
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(totalWithdrawals)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Flow</p>
              <p
                className={`text-xl font-bold ${
                  totalDeposits - totalWithdrawals >= 0
                    ? "text-accent"
                    : "text-destructive"
                }`}
              >
                {formatCurrency(totalDeposits - totalWithdrawals)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TransactionFilters accounts={accounts} />

      {/* Transactions Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <span className="font-medium capitalize text-card-foreground">
                          {tx.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-muted-foreground">
                          {tx.accountId?.accountNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-card-foreground">
                          {tx.description || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(tx.status)}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(new Date(tx.createdAt))}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`font-semibold ${
                            ["deposit", "loan_disbursement"].includes(tx.type)
                              ? "text-accent"
                              : "text-destructive"
                          }`}
                        >
                          {[
                            "deposit",
                            "transfer_in",
                            "loan_disbursement",
                          ].includes(tx.type)
                            ? "+"
                            : "-"}
                          {formatCurrency(Math.abs(Number(tx.amount)))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-card-foreground">
                No transactions yet
              </p>
              <p className="text-muted-foreground">
                Start by depositing money or making a transfer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
