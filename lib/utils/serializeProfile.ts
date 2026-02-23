// lib/serializeProfile.ts
import type { SafeProfile } from "@/types/safe-profile";

export function serializeProfile(profile: any): SafeProfile {
  return {
    id: profile._id?.toString() || "",
    clerkId: String(profile.clerkId || ""),
    email: String(profile.email || ""),
    fullName: String(profile.fullName || ""),
    phone: String(profile.phone || ""),
    kycStatus: (profile.kycStatus as SafeProfile["kycStatus"]) || "pending",
    isAdmin: !!profile.isAdmin,
    createdAt:
      (profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : profile.createdAt
        ? new Date(profile.createdAt).toISOString()
        : "") || "",
    updatedAt:
      (profile.updatedAt instanceof Date
        ? profile.updatedAt.toISOString()
        : profile.updatedAt
        ? new Date(profile.updatedAt).toISOString()
        : "") || "",
  };
}
