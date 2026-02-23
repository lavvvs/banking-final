import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { Account, Profile } from "@/lib/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WithdrawDialogWrapper } from "@/components/dashboard/WithdrawDialogWrapper";
import { auth } from "@clerk/nextjs/server";
import { Wallet, Info } from "lucide-react";

export default async function WithdrawPage() {
  await dbConnect();

  const session = await auth();
  const userId = session.userId;
  if (!userId) redirect("/auth/login");

  const user = await Profile.findOne({ clerkId: userId }).lean();
  if (!user) redirect("/auth/login");

  // Fetch accounts and convert to plain objects
  const accountsRaw = await Account.find({
    userId: user.clerkId,
    status: "active",
  })
    .lean()
    .exec();

  if (!accountsRaw || accountsRaw.length === 0) {
    redirect("/dashboard/accounts");
  }

  const accounts = accountsRaw.map((account) => ({
    id: account._id.toString(), // Wrapper expects 'id', not '_id'
    userId: account.userId,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    currency: account.currency,
    status: account.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Withdraw Funds</h1>
        <p className="text-muted-foreground">
          Transfer funds from your accounts to external sources.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal</CardTitle>
            <CardDescription>
              Select an account and amount to withdraw. The funds will be
              deducted from your account balance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-accent/10 p-4">
                <Wallet className="h-8 w-8 text-accent" />
              </div>
              <WithdrawDialogWrapper accounts={accounts} userId={userId} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
            <CardDescription>Withdrawal policies and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Processing Time</p>
                <p className="text-sm text-muted-foreground">
                  Withdrawals are processed immediately.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Daily Limit</p>
                <p className="text-sm text-muted-foreground">
                  Maximum withdrawal limit is $10,000 per day.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
