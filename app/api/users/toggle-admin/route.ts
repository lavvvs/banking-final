import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, clerkId, hasProfile, isAdmin, email, fullName, phone } =
      body;

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let profile;

    // If user already has a profile, find it by MongoDB _id
    if (hasProfile && mongoose.Types.ObjectId.isValid(userId)) {
      profile = await Profile.findById(userId);
    }

    // If not found by _id, try to find by userId or clerkId
    if (!profile) {
      profile = await Profile.findOne({
        $or: [
          { userId: userId },
          { userId: clerkId },
          { clerkId: userId },
          { clerkId: clerkId },
        ],
      });
    }

    // If profile exists, just update it
    if (profile) {
      profile.isAdmin = isAdmin;
      await profile.save();

      return NextResponse.json({
        success: true,
        message: `Admin status updated`,
      });
    }

    // If no profile exists, create a new one
    if (!email || !clerkId) {
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
      isAdmin: isAdmin,
      kycStatus: "pending",
    });

    await profile.save();

    return NextResponse.json({
      success: true,
      message: `Profile created with admin status: ${isAdmin}`,
    });
  } catch (error: any) {
    console.error("Error toggling admin:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A profile with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update admin status" },
      { status: 500 }
    );
  }
}
