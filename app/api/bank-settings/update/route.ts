import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { BankSetting } from "@/lib/models";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  const session = await auth();
  const userId = session.userId;
  if (!userId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { values } = body;

  if (!values || typeof values !== "object")
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    await dbConnect();

    const updates = Object.entries(values).map(([key, value]) =>
      BankSetting.findOneAndUpdate(
        { setting_key: key },
        { setting_value: value, updated_by: userId, updated_at: new Date() }
      )
    );

    await Promise.all(updates);

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
