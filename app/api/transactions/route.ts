import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Transaction, Account } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { accountId, amount, type, description, referenceId } = body;

    // Validate required fields
    if (!accountId || amount === undefined || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Start a session for atomic operation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the account
      const account = await Account.findOne({
        _id: new mongoose.Types.ObjectId(accountId),
        userId,
      }).session(session);

      if (!account) {
        throw new Error("Account not found");
      }

      // 2. Perform balance update based on transaction type
      if (type === "withdrawal" || type === "transfer_out" || type === "emi_payment") {
        if (account.balance < amount) {
          throw new Error("Insufficient balance");
        }
        account.balance -= amount;
      } else if (type === "deposit" || type === "transfer_in" || type === "loan_disbursement") {
        account.balance += amount;
      }

      await account.save({ session });

      // 3. Create the transaction
      const transaction = await Transaction.create(
        [
          {
            userId,
            accountId,
            amount,
            type,
            status: "completed",
            description: description || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
            referenceId: referenceId || `TXN-${Date.now()}`,
          },
        ],
        { session }
      );

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return NextResponse.json(
        { success: true, transaction: transaction[0], newBalance: account.balance },
        { status: 201 }
      );
    } catch (innerError: any) {
      await session.abortTransaction();
      session.endSession();
      throw innerError;
    }
  } catch (error: any) {
    console.error("Transaction processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process transaction" },
      { status: 500 }
    );
  }
}
