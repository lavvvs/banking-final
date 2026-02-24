// app/api/accounts/[accountId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// Required to prevent Next.js from caching this mutation route on Vercel
export const dynamic = "force-dynamic";

async function updateAccount(
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

    console.log("📝 Received accountId update request:", accountId);

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return NextResponse.json(
        { error: `Invalid account ID: ${accountId}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { balance, status } = body;

    const account = await Account.findOne({
      _id: new mongoose.Types.ObjectId(accountId),
      userId,
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Update fields if provided
    let updated = false;
    
    if (balance !== undefined && balance !== null) {
      account.balance = balance;
      updated = true;
    }
    
    if (status !== undefined && status !== null) {
      if (!["active", "inactive"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be 'active' or 'inactive'" },
          { status: 400 }
        );
      }
      account.status = status;
      updated = true;
    }

    if (!updated) {
      return NextResponse.json(
        { error: "No fields provided for update (balance or status)" },
        { status: 400 }
      );
    }

    await account.save();

    console.log("✅ Account updated successfully:", {
      accountId,
      fields: { balance, status },
    });

    return NextResponse.json(
      {
        success: true,
        account: {
          _id: account._id.toString(),
          balance: account.balance,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          status: account.status,
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

export const PATCH = updateAccount;
export const PUT = updateAccount;

