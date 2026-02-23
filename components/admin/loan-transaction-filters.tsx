"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useState } from "react";

interface LoanTransactionFiltersProps {
  currentType?: string;
  currentPage: number;
  totalPages: number;
  currentSearch?: string;
}

export function LoanTransactionFilters({
  currentType,
  currentPage,
  totalPages,
  currentSearch,
}: LoanTransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch || "");

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filters change
    if (key !== "page") {
      params.set("page", "1");
    }

    router.push(`/admin/transactions?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    updateFilters("page", page.toString());
  };

  const handleSearch = () => {
    updateFilters("search", searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    updateFilters("search", "");
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Left side - Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">
            Transaction Type:
          </span>
          <Select
            value={currentType || "all"}
            onValueChange={(value) => updateFilters("type", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="loan_disbursement">
                Disbursements Only
              </SelectItem>
              <SelectItem value="emi_payment">EMI Payments Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search user or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-[240px] pr-8"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right side - Pagination */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground whitespace-nowrap px-2">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
