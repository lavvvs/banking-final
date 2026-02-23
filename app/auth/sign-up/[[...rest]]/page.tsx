"use client";

import type { FC } from "react";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Building2 } from "lucide-react";

const SignUpPage: FC = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <Link href="/" className="relative mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">
          NexBank
        </span>
      </Link>

      <div className="relative w-full max-w-md border-0 shadow-2xl shadow-primary/5">
        {/* Clerk SignUp Component */}
        <SignUp path="/auth/sign-up" routing="path" signInUrl="/auth/login" />
      </div>
    </div>
  );
};

export default SignUpPage;
