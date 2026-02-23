// app/api/admin/fix-loan-status/route.ts
// Create this file to fix existing loans with "disbursed" status

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Loan, Profile } from "@/lib/models";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check admin status
    const profile = await Profile.findOne({
      $or: [{ userId }, { clerkId: userId }],
    }).lean();

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find all loans with "disbursed" status
    const disbursedLoans = await Loan.find({ status: "disbursed" });

    console.log(`Found ${disbursedLoans.length} loans with "disbursed" status`);

    // Update them to "active"
    const result = await Loan.updateMany(
      { status: "disbursed" },
      { status: "active" }
    );

    console.log(`Updated ${result.modifiedCount} loans to "active" status`);

    return NextResponse.json({
      success: true,
      message: `Fixed ${result.modifiedCount} loans`,
      loansFixed: result.modifiedCount,
      loansFound: disbursedLoans.length,
      loanIds: disbursedLoans.map((l) => l._id.toString()),
    });
  } catch (error: any) {
    console.error("Fix loan status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fix loan status" },
      { status: 500 }
    );
  }
}
