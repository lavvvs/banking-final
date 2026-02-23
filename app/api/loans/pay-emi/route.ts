// app/api/loans/pay-emi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Loan, EmiPayment, Account, Transaction } from "@/lib/models";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { loanId, emiId, accountId } = body;

    // Validate input
    if (!loanId || !emiId || !accountId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find and validate the EMI payment
      const emiPayment = await EmiPayment.findById(emiId).session(session);
      if (!emiPayment) {
        throw new Error("EMI payment not found");
      }

      if (emiPayment.status === "paid") {
        throw new Error("This EMI has already been paid");
      }

      // 2. Find and validate the loan
      const loan = await Loan.findById(loanId).session(session);
      if (!loan) {
        throw new Error("Loan not found");
      }

      if (loan.userId !== userId) {
        throw new Error("Unauthorized: This loan doesn't belong to you");
      }

      // 3. Find and validate the account
      const account = await Account.findById(accountId).session(session);
      if (!account) {
        throw new Error("Account not found");
      }

      if (account.userId !== userId) {
        throw new Error("Unauthorized: This account doesn't belong to you");
      }

      if (account.status !== "active") {
        throw new Error("Account is not active");
      }

      // 4. Check sufficient balance
      if (account.balance < emiPayment.amount) {
        throw new Error(
          `Insufficient balance. Required: ${emiPayment.amount.toFixed(
            2
          )}, Available: ${account.balance.toFixed(2)}`
        );
      }

      // 5. Deduct amount from user account
      account.balance -= emiPayment.amount;
      await account.save({ session });

      // 6. Add amount to admin account (for tracking)
      const adminAccount = await Account.findOne({
        accountType: "admin",
      }).session(session);

      if (adminAccount) {
        adminAccount.balance += emiPayment.amount;
        await adminAccount.save({ session });
      }

      // 7. Update EMI payment status
      emiPayment.status = "paid";
      emiPayment.paidDate = new Date();
      await emiPayment.save({ session });

      // 8. Update loan amounts
      loan.amountPaid = (loan.amountPaid || 0) + emiPayment.amount;
      loan.remainingAmount = Math.max(
        0,
        loan.remainingAmount - emiPayment.amount
      );

      // Update next EMI date
      const nextPendingEmi = await EmiPayment.findOne({
        loanId: loan._id,
        status: "pending",
      })
        .sort({ emiNumber: 1 })
        .session(session);

      if (nextPendingEmi) {
        loan.nextEmiDate = nextPendingEmi.dueDate;
      } else {
        // All EMIs are paid, mark loan as completed
        loan.status = "completed";
        loan.nextEmiDate = undefined;
      }

      await loan.save({ session });

      // 9. Create transaction record - THIS IS THE KEY PART
      const transaction = new Transaction({
        userId: userId, // ✅ Clerk user ID
        accountId: account._id,
        type: "emi_payment", // ✅ Correct type
        amount: emiPayment.amount,
        status: "completed",
        description: `EMI #${emiPayment.emiNumber} payment for ${loan.loanType} loan`,
        referenceId: loanId, // ✅ Link to loan (if this field exists in your schema)
      });

      await transaction.save({ session });

      console.log("✅ EMI Transaction Created:", {
        id: transaction._id.toString(),
        userId: transaction.userId,
        accountId: transaction.accountId.toString(),
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
      });

      // Update EMI payment with transaction reference
      emiPayment.transactionId = transaction._id;
      await emiPayment.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      console.log(
        `✅ EMI #${emiPayment.emiNumber} paid successfully for loan ${loanId}`
      );

      // Revalidate paths
      revalidatePath("/dashboard/loans");
      revalidatePath("/dashboard/transactions");
      revalidatePath("/dashboard/accounts");
      revalidatePath("/admin/transactions");

      return NextResponse.json({
        success: true,
        message: "EMI payment successful",
        data: {
          emiNumber: emiPayment.emiNumber,
          amountPaid: emiPayment.amount,
          newBalance: account.balance,
          remainingAmount: loan.remainingAmount,
          nextEmiDate: loan.nextEmiDate,
          loanStatus: loan.status,
          transactionId: transaction._id,
        },
      });
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("❌ EMI payment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process EMI payment",
      },
      { status: 500 }
    );
  }
}
