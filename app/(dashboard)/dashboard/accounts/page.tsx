// app/dashboard/accounts/page.tsx
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils/emi-calculator";
import { CreateAccountDialog } from "@/components/create-account-dialog";
import { AccountStatusToggle } from "@/components/dashboard/AccountStatusToggle";
import { CreditCard, Wallet } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

export default async function AccountsPage() {
  // 1️⃣ Connect to MongoDB
  await dbConnect();

  // 2️⃣ Get current user from Clerk
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const userId = user.id; // This is the Clerk ID string

  // 3️⃣ Fetch user's accounts using Clerk ID (NOT profile._id)
  // ✅ FIX: Query by userId (Clerk ID) instead of profile._id
  const accountsDocs = await Account.find({ userId })
    .sort({
      createdAt: -1,
    })
    .lean();

  // 4️⃣ Serialize accounts for client components
  const accounts = accountsDocs.map((acc: any) => ({
    id: acc._id.toString(),
    userId: acc.userId,
    accountNumber: acc.accountNumber,
    accountType: acc.accountType,
    balance: acc.balance || 0,
    currency: acc.currency || "USD",
    status: acc.status || "active",
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
  }));

  // 5️⃣ Calculate total balance (only from active accounts)
  const totalBalance = accounts
    .filter((acc) => acc.status === "active")
    .reduce((sum, acc) => sum + Number(acc.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts and view balances
          </p>
        </div>
        <CreateAccountDialog />
      </div>

      {/* Total Balance Card */}
      <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/80">
                Total Balance
              </p>
              <p className="mt-1 text-3xl font-bold text-primary-foreground">
                {formatCurrency(totalBalance)}
              </p>
              <p className="mt-1 text-sm text-primary-foreground/60">
                Across {accounts.length} account
                {accounts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold capitalize">
                        {account.accountType} Account
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-mono">
                        {account.accountNumber}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      account.status === "active"
                        ? "default"
                        : account.status === "frozen"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {account.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Balance
                    </span>
                    <span className="text-xl font-bold text-card-foreground">
                      {formatCurrency(Number(account.balance))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium text-card-foreground">
                      {account.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-card-foreground">
                      {formatDateTime(new Date(account.createdAt))}
                    </span>
                  </div>

                  {/* ✅ NEW: Status Toggle */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Account Status
                      </span>
                      <AccountStatusToggle
                        accountId={account.id}
                        currentStatus={account.status as "active" | "inactive"}
                        accountNumber={account.accountNumber}
                        accountType={account.accountType}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">
              No accounts yet
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              Create your first bank account to start managing your finances.
            </p>
            <div className="mt-6">
              <CreateAccountDialog />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
