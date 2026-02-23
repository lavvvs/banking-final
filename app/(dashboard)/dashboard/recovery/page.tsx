// app/dashboard/recovery/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Account, Transaction, Loan, EmiPayment } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecoveryButton } from "@/components/dashboard/recovery-button";
import mongoose from "mongoose";

export default async function RecoveryPage() {
  await dbConnect();

  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const userId = user.id;

  // Get all data for this user
  const yourAccounts = await Account.find({ userId }).lean();
  const yourTransactions = await Transaction.find({ userId }).lean();
  const yourLoans = await Loan.find({ userId }).lean();
  const yourEmis = await EmiPayment.find({ userId }).lean();

  // Get orphaned data
  const orphanedTransactions = await Transaction.find({
    userId,
    $or: [{ accountId: null }, { accountId: { $exists: false } }],
  }).lean();

  const orphanedLoans = await Loan.find({
    userId,
    $or: [
      { disbursementAccountId: null },
      { disbursementAccountId: { $exists: false } },
    ],
  }).lean();

  const orphanedEmis = await EmiPayment.find({
    userId,
    $or: [{ transactionId: null }, { transactionId: { $exists: false } }],
  }).lean();

  // Check for accounts referenced in transactions but with different userId
  const accountIdsFromTransactions = [
    ...new Set(
      yourTransactions
        .filter((t) => t.accountId)
        .map((t) => t.accountId.toString())
    ),
  ];

  const referencedAccounts = await Account.find({
    _id: {
      $in: accountIdsFromTransactions.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    },
  }).lean();

  const accountsWithWrongUserId = referencedAccounts.filter(
    (acc) => acc.userId !== userId
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Recovery Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          View and recover all your banking data
        </p>
      </div>

      {/* Recovery Button */}
      {(orphanedTransactions.length > 0 ||
        orphanedLoans.length > 0 ||
        orphanedEmis.length > 0 ||
        accountsWithWrongUserId.length > 0) && (
        <RecoveryButton
          transactionCount={orphanedTransactions.length}
          accountCount={yourAccounts.length}
          loanCount={orphanedLoans.length}
          emiCount={orphanedEmis.length}
        />
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Your Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yourAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              Total accounts linked to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Your Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yourTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              {orphanedTransactions.length} orphaned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Your Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yourLoans.length}</div>
            <p className="text-xs text-muted-foreground">
              {orphanedLoans.length} need linking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Your EMI Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yourEmis.length}</div>
            <p className="text-xs text-muted-foreground">
              {orphanedEmis.length} need linking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Orphaned Transactions */}
        {orphanedTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Orphaned Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orphanedTransactions.map((tx) => (
                  <div
                    key={tx._id.toString()}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${tx.amount}</p>
                      <Badge variant="destructive" className="text-xs">
                        No Account
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orphaned Loans */}
        {orphanedLoans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Orphaned Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orphanedLoans.map((loan) => (
                  <div
                    key={loan._id.toString()}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {loan.loanType} Loan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {loan.tenureMonths} months
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${loan.amount}</p>
                      <Badge variant="destructive" className="text-xs">
                        No Account
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts with Wrong User ID */}
        {accountsWithWrongUserId.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Accounts Needing Ownership Fix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accountsWithWrongUserId.map((acc) => (
                  <div
                    key={acc._id.toString()}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <div>
                      <p className="font-medium">{acc.accountNumber}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {acc.accountType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${acc.balance}</p>
                      <Badge variant="destructive" className="text-xs">
                        Wrong Owner
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {yourAccounts.length > 0 ? (
              <div className="space-y-2">
                {yourAccounts.map((acc) => (
                  <div
                    key={acc._id.toString()}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <div>
                      <p className="font-medium">{acc.accountNumber}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {acc.accountType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${acc.balance}</p>
                      <Badge className="text-xs">{acc.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No accounts found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
