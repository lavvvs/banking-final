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
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const accountTypes = [
  {
    value: "savings",
    label: "Savings Account",
    description: "For personal savings with interest",
  },
  {
    value: "current",
    label: "Current Account",
    description: "For daily transactions",
  },
  {
    value: "salary",
    label: "Salary Account",
    description: "For receiving salary payments",
  },
];

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [accountType, setAccountType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser(); // Clerk

  const generateAccountNumber = () => {
    return (
      "ACC" +
      Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, "0")
    );
  };

  const handleCreateAccount = async () => {
    if (!accountType) {
      setError("Please select an account type");
      return;
    }

    if (!user) {
      setError("You must be logged in to create an account");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          accountType,
          accountNumber: generateAccountNumber(),
          balance: 0,
          currency: "USD",
          status: "active",
        }),
      });

      setOpen(false);
      setAccountType("");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Choose an account type to get started with your new bank account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger id="accountType">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateAccount} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
