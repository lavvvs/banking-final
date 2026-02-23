// app/api/bank-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { BankSettings } from "@/lib/models";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Check if userId is provided in query params (for admin viewing other users)
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("userId") || userId;

    // If querying for another user, verify admin access
    // You can add admin check here if needed
    // const { sessionClaims } = await auth();
    // if (targetUserId !== userId && sessionClaims?.metadata?.role !== "admin") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    await dbConnect();

    // Find or create bank settings for the user
    let settings = await BankSettings.findOne({ userId: targetUserId });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await BankSettings.create({
        userId: targetUserId,
        bankName: "Your Bank",
        transactionLimits: {
          daily: 10000,
          perTransaction: 5000,
        },
        interestRates: {
          savings: 3.5,
          checking: 0.5,
        },
        fees: {
          monthlyMaintenance: 0,
          overdraft: 35,
          atmWithdrawal: 2.5,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings._id.toString(),
        userId: settings.userId,
        bankName: settings.bankName,
        transactionLimits: settings.transactionLimits,
        interestRates: settings.interestRates,
        fees: settings.fees,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching bank settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bank settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    await dbConnect();

    // Update or create settings
    const settings = await BankSettings.findOneAndUpdate(
      { userId },
      { ...body, userId },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("❌ Error updating bank settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bank settings" },
      { status: 500 }
    );
  }
}
