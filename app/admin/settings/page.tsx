// app/admin/settings/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles, MessageSquare, Database, Zap } from "lucide-react";
import AIChatbot from "@/components/admin/AIChatbot";

export default async function AdminSettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  await dbConnect();

  // Check if user is admin
  const profile = await Profile.findOne({
    $or: [{ userId: userId }, { clerkId: userId }],
  }).lean();

  if (!profile?.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">
            Intelligent chatbot for data analytics
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <AIChatbot />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analytics Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Total EMI collected this quarter</li>
              <li>• Average loan amount by type</li>
              <li>• Top 10 borrowers</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Find user by email</li>
              <li>• Loans disbursed last week</li>
              <li>• All overdue EMI payments</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Monthly disbursement report</li>
              <li>• User growth statistics</li>
              <li>• Collection efficiency rate</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
