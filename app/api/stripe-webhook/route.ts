// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import mongoose from "mongoose";

export const POST = async (req: NextRequest) => {
  console.log("🔔 Webhook received");

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!signature) {
    console.error("❌ No Stripe signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    console.log("✅ Webhook signature verified:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json(
      {
        error: `Webhook Error: ${
          err instanceof Error ? err.message : "Unknown"
        }`,
      },
      { status: 400 }
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("💰 Checkout session completed:", {
      sessionId: session.id,
      metadata: session.metadata,
      amount_total: session.amount_total,
    });

    const accountId = session.metadata?.accountId;
    const amountStr = session.metadata?.amount;

    // FIX 1: Use amount_total from session (already in cents)
    // Convert cents to dollars
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    console.log("📊 Payment details:", {
      accountId,
      amountFromMetadata: amountStr,
      amountFromSession: amount,
    });

    if (!accountId) {
      console.error("❌ Missing accountId in metadata");
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    if (amount <= 0) {
      console.error("❌ Invalid amount:", amount);
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    try {
      await dbConnect();
      console.log("✅ Database connected");

      // FIX 2: Validate ObjectId before querying
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        console.error("❌ Invalid ObjectId:", accountId);
        return NextResponse.json(
          { error: "Invalid account ID" },
          { status: 400 }
        );
      }

      // FIX 3: Use findByIdAndUpdate with proper options
      const updatedAccount = await Account.findByIdAndUpdate(
        accountId,
        { $inc: { balance: amount } },
        {
          new: true, // Return the updated document
          runValidators: true, // Run model validators
        }
      );

      if (!updatedAccount) {
        console.error("❌ Account not found:", accountId);
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      console.log("✅ Account balance updated:", {
        accountId: updatedAccount._id,
        previousBalance: updatedAccount.balance - amount,
        addedAmount: amount,
        newBalance: updatedAccount.balance,
      });

      // FIX 4: Optional - Create a transaction record
      // Uncomment if you have a Transaction model
      /*
      await Transaction.create({
        accountId: updatedAccount._id,
        userId: session.metadata?.userId,
        type: "deposit",
        amount: amount,
        status: "completed",
        method: "stripe",
        reference: session.id,
        description: "Stripe deposit",
      });
      console.log("✅ Transaction record created");
      */
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
};

// IMPORTANT: Disable body parsing for Stripe webhooks

