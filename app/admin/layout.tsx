// app/admin/layout.tsx
import type React from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { serializeProfile } from "@/lib/utils/serializeProfile";
import type { SafeProfile } from "@/types/safe-profile";

export default async function AdminLayout({
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
    redirect("/dashboard");
  }

  // Check if user is admin
  if (!profile.isAdmin) {
    redirect("/dashboard");
  }

  const safeProfile: SafeProfile = serializeProfile(profile);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar profile={safeProfile} />
      <div className="flex w-full flex-col lg:pl-72">
        <DashboardHeader profile={safeProfile} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
