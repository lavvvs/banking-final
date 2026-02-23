// lib/types/serialized.ts
// Use these types when passing data to Client Components

export type SerializedAccount = {
  id: string; // ObjectId converted to string
  userId: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
};

export type SerializedTransaction = {
  id: string; // ObjectId converted to string
  userId: string;
  accountId: {
    id: string;
    accountNumber: string | null;
    accountType: string | null;
  } | null;
  amount: number;
  type: string;
  status: string;
  description: string;
  referenceId: string;
  createdAt: string; // Date converted to ISO string
};

export type SerializedProfile = {
  id: string;
  clerkId: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  kycStatus: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SerializedLoan = {
  id: string;
  userId: string;
  loanType: string;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalPayable: number;
  amountPaid: number;
  remainingAmount?: number;
  status: string;
  approvedAt?: string;
  disbursedAt?: string;
  nextEmiDate?: string;
  createdAt: string;
  updatedAt: string;
};

// Helper function to serialize accounts
export function serializeAccount(doc: any): SerializedAccount {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    accountNumber: doc.accountNumber,
    accountType: doc.accountType || "savings",
    balance: doc.balance || 0,
    currency: doc.currency || "USD",
    status: doc.status || "active",
  };
}

// Helper function to serialize transactions
export function serializeTransaction(doc: any): SerializedTransaction {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    accountId: doc.accountId
      ? {
          id:
            typeof doc.accountId === "object"
              ? doc.accountId._id.toString()
              : doc.accountId.toString(),
          accountNumber:
            typeof doc.accountId === "object"
              ? doc.accountId.accountNumber
              : null,
          accountType:
            typeof doc.accountId === "object"
              ? doc.accountId.accountType
              : null,
        }
      : null,
    amount: doc.amount,
    type: doc.type,
    status: doc.status,
    description: doc.description || "",
    referenceId: doc.referenceId || "",
    createdAt: doc.createdAt.toISOString(),
  };
}

// Helper function to serialize profiles
export function serializeProfile(doc: any): SerializedProfile {
  return {
    id: doc._id.toString(),
    clerkId: doc.clerkId,
    email: doc.email,
    fullName: doc.fullName,
    phone: doc.phone,
    address: doc.address,
    kycStatus: doc.kycStatus || "pending",
    isAdmin: doc.isAdmin || false,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// Helper function to serialize loans
export function serializeLoan(doc: any): SerializedLoan {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    loanType: doc.loanType,
    amount: doc.amount,
    interestRate: doc.interestRate,
    tenureMonths: doc.tenureMonths,
    emiAmount: doc.emiAmount,
    totalPayable: doc.totalPayable,
    amountPaid: doc.amountPaid || 0,
    remainingAmount: doc.remainingAmount,
    status: doc.status || "pending",
    approvedAt: doc.approvedAt?.toISOString(),
    disbursedAt: doc.disbursedAt?.toISOString(),
    nextEmiDate: doc.nextEmiDate?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
