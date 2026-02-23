// api/profile/update/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";
import mongoose from "mongoose";

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { profileId, fullName, phone, address } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    const updated = await Profile.findByIdAndUpdate(
      new mongoose.Types.ObjectId(profileId),
      { fullName, phone, address },
      { new: true }
    ).lean();

    return NextResponse.json({ profile: updated }, { status: 200 });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
