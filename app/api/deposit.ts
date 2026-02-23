import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import { Transaction } from "@/lib/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { userId, accountId, amount, description } = req.body;

  try {
    await dbConnect();

    // Create transaction
    const transaction = new Transaction({
      user_id: userId,
      account_id: accountId,
      amount,
      type: "deposit",
      status: "completed",
      description,
      reference_id: `DEP-${Date.now()}`,
    });
    await transaction.save();

    // Update account balance
    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    account.balance += amount;
    await account.save();

    res.status(200).json({ success: true, transaction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
