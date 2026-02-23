"use client";

import { useState } from "react";
import { WithdrawDialog } from "./transaction-actions";

type AccountData = {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
};

interface Props {
  accounts: AccountData[];
  userId: string;
}

export function WithdrawDialogWrapper({ accounts, userId }: Props) {
  const [open, setOpen] = useState(false);

  const createTransaction = async (data: any) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create transaction";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server Error (${response.status}): ${response.statusText || "Unknown Error"}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Transaction error:", error);
      throw error;
    }
  };

  const updateAccountBalance = async (
    accountId: string,
    newBalance: number
  ): Promise<void> => {
    // This is now handled atomically by createTransaction
    console.log("ℹ️ Balance update handled by transaction API");
  };
  return (
    <>
      <button
        className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/80"
        onClick={() => setOpen(true)}
      >
        Withdraw
      </button>

      <WithdrawDialog
        accounts={accounts}
        userId={userId}
        open={open}
        onOpenChange={setOpen}
        createTransaction={createTransaction}
        updateAccountBalance={updateAccountBalance}
      />
    </>
  );
}
