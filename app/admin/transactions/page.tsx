// app/admin/transactions/page.tsx
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Transaction, Loan, Account, Profile } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils/emi-calculator";
import { LoanTransactionFilters } from "@/components/admin/loan-transaction-filters";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    page?: string;
    search?: string;
  }>;
}

export default async function AdminTransactionsPage({
  searchParams,
}: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  await dbConnect();

  // Check if user is admin from Profile collection
  const profile = await Profile.findOne({
    $or: [{ userId: userId }, { clerkId: userId }],
  }).lean();

  if (!profile?.isAdmin) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const type = params.type || "all";
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const limit = 20;

  // ✅ FIXED: Build query for loan-related transactions - much simpler
  let query: any = {};

  // Filter by specific type
  if (type === "emi_payment") {
    query.type = "emi_payment";
  } else if (type === "loan_disbursement") {
    query.type = "loan_disbursement";
  } else {
    // "all" - show both loan_disbursement and emi_payment
    query.type = { $in: ["loan_disbursement", "emi_payment"] };
  }

  // 🐛 DEBUG: Log the query
  console.log("📊 Admin Transactions Query:", JSON.stringify(query, null, 2));

  // Search functionality
  if (search) {
    // Try to find matching users from loans
    const matchingLoans = await Loan.find({
      $or: [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ],
    })
      .limit(50)
      .lean();

    const matchingUserIds = matchingLoans.map((loan: any) => loan.userId);

    // Also try Clerk users
    const client = await clerkClient();
    let clerkMatchingUserIds: string[] = [];
    try {
      const clerkUsers = await client.users.getUserList({
        query: search,
        limit: 50,
      });
      clerkMatchingUserIds = clerkUsers.data.map((u) => u.id);
    } catch (error) {
      console.error("Error searching Clerk users:", error);
    }

    // Combine all matching user IDs
    const allMatchingUserIds = [
      ...new Set([...matchingUserIds, ...clerkMatchingUserIds]),
    ];

    // Add search criteria
    query = {
      ...query,
      $or: [
        { description: { $regex: search, $options: "i" } },
        { userId: { $in: allMatchingUserIds } },
      ],
    };
  }

  console.log("Transaction Query:", JSON.stringify(query, null, 2));

  // Fetch transactions with pagination
  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  console.log(`Found ${total} transactions matching query`);
  console.log(
    "📋 Transaction types in results:",
    transactions.map((t) => ({ type: t.type, desc: t.description }))
  );

  // Get unique user IDs and account IDs
  const userIds = [...new Set(transactions.map((t) => t.userId))];
  const accountIds = [
    ...new Set(transactions.map((t) => t.accountId.toString())),
  ];

  // Fetch accounts
  const accounts = await Account.find({
    _id: { $in: accountIds },
  }).lean();

  const accountMap = new Map(accounts.map((acc) => [acc._id.toString(), acc]));

  // Fetch loans to get userName and userEmail from seed data
  const loans = await Loan.find({}).lean();
  const loanUsersMap = new Map();
  loans.forEach((loan: any) => {
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

  userIds.forEach((userId) => {
    const clerkUser = clerkUserMap.get(userId);
    const loanUser = loanUsersMap.get(userId);

    let name = "Unknown User";
    let email = null;
    let imageUrl = null;

    if (clerkUser) {
      // Real Clerk user - prioritize Clerk data
      name =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || "Unknown User";
      email = clerkUser.emailAddresses[0]?.emailAddress;
      imageUrl = clerkUser.imageUrl;
    } else if (loanUser) {
      // Fake/seeded user - use loan data
      name = loanUser.userName;
      email = loanUser.userEmail;
    }

    userDataMap.set(userId, { name, email, imageUrl });
  });

  // ✅ FIXED: Calculate statistics - simpler queries
  const allDisbursements = await Transaction.find({
    type: "loan_disbursement",
  }).lean();

  const allRepayments = await Transaction.find({
    type: "emi_payment",
  }).lean();

  const totalDisbursed = allDisbursements.reduce((sum, t) => sum + t.amount, 0);
  const totalRepaid = allRepayments.reduce((sum, t) => sum + t.amount, 0);
  const uniqueBorrowers = new Set(allDisbursements.map((t) => t.userId)).size;

  console.log("Stats:", {
    totalDisbursements: allDisbursements.length,
    totalRepayments: allRepayments.length,
    totalDisbursed,
    totalRepaid,
  });

  // Serialize transactions
  const serializedTransactions = transactions.map((transaction) => {
    const account = accountMap.get(transaction.accountId.toString());
    const userData = userDataMap.get(transaction.userId) || {
      name: "Unknown User",
      email: null,
      imageUrl: null,
    };

    return {
      id: transaction._id.toString(),
      userId: transaction.userId,
      accountId: transaction.accountId.toString(),
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
      accountNumber: account?.accountNumber || "N/A",
      accountType: account?.accountType || "N/A",
      userName: userData.name,
      userEmail: userData.email,
      userImage: userData.imageUrl,
    };
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {" "}
      {/* FIXED: Better overflow control */}
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Loan Transactions</h1>
        <p className="text-muted-foreground">
          Monitor all loan disbursements and EMI repayments
        </p>
      </div>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Disbursed
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalDisbursed)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {allDisbursements.length} disbursements
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Repaid
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRepaid)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {allRepayments.length} payments
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalDisbursed - totalRepaid)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Remaining balance
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Borrowers
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {uniqueBorrowers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique users
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <LoanTransactionFilters
        currentType={type}
        currentPage={page}
        totalPages={totalPages}
        currentSearch={search}
      />
      {/* Transactions Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>
            Transaction History
            {search && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Searching for "{search}"
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {" "}
          {/* FIXED: Added overflow-hidden */}
          {serializedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Landmark className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? `No results for "${search}"`
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto scrollbar-thin">
              {" "}
              {/* FIXED: Cleaner scroll container */}
              <table className="w-full table-fixed divide-y divide-border">
                {" "}
                {/* FIXED: table-fixed for better control */}
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[250px]">
                      Borrower
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[180px]">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[150px]">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[250px]">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-[180px]">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground w-[150px]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {serializedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {transaction.userImage ? (
                            <img
                              src={transaction.userImage}
                              alt={transaction.userName}
                              className="h-10 w-10 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium">
                                {transaction.userName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm whitespace-nowrap">
                              {transaction.userName}
                            </p>
                            {transaction.userEmail && (
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {transaction.userEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-sm whitespace-nowrap">
                            {transaction.accountNumber}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize whitespace-nowrap">
                            {transaction.accountType}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            transaction.type === "loan_disbursement"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            transaction.type === "loan_disbursement"
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 whitespace-nowrap"
                              : "bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap"
                          }
                        >
                          {transaction.type === "loan_disbursement" ? (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Disbursement
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              EMI Payment
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 max-w-[300px]">
                        <span className="text-sm truncate block">
                          {transaction.description}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(transaction.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-bold text-base whitespace-nowrap ${
                            transaction.type === "loan_disbursement"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        >
                          {transaction.type === "loan_disbursement" ? "-" : "+"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
