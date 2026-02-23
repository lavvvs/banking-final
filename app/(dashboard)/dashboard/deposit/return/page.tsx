// app/dashboard/deposit/return/page.tsx
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { getCheckoutSessionStatus } from "@/app/actions/stripe";
import connectDB from "@/lib/mongodb";
import { Account, Transaction } from "@/lib/models";
import mongoose from "mongoose";

async function confirmAndUpdateBalance(sessionId: string) {
  "use server";

  console.log("🔄 Manual balance update starting for session:", sessionId);

  try {
    const { stripe } = await import("@/lib/stripe");
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("📋 Session retrieved:", {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata,
      amount_total: session.amount_total,
    });

    if (session.payment_status !== "paid") {
      console.log("⚠️ Payment not completed, skipping balance update");
      return { success: false, error: "Payment not completed" };
    }

    const accountId = session.metadata?.accountId;
    const userId = session.metadata?.userId;
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    console.log("💰 Payment details:", { accountId, userId, amount });

    if (!accountId) {
      console.error("❌ No accountId in metadata");
      return { success: false, error: "Missing account ID" };
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      console.error("❌ Invalid accountId format:", accountId);
      return { success: false, error: "Invalid account ID" };
    }

    if (amount <= 0) {
      console.error("❌ Invalid amount:", amount);
      return { success: false, error: "Invalid amount" };
    }

    await connectDB();
    console.log("✅ Database connected");

    // Check if transaction already exists (prevent double deposits)
    const existingTx = await Transaction.findOne({ referenceId: sessionId });
    if (existingTx) {
      console.log("⚠️ Transaction already processed, skipping");
      return {
        success: true,
        alreadyProcessed: true,
        message: "Deposit already processed",
      };
    }

    // Find account first
    console.log("🔍 Finding account:", accountId);
    const accountBefore = await Account.findById(accountId);

    if (!accountBefore) {
      console.error("❌ Account not found");
      return { success: false, error: "Account not found" };
    }

    console.log("📦 Account found:", {
      id: accountBefore._id.toString(),
      currentBalance: accountBefore.balance,
      userId: accountBefore.userId,
    });

    // Update balance
    console.log("💵 Updating balance by:", amount);
    const updatedAccount = await Account.findByIdAndUpdate(
      accountId,
      { $inc: { balance: amount } },
      { new: true }
    );

    if (!updatedAccount) {
      console.error("❌ Account update failed");
      return { success: false, error: "Failed to update balance" };
    }

    console.log("✅ Balance updated:", {
      previousBalance: accountBefore.balance,
      amountAdded: amount,
      newBalance: updatedAccount.balance,
    });

    // Create transaction record
    const transaction = await Transaction.create({
      userId: userId || updatedAccount.userId,
      accountId: updatedAccount._id,
      amount,
      type: "deposit",
      status: "completed",
      referenceId: sessionId,
      description: `Stripe deposit - ${new Date().toLocaleDateString()}`,
    });

    console.log("✅ Transaction record created:", transaction._id.toString());

    // Verify by fetching again
    const verifyAccount = await Account.findById(accountId);
    console.log("🔍 Verification:", {
      updatedBalance: updatedAccount.balance,
      verifiedBalance: verifyAccount?.balance,
      match: updatedAccount.balance === verifyAccount?.balance,
    });

    return {
      success: true,
      newBalance: updatedAccount.balance,
      transactionId: transaction._id.toString(),
    };
  } catch (error) {
    console.error("❌ Balance update error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function DepositReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/dashboard/deposit");
  }

  // Retrieve session status from Stripe
  const sessionStatus = await getCheckoutSessionStatus(sessionId);

  if (!sessionStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Error</h1>
            <p className="text-muted-foreground">
              Unable to verify payment status. Please contact support if you
              were charged.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard/deposit">Try Again</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✨ NEW: Manually update balance if payment is successful
  let balanceUpdateResult = null;
  if (sessionStatus.payment_status === "paid") {
    balanceUpdateResult = await confirmAndUpdateBalance(sessionId);
    console.log("Balance update result:", balanceUpdateResult);
  }

  const isSuccess = sessionStatus.payment_status === "paid";
  const isPending =
    sessionStatus.payment_status === "unpaid" ||
    sessionStatus.status === "open";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          {isSuccess ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Deposit Successful!
              </h1>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Your account balance has been updated.
                </p>
                {sessionStatus.amount_total && (
                  <p className="text-lg font-semibold text-foreground">
                    Amount: ${(sessionStatus.amount_total / 100).toFixed(2)}
                  </p>
                )}
                {balanceUpdateResult?.alreadyProcessed && (
                  <p className="text-sm text-amber-600">
                    (Already processed by webhook)
                  </p>
                )}
                {sessionStatus.customer_email && (
                  <p className="text-sm text-muted-foreground">
                    A confirmation email has been sent to{" "}
                    <span className="font-medium">
                      {sessionStatus.customer_email}
                    </span>
                  </p>
                )}
              </div>
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/deposit">Make Another Deposit</Link>
                </Button>
              </div>
            </>
          ) : isPending ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mx-auto">
                <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Payment Processing
              </h1>
              <p className="text-muted-foreground">
                Your payment is being processed. This usually takes a few
                moments.
                <br />
                <span className="text-sm">Status: {sessionStatus.status}</span>
              </p>
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  <a href="#">Refresh Status</a>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Payment Failed
              </h1>
              <p className="text-muted-foreground">
                Your payment could not be processed. Please try again.
                <br />
                <span className="text-sm">
                  Status: {sessionStatus.payment_status}
                </span>
              </p>
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard/deposit">Try Again</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
