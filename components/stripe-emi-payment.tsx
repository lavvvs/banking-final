"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { startEMIPaymentCheckout } from "@/app/actions/stripe";
import { formatCurrency, formatDate } from "@/lib/utils/emi-calculator";
import type { IEmiPayment, ILoan, IAccount } from "@/lib/models";
import { CreditCard, CheckCircle2 } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripeEMIPaymentProps {
  emi: IEmiPayment;
  loan: ILoan;
  accounts: IAccount[];
  onSuccess?: () => void;
}

export function StripeEMIPayment({
  emi,
  loan,
  accounts,
  onSuccess,
}: StripeEMIPaymentProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  const fetchClientSecret = useCallback(async () => {
    const secret = await startEMIPaymentCheckout(
      emi._id.toString(),
      loan._id.toString()
    );
    if (!secret) throw new Error("Failed to get client secret");
    return secret;
  }, [emi._id, loan._id]);

  const handleComplete = async () => {
    setIsProcessing(true);

    // Here you should call your backend API to update MongoDB
    // For example, updating transaction, EMI status, and loan

    setIsProcessing(false);
    setIsComplete(true);

    setTimeout(() => {
      setOpen(false);
      setIsComplete(false);
      router.refresh();
      onSuccess?.();
    }, 2000);
  };

  const paymentAccount =
    accounts.find(
      (a) => a._id.toString() === loan.disbursementAccountId?.toString()
    ) || accounts[0];

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CreditCard className="mr-2 h-4 w-4" />
        Pay with Card
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay EMI #{emi.emiNumber}</DialogTitle>
            <DialogDescription>
              {loan.loanType} Loan - Due {formatDate(emi.dueDate)}
            </DialogDescription>
          </DialogHeader>

          {isComplete ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                Payment Successful!
              </h3>
              <p className="mt-2 text-muted-foreground">
                EMI #{emi.emiNumber} has been paid.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-xl font-bold text-card-foreground">
                    {formatCurrency(emi.amount)}
                  </span>
                </div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
