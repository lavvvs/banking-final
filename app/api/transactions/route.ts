import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Transaction } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";

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
    if (!accountId || !amount || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the transaction
    const transaction = await Transaction.create({
      userId,
      accountId,
      amount,
      type,
      status: "completed",
      description: description || "",
      referenceId: referenceId || `TXN-${Date.now()}`,
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error: any) {
    console.error("Transaction creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}
