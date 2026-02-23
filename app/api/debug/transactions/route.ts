// app/api/debug/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Transaction } from "@/lib/models";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all EMI payment transactions
    const emiPayments = await Transaction.find({ type: "emi_payment" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get all loan disbursements
    const disbursements = await Transaction.find({ type: "loan_disbursement" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get all transactions
    const allTransactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      summary: {
        totalTransactions: await Transaction.countDocuments(),
        emiPayments: await Transaction.countDocuments({ type: "emi_payment" }),
        disbursements: await Transaction.countDocuments({
          type: "loan_disbursement",
        }),
        byType: await Transaction.aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
      },
      data: {
        recentEmiPayments: emiPayments,
        recentDisbursements: disbursements,
        recentAll: allTransactions,
      },
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug data", details: error.message },
      { status: 500 }
    );
  }
}
