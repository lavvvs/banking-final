// lib/models.ts
import mongoose, { Schema, Document } from "mongoose";

const { ObjectId } = Schema.Types;

// =======================
// 1️⃣ Profile
// =======================
export interface IProfile extends Document {
  clerkId: string; // Changed: Add clerkId as the primary identifier
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  kycStatus: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    clerkId: { type: String, unique: true, required: true }, // Changed: Use Clerk ID
    email: { type: String, unique: true, required: true },
    fullName: String,
    phone: String,
    address: String,
    kycStatus: { type: String, default: "pending" },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// =======================
// 2️⃣ Account
// =======================
export interface IAccount extends Document {
  userId: string; // Changed: String instead of ObjectId
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: String, required: true }, // Changed: String for Clerk ID
    accountNumber: { type: String, unique: true, required: true },
    accountType: String,
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

// =======================
// 3️⃣ Transaction
// =======================
export interface ITransaction extends Document {
  userId: string; // Changed: String instead of ObjectId
  accountId: mongoose.Types.ObjectId;
  amount: number;
  type: string;
  status: string;
  description?: string;
  referenceId?: string;
  recipientAccountId?: mongoose.Types.ObjectId;
  recipientUserId?: string; // Changed: String instead of ObjectId
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true }, // Changed: String for Clerk ID
    accountId: { type: ObjectId, ref: "Account", required: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    status: { type: String, default: "completed" },
    description: String,
    referenceId: String,
    recipientAccountId: { type: ObjectId, ref: "Account" },
    recipientUserId: { type: String }, // Changed: String for Clerk ID
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// =======================
// 4️⃣ Loan
// =======================
export interface ILoan extends Document {
  userId: string; // Changed: String instead of ObjectId
  loanType: string;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalPayable: number;
  amountPaid: number;
  remainingAmount?: number;
  status: string;
  disbursementAccountId?: mongoose.Types.ObjectId;
  approvedBy?: string; // Changed: String instead of ObjectId
  approvedAt?: Date;
  disbursedAt?: Date;
  nextEmiDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    userId: { type: String, required: true }, // Changed: String for Clerk ID
    loanType: String,
    amount: Number,
    interestRate: Number,
    tenureMonths: Number,
    emiAmount: Number,
    totalPayable: Number,
    amountPaid: { type: Number, default: 0 },
    remainingAmount: Number,
    status: { type: String, default: "pending" },
    disbursementAccountId: { type: ObjectId, ref: "Account" },
    approvedBy: { type: String }, // Changed: String for Clerk ID
    approvedAt: Date,
    disbursedAt: Date,
    nextEmiDate: Date,
  },
  { timestamps: true }
);

// =======================
// 5️⃣ EmiPayment
// =======================
export interface IEmiPayment extends Document {
  loanId: mongoose.Types.ObjectId;
  userId: string; // Changed: String instead of ObjectId
  emiNumber: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: string;
  stripePaymentId?: string;
  transactionId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const EmiPaymentSchema = new Schema<IEmiPayment>(
  {
    loanId: { type: ObjectId, ref: "Loan", required: true },
    userId: { type: String, required: true, index: true }, // Changed: String for Clerk ID
    emiNumber: Number,
    amount: Number,
    principalAmount: Number,
    interestAmount: Number,
    dueDate: Date,
    paidDate: Date,
    status: { type: String, default: "pending" },
    stripePaymentId: String,
    transactionId: { type: ObjectId, ref: "Transaction" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// =======================
// 6️⃣ BankSetting
// =======================
export interface IBankSetting extends Document {
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedBy?: string; // Changed: String instead of ObjectId
  updatedAt: Date;
}

const BankSettingSchema = new Schema<IBankSetting>(
  {
    settingKey: { type: String, unique: true },
    settingValue: String,
    description: String,
    updatedBy: { type: String }, // Changed: String for Clerk ID
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

// =======================
// Export all models
// =======================
export const Profile =
  mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
export const Account =
  mongoose.models.Account || mongoose.model("Account", AccountSchema);
export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
export const Loan = mongoose.models.Loan || mongoose.model("Loan", LoanSchema);
export const EmiPayment =
  mongoose.models.EmiPayment || mongoose.model("EmiPayment", EmiPaymentSchema);
export const BankSetting =
  mongoose.models.BankSetting ||
  mongoose.model("BankSetting", BankSettingSchema);

// lib/models.ts (add this to your existing models file)

const bankSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bankName: {
      type: String,
      default: "Your Bank",
    },
    transactionLimits: {
      daily: {
        type: Number,
        default: 10000,
      },
      perTransaction: {
        type: Number,
        default: 5000,
      },
    },
    interestRates: {
      savings: {
        type: Number,
        default: 3.5,
      },
      checking: {
        type: Number,
        default: 0.5,
      },
    },
    fees: {
      monthlyMaintenance: {
        type: Number,
        default: 0,
      },
      overdraft: {
        type: Number,
        default: 35,
      },
      atmWithdrawal: {
        type: Number,
        default: 2.5,
      },
    },
  },
  { timestamps: true }
);

export const BankSettings =
  mongoose.models.BankSettings ||
  mongoose.model("BankSettings", bankSettingsSchema);
