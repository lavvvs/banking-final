// app/api/loans/[loanId]/emi/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { EmiPayment } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch EMI payments for this loan
    const emiPayments = await EmiPayment.find({
      loanId: params.loanId,
    })
      .sort({ emiNumber: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      emiPayments: emiPayments.map((emi) => ({
        ...emi,
        _id: emi._id.toString(),
        loanId: emi.loanId.toString(),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching EMI payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch EMI payments" },
      { status: 500 }
    );
  }
}
