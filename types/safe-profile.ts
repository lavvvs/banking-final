// types/safe-profile.ts
export interface SafeProfile {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  phone: string;
  kycStatus: "pending" | "approved" | "rejected";
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}
