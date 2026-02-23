// app/dashboard/settings/page.tsx
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile-form";
import { User, Shield, FileText } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { serializeProfile } from "@/lib/utils/serializeProfile";
import type { SafeProfile } from "@/types/safe-profile";

export default async function SettingsPage() {
  await dbConnect();

  // 1️⃣ Get current user from Clerk
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  const userId = user.id;

  // 2️⃣ Fetch user profile from MongoDB
  const profileDoc = await Profile.findOne({ clerkId: userId }).lean();
  if (!profileDoc) redirect("/auth/login");

  // 3️⃣ Serialize profile for Client Components
  const safeProfile: SafeProfile = serializeProfile(profileDoc);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and account preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Information */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={safeProfile} />
          </CardContent>
        </Card>

        {/* KYC Status */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-base">KYC Verification</CardTitle>
                  <CardDescription>
                    Identity verification status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      safeProfile.kycStatus === "approved"
                        ? "default"
                        : safeProfile.kycStatus === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {safeProfile.kycStatus || "pending"}
                  </Badge>
                </div>
                {safeProfile.kycStatus === "pending" && (
                  <p className="text-xs text-muted-foreground">
                    Please upload your KYC documents to complete verification.
                  </p>
                )}
                {safeProfile.kycStatus === "approved" && (
                  <p className="text-xs text-accent">
                    Your identity has been verified successfully.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-base">Account Info</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-card-foreground">
                    {safeProfile.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium text-card-foreground">
                    {safeProfile.createdAt
                      ? new Date(safeProfile.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium text-card-foreground">
                    {safeProfile.isAdmin ? "Administrator" : "Standard User"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
