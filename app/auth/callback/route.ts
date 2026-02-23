import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Profile } from "@/lib/models";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  await dbConnect();

  const { userId } = await auth();
  if (!userId) return redirect("/auth/login");

  // Get full user details from Clerk
  const user = await currentUser();
  if (!user) return redirect("/auth/login");

  // Check if profile exists
  let profile = await Profile.findOne({ clerkId: userId });

  if (!profile) {
    // Create new profile with Clerk data
    profile = await Profile.create({
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      fullName: user.fullName || "",
      phone: user.phoneNumbers[0]?.phoneNumber || "",
      kycStatus: "pending",
      isAdmin: false,
    });
    console.log("Created profile for:", user.emailAddresses[0]?.emailAddress);
  }

  return redirect("/dashboard");
}
