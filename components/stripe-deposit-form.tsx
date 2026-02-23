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
import { Loader2 } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectedAccount = accounts.find((a) => a._id.toString() === accountId);

  const fetchClientSecret = useCallback(async () => {
    try {
      setError(null);

      if (selectedPreset) {
        console.log("Fetching client secret for preset:", selectedPreset);
        const secret = await startDepositCheckout(selectedPreset, accountId);
        if (!secret) throw new Error("Failed to get client secret");
        return secret;
      } else if (customAmount) {
        console.log("Fetching client secret for custom amount:", customAmount);
        const secret = await startCustomDepositCheckout(
          Number.parseFloat(customAmount),
          accountId
        );
        if (!secret) throw new Error("Failed to get client secret");
        return secret;
      }
      throw new Error("No amount selected");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize payment";
      setError(errorMessage);
      console.error("❌ Error fetching client secret:", err);
      throw err;
    }
  }, [selectedPreset, customAmount, accountId]);

  const handlePresetSelect = (preset: (typeof PRESET_AMOUNTS)[0]) => {
    setSelectedPreset(preset.id);
    setCustomAmount("");
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPreset(null);
    setError(null);
  };

  const handleProceed = async () => {
    if (!selectedPreset && !customAmount) return;
    setIsProcessing(true);
    setError(null);

    try {
      // Test the connection first
      await fetchClientSecret();
      setShowCheckout(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setIsProcessing(false);
    }
  };

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
          {selectedPreset && (
            <p className="text-sm font-semibold mt-1">
              Amount:{" "}
              {PRESET_AMOUNTS.find((p) => p.id === selectedPreset)?.label}
            </p>
          )}
          {customAmount && (
            <p className="text-sm font-semibold mt-1">
              Amount: {formatCurrency(Number.parseFloat(customAmount))}
            </p>
          )}
        </div>

        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            fetchClientSecret,
            // Stripe will handle the redirect to return_url automatically
          }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>

        <Button
          variant="outline"
          onClick={() => {
            setShowCheckout(false);
            setError(null);
          }}
          className="w-full"
        >
          Back
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
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
            min="10"
            max="100000"
            step="0.01"
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum: $10 | Maximum: $100,000
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Proceed Button */}
      <Button
        onClick={handleProceed}
        disabled={(!selectedPreset && !customAmount) || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing Payment...
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
