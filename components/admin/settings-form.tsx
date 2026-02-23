"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Setting {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string;
}

interface SettingsFormProps {
  settings: Setting[];
  type: "interest" | "other";
}

export function SettingsForm({ settings, type }: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(
    settings.reduce((acc, setting) => {
      acc[setting.settingKey] = setting.settingValue;
      return acc;
    }, {} as Record<string, string>)
  );

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: formData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });

      router.refresh();
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {settings.map((setting) => (
        <div key={setting.id} className="space-y-2">
          <Label htmlFor={setting.settingKey}>
            {formatLabel(setting.settingKey)}
          </Label>
          {setting.description && (
            <p className="text-xs text-muted-foreground">
              {setting.description}
            </p>
          )}
          <Input
            id={setting.settingKey}
            type={type === "interest" ? "number" : "text"}
            step={type === "interest" ? "0.01" : undefined}
            value={formData[setting.settingKey] || ""}
            onChange={(e) => handleChange(setting.settingKey, e.target.value)}
            placeholder={
              type === "interest"
                ? "Enter interest rate (e.g., 10.5)"
                : "Enter value"
            }
          />
        </div>
      ))}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </form>
  );
}
