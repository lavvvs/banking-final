// app/api/recover-my-account/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import { Account, Transaction, Loan, EmiPayment } from "@/lib/models";

export async function POST() {
  try {
    await dbConnect();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    console.log("========================================");
    console.log("🔧 STARTING RECOVERY FOR USER:", userId);
    console.log("========================================");

    let accountsCreated = 0;
    let accountsFixed = 0;
    let transactionsLinked = 0;
    let loansLinked = 0;
    let emisLinked = 0;
    let totalBalance = 0;

    // === STEP 1: Get all user data ===
    const existingAccounts = await Account.find({ userId });
    const allTransactions = await Transaction.find({ userId });
    const allLoans = await Loan.find({ userId });
    const allEmis = await EmiPayment.find({ userId });

    console.log("📊 Current state:");
    console.log("  Accounts:", existingAccounts.length);
    console.log("  Transactions:", allTransactions.length);
    console.log("  Loans:", allLoans.length);
    console.log("  EMIs:", allEmis.length);

    // === STEP 2: Find accounts that belong to user but have wrong userId ===
    const accountIdsFromTransactions = [
      ...new Set(
        allTransactions
          .filter((t) => t.accountId)
          .map((t) => t.accountId.toString())
      ),
    ];

    if (accountIdsFromTransactions.length > 0) {
      const wrongOwnershipAccounts = await Account.find({
        _id: { $in: accountIdsFromTransactions },
        userId: { $ne: userId },
      });

      if (wrongOwnershipAccounts.length > 0) {
        console.log(
          `🔧 Found ${wrongOwnershipAccounts.length} accounts with wrong userId...`
        );
        const fixResult = await Account.updateMany(
          {
            _id: { $in: accountIdsFromTransactions },
            userId: { $ne: userId },
          },
          { userId }
        );
        accountsFixed = fixResult.modifiedCount;
        console.log(`✅ Fixed ${accountsFixed} account ownerships`);
      }
    }

    // Refresh accounts after fixing ownership
    const updatedAccounts = await Account.find({ userId });

    // === STEP 3: Create missing accounts based on transactions ===
    const hasTransactions = allTransactions.length > 0;
    let primaryAccount = updatedAccounts.find(
      (acc) => acc.accountType === "savings"
    );

    if (hasTransactions && !primaryAccount) {
      console.log("📝 Creating primary savings account...");
      primaryAccount = await Account.create({
        userId,
        accountNumber: `SAV${Date.now()}`,
        accountType: "savings",
        balance: 0, // Will calculate later
        currency: "USD",
        status: "active",
      });
      accountsCreated++;
      console.log(
        `✅ Created savings account: ${primaryAccount.accountNumber}`
      );
    }

    // === STEP 4: Link orphaned transactions to accounts ===
    const orphanedTransactions = await Transaction.find({
      userId,
      $or: [{ accountId: null }, { accountId: { $exists: false } }],
    });

    if (orphanedTransactions.length > 0 && primaryAccount) {
      console.log(
        `🔗 Linking ${orphanedTransactions.length} orphaned transactions...`
      );
      const txResult = await Transaction.updateMany(
        {
          userId,
          $or: [{ accountId: null }, { accountId: { $exists: false } }],
        },
        { accountId: primaryAccount._id }
      );
      transactionsLinked = txResult.modifiedCount;
      console.log(`✅ Linked ${transactionsLinked} transactions`);
    }

    // === STEP 5: Fix loans WITHOUT disbursement accounts ===
    const loansNeedingAccounts = await Loan.find({
      userId,
      $or: [
        { disbursementAccountId: null },
        { disbursementAccountId: { $exists: false } },
      ],
    });

    if (loansNeedingAccounts.length > 0 && primaryAccount) {
      console.log(
        `🔗 Linking ${loansNeedingAccounts.length} loans to account...`
      );

      for (const loan of loansNeedingAccounts) {
        await Loan.updateOne(
          { _id: loan._id },
          { disbursementAccountId: primaryAccount._id }
        );
        loansLinked++;
      }

      console.log(`✅ Linked ${loansLinked} loans to account`);
    }

    // === STEP 6: Check EMI-Transaction links (but don't count as orphaned) ===
    const emisNeedingTransactionLink = await EmiPayment.find({
      userId,
      status: "paid",
      $or: [{ transactionId: null }, { transactionId: { $exists: false } }],
    });

    if (emisNeedingTransactionLink.length > 0) {
      console.log(
        `🔗 Found ${emisNeedingTransactionLink.length} paid EMIs without transaction links...`
      );

      for (const emi of emisNeedingTransactionLink) {
        // Try to find matching transaction with more flexible criteria
        const matchingTx = await Transaction.findOne({
          userId,
          type: { $in: ["emi_payment", "debit", "EMI Payment"] },
          amount: { $gte: emi.amount - 1, $lte: emi.amount + 1 }, // Allow ±1 variance
          createdAt: {
            $gte: new Date(
              new Date(emi.paidDate || emi.dueDate).getTime() -
                7 * 24 * 60 * 60 * 1000 // 7 days before
            ),
            $lte: new Date(
              new Date(emi.paidDate || emi.dueDate).getTime() +
                1 * 24 * 60 * 60 * 1000 // 1 day after
            ),
          },
        });

        if (matchingTx) {
          await EmiPayment.updateOne(
            { _id: emi._id },
            { transactionId: matchingTx._id }
          );
          emisLinked++;
        }
      }

      if (emisLinked > 0) {
        console.log(`✅ Linked ${emisLinked} EMIs to transactions`);
      }
    }

    // === STEP 7: Calculate accurate balance from ALL transactions ===
    const finalTransactions = await Transaction.find({ userId });

    finalTransactions.forEach((t) => {
      if (["deposit", "transfer_in", "loan_disbursement"].includes(t.type)) {
        totalBalance += Number(t.amount);
      } else if (
        [
          "withdrawal",
          "transfer_out",
          "emi_payment",
          "debit",
          "EMI Payment",
        ].includes(t.type)
      ) {
        totalBalance -= Math.abs(Number(t.amount));
      }
    });

    console.log(`💰 Calculated balance: $${totalBalance.toFixed(2)}`);

    // === STEP 8: Update account balance ===
    if (primaryAccount) {
      await Account.updateOne(
        { _id: primaryAccount._id },
        { balance: totalBalance }
      );
      console.log(`✅ Updated account balance`);
    }

    // === STEP 9: Remove any incorrectly created "loan" type accounts ===
    const loanTypeAccounts = await Account.find({
      userId,
      accountType: "loan",
    });

    if (loanTypeAccounts.length > 0) {
      console.log(
        `🗑️ Removing ${loanTypeAccounts.length} incorrect loan accounts...`
      );
      await Account.deleteMany({
        userId,
        accountType: "loan",
      });
      console.log(`✅ Cleaned up loan accounts`);
    }

    console.log("========================================");
    console.log("✅ RECOVERY COMPLETE");
    console.log("========================================");

    return NextResponse.json({
      success: true,
      message: "All data recovered successfully!",
      accountsCreated,
      accountsFixed,
      transactionsLinked,
      loansLinked,
      emisLinked,
      totalBalance: Number(totalBalance.toFixed(2)),
      details: {
        totalAccounts: await Account.countDocuments({ userId }),
        totalTransactions: finalTransactions.length,
        totalLoans: allLoans.length,
        totalEmis: allEmis.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Recovery error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Recovery failed",
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
