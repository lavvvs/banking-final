"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  startDepositCheckout,
  startCustomDepositCheckout,
} from "@/app/actions/stripe";
import { formatCurrency } from "@/lib/utils/emi-calculator";
import type { IAccount } from "@/lib/models";
import { CheckCircle2, Loader2 } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PRESET_AMOUNTS = [
  { id: "deposit-100", label: "$100", value: 100 },
  { id: "deposit-500", label: "$500", value: 500 },
  { id: "deposit-1000", label: "$1,000", value: 1000 },
  { id: "deposit-5000", label: "$5,000", value: 5000 },
];

interface StripeDepositFormProps {
  accounts: IAccount[];
  defaultAccountId: string;
}

export function StripeDepositForm({
  accounts,
  defaultAccountId,
}: StripeDepositFormProps) {
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  const selectedAccount = accounts.find((a) => a._id.toString() === accountId);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    let secret: string | null = null;

    if (selectedPreset) {
      secret = await startDepositCheckout(selectedPreset, accountId);
    } else if (customAmount) {
      secret = await startCustomDepositCheckout(
        Number(customAmount),
        accountId
      );
    }

    if (!secret) throw new Error("Failed to fetch Stripe client secret");
    return secret;
  }, [selectedPreset, customAmount, accountId]);

  const handlePresetSelect = (preset: (typeof PRESET_AMOUNTS)[0]) => {
    setSelectedPreset(preset.id);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPreset(null);
  };

  const handleProceed = () => {
    if (!selectedPreset && !customAmount) return;
    setShowCheckout(true);
  };

  const handleComplete = async () => {
    setIsProcessing(true);

    await fetch("/api/deposit", {
      method: "POST",
      body: JSON.stringify({
        accountId,
        amount: selectedPreset
          ? PRESET_AMOUNTS.find((p) => p.id === selectedPreset)?.value
          : Number(customAmount),
      }),
      headers: { "Content-Type": "application/json" },
    });

    setIsProcessing(false);
    setIsComplete(true);

    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-card-foreground">
          Deposit Successful!
        </h3>
        <p className="mt-2 text-muted-foreground">
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Depositing to:{" "}
            <span className="font-medium text-foreground">
              {selectedAccount?.accountType} Account (
              {selectedAccount?.accountNumber})
            </span>
          </p>
        </div>

        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            fetchClientSecret,
            onComplete: handleComplete,
          }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>

        <Button
          variant="outline"
          onClick={() => setShowCheckout(false)}
          className="w-full"
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div className="space-y-2">
        <Label>Select Account</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem
                key={account._id.toString()}
                value={account._id.toString()}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="capitalize">{account.accountType}</span>
                  <span className="text-xs text-muted-foreground">
                    Balance: {formatCurrency(Number(account.balance))}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preset Amounts */}
      <div className="space-y-2">
        <Label>Quick Select</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRESET_AMOUNTS.map((preset) => (
            <Card
              key={preset.id}
              className={`cursor-pointer border-2 transition-colors hover:border-primary ${
                selectedPreset === preset.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              onClick={() => handlePresetSelect(preset)}
            >
              <CardContent className="flex items-center justify-center p-4">
                <span className="text-lg font-bold text-card-foreground">
                  {preset.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="space-y-2">
        <Label>Or Enter Custom Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            placeholder="Enter amount"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            min={10}
            max={100000}
            step="0.01"
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum: $10 | Maximum: $100,000
        </p>
      </div>

      {/* Proceed Button */}
      <Button
        onClick={handleProceed}
        disabled={!selectedPreset && !customAmount}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Proceed to Payment${
            selectedPreset
              ? ` - ${
                  PRESET_AMOUNTS.find((p) => p.id === selectedPreset)?.label
                }`
              : customAmount
              ? ` - ${formatCurrency(Number.parseFloat(customAmount))}`
              : ""
          }`
        )}
      </Button>
    </div>
  );
}
