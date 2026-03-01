"use server";

import dbConnect from "@/lib/mongodb";
import { Account, Profile } from "@/lib/models";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export async function toggleAccountStatus(
  accountId: string,
  status: "active" | "inactive"
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      throw new Error(`Invalid account ID: ${accountId}`);
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Invalid status. Must be 'active' or 'inactive'");
    }

    await dbConnect();

    const userProfile = await Profile.findOne({ clerkId: userId });
    const isAdmin = userProfile?.isAdmin || false;

    const query = isAdmin
      ? { _id: new mongoose.Types.ObjectId(accountId) }
      : { _id: new mongoose.Types.ObjectId(accountId), userId };

    const account = await Account.findOne(query);

    if (!account) {
      throw new Error("Account not found");
    }

    account.status = status;
    await account.save();

    console.log("✅ Server Action: Account status updated:", {
      accountId,
      newStatus: status,
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      account: {
        _id: account._id.toString(),
        status: account.status
      } 
    };
  } catch (error: any) {
    console.error("❌ Account status action update error:", error);
    return { success: false, error: error.message || "Failed to update account status" };
  }
}
