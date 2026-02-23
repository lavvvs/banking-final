// app/api/accounts/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Account } from "@/lib/models";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { accountType, accountNumber, balance, currency, status } = body;

    if (!accountType || !accountNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const account = await Account.create({
      userId: user.id,
      accountType,
      accountNumber,
      balance,
      currency,
      status,
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (err: any) {
    console.error("Account creation error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
