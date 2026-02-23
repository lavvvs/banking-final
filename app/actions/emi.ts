// app/actions/emi.ts
"use server";

import dbConnect from "@/lib/mongodb";
import { Loan, EmiPayment } from "@/lib/models";
import { revalidatePath } from "next/cache";

// Calculate EMI using reducing balance method
function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
) {
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

// Generate EMI schedule when loan is approved/disbursed
export async function generateEMISchedule(
  loanId: string,
  startDate: Date,
  firstEMIDate?: Date
) {
  await dbConnect();

  const loan = await Loan.findById(loanId);
  if (!loan) throw new Error("Loan not found");

  // Calculate EMI amount
  const emiAmount = calculateEMI(
    loan.amount,
    loan.interestRate,
    loan.tenureMonths
  );

  // Calculate total payable and interest
  const totalPayable = emiAmount * loan.tenureMonths;
  const totalInterest = totalPayable - loan.amount;

  // Update loan with calculated values
  loan.emiAmount = emiAmount;
  loan.totalPayable = totalPayable;
  loan.remainingAmount = totalPayable;
  await loan.save();

  // Delete existing EMI schedule if any (in case of regeneration)
  await EmiPayment.deleteMany({ loanId });

  // Generate EMI schedule
  const emiSchedule = [];
  let remainingPrincipal = loan.amount;
  const monthlyRate = loan.interestRate / 12 / 100;

  // Use provided first EMI date or calculate based on loan start date
  let currentDate = firstEMIDate ? new Date(firstEMIDate) : new Date(startDate);
  if (!firstEMIDate) {
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  for (let i = 1; i <= loan.tenureMonths; i++) {
    // Calculate interest and principal for this EMI
    const interestForMonth = remainingPrincipal * monthlyRate;
    const principalForMonth = emiAmount - interestForMonth;
    remainingPrincipal -= principalForMonth;

    // Ensure remaining principal doesn't go negative due to rounding
    if (remainingPrincipal < 0) remainingPrincipal = 0;

    emiSchedule.push({
      loanId: loan._id,
      userId: loan.userId,
      emiNumber: i,
      dueDate: new Date(currentDate),
      amount: emiAmount,
      principalAmount: Math.round(principalForMonth * 100) / 100,
      interestAmount: Math.round(interestForMonth * 100) / 100,
      status: "pending",
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Save all EMI records
  await EmiPayment.insertMany(emiSchedule);

  console.log(
    `✅ Generated ${emiSchedule.length} EMI payments for loan ${loanId}`,
    {
      emiAmount,
      totalPayable,
      totalInterest,
      firstEmiDate: emiSchedule[0].dueDate,
      lastEmiDate: emiSchedule[emiSchedule.length - 1].dueDate,
    }
  );

  revalidatePath("/admin/loans");
  revalidatePath("/dashboard/loans");

  return {
    success: true,
    emiCount: emiSchedule.length,
    emiAmount,
    totalAmount: totalPayable,
    interestAmount: totalInterest,
  };
}

// Update a specific EMI due date (admin only)
export async function updateEMIDueDate(emiId: string, newDueDate: Date) {
  await dbConnect();

  const emi = await EmiPayment.findById(emiId);
  if (!emi) throw new Error("EMI not found");

  if (emi.status === "paid") {
    throw new Error("Cannot update due date of paid EMI");
  }

  emi.dueDate = newDueDate;
  await emi.save();

  // Update loan's next EMI date if this is the next pending EMI
  const loan = await Loan.findById(emi.loanId);
  if (loan) {
    const nextPendingEmi = await EmiPayment.findOne({
      loanId: loan._id,
      status: "pending",
    }).sort({ emiNumber: 1 });

    if (nextPendingEmi) {
      loan.nextEmiDate = nextPendingEmi.dueDate;
      await loan.save();
    }
  }

  revalidatePath("/admin/loans");
  revalidatePath("/dashboard/loans");

  return { success: true, message: "Due date updated successfully" };
}

// Bulk update EMI due dates for a loan (admin only)
export async function rescheduleAllEMIs(loanId: string, newStartDate: Date) {
  await dbConnect();

  const emis = await EmiPayment.find({
    loanId,
    status: { $ne: "paid" },
  }).sort({ emiNumber: 1 });

  if (emis.length === 0) {
    throw new Error("No pending EMIs found");
  }

  let currentDate = new Date(newStartDate);

  for (const emi of emis) {
    emi.dueDate = new Date(currentDate);
    await emi.save();
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Update loan's next EMI date
  const loan = await Loan.findById(loanId);
  if (loan) {
    loan.nextEmiDate = emis[0].dueDate;
    await loan.save();
  }

  revalidatePath("/admin/loans");
  revalidatePath("/dashboard/loans");

  return {
    success: true,
    message: `Rescheduled ${emis.length} EMIs`,
    count: emis.length,
  };
}

// Mark EMI as overdue (can be run as a cron job)
export async function markOverdueEMIs() {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await EmiPayment.updateMany(
    {
      status: "pending",
      dueDate: { $lt: today },
    },
    {
      $set: { status: "overdue" },
    }
  );

  console.log(`✅ Marked ${result.modifiedCount} EMIs as overdue`);

  revalidatePath("/admin/loans");
  revalidatePath("/dashboard/loans");

  return {
    success: true,
    count: result.modifiedCount,
  };
}
