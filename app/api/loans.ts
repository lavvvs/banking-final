// app/api/loans.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import { Loan } from "@/lib/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const {
    userId,
    loanType,
    amount,
    interestRate,
    tenureMonths,
    emiAmount,
    totalPayable,
    remainingAmount,
    status,
    disbursementAccountId,
  } = req.body;

  try {
    await dbConnect();
    const loan = new Loan({
      user_id: userId,
      loan_type: loanType,
      amount,
      interest_rate: interestRate,
      tenure_months: tenureMonths,
      emi_amount: emiAmount,
      total_payable: totalPayable,
      remaining_amount: remainingAmount,
      status,
      disbursement_account_id: disbursementAccountId,
    });
    await loan.save();
    res.status(200).json({ success: true, loan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
