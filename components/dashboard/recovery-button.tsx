// components/dashboard/recovery-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function RecoveryButton({
  transactionCount,
  accountCount = 0,
  loanCount = 0,
  emiCount = 0,
  accountsWithWrongUserId = 0,
}: {
  transactionCount: number;
  accountCount?: number;
  loanCount?: number;
  emiCount?: number;
  accountsWithWrongUserId?: number;
}) {
  const [loading, setLoading] = useState(false);

  const totalIssues =
    transactionCount + loanCount + emiCount + accountsWithWrongUserId;

  const handleRecover = async () => {
    setLoading(true);

    // Show loading toast
    const loadingToast = toast.loading(
      "🔧 Recovering your accounts and data...",
      {
        description: "This may take a few moments...",
      }
    );

    try {
      const res = await fetch("/api/recover-my-account", {
        method: "POST",
      });
      const data = await res.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (data.success) {
        // Show success toast with details
        toast.success("Account Recovery Complete! 🎉", {
          description: (
            <div className="space-y-1 text-sm mt-2">
              {data.accountsCreated > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{data.accountsCreated} account(s) created</span>
                </div>
              )}
              {data.transactionsLinked > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{data.transactionsLinked} transactions linked</span>
                </div>
              )}
              {data.loansLinked > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{data.loansLinked} loans recovered</span>
                </div>
              )}
              {data.emisLinked > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{data.emisLinked} EMI payments recovered</span>
                </div>
              )}
              {data.accountsFixed > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{data.accountsFixed} account(s) ownership fixed</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-green-200">
                <p className="font-bold text-green-700">
                  💰 Total Balance: ${data.totalBalance?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          ),
          duration: 6000,
        });

        // Refresh after 1.5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error("Recovery Failed ❌", {
          description:
            data.error ||
            data.message ||
            "Unknown error occurred. Please check console for details.",
          duration: 5000,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Recovery Failed ❌", {
        description:
          "An unexpected error occurred. Please check the console and try again.",
        duration: 5000,
      });
      console.error("Recovery error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl shadow-lg">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.4) 10px, rgba(251, 191, 36, 0.4) 20px)`,
          }}
        ></div>
      </div>

      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-yellow-400 rounded-full">
          <AlertCircle className="h-6 w-6 text-yellow-900" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-yellow-900 text-lg">
              ⚠️ Data Recovery Required
            </h3>
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {totalIssues} {totalIssues === 1 ? "Issue" : "Issues"}
            </span>
          </div>

          <p className="text-sm text-yellow-800 mb-3">
            We detected orphaned data that needs to be recovered and linked to
            your account:
          </p>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 mb-4">
            <ul className="space-y-2">
              {transactionCount > 0 && (
                <li className="flex items-center gap-2 text-sm text-yellow-900">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>
                    <strong className="font-semibold">
                      {transactionCount}
                    </strong>{" "}
                    transaction(s) without accounts
                  </span>
                </li>
              )}
              {loanCount > 0 && (
                <li className="flex items-center gap-2 text-sm text-yellow-900">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>
                    <strong className="font-semibold">{loanCount}</strong>{" "}
                    loan(s) need to be linked
                  </span>
                </li>
              )}
              {emiCount > 0 && (
                <li className="flex items-center gap-2 text-sm text-yellow-900">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>
                    <strong className="font-semibold">{emiCount}</strong> EMI
                    payment(s) need to be linked
                  </span>
                </li>
              )}
              {accountsWithWrongUserId > 0 && (
                <li className="flex items-center gap-2 text-sm text-yellow-900">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>
                    <strong className="font-semibold">
                      {accountsWithWrongUserId}
                    </strong>{" "}
                    account(s) with wrong ownership
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRecover}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Recovering Data...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Recover All Data Now
                </>
              )}
            </Button>

            {accountCount > 0 && (
              <p className="text-xs text-yellow-700">
                You currently have {accountCount} account(s) linked
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
