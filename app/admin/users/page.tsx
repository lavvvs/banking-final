import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/emi-calculator";
import { UserActionsDropdown } from "@/components/admin/user-actions-dropdown";
import { Users, Shield, Clock, CheckCircle2 } from "lucide-react";
import { Profile, Account } from "@/lib/models";
import dbConnect from "@/lib/mongodb";
import { clerkClient } from "@clerk/nextjs/server";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminUsersPage(props: PageProps) {
  await dbConnect();

  const searchParams = await props.searchParams;
  const currentPage = parseInt(searchParams.page || "1");
  const itemsPerPage = 20;
  const skip = (currentPage - 1) * itemsPerPage;

  // Get all accounts (includes fake seeded users)
  const allAccounts = await Account.find({}).lean();
  const accountUserIds = [
    ...new Set(allAccounts.map((acc: any) => acc.userId)),
  ];

  // Fetch profiles for users who have them
  const profiles = await Profile.find({}).lean();
  const profilesMap = new Map(profiles.map((p: any) => [p.userId, p]));
  const profilesByClerkId = new Map(profiles.map((p: any) => [p.clerkId, p]));

  // Fetch loans to get userName and userEmail from seed data
  const Loan = (await import("@/lib/models")).Loan;
  const loans = await Loan.find({}).lean();
  const loanUsersMap = new Map();
  loans.forEach((loan: any) => {
    if (loan.userName && loan.userEmail && !loanUsersMap.has(loan.userId)) {
      loanUsersMap.set(loan.userId, {
        userName: loan.userName,
        userEmail: loan.userEmail,
      });
    }
  });

  // Fetch real Clerk users
  const client = await clerkClient();
  let clerkUsers: any[] = [];
  try {
    const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
    clerkUsers = clerkUsersResponse.data || [];
  } catch (error) {
    console.error("Failed to fetch Clerk users:", error);
  }

  // Get all unique user IDs
  const clerkUserIds = clerkUsers.map((u: any) => u.id);
  const profileUserIds = profiles.map((p: any) => p.userId);

  // Create a Set to ensure uniqueness
  const allUserIdsSet = new Set<string>();

  // Add Clerk users first (priority)
  clerkUserIds.forEach((id) => allUserIdsSet.add(id));

  // Add profile users (if not already in Clerk)
  profileUserIds.forEach((id) => allUserIdsSet.add(id));

  // Add account users (if not already added)
  accountUserIds.forEach((id) => allUserIdsSet.add(id));

  const allUserIds = Array.from(allUserIdsSet);

  // Build combined user list
  const allUsers = allUserIds.map((userId) => {
    const account = allAccounts.find((acc: any) => acc.userId === userId);
    const clerkUser = clerkUsers.find((u: any) => u.id === userId);

    // Find profile by BOTH userId and clerkId
    let profile = profilesMap.get(userId);
    if (!profile && clerkUser) {
      profile = profilesByClerkId.get(clerkUser.id);
    }

    const loanUser = loanUsersMap.get(userId);

    // Determine if this is a real Clerk user or fake seeded user
    const isRealUser = !!clerkUser;

    // For real Clerk users, get data from Clerk
    let fullName = "Unknown User";
    let email = "No email";

    if (isRealUser && clerkUser) {
      fullName =
        clerkUser.fullName ||
        clerkUser.firstName ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        "Unknown User";
      email = clerkUser.emailAddresses[0]?.emailAddress || "No email";
    } else if (profile) {
      // From profile if exists
      fullName = profile.fullName || userId;
      email = profile.email || "No email";
    } else if (loanUser) {
      // From loan data (seed script)
      fullName = loanUser.userName;
      email = loanUser.userEmail;
    } else {
      // Fallback
      fullName = userId;
      email = "No email";
    }

    // Get phone number - PRIORITIZE PROFILE OVER CLERK
    let phone = "-";
    if (profile?.phone && profile.phone !== "" && profile.phone !== "-") {
      phone = profile.phone;
    } else if (clerkUser?.phoneNumbers?.[0]?.phoneNumber) {
      phone = clerkUser.phoneNumbers[0].phoneNumber;
    }

    // Get KYC status from profile
    const kycStatus = profile?.kycStatus || "pending";

    // User is verified based on KYC status
    const isVerified = kycStatus === "approved";

    return {
      id:
        clerkUser?.id ||
        profile?._id?.toString() ||
        account?._id?.toString() ||
        userId,
      userId: userId,
      clerkId: clerkUser?.id || userId,
      profileId: profile?._id?.toString() || null,
      fullName: fullName,
      email: email,
      phone: phone,
      isVerified: isVerified,
      kycStatus: kycStatus,
      isAdmin: profile?.isAdmin || false,
      createdAt: new Date(
        profile?.createdAt ||
          clerkUser?.createdAt ||
          account?.createdAt ||
          Date.now()
      ).toISOString(),
      hasProfile: !!profile,
      isRealUser: isRealUser,
      imageUrl: clerkUser?.imageUrl || null,
    };
  });

  // Sort by creation date
  allUsers.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination
  const totalUsers = allUsers.length;
  const paginatedUsers = allUsers.slice(skip, skip + itemsPerPage);
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  // Count stats
  const verifiedUsers = allUsers.filter((u) => u.isVerified).length;
  const unverifiedUsers = allUsers.filter((u) => !u.isVerified).length;
  const adminUsers = allUsers.filter((u) => u.isAdmin).length;
  const realUsers = allUsers.filter((u) => u.isRealUser).length;

  const getVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1 whitespace-nowrap">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 whitespace-nowrap">
        <Clock className="h-3 w-3" />
        Unverified
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and profile verifications ({realUsers} real,{" "}
          {totalUsers - realUsers} test)
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-xl font-semibold text-primary truncate">
                  {totalUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Unverified</p>
                <p className="text-xl font-semibold text-yellow-600 truncate">
                  {unverifiedUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-xl font-semibold text-green-600 truncate">
                  {verifiedUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-xl font-semibold text-red-600 truncate">
                  {adminUsers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Users</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {skip + 1}-{Math.min(skip + itemsPerPage, totalUsers)} of{" "}
            {totalUsers}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Profile Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedUsers?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[200px]">
                          {user.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={user.fullName}
                              className="h-10 w-10 shrink-0 rounded-full"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {user.phone}
                      </td>
                      <td className="px-4 py-3">
                        {getVerificationBadge(user.isVerified)}
                      </td>
                      <td className="px-4 py-3">
                        {user.isRealUser ? (
                          <Badge
                            variant="default"
                            className="whitespace-nowrap bg-blue-500"
                          >
                            Real
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            Test
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.isAdmin ? (
                          <Badge
                            variant="destructive"
                            className="whitespace-nowrap"
                          >
                            Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            User
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(new Date(user.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <UserActionsDropdown
                          user={{
                            _id: user.profileId || user.clerkId,
                            userId: user.userId,
                            clerkId: user.clerkId,
                            hasProfile: user.hasProfile,
                            fullName: user.fullName,
                            email: user.email,
                            phone: user.phone,
                            isAdmin: user.isAdmin,
                            kycStatus: user.kycStatus,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <a href={`/admin/users?page=${currentPage - 1}`}>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                      Previous
                    </button>
                  </a>
                )}
                {currentPage < totalPages && (
                  <a href={`/admin/users?page=${currentPage + 1}`}>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                      Next
                    </button>
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
