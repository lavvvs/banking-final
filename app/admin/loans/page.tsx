// app/admin/loans/page.tsx
import dbConnect from "@/lib/mongodb";
import { Account, Loan } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/emi-calculator";
import { LoanActionsDropdown } from "@/components/admin/loan-actions-dropdown";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FixLoanStatusButton } from "@/components/admin/fix-loan-status-button";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminLoansPage(props: PageProps) {
  await dbConnect();

  const searchParams = await props.searchParams;
  const currentPage = parseInt(searchParams.page || "1");
  const statusFilter = searchParams.status || "all";
  const itemsPerPage = 10;
  const skip = (currentPage - 1) * itemsPerPage;

  // Build filter query
  const filterQuery: any = {};
  if (statusFilter !== "all") {
    filterQuery.status = statusFilter;
  }

  // Fetch loans with pagination
  const [loansDocs, totalCount] = await Promise.all([
    Loan.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .lean(),
    Loan.countDocuments(filterQuery),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Get unique user IDs from loans
  const userIds = [...new Set(loansDocs.map((loan: any) => loan.userId))];

  // Create a map of loan data (for seed/fake users)
  const loanUsersMap = new Map();
  loansDocs.forEach((loan: any) => {
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
    // Fetch all Clerk users
    const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
    clerkUsers = clerkUsersResponse.data || [];
  } catch (error) {
    console.error("Failed to fetch Clerk users:", error);
  }

  // Create a map of Clerk users for quick lookup
  const clerkUserMap = new Map(clerkUsers.map((u: any) => [u.id, u]));

  // Build user data map combining Clerk and loan data
  const userDataMap = new Map();

  userIds.forEach((userId) => {
    const clerkUser = clerkUserMap.get(userId);
    const loanUser = loanUsersMap.get(userId);

    let userName = "Unknown User";
    let userEmail = "";

    if (clerkUser) {
      // Real Clerk user - prioritize Clerk data
      userName =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            "Unknown User";
      userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
    } else if (loanUser) {
      // Fake/seeded user - use loan data
      userName = loanUser.userName;
      userEmail = loanUser.userEmail;
    }

    userDataMap.set(userId, { userName, userEmail });
  });

  // Serialize loans with combined user data
  const loans = loansDocs.map((loan: any) => {
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
      interestRate: loan.interestRate,
      tenureMonths: loan.tenureMonths,
      emiAmount: loan.emiAmount,
      totalPayable: loan.totalPayable,
      amountPaid: loan.amountPaid || 0,
      remainingAmount: loan.remainingAmount || loan.totalPayable,
      status: loan.status,
      disbursementAccountId: loan.disbursementAccountId?.toString(),
      rejectionReason: loan.rejectionReason,
      createdAt: loan.createdAt.toISOString(),
      approvedAt: loan.approvedAt?.toISOString(),
      disbursedAt: loan.disbursedAt?.toISOString(),
      rejectedAt: loan.rejectedAt?.toISOString(),
    };
  });

  // Fetch all active accounts for the loan actions dropdown
  const accountsDocs = await Account.find({ status: "active" }).lean();
  const accounts = accountsDocs.map((acc: any) => ({
    id: acc._id.toString(),
    userId: acc.userId,
    accountNumber: acc.accountNumber,
    accountType: acc.accountType,
    balance: acc.balance,
    status: acc.status,
  }));

  // Stats - fetch all loans for stats (not paginated)
  const allLoans = await Loan.find({}).lean();
  const pendingCount = allLoans.filter(
    (l: any) => l.status === "pending"
  ).length;
  const approvedCount = allLoans.filter(
    (l: any) => l.status === "approved"
  ).length;
  const activeCount = allLoans.filter((l: any) => l.status === "active").length;
  const disbursedCount = allLoans.filter(
    (l: any) => l.status === "disbursed"
  ).length;
  const rejectedCount = allLoans.filter(
    (l: any) => l.status === "rejected"
  ).length;
  const completedCount = allLoans.filter(
    (l: any) => l.status === "completed"
  ).length;

  const totalDisbursed = allLoans
    .filter((l: any) =>
      ["disbursed", "active", "completed", "closed"].includes(l.status)
    )
    .reduce((sum: number, l: any) => sum + Number(l.amount), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 gap-1 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1 whitespace-nowrap">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "disbursed":
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 gap-1 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case "completed":
      case "closed":
        return (
          <Badge variant="outline" className="gap-1 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "defaulted":
        return (
          <Badge variant="destructive" className="gap-1 whitespace-nowrap">
            <AlertCircle className="h-3 w-3" />
            Defaulted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ✅ HEADER WITH FIX BUTTON */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Loan Management
          </h1>
          <p className="text-muted-foreground">
            Review and manage loan applications
          </p>
        </div>
        {/* ✅ ADD THE FIX BUTTON HERE */}
        {disbursedCount > 0 && <FixLoanStatusButton />}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold text-blue-600">
                  {approvedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-green-600">
                  {activeCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold text-red-600">
                  {rejectedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Disbursed</p>
                <p className="text-lg font-bold text-primary truncate">
                  {formatCurrency(totalDisbursed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/loans?page=1&status=all">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
          >
            All ({totalCount})
          </Button>
        </Link>
        <Link href="/admin/loans?page=1&status=pending">
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
          >
            Pending ({pendingCount})
          </Button>
        </Link>
        <Link href="/admin/loans?page=1&status=approved">
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            size="sm"
          >
            Approved ({approvedCount})
          </Button>
        </Link>
        <Link href="/admin/loans?page=1&status=active">
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
          >
            Active ({activeCount})
          </Button>
        </Link>
        <Link href="/admin/loans?page=1&status=rejected">
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            size="sm"
          >
            Rejected ({rejectedCount})
          </Button>
        </Link>
        <Link href="/admin/loans?page=1&status=completed">
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
          >
            Completed ({completedCount})
          </Button>
        </Link>
      </div>

      {/* Loans Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {statusFilter === "all"
              ? "All Loans"
              : `${
                  statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                } Loans`}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {skip + 1}-{Math.min(skip + itemsPerPage, totalCount)} of{" "}
            {totalCount}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loans.length > 0 ? (
            <>
              <div className="w-full">
                <div className="max-w-full overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Tenure
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          EMI
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Applied
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-[180px]">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                {loan.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-xs truncate">
                                  {loan.userName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {loan.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <span className="capitalize">{loan.loanType}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-sm whitespace-nowrap">
                            {formatCurrency(Number(loan.amount))}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {loan.interestRate}%
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {loan.tenureMonths}m
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {formatCurrency(Number(loan.emiAmount))}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(loan.status)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(new Date(loan.createdAt))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <LoanActionsDropdown
                              loanId={loan.id}
                              loanStatus={loan.status}
                              userAccounts={accounts.filter(
                                (a) => a.userId === loan.userId
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/loans?page=${currentPage - 1}${
                        statusFilter !== "all" ? `&status=${statusFilter}` : ""
                      }`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/loans?page=${currentPage + 1}${
                        statusFilter !== "all" ? `&status=${statusFilter}` : ""
                      }`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 px-6 text-muted-foreground">
              No {statusFilter !== "all" ? statusFilter : ""} loan applications
              yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
