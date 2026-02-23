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
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create transaction");
    }

    return response.json();
  };

  const updateAccountBalance = async (
    accountId: string,
    newBalance: number
  ) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ balance: newBalance }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Balance update failed:", error);
        throw new Error(error.error || "Failed to update balance");
      }

      const data = await response.json();

      // Force a refresh of the account data
      // You might need to call a refresh function here
      // For example, if you're using React Query or SWR:
      // mutate('/api/accounts');

      return data;
    } catch (error) {
      console.error("Error updating balance:", error);
      throw error;
    }
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
