// app/admin/dashboard/page.tsx
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils/emi-calculator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  Wallet,
  ArrowLeftRight,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ArrowRight,
} from "lucide-react";
import dbConnect from "@/lib/mongodb";
import { Profile, Account, Transaction, Loan } from "@/lib/models";
import { clerkClient } from "@clerk/nextjs/server";

export default async function AdminDashboardPage() {
  await dbConnect();

  // Get unique users from accounts (since seed script creates accounts, not profiles)
  const allAccounts = await Account.find({}).lean();
  const uniqueUserIds = [...new Set(allAccounts.map((acc: any) => acc.userId))];
  const totalUsers = uniqueUserIds.length;
  const totalAccounts = await Account.countDocuments();

  const transactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const loans = await Loan.find().lean();

  const pendingKYC = await Profile.find({ kycStatus: "pending" })
    .limit(5)
    .lean();

  // Fetch pending loans
  const pendingLoansDocs = await Loan.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Fetch recent transactions
  const recentTransactionsDocs = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Get unique user IDs from pending loans
  const pendingLoanUserIds = [
    ...new Set(pendingLoansDocs.map((loan: any) => loan.userId)),
  ];

  // Get unique user IDs from recent transactions
  const recentTxnUserIds = [
    ...new Set(recentTransactionsDocs.map((txn: any) => txn.userId)),
  ];

  // Combine all user IDs
  const allUserIds = [...new Set([...pendingLoanUserIds, ...recentTxnUserIds])];

  // Fetch loans to get userName and userEmail from seed data
  const allLoans = await Loan.find({}).lean();
  const loanUsersMap = new Map();
  allLoans.forEach((loan: any) => {
    if (loan.userName && loan.userEmail && !loanUsersMap.has(loan.userId)) {
      loanUsersMap.set(loan.userId, {
        userName: loan.userName,
        userEmail: loan.userEmail,
      });
    }
  });

  // Fetch real Clerk users
  const client = await clerkClient();
  let clerkUsers: any[] = [];
  try {
    const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
    clerkUsers = clerkUsersResponse.data || [];
  } catch (error) {
    console.error("Failed to fetch Clerk users:", error);
  }

  // Create a map of Clerk users for quick lookup
  const clerkUserMap = new Map(clerkUsers.map((u: any) => [u.id, u]));

  // Build combined user data map
  const userDataMap = new Map();

  allUserIds.forEach((userId) => {
    const clerkUser = clerkUserMap.get(userId);
    const loanUser = loanUsersMap.get(userId);

    let userName = "Unknown User";
    let userEmail = "";

    if (clerkUser) {
      // Real Clerk user
      userName =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || "Unknown User";
      userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
    } else if (loanUser) {
      // Fake/seeded user
      userName = loanUser.userName;
      userEmail = loanUser.userEmail;
    }

    userDataMap.set(userId, { userName, userEmail });
  });

  // Serialize pending loans with combined user data
  const pendingLoans = pendingLoansDocs.map((loan: any) => {
    const userData = userDataMap.get(loan.userId) || {
      userName: loan.userName || "Unknown User",
      userEmail: loan.userEmail || "",
    };

    return {
      id: loan._id.toString(),
      userId: loan.userId,
      userName: userData.userName,
      userEmail: userData.userEmail,
      loanType: loan.loanType,
      amount: loan.amount,
      createdAt: loan.createdAt.toISOString(),
    };
  });

  // Serialize recent transactions with combined user data
  const recentTransactions = recentTransactionsDocs.map((txn: any) => {
    const userData = userDataMap.get(txn.userId) || {
      userName: txn.userId || "Unknown",
      userEmail: "",
    };

    return {
      id: txn._id.toString(),
      userId: txn.userId,
      userName: userData.userName,
      accountId: txn.accountId?.toString(),
      type: txn.type,
      amount: txn.amount,
      createdAt: txn.createdAt.toISOString(),
    };
  });

  const totalDeposits =
    transactions
      ?.filter((t) => t.type === "deposit" || t.type === "transfer_in")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalWithdrawals =
    transactions
      ?.filter((t) => t.type === "withdrawal" || t.type === "transfer_out")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

  const pendingLoansCount =
    loans?.filter((l) => l.status === "pending").length || 0;
  const approvedLoansCount =
    loans?.filter((l) => ["approved", "disbursed", "active"].includes(l.status))
      .length || 0;
  const totalLoanAmount =
    loans
      ?.filter((l) => ["disbursed", "active"].includes(l.status))
      .reduce((sum, l) => sum + Number(l.amount), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Overview of your banking system</p>
      </div>

      {/* Main Stats Grid - 4 columns */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {totalUsers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered users
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Accounts
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {totalAccounts}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active bank accounts
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Deposits
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {formatCurrency(totalDeposits)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <ArrowDownLeft className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Withdrawals
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {formatCurrency(totalWithdrawals)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <ArrowUpRight className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid - 4 columns */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Loans
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {pendingLoansCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting approval
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Loans
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {approvedLoansCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Landmark className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Loan Portfolio
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {formatCurrency(totalLoanAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total disbursed
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <Landmark className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Transactions
                </p>
                <p className="text-3xl font-semibold text-foreground mt-2 truncate">
                  {transactions.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recent transactions
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted-foreground/10">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Loans Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              Pending Loans
            </CardTitle>
            <Link href="/admin/loans">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingLoans.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No pending loans
              </p>
            ) : (
              pendingLoans.map((loan: any) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{loan.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.userEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(loan.amount)}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {loan.loanType}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              Recent Transactions
            </CardTitle>
            <Link href="/admin/transactions">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent transactions
              </p>
            ) : (
              recentTransactions.map((txn: any) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        txn.type === "deposit" ||
                        txn.type === "transfer_in" ||
                        txn.type === "credit"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {txn.type === "deposit" ||
                      txn.type === "transfer_in" ||
                      txn.type === "credit" ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium capitalize">
                        {txn.type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {txn.userName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        txn.type === "deposit" ||
                        txn.type === "transfer_in" ||
                        txn.type === "credit"
                          ? "text-emerald-500"
                          : "text-destructive"
                      }`}
                    >
                      {txn.type === "deposit" ||
                      txn.type === "transfer_in" ||
                      txn.type === "credit"
                        ? "+"
                        : "-"}
                      {formatCurrency(Math.abs(Number(txn.amount)))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(new Date(txn.createdAt))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending KYC Section */}
      {pendingKYC.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              Pending KYC Approvals
            </CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingKYC.map((profile: any) => (
                <div
                  key={profile._id.toString()}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{profile.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
