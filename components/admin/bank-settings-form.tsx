"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

export interface BankSettingClient {
  _id: string;
  settingKey: string;
  settingValue: string;
  description?: string;
}

interface BankSettingsFormProps {
  userId: string;
}

export function BankSettingsForm({ userId }: BankSettingsFormProps) {
  const [settings, setSettings] = useState<BankSettingClient[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Fetch settings from server
  useEffect(() => {
    fetch("/api/bank-settings?userId=" + userId)
      .then((res) => res.json())
      .then((data: BankSettingClient[]) => {
        setSettings(data);
        setValues(
          data.reduce(
            (acc, s) => ({ ...acc, [s.settingKey]: s.settingValue }),
            {}
          )
        );
      });
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/bank-settings/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, values }),
      });
      if (!res.ok) throw new Error(await res.text());

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const formatLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/loan rate/g, "Loan Rate")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {settings.map((setting) => (
        <div key={setting._id} className="space-y-2">
          <Label htmlFor={setting.settingKey}>
            {formatLabel(setting.settingKey)}
            {setting.settingKey.endsWith("_rate") && " (%)"}
          </Label>
          <Input
            id={setting.settingKey}
            type="number"
            step="0.01"
            value={values[setting.settingKey] || ""}
            onChange={(e) =>
              setValues({ ...values, [setting.settingKey]: e.target.value })
            }
          />
          {setting.description && (
            <p className="text-xs text-muted-foreground">
              {setting.description}
            </p>
          )}
        </div>
      ))}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved successfully
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
