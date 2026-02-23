// scripts/seed-loan-transactions.js
// Run with: node scripts/seed-loan-transactions.js

require("dotenv").config({ path: ".env" });
const { MongoClient, ObjectId } = require("mongodb");

// Fake user data (matching Clerk user IDs format) - 60 users
const FAKE_USERS = [
  {
    userId: "user_2aBC123XYZ456def",
    name: "John Smith",
    email: "john.smith@example.com",
  },
  {
    userId: "user_3dEF789GHI012jkl",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
  },
  {
    userId: "user_4mNO345PQR678stu",
    name: "Michael Chen",
    email: "m.chen@example.com",
  },
  {
    userId: "user_5vWX901YZA234bcd",
    name: "Emily Davis",
    email: "emily.davis@example.com",
  },
  {
    userId: "user_6eFG567HIJ890klm",
    name: "David Wilson",
    email: "d.wilson@example.com",
  },
  {
    userId: "user_7nOP123QRS456tuv",
    name: "Lisa Anderson",
    email: "lisa.a@example.com",
  },
  {
    userId: "user_8wXY789ZAB012cde",
    name: "James Taylor",
    email: "j.taylor@example.com",
  },
  {
    userId: "user_9fGH345IJK678lmn",
    name: "Maria Garcia",
    email: "maria.g@example.com",
  },
  {
    userId: "user_0oPQ901RST234uvw",
    name: "Robert Brown",
    email: "r.brown@example.com",
  },
  {
    userId: "user_1xYZ567ABC890def",
    name: "Jennifer Lee",
    email: "jennifer.lee@example.com",
  },
  {
    userId: "user_2bCD891EFG234hij",
    name: "Christopher Martinez",
    email: "c.martinez@example.com",
  },
  {
    userId: "user_3kLM456NOP789qrs",
    name: "Amanda White",
    email: "amanda.w@example.com",
  },
  {
    userId: "user_4tUV012QRS345wxy",
    name: "Daniel Rodriguez",
    email: "d.rodriguez@example.com",
  },
  {
    userId: "user_5zAB678CDE901fgh",
    name: "Michelle Thomas",
    email: "michelle.t@example.com",
  },
  {
    userId: "user_6iJK234LMN567opq",
    name: "Kevin Jackson",
    email: "k.jackson@example.com",
  },
  {
    userId: "user_7rST890UVW123xyz",
    name: "Jessica Harris",
    email: "jessica.h@example.com",
  },
  {
    userId: "user_8aBC456DEF789ghi",
    name: "Brian Clark",
    email: "b.clark@example.com",
  },
  {
    userId: "user_9jKL012MNO345pqr",
    name: "Nicole Lewis",
    email: "nicole.l@example.com",
  },
  {
    userId: "user_0sTV678WXY901abc",
    name: "Ryan Robinson",
    email: "r.robinson@example.com",
  },
  {
    userId: "user_1dEF234GHI567jkl",
    name: "Laura Walker",
    email: "laura.w@example.com",
  },
  {
    userId: "user_2mNO890PQR123stu",
    name: "Steven Hall",
    email: "s.hall@example.com",
  },
  {
    userId: "user_3vWX456YZA789bcd",
    name: "Angela Allen",
    email: "angela.a@example.com",
  },
  {
    userId: "user_4eFG012HIJ345klm",
    name: "Jason Young",
    email: "j.young@example.com",
  },
  {
    userId: "user_5nOP678QRS901tuv",
    name: "Stephanie King",
    email: "stephanie.k@example.com",
  },
  {
    userId: "user_6wXY234ZAB567cde",
    name: "Matthew Wright",
    email: "m.wright@example.com",
  },
  {
    userId: "user_7fGH890IJK123lmn",
    name: "Rebecca Scott",
    email: "rebecca.s@example.com",
  },
  {
    userId: "user_8oPQ456RST789uvw",
    name: "Andrew Green",
    email: "a.green@example.com",
  },
  {
    userId: "user_9xYZ012ABC345def",
    name: "Melissa Baker",
    email: "melissa.b@example.com",
  },
  {
    userId: "user_0gHI678JKL901mno",
    name: "Joshua Adams",
    email: "j.adams@example.com",
  },
  {
    userId: "user_1pQR234STU567vwx",
    name: "Kimberly Nelson",
    email: "kimberly.n@example.com",
  },
  {
    userId: "user_2yZA890BCD123efg",
    name: "Brandon Carter",
    email: "b.carter@example.com",
  },
  {
    userId: "user_3hIJ456KLM789nop",
    name: "Amy Mitchell",
    email: "amy.m@example.com",
  },
  {
    userId: "user_4qRS012TUV345wxy",
    name: "Jacob Perez",
    email: "jacob.p@example.com",
  },
  {
    userId: "user_5zBC678DEF901ghi",
    name: "Rachel Roberts",
    email: "rachel.r@example.com",
  },
  {
    userId: "user_6jKL234MNO567pqr",
    name: "Tyler Turner",
    email: "tyler.t@example.com",
  },
  {
    userId: "user_7sTU890VWX123yza",
    name: "Samantha Phillips",
    email: "samantha.p@example.com",
  },
  {
    userId: "user_8bCD456EFG789hij",
    name: "Eric Campbell",
    email: "eric.c@example.com",
  },
  {
    userId: "user_9kLM012NOP345qrs",
    name: "Christina Parker",
    email: "christina.p@example.com",
  },
  {
    userId: "user_0tUV678WXY901abc",
    name: "Justin Evans",
    email: "justin.e@example.com",
  },
  {
    userId: "user_1eGH234IJK567lmn",
    name: "Heather Edwards",
    email: "heather.e@example.com",
  },
  {
    userId: "user_2nOP890QRS123tuv",
    name: "Aaron Collins",
    email: "aaron.c@example.com",
  },
  {
    userId: "user_3wXY456ZAB789cde",
    name: "Megan Stewart",
    email: "megan.s@example.com",
  },
  {
    userId: "user_4fGH012IJK345lmn",
    name: "Nathan Sanchez",
    email: "nathan.s@example.com",
  },
  {
    userId: "user_5oPQ678RST901uvw",
    name: "Katherine Morris",
    email: "katherine.m@example.com",
  },
  {
    userId: "user_6xYZ234ABC567def",
    name: "Zachary Rogers",
    email: "zachary.r@example.com",
  },
  {
    userId: "user_7gHI890JKL123mno",
    name: "Donna Reed",
    email: "donna.r@example.com",
  },
  {
    userId: "user_8pQR456STU789vwx",
    name: "Gregory Cook",
    email: "gregory.c@example.com",
  },
  {
    userId: "user_9yZA012BCD345efg",
    name: "Christine Morgan",
    email: "christine.m@example.com",
  },
  {
    userId: "user_0hIJ678KLM901nop",
    name: "Patrick Bell",
    email: "patrick.b@example.com",
  },
  {
    userId: "user_1qRS234TUV567wxy",
    name: "Victoria Murphy",
    email: "victoria.m@example.com",
  },
  {
    userId: "user_2zAB890CDE123fgh",
    name: "Bryan Bailey",
    email: "bryan.b@example.com",
  },
  {
    userId: "user_3iJK456LMN789opq",
    name: "Deborah Rivera",
    email: "deborah.r@example.com",
  },
  {
    userId: "user_4rST012UVW345xyz",
    name: "Marcus Cooper",
    email: "marcus.c@example.com",
  },
  {
    userId: "user_5aBC678DEF901ghi",
    name: "Janet Richardson",
    email: "janet.r@example.com",
  },
  {
    userId: "user_6jKL234MNO567pqr",
    name: "Scott Cox",
    email: "scott.c@example.com",
  },
  {
    userId: "user_7sTU890VWX123yza",
    name: "Carolyn Howard",
    email: "carolyn.h@example.com",
  },
  {
    userId: "user_8bCD456EFG789hij",
    name: "Dennis Ward",
    email: "dennis.w@example.com",
  },
  {
    userId: "user_9kLM012NOP345qrs",
    name: "Sharon Torres",
    email: "sharon.t@example.com",
  },
  {
    userId: "user_0tUV678WXY901abc",
    name: "Jerry Peterson",
    email: "jerry.p@example.com",
  },
  {
    userId: "user_1eGH234IJK567lmn",
    name: "Cynthia Gray",
    email: "cynthia.g@example.com",
  },
];

// Loan types and their typical amounts
const LOAN_TYPES = [
  { type: "personal", minAmount: 5000, maxAmount: 50000, rate: 12 },
  { type: "home", minAmount: 100000, maxAmount: 500000, rate: 8 },
  { type: "auto", minAmount: 15000, maxAmount: 75000, rate: 10 },
  { type: "business", minAmount: 50000, maxAmount: 300000, rate: 14 },
  { type: "education", minAmount: 10000, maxAmount: 100000, rate: 9 },
];

// Loan statuses with distribution
const LOAN_STATUSES = [
  "pending",
  "approved",
  "active",
  "rejected",
  "completed",
];

// Helper functions
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generateAccountNumber() {
  return `ACC${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

function calculateEMI(principal, annualRate, months) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / months;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi * 100) / 100;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedRandomStatus() {
  const rand = Math.random();
  // 10% pending, 15% rejected, 50% active, 20% approved (not disbursed yet), 5% completed
  if (rand < 0.1) return "pending";
  if (rand < 0.25) return "rejected";
  if (rand < 0.75) return "active";
  if (rand < 0.95) return "approved";
  return "completed";
}

async function seedDatabase() {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    console.error("❌ DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  console.log("🔗 Connecting to MongoDB...");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("BANKING");

    // Collections
    const accountsCol = db.collection("accounts");
    const loansCol = db.collection("loans");
    const transactionsCol = db.collection("transactions");
    const emiPaymentsCol = db.collection("emipayments");
    const usersCol = db.collection("users");

    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      transactionsCol.deleteMany({
        type: { $in: ["loan_disbursement", "emi_payment"] },
      }),
      emiPaymentsCol.deleteMany({}),
      loansCol.deleteMany({}),
      accountsCol.deleteMany({}),
      usersCol.deleteMany({}),
    ]);

    console.log("👥 Creating user profiles...");
    const userProfiles = FAKE_USERS.map((user) => ({
      _id: new ObjectId(),
      userId: user.userId,
      name: user.name,
      email: user.email,
      createdAt: randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1)),
      updatedAt: new Date(),
    }));

    await usersCol.insertMany(userProfiles);
    console.log(`✅ Created ${userProfiles.length} user profiles`);

    console.log("🏦 Creating accounts for users...");
    const accounts = [];

    for (const user of FAKE_USERS) {
      const account = {
        _id: new ObjectId(),
        userId: user.userId,
        accountNumber: generateAccountNumber(),
        accountType: randomChoice(["savings", "checking"]),
        balance: randomInt(5000, 50000),
        currency: "USD",
        status: "active",
        createdAt: randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1)),
        updatedAt: new Date(),
      };
      accounts.push(account);
    }

    await accountsCol.insertMany(accounts);
    console.log(`✅ Created ${accounts.length} accounts`);

    console.log("💰 Creating loans with various statuses...");

    const loans = [];
    const transactions = [];
    const emiPayments = [];
    let totalDisbursed = 0;
    let totalRepaid = 0;

    const statusCounts = {
      pending: 0,
      approved: 0,
      active: 0,
      rejected: 0,
      completed: 0,
    };

    // Create 150-200 loans with varied statuses
    const numLoans = randomInt(150, 200);

    for (let i = 0; i < numLoans; i++) {
      const user = randomChoice(FAKE_USERS);
      const account = accounts.find((a) => a.userId === user.userId);
      const loanConfig = randomChoice(LOAN_TYPES);
      const loanStatus = weightedRandomStatus();

      const amount = randomInt(loanConfig.minAmount, loanConfig.maxAmount);
      const tenureMonths = randomChoice([6, 12, 18, 24, 36, 48, 60]); // Varied tenure periods
      const emiAmount = calculateEMI(amount, loanConfig.rate, tenureMonths);
      const totalPayable = emiAmount * tenureMonths;

      // Loan created date
      const loanCreatedDate = randomDate(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      const loanId = new ObjectId();

      // Base loan object
      const loan = {
        _id: loanId,
        userId: user.userId,
        userName: user.name, // Add user name to loan
        userEmail: user.email, // Add user email to loan
        loanType: loanConfig.type,
        amount: amount,
        interestRate: loanConfig.rate,
        tenureMonths: tenureMonths,
        emiAmount: emiAmount,
        totalPayable: totalPayable,
        amountPaid: 0,
        remainingAmount: totalPayable,
        status: loanStatus,
        disbursementAccountId: account._id,
        createdAt: loanCreatedDate,
        updatedAt: new Date(),
      };

      statusCounts[loanStatus]++;

      // Handle different statuses
      if (loanStatus === "pending") {
        // Pending loans: just submitted, no approval yet
        loan.approvedAt = null;
        loan.disbursedAt = null;
        loan.nextEmiDate = null;
      } else if (loanStatus === "rejected") {
        // Rejected loans: reviewed but denied
        loan.approvedAt = null;
        loan.disbursedAt = null;
        loan.nextEmiDate = null;
        loan.rejectedAt = new Date(
          loanCreatedDate.getTime() + randomInt(1, 5) * 24 * 60 * 60 * 1000
        );
        loan.rejectionReason = randomChoice([
          "Insufficient credit score",
          "Income verification failed",
          "High debt-to-income ratio",
          "Incomplete documentation",
          "Employment verification failed",
        ]);
      } else if (loanStatus === "approved") {
        // Approved but not yet disbursed
        loan.approvedAt = new Date(
          loanCreatedDate.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000
        );
        loan.disbursedAt = null;
        loan.nextEmiDate = null;
      } else if (loanStatus === "active" || loanStatus === "completed") {
        // Active or completed loans: fully processed
        const approvalDate = new Date(
          loanCreatedDate.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000
        );
        const disbursementDate = new Date(
          approvalDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000
        );

        loan.approvedAt = approvalDate;
        loan.disbursedAt = disbursementDate;

        // Create disbursement transaction
        const disbursementTx = {
          _id: new ObjectId(),
          userId: user.userId,
          accountId: account._id,
          amount: amount,
          type: "loan_disbursement",
          status: "completed",
          description: `Loan disbursement - ${loanConfig.type} loan`,
          createdAt: disbursementDate,
        };

        transactions.push(disbursementTx);
        totalDisbursed += amount;

        // Calculate EMI payments
        const monthsSinceDisbursement = Math.floor(
          (Date.now() - disbursementDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
        );

        let emisPaid;
        if (loanStatus === "completed") {
          emisPaid = tenureMonths; // All EMIs paid
        } else {
          emisPaid = Math.min(
            randomInt(1, monthsSinceDisbursement),
            tenureMonths
          );
        }

        let totalPaid = 0;

        // Create EMI schedule
        for (let emiNum = 1; emiNum <= tenureMonths; emiNum++) {
          const dueDate = new Date(disbursementDate);
          dueDate.setMonth(dueDate.getMonth() + emiNum);

          const isPaid = emiNum <= emisPaid;
          const paidDate = isPaid
            ? new Date(
                dueDate.getTime() - randomInt(0, 5) * 24 * 60 * 60 * 1000
              )
            : null;

          const principalAmount = amount / tenureMonths;
          const interestAmount = emiAmount - principalAmount;

          const emiPayment = {
            _id: new ObjectId(),
            loanId: loanId,
            userId: user.userId,
            emiNumber: emiNum,
            amount: emiAmount,
            principalAmount: Math.round(principalAmount * 100) / 100,
            interestAmount: Math.round(interestAmount * 100) / 100,
            dueDate: dueDate,
            paidDate: paidDate,
            status: isPaid ? "paid" : "pending",
            transactionId: isPaid ? new ObjectId() : null,
            createdAt: disbursementDate,
          };

          emiPayments.push(emiPayment);

          // Create EMI payment transaction
          if (isPaid) {
            const emiTx = {
              _id: emiPayment.transactionId,
              userId: user.userId,
              accountId: account._id,
              amount: emiAmount,
              type: "emi_payment",
              status: "completed",
              description: `EMI #${emiNum} payment for ${loanConfig.type} loan`,
              createdAt: paidDate,
            };

            transactions.push(emiTx);
            totalPaid += emiAmount;
            totalRepaid += emiAmount;
          }
        }

        // Update loan with payment info
        loan.amountPaid = totalPaid;
        loan.remainingAmount = totalPayable - totalPaid;
        loan.status = totalPaid >= totalPayable ? "completed" : "active";

        // Set next EMI date for active loans
        if (loan.status === "active") {
          const nextPendingEmi = emiPayments
            .filter((e) => e.loanId.equals(loanId) && e.status === "pending")
            .sort((a, b) => a.emiNumber - b.emiNumber)[0];

          if (nextPendingEmi) {
            loan.nextEmiDate = nextPendingEmi.dueDate;
          }
        } else {
          loan.nextEmiDate = null;
        }
      }

      loans.push(loan);
    }

    // Insert all data
    console.log("💾 Inserting loans...");
    await loansCol.insertMany(loans);
    console.log(`✅ Created ${loans.length} loans`);

    if (transactions.length > 0) {
      console.log("💾 Inserting transactions...");
      await transactionsCol.insertMany(transactions);
      console.log(`✅ Created ${transactions.length} transactions`);
    }

    if (emiPayments.length > 0) {
      console.log("💾 Inserting EMI payments...");
      await emiPaymentsCol.insertMany(emiPayments);
      console.log(`✅ Created ${emiPayments.length} EMI payment records`);
    }

    // Summary
    console.log("\n📊 SEEDING SUMMARY");
    console.log("==================");
    console.log(`👥 Users: ${FAKE_USERS.length}`);
    console.log(`👤 User Profiles: ${userProfiles.length}`);
    console.log(`🏦 Accounts: ${accounts.length}`);
    console.log(`💰 Total Loans: ${loans.length}`);
    console.log(`\n📋 Loan Status Breakdown:`);
    console.log(`   ⏳ Pending: ${statusCounts.pending}`);
    console.log(`   ✅ Approved: ${statusCounts.approved}`);
    console.log(`   💵 Active: ${statusCounts.active}`);
    console.log(`   ❌ Rejected: ${statusCounts.rejected}`);
    console.log(`   ✔️  Completed: ${statusCounts.completed}`);
    console.log(`\n📝 Transactions: ${transactions.length}`);
    console.log(`📅 EMI Payments: ${emiPayments.length}`);
    console.log(`\n💵 Financial Summary:`);
    console.log(`   Total Disbursed: $${totalDisbursed.toLocaleString()}`);
    console.log(`   Total Repaid: $${totalRepaid.toLocaleString()}`);
    console.log(
      `   Outstanding: $${(totalDisbursed - totalRepaid).toLocaleString()}`
    );
    console.log(`\n🎉 Database seeding completed successfully!`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("👋 Disconnected from MongoDB");
  }
}

seedDatabase();
