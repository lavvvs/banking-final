import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Loan } from "@/lib/models";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { loanId } = await req.json();

    if (!loanId) {
      return NextResponse.json(
        { error: "loanId is required" },
        { status: 400 }
      );
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      { status: "rejected" },
      { new: true }
    );

    if (!updatedLoan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Loan rejected", loan: updatedLoan },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Reject Loan Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
