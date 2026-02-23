// app/api/accounts/[accountId]/status/route.ts
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

    // Await params in Next.js 15+
    const params = await context.params;
    const accountId = params.accountId;

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return NextResponse.json(
        { error: "Invalid account ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    // Find the account
    const account = await Account.findOne({
      _id: new mongoose.Types.ObjectId(accountId),
      userId,
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Update status
    account.status = status;
    await account.save();

    console.log("✅ Account status updated:", {
      accountId,
      newStatus: status,
    });

    return NextResponse.json(
      {
        success: true,
        account: {
          _id: account._id.toString(),
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          status: account.status,
          balance: account.balance,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Account status update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update account status" },
      { status: 500 }
    );
  }
}
