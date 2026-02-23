// app/api/admin/loans/[loanId]/disburse/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Loan, Account, Transaction, EmiPayment, Profile } from "@/lib/models";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ loanId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check admin status
    const profile = await Profile.findOne({
      $or: [{ userId }, { clerkId: userId }],
    }).lean();

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await context.params;
    const { loanId } = params;
    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Validate loan exists and is approved
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved loans can be disbursed" },
        { status: 400 }
      );
    }

    // Validate account exists and belongs to the loan applicant
    const account = await Account.findById(accountId);
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (account.userId !== loan.userId) {
      return NextResponse.json(
        { error: "Account does not belong to loan applicant" },
        { status: 400 }
      );
    }

    // Start session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Update account balance
      await Account.findByIdAndUpdate(
        accountId,
        { $inc: { balance: loan.amount } },
        { session }
      );

      // 2. Create disbursement transaction
      const transaction = await Transaction.create(
        [
          {
            userId: loan.userId,
            accountId: new mongoose.Types.ObjectId(accountId),
            amount: loan.amount,
            type: "loan_disbursement",
            status: "completed",
            description: `Loan disbursement - ${loan.loanType} loan`,
            referenceId: loanId,
          },
        ],
        { session }
      );

      // 3. Calculate first EMI date (1 month from now)
      const firstEmiDate = new Date();
      firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
      firstEmiDate.setHours(0, 0, 0, 0);

      // 4. ✅ FIXED: Update loan status to "active" (not "disbursed")
      await Loan.findByIdAndUpdate(
        loanId,
        {
          status: "active", // ✅ Changed from "disbursed" to "active"
          disbursementAccountId: new mongoose.Types.ObjectId(accountId),
          disbursedAt: new Date(),
          nextEmiDate: firstEmiDate,
          remainingAmount: loan.totalPayable,
        },
        { session }
      );

      // 5. Generate EMI payment schedule
      const emiPayments = [];
      for (let i = 1; i <= loan.tenureMonths; i++) {
        const dueDate = new Date(firstEmiDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        // Calculate principal and interest for each EMI
        const monthlyInterestRate = loan.interestRate / 100 / 12;
        const remainingPrincipal =
          loan.amount -
          (loan.emiAmount - loan.amount * monthlyInterestRate) * (i - 1);
        const interestAmount = remainingPrincipal * monthlyInterestRate;
        const principalAmount = loan.emiAmount - interestAmount;

        emiPayments.push({
          loanId: new mongoose.Types.ObjectId(loanId),
          userId: loan.userId,
          emiNumber: i,
          amount: loan.emiAmount,
          principalAmount,
          interestAmount,
          dueDate,
          status: "pending",
        });
      }

      await EmiPayment.insertMany(emiPayments, { session });

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: "Loan disbursed successfully",
        transactionId: transaction[0]._id.toString(),
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("Loan disbursement error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disburse loan" },
      { status: 500 }
    );
  }
}
