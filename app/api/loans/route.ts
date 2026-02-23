// app/api/loans/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Loan } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      loanType,
      amount,
      interestRate,
      tenureMonths,
      emiAmount,
      totalPayable,
      remainingAmount,
      disbursementAccountId,
    } = body;

    // Validate required fields
    if (
      !loanType ||
      !amount ||
      !interestRate ||
      !tenureMonths ||
      !emiAmount ||
      !totalPayable
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate loan amount
    if (amount < 1000) {
      return NextResponse.json(
        { error: "Minimum loan amount is $1,000" },
        { status: 400 }
      );
    }

    // Create new loan
    const loan = new Loan({
      userId, // Clerk ID string
      loanType,
      amount: Number(amount),
      interestRate: Number(interestRate),
      tenureMonths: Number(tenureMonths),
      emiAmount: Number(emiAmount),
      totalPayable: Number(totalPayable),
      amountPaid: 0,
      remainingAmount: remainingAmount || totalPayable,
      status: "pending",
      disbursementAccountId: disbursementAccountId || null,
    });

    await loan.save();

    console.log("✅ Loan application created:", {
      loanId: loan._id.toString(),
      userId,
      loanType,
      amount,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Loan application submitted successfully",
        loan: {
          id: loan._id.toString(),
          loanType: loan.loanType,
          amount: loan.amount,
          status: loan.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Loan application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit loan application" },
      { status: 500 }
    );
  }
}
