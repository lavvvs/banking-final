import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import { stripe } from "@/lib/stripe";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { sessionId } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Use metadata to get accountId and amount
    const accountId = session.metadata?.accountId;
    const amount = session.metadata?.amount
      ? parseFloat(session.metadata.amount)
      : 0;

    if (!accountId || amount <= 0) {
      return NextResponse.json(
        { error: "Missing accountId or amount in metadata" },
        { status: 400 }
      );
    }

    // Update account balance
    const account = await Account.findById(new ObjectId(accountId));
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    account.balance += amount;
    await account.save();

    return NextResponse.json({ success: true, balance: account.balance });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
