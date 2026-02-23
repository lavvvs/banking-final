// app/api/deposit/confirm/route.ts
// TEMPORARY: Manual balance update after payment
// Remove this once webhook is working

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    console.log("🔍 Confirming payment for session:", sessionId);

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("📊 Session details:", {
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      metadata: checkoutSession.metadata,
    });

    // Only process if payment was successful
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Payment not completed",
          status: checkoutSession.payment_status,
        },
        { status: 400 }
      );
    }

    const accountId = checkoutSession.metadata?.accountId;
    const amount = checkoutSession.amount_total
      ? checkoutSession.amount_total / 100
      : 0;

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing account ID in session metadata" },
        { status: 400 }
      );
    }

    // Verify user owns the account
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      );
    }

    const updatedAccount = await Account.findOneAndUpdate(
      {
        _id: accountId,
        userId: session.userId,
      },
      { $inc: { balance: amount } },
      { new: true, runValidators: true }
    );

    if (!updatedAccount) {
      return NextResponse.json(
        { error: "Account not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log("✅ Balance updated successfully:", {
      accountId: updatedAccount._id.toString(),
      newBalance: updatedAccount.balance,
      addedAmount: amount,
    });

    return NextResponse.json({
      success: true,
      newBalance: updatedAccount.balance,
      depositAmount: amount,
    });
  } catch (error) {
    console.error("❌ Error confirming deposit:", error);
    return NextResponse.json(
      { error: "Failed to confirm deposit" },
      { status: 500 }
    );
  }
}
