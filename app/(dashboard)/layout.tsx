// app/(dashboard)/layout.tsx
import type React from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { serializeProfile } from "@/lib/utils/serializeProfile";
import type { SafeProfile } from "@/types/safe-profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session.userId;

  if (!userId) redirect("/auth/login");

  await dbConnect();

  let profile = await Profile.findOne({ clerkId: userId }).lean();

  if (!profile) {
    const user = await currentUser();
    if (!user) redirect("/auth/login");

    const newProfile = await Profile.create({
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      fullName: user.fullName || "",
      phone: user.phoneNumbers[0]?.phoneNumber || "",
      kycStatus: "pending",
      isAdmin: false,
    });

    profile = newProfile.toObject();
  }

  const safeProfile: SafeProfile = serializeProfile(profile);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Fixed position */}
      <DashboardSidebar profile={safeProfile} />

      {/* Main content area - Uses margin instead of padding */}
      <div className="min-h-screen lg:ml-72">
        <DashboardHeader profile={safeProfile} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
