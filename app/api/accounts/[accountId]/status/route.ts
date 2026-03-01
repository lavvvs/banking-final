// app/api/accounts/[accountId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Account, Profile } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// Required to prevent Next.js from caching this mutation route on Vercel
export const dynamic = "force-dynamic";

async function handleAccountStatusUpdate(
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

    console.log("🔍 Account status update request:", { accountId, userId });

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
    const userProfile = await Profile.findOne({ clerkId: userId });
    const isAdmin = userProfile?.isAdmin || false;

    const query = isAdmin
      ? { _id: new mongoose.Types.ObjectId(accountId) }
      : { _id: new mongoose.Types.ObjectId(accountId), userId };

    const account = await Account.findOne(query);

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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ accountId: string }> }
) {
  return handleAccountStatusUpdate(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ accountId: string }> }
) {
  return handleAccountStatusUpdate(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ accountId: string }> }
) {
  return handleAccountStatusUpdate(request, context);
}
