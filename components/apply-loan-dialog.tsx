"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { calculateEMI, formatCurrency } from "@/lib/utils/emi-calculator";
import { Plus, Loader2, Calculator } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

interface ApplyLoanDialogProps {
  accounts: Account[];
  interestRates: Record<string, number>;
}

const loanTypes = [
  { value: "personal", label: "Personal Loan", icon: "💰" },
  { value: "home", label: "Home Loan", icon: "🏠" },
  { value: "education", label: "Education Loan", icon: "🎓" },
  { value: "vehicle", label: "Vehicle Loan", icon: "🚗" },
  { value: "business", label: "Business Loan", icon: "💼" },
];

export function ApplyLoanDialog({
  accounts,
  interestRates,
}: ApplyLoanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loanType, setLoanType] = useState("");
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState([12]);
  const [disbursementAccountId, setDisbursementAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useUser();

  const interestRate = loanType ? interestRates[loanType] || 12 : 0;
  const loanAmount = Number.parseFloat(amount) || 0;
  const tenureMonths = tenure[0];
  const emiAmount =
    loanAmount > 0 ? calculateEMI(loanAmount, interestRate, tenureMonths) : 0;
  const totalPayable = emiAmount * tenureMonths;
  const totalInterest = totalPayable - loanAmount;

  const resetForm = () => {
    setLoanType("");
    setAmount("");
    setTenure([12]);
    setDisbursementAccountId("");
    setError(null);
  };

  const handleApply = async () => {
    if (!loanType || !amount || !disbursementAccountId) {
      setError("Please fill in all required fields");
      return;
    }

    if (loanAmount < 1000) {
      setError("Minimum loan amount is $1,000");
      return;
    }

    if (!user) {
      setError("You must be logged in");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post("/api/loans", {
        userId: user.id,
        loanType,
        amount: loanAmount,
        interestRate,
        tenureMonths,
        emiAmount,
        totalPayable,
        remainingAmount: totalPayable,
        status: "pending",
        disbursementAccountId,
      });

      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Apply for Loan
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Apply for a Loan</DialogTitle>
          <DialogDescription>
            Fill in the details to submit your loan application.
          </DialogDescription>
        </DialogHeader>

        {/* ✅ FIX: Scrollable content area */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4 py-4">
            {/* Loan Type */}
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  {loanTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">
                          @ {interestRates[type.value] || 12}% p.a.
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <Label>Loan Amount (USD)</Label>
              <Input
                type="number"
                placeholder="Minimum $1,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1000}
                step={100}
              />
            </div>

            {/* Tenure */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tenure</Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {tenureMonths} months
                </span>
              </div>
              <Slider
                value={tenure}
                onValueChange={setTenure}
                min={6}
                max={60}
                step={6}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>6 months</span>
                <span>60 months</span>
              </div>
            </div>

            {/* Disbursement Account */}
            <div className="space-y-2">
              <Label>Disbursement Account</Label>
              <Select
                value={disbursementAccountId}
                onValueChange={setDisbursementAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">
                          {account.accountType}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {account.accountNumber}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Summary */}
            {loanAmount > 0 && loanType && (
              <Card className="border-0 bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <Calculator className="h-4 w-4" />
                    Loan Summary
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Monthly EMI</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(emiAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="text-lg font-bold text-card-foreground">
                        {interestRate}% p.a.
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Interest</p>
                      <p className="font-semibold text-warning">
                        {formatCurrency(totalInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Payable</p>
                      <p className="font-semibold text-card-foreground">
                        {formatCurrency(totalPayable)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ✅ FIX: Fixed footer with actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isLoading || accounts.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
