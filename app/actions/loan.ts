// app/actions/loan.ts
"use server";

import dbConnect from "@/lib/mongodb";
import { Account, Loan, EmiPayment, Transaction } from "@/lib/models";
import { revalidatePath } from "next/cache";
import { calculateEMI } from "@/lib/utils/emi-calculator";

export async function disburseLoan(loanId: string) {
  try {
    await dbConnect();

    // Find the loan with fresh data
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return { success: false, error: "Loan not found" };
    }

    console.log("📋 Loan Status:", loan.status);

    // Check if loan is already disbursed or active
    if (loan.status === "disbursed" || loan.status === "active") {
      return {
        success: false,
        error: "Loan has already been disbursed",
      };
    }

    // Allow disbursement for both 'approved' and 'pending' status
    if (loan.status !== "approved" && loan.status !== "pending") {
      return {
        success: false,
        error: `Loan must be approved first. Current status: ${loan.status}`,
      };
    }

    // Check if EMI schedule already exists (to prevent duplicates)
    const existingEMIs = await EmiPayment.countDocuments({ loanId: loan._id });

    if (existingEMIs > 0) {
      console.log("⚠️ EMI schedule already exists, just updating loan status");

      // Just update the loan status to active
      loan.status = "active";
      loan.disbursementDate = new Date();
      await loan.save();

      revalidatePath("/admin/loans");
      revalidatePath("/admin/dashboard");
      revalidatePath("/dashboard");

      return {
        success: true,
        message: "Loan activated successfully",
      };
    }

    // Find user's account
    const account = await Account.findOne({ userId: loan.userId });

    if (!account) {
      return { success: false, error: "User account not found" };
    }

    // Credit the loan amount to user's account
    account.balance += loan.amount;
    await account.save();

    // Create transaction record
    const transaction = await Transaction.create({
      accountId: account._id,
      type: "credit",
      amount: loan.amount,
      description: `Loan disbursement - ${loan.loanType}`,
      status: "completed",
    });

    // Calculate EMI if not already calculated
    if (!loan.emiAmount) {
      loan.emiAmount = calculateEMI(
        loan.amount,
        loan.interestRate,
        loan.tenureMonths
      );
    }

    // Generate EMI schedule
    const emiSchedule = [];
    const startDate = new Date();

    for (let i = 0; i < loan.tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      emiSchedule.push({
        loanId: loan._id,
        emiNumber: i + 1,
        dueDate,
        amount: loan.emiAmount,
        status: "pending",
        principalAmount: loan.amount / loan.tenureMonths,
        interestAmount: loan.emiAmount - loan.amount / loan.tenureMonths,
      });
    }

    // Insert all EMI payments at once
    await EmiPayment.insertMany(emiSchedule);

    // Update loan status to active
    loan.status = "active";
    loan.disbursementDate = new Date();
    await loan.save();

    console.log("✅ Loan disbursed successfully:", {
      loanId: loan._id,
      amount: loan.amount,
      emiCount: emiSchedule.length,
      status: loan.status,
    });

    // Revalidate all relevant paths
    revalidatePath("/admin/loans");
    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
    revalidatePath("/loans");

    return {
      success: true,
      message: "Loan disbursed successfully",
      transactionId: transaction._id.toString(),
    };
  } catch (error: any) {
    console.error("❌ Disburse Loan Error:", error);
    return {
      success: false,
      error: error.message || "Failed to disburse loan",
    };
  }
}

export async function approveLoan(loanId: string) {
  try {
    await dbConnect();

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return { success: false, error: "Loan not found" };
    }

    if (loan.status === "approved") {
      return { success: false, error: "Loan is already approved" };
    }

    loan.status = "approved";
    await loan.save();

    revalidatePath("/admin/loans");
    revalidatePath("/admin/dashboard");

    return { success: true, message: "Loan approved successfully" };
  } catch (error: any) {
    console.error("❌ Approve Loan Error:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectLoan(loanId: string, reason: string) {
  try {
    await dbConnect();

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return { success: false, error: "Loan not found" };
    }

    loan.status = "rejected";
    loan.rejectionReason = reason;
    await loan.save();

    revalidatePath("/admin/loans");
    revalidatePath("/admin/dashboard");

    return { success: true, message: "Loan rejected successfully" };
  } catch (error: any) {
    console.error("❌ Reject Loan Error:", error);
    return { success: false, error: error.message };
  }
}
