// app/actions/stripe.ts
"use server";

import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import { Account } from "@/lib/models";
import dbConnect from "@/lib/mongodb";

const DEPOSIT_OPTIONS = [
  { id: "deposit-100", name: "Deposit $100", amount: 10000 },
  { id: "deposit-500", name: "Deposit $500", amount: 50000 },
  { id: "deposit-1000", name: "Deposit $1,000", amount: 100000 },
  { id: "deposit-5000", name: "Deposit $5,000", amount: 500000 },
];

export async function startDepositCheckout(
  depositId: string,
  accountId: string
) {
  const session = await auth();
  const userId = session.userId;
  if (!userId) throw new Error("You must be logged in");

  const deposit = DEPOSIT_OPTIONS.find((d) => d.id === depositId);
  if (!deposit) throw new Error(`Deposit option "${depositId}" not found`);

  await dbConnect();
  const account = await Account.findOne({ _id: accountId, userId }).lean();
  if (!account) throw new Error("Account not found");

  console.log("Creating checkout session:", {
    depositId,
    accountId,
    amount: deposit.amount / 100,
    userId,
  });

  const sessionObj = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    // FIX 1: Add return_url instead of redirect_on_completion
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/deposit/return?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: deposit.name,
            description: `Add funds to your ${account.accountType} account (${account.accountNumber})`,
          },
          unit_amount: deposit.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId,
      accountId,
      depositId,
      amount: (deposit.amount / 100).toString(),
      type: "deposit",
    },
  });

  console.log("✅ Checkout session created:", sessionObj.id);
  return sessionObj.client_secret;
}

export async function startCustomDepositCheckout(
  amount: number,
  accountId: string
) {
  if (amount < 10 || amount > 100000)
    throw new Error("Amount must be between $10 and $100,000");

  const session = await auth();
  const userId = session.userId;
  if (!userId) throw new Error("You must be logged in");

  await dbConnect();
  const account = await Account.findOne({ _id: accountId, userId }).lean();
  if (!account) throw new Error("Account not found");

  console.log("Creating custom checkout session:", {
    amount,
    accountId,
    userId,
  });

  const sessionObj = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    // FIX 1: Add return_url instead of redirect_on_completion
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/deposit/return?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Deposit $${amount.toFixed(2)}`,
            description: `Add funds to your ${account.accountType} account (${account.accountNumber})`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId,
      accountId,
      depositId: "custom",
      amount: amount.toString(),
      type: "deposit",
    },
  });

  console.log("✅ Custom checkout session created:", sessionObj.id);
  return sessionObj.client_secret;
}

// Helper function to retrieve session status
export async function getCheckoutSessionStatus(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("Session status:", {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
    });

    return {
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
    };
  } catch (error) {
    console.error("❌ Error retrieving session:", error);
    return null;
  }
}
// Add this import at the top if not already there
import type Stripe from "stripe";

// EMI Payment Checkout
export async function startEMIPaymentCheckout(emiId: string, loanId: string) {
  const session = await auth();
  const userId = session.userId;
  if (!userId) throw new Error("You must be logged in");

  await dbConnect();

  const { Loan, EmiPayment } = await import("@/lib/models");

  const loan = await Loan.findOne({ _id: loanId, userId }).lean();
  if (!loan) throw new Error("Loan not found");

  const emi = await EmiPayment.findOne({ _id: emiId, loanId }).lean();
  if (!emi) throw new Error("EMI not found");

  if (emi.status === "paid") {
    throw new Error("This EMI has already been paid");
  }

  const sessionObj = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/loans/emi-return?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `EMI Payment #${emi.emiNumber}`,
            description: `${loan.loanType} Loan - Due ${new Date(
              emi.dueDate
            ).toLocaleDateString()}`,
          },
          unit_amount: Math.round(emi.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId: userId,
      loanId: loanId.toString(),
      emiId: emiId.toString(),
      emiNumber: emi.emiNumber.toString(),
      amount: emi.amount.toString(),
      type: "emi_payment",
    },
  });

  return sessionObj.client_secret;
}

// Handle EMI Payment Success
export async function handleEMIPaymentSuccess(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return { success: false, message: "Payment not completed" };
    }

    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const loanId = metadata.loanId;
    const emiId = metadata.emiId;
    const amount = metadata.amount;

    if (!userId || !loanId || !emiId || !amount) {
      throw new Error("Missing required metadata");
    }

    await dbConnect();
    const { Loan, EmiPayment, Transaction, Account } = await import(
      "@/lib/models"
    );

    const emi = await EmiPayment.findByIdAndUpdate(
      emiId,
      {
        status: "paid",
        paidDate: new Date(),
        paidAmount: parseFloat(amount),
      },
      { new: true }
    );

    if (!emi) throw new Error("EMI not found");

    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error("Loan not found");

    loan.amountPaid = (loan.amountPaid || 0) + parseFloat(amount);

    const totalPaid = loan.amountPaid;
    const totalAmount = loan.amount + (loan.interestAmount || 0);

    if (totalPaid >= totalAmount) {
      loan.status = "closed";
    }

    await loan.save();

    const transaction = await Transaction.create({
      userId,
      accountId: loan.disbursementAccountId,
      type: "emi_payment",
      amount: -parseFloat(amount),
      status: "completed",
      description: `EMI #${emi.emiNumber} payment for ${loan.loanType} loan`,
      reference: sessionId,
    });

    await Account.findByIdAndUpdate(loan.disbursementAccountId, {
      $inc: { balance: -parseFloat(amount) },
    });

    return {
      success: true,
      message: "EMI payment successful",
      emiNumber: emi.emiNumber,
      amount: parseFloat(amount),
    };
  } catch (error) {
    console.error("❌ Error processing EMI payment:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Payment processing failed",
    };
  }
}
