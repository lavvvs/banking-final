// app/dashboard/deposit/page.tsx
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { Profile, Account } from "@/lib/models";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StripeDepositForm } from "@/components/dashboard/stripe-deposit-form";
import { CreditCard, Shield, Zap } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

export default async function DepositPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  await dbConnect();

  // Await searchParams in Next.js 15
  const params = await searchParams;

  // Get logged-in user
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

  // Ensure we have accounts and properly serialize them
  if (!accountsRaw || accountsRaw.length === 0) {
    redirect("/dashboard/accounts");
  }

  // Convert MongoDB documents to serializable objects
  const accounts = accountsRaw.map((account) => ({
    ...account,
    _id: account._id.toString(),
    createdAt: account.createdAt?.toISOString(),
    updatedAt: account.updatedAt?.toISOString(),
  }));

  // Safely get the selected account ID
  const selectedAccountId =
    params?.account && accounts.some((acc) => acc._id === params.account)
      ? params.account
      : accounts[0]._id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Funds</h1>
        <p className="text-muted-foreground">
          Securely deposit money to your account using Stripe
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Deposit Amount</CardTitle>
              <CardDescription>
                Choose a preset amount or enter a custom amount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StripeDepositForm
                accounts={accounts}
                defaultAccountId={selectedAccountId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Payments</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All transactions are encrypted and processed through Stripe.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Instant Processing</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Funds are added immediately after payment.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Multiple Payment Methods</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pay with card, UPI, or Netbanking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
