// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { BankSetting, Profile } from "@/lib/models";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user is admin
    const profile = await Profile.findOne({
      $or: [{ userId: userId }, { clerkId: userId }],
    }).lean();

    if (!profile?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid settings data" },
        { status: 400 }
      );
    }

    // Update or create each setting
    const updatePromises = Object.entries(settings).map(
      async ([key, value]) => {
        return BankSetting.findOneAndUpdate(
          { settingKey: key },
          {
            settingKey: key,
            settingValue: value as string,
            updatedBy: userId,
          },
          { upsert: true, new: true }
        );
      }
    );

    await Promise.all(updatePromises);

    console.log(`✅ Settings updated by admin: ${userId}`);

    // Revalidate the settings page
    revalidatePath("/admin/settings");

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update settings",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user is admin
    const profile = await Profile.findOne({
      $or: [{ userId: userId }, { clerkId: userId }],
    }).lean();

    if (!profile?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const settings = await BankSetting.find({}).lean();

    return NextResponse.json({
      success: true,
      settings: settings.map((s) => ({
        id: s._id.toString(),
        settingKey: s.settingKey,
        settingValue: s.settingValue,
        description: s.description,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("❌ Error fetching settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch settings",
      },
      { status: 500 }
    );
  }
}
