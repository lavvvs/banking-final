// app/dashboard/diagnostics/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Account, Transaction, Loan, EmiPayment } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import mongoose from "mongoose";

export default async function DiagnosticsPage() {
  await dbConnect();

  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const userId = user.id;

  // Get all your data
  const yourAccounts = await Account.find({ userId }).lean();
  const yourTransactions = await Transaction.find({ userId }).lean();
  const yourLoans = await Loan.find({ userId }).lean();
  const yourEmis = await EmiPayment.find({ userId }).lean();

  // Get unique account IDs from your transactions
  const accountIdsFromTransactions = [
    ...new Set(
      yourTransactions
        .filter((t) => t.accountId)
        .map((t) => t.accountId.toString())
    ),
  ];

  // Fetch those accounts
  const referencedAccounts = await Account.find({
    _id: {
      $in: accountIdsFromTransactions.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    },
  }).lean();

  // Check which accounts have correct userId
  const accountsWithCorrectUserId = referencedAccounts.filter(
    (acc) => acc.userId === userId
  );
  const accountsWithWrongUserId = referencedAccounts.filter(
    (acc) => acc.userId !== userId
  );

  // Calculate total balance from transactions
  let calculatedBalance = 0;
  yourTransactions.forEach((t) => {
    if (["deposit", "transfer_in", "loan_disbursement"].includes(t.type)) {
      calculatedBalance += t.amount;
    } else if (["withdrawal", "transfer_out", "emi_payment"].includes(t.type)) {
      calculatedBalance -= Math.abs(t.amount);
    }
  });

  const actualBalance = yourAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const balanceMismatch = Math.abs(calculatedBalance - actualBalance) > 0.01;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Diagnostics</h1>
        <p className="text-muted-foreground mt-2">
          Complete analysis of your banking data integrity
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clerk ID:</span>
            <span className="font-mono text-sm">{userId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">
              {user.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{yourAccounts.length}</div>
            <p className="text-xs text-muted-foreground">Your Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{yourTransactions.length}</div>
            <p className="text-xs text-muted-foreground">Your Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{yourLoans.length}</div>
            <p className="text-xs text-muted-foreground">Your Loans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{yourEmis.length}</div>
            <p className="text-xs text-muted-foreground">Your EMI Payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Ownership Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Account Ownership Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-bold text-lg">
                  {accountsWithCorrectUserId.length}
                </div>
                <div className="text-sm text-green-700">
                  Accounts with Correct Ownership
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="font-bold text-lg">
                  {accountsWithWrongUserId.length}
                </div>
                <div className="text-sm text-red-700">
                  Accounts with Wrong Ownership
                </div>
              </div>
            </div>
          </div>

          {/* List accounts with wrong ownership */}
          {accountsWithWrongUserId.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-red-700">
                ⚠️ Accounts Needing Ownership Fix:
              </h4>
              <div className="space-y-2">
                {accountsWithWrongUserId.map((acc) => (
                  <div
                    key={acc._id.toString()}
                    className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200"
                  >
                    <div>
                      <p className="font-medium">{acc.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {acc.accountType} | Balance: ${acc.balance}
                      </p>
                      <p className="text-xs text-red-600 font-mono">
                        Owner: {acc.userId}
                      </p>
                    </div>
                    <Badge variant="destructive">Wrong Owner</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted rounded">
            <span>Balance in Accounts:</span>
            <span className="font-bold text-lg">
              ${actualBalance.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded">
            <span>Calculated from Transactions:</span>
            <span className="font-bold text-lg">
              ${calculatedBalance.toFixed(2)}
            </span>
          </div>
          <div
            className="flex items-center gap-2 p-3 rounded"
            style={{
              backgroundColor: balanceMismatch ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${balanceMismatch ? "#fca5a5" : "#86efac"}`,
            }}
          >
            {balanceMismatch ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-medium">
                  Balance Mismatch: $
                  {Math.abs(calculatedBalance - actualBalance).toFixed(2)}{" "}
                  difference
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  Balances Match Perfectly!
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your Accounts Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Your Accounts ({yourAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {yourAccounts.length > 0 ? (
            <div className="space-y-2">
              {yourAccounts.map((acc) => (
                <div
                  key={acc._id.toString()}
                  className="flex items-center justify-between p-3 bg-muted rounded"
                >
                  <div>
                    <p className="font-medium">{acc.accountNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {acc.accountType} | Created:{" "}
                      {new Date(acc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${acc.balance.toFixed(2)}</p>
                    <Badge>{acc.status}</Badge>
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

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {yourTransactions.slice(0, 10).map((tx) => {
              const linkedAccount = referencedAccounts.find(
                (acc) => acc._id.toString() === tx.accountId?.toString()
              );
              const isCorrectOwner = linkedAccount?.userId === userId;

              return (
                <div
                  key={tx._id.toString()}
                  className="flex items-center justify-between p-3 bg-muted rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {tx.type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                    {linkedAccount && (
                      <p className="text-xs font-mono mt-1">
                        Account: {linkedAccount.accountNumber}
                        {!isCorrectOwner && (
                          <span className="text-red-600 ml-2">
                            (Wrong Owner!)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${tx.amount.toFixed(2)}</p>
                    <Badge
                      variant={
                        tx.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          {yourTransactions.length > 10 && (
            <p className="text-center text-muted-foreground text-sm mt-4">
              Showing 10 of {yourTransactions.length} transactions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Raw Data for Debugging */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (For Debugging)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div>
              <p className="font-semibold">
                Account IDs from your transactions:
              </p>
              <pre className="bg-muted p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(accountIdsFromTransactions, null, 2)}
              </pre>
            </div>
            <div className="mt-4">
              <p className="font-semibold">Referenced Accounts:</p>
              <pre className="bg-muted p-2 rounded mt-1 overflow-auto max-h-60">
                {JSON.stringify(
                  referencedAccounts.map((acc) => ({
                    id: acc._id.toString(),
                    accountNumber: acc.accountNumber,
                    userId: acc.userId,
                    balance: acc.balance,
                    isYours: acc.userId === userId,
                  })),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
