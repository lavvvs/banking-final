import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    console.log("=== UPDATE KYC DEBUG ===");
    console.log("Received body:", JSON.stringify(body, null, 2));

    const { userId, clerkId, hasProfile, status, email, fullName, phone } =
      body;

    if (!userId || !status) {
      console.log("Missing userId or status");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let profile = null;

    // If user already has a profile, find it by MongoDB _id
    if (hasProfile && mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Searching by MongoDB _id:", userId);
      profile = await Profile.findById(userId);
      console.log("Found by _id:", profile ? "YES" : "NO");
    }

    // If not found by _id, try to find by userId or clerkId
    if (!profile) {
      console.log("Searching by userId/clerkId...");
      profile = await Profile.findOne({
        $or: [
          { userId: userId },
          { userId: clerkId },
          { clerkId: userId },
          { clerkId: clerkId },
        ],
      });
      console.log("Found by userId/clerkId:", profile ? "YES" : "NO");
    }

    // If profile exists, just update it
    if (profile) {
      console.log("Updating existing profile:", profile._id);
      profile.kycStatus = status;
      await profile.save();

      return NextResponse.json({
        success: true,
        message: `KYC status updated to ${status}`,
      });
    }

    // If no profile exists, create a new one
    console.log("No profile found, creating new one");
    console.log("Email:", email);
    console.log("ClerkId:", clerkId);

    if (!email || !clerkId) {
      console.log("Missing email or clerkId for new profile");
      return NextResponse.json(
        { error: "Email and clerkId are required to create a profile" },
        { status: 400 }
      );
    }

    profile = new Profile({
      userId: clerkId,
      clerkId: clerkId,
      email: email,
      fullName: fullName || "Unknown User",
      phone: phone || "",
      kycStatus: status,
      isAdmin: false,
    });

    console.log("Saving new profile...");
    await profile.save();
    console.log("New profile saved successfully");

    return NextResponse.json({
      success: true,
      message: `Profile created with KYC status: ${status}`,
    });
  } catch (error: any) {
    console.error("=== ERROR in update-kyc ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A profile with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update KYC status: " + error.message },
      { status: 500 }
    );
  }
}
