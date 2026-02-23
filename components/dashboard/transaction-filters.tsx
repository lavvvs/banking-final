"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Define the same AccountData type
type AccountData = {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
};

interface TransactionFiltersProps {
  accounts: AccountData[]; // ✅ Changed from IAccount[]
}

export function TransactionFilters({ accounts }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "all";
  const currentAccount = searchParams.get("account") || "all";

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`/dashboard/transactions?${params.toString()}`);
  };

  const handleAccountChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("account");
    } else {
      params.set("account", value);
    }
    router.push(`/dashboard/transactions?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="transfer_in">Transfer In</SelectItem>
            <SelectItem value="transfer_out">Transfer Out</SelectItem>
            <SelectItem value="emi_payment">EMI Payment</SelectItem>
            <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Select value={currentAccount} onValueChange={handleAccountChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <span className="capitalize">{account.accountType}</span> -{" "}
                {account.accountNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
