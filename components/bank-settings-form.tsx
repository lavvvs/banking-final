"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface BankSettings {
  id?: string;
  userId: string;
  bankName: string;
  transactionLimits: {
    daily: number;
    perTransaction: number;
  };
  interestRates: {
    savings: number;
    checking: number;
  };
  fees: {
    monthlyMaintenance: number;
    overdraft: number;
    atmWithdrawal: number;
  };
}

export function BankSettingsForm() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BankSettings | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchSettings();
    }
  }, [isLoaded, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Don't pass userId in query params - let the API get it from auth
      const response = await fetch("/api/bank-settings");

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load bank settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const response = await fetch("/api/bank-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Settings saved successfully!");
        setSettings(data.settings);
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string[], value: any) => {
    if (!settings) return;

    setSettings((prev) => {
      if (!prev) return prev;

      const newSettings = { ...prev };
      let current: any = newSettings;

      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isLoaded || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Please sign in to view settings
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load settings</p>
          <Button onClick={fetchSettings} variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bank Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={settings.bankName}
              onChange={(e) => updateSetting(["bankName"], e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dailyLimit">Daily Limit ($)</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={settings.transactionLimits.daily}
              onChange={(e) =>
                updateSetting(
                  ["transactionLimits", "daily"],
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="perTransactionLimit">
              Per Transaction Limit ($)
            </Label>
            <Input
              id="perTransactionLimit"
              type="number"
              value={settings.transactionLimits.perTransaction}
              onChange={(e) =>
                updateSetting(
                  ["transactionLimits", "perTransaction"],
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interest Rates (%)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="savingsRate">Savings Account</Label>
            <Input
              id="savingsRate"
              type="number"
              step="0.1"
              value={settings.interestRates.savings}
              onChange={(e) =>
                updateSetting(
                  ["interestRates", "savings"],
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="checkingRate">Checking Account</Label>
            <Input
              id="checkingRate"
              type="number"
              step="0.1"
              value={settings.interestRates.checking}
              onChange={(e) =>
                updateSetting(
                  ["interestRates", "checking"],
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fees ($)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="maintenanceFee">Monthly Maintenance Fee</Label>
            <Input
              id="maintenanceFee"
              type="number"
              step="0.01"
              value={settings.fees.monthlyMaintenance}
              onChange={(e) =>
                updateSetting(
                  ["fees", "monthlyMaintenance"],
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
          <div>
            <Label htmlFor="overdraftFee">Overdraft Fee</Label>
            <Input
              id="overdraftFee"
              type="number"
              step="0.01"
              value={settings.fees.overdraft}
              onChange={(e) =>
                updateSetting(["fees", "overdraft"], parseFloat(e.target.value))
              }
            />
          </div>
          <div>
            <Label htmlFor="atmFee">ATM Withdrawal Fee</Label>
            <Input
              id="atmFee"
              type="number"
              step="0.01"
              value={settings.fees.atmWithdrawal}
              onChange={(e) =>
                updateSetting(
                  ["fees", "atmWithdrawal"],
                  parseFloat(e.target.value)
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
