// app/api/accounts/[accountId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ accountId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // ✅ CRITICAL FIX: Await params in Next.js 15
    const params = await context.params;
    const accountId = params.accountId;

    console.log("📝 Received accountId:", accountId);

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return NextResponse.json(
        { error: `Invalid account ID format: ${accountId}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { balance } = body;

    if (balance === undefined || balance === null) {
      return NextResponse.json(
        { error: "Balance is required" },
        { status: 400 }
      );
    }

    const account = await Account.findOne({
      _id: new mongoose.Types.ObjectId(accountId),
      userId,
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Update balance
    account.balance = balance;
    await account.save();

    console.log("✅ Account balance updated:", {
      accountId,
      newBalance: balance,
    });

    return NextResponse.json(
      {
        success: true,
        account: {
          _id: account._id,
          balance: account.balance,
          accountName: account.accountName,
          accountType: account.accountType,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Account update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update account" },
      { status: 500 }
    );
  }
}
