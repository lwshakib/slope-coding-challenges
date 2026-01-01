"use client";

import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { GalleryVerticalEnd } from "lucide-react";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
            <div className="flex justify-center gap-2 md:justify-start">
             <Link href="/" className="flex items-center gap-2 font-medium">
                 <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                     <GalleryVerticalEnd className="size-4" />
                 </div>
                 Slope Challenges
             </Link>
            </div>
            <div className="flex flex-1 items-center justify-center">
                 <div className="w-full max-w-md text-center bg-card rounded-xl border p-8 shadow-sm">
                    <h1 className="text-xl font-bold mb-4">Invalid Reset Link</h1>
                    <p className="mb-6 text-muted-foreground">The reset link is missing or invalid.</p>
                    <Button asChild className="w-full">
                        <Link href="/forgot-password">Request a new link</Link>
                    </Button>
                 </div>
            </div>
        </div>
        <div className="bg-muted relative hidden lg:block border-l">
            <img
            src="/reset-password-visual.png"
            alt="Reset Password Background"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
            />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
             <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                 <GalleryVerticalEnd className="size-4" />
             </div>
             Slope Challenges
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
             <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  const formData = new FormData(e.currentTarget);
                  const password = formData.get("password") as string;
                  const confirmPassword = formData.get("confirmPassword") as string;
        
                  if (password !== confirmPassword) {
                    toast.error("Passwords do not match");
                    setLoading(false);
                    return;
                  }
        
                  const { error } = await authClient.resetPassword({
                    newPassword: password,
                    token: token,
                  });
        
                  if (error) {
                    toast.error(error.message || "Failed to reset password");
                  } else {
                    toast.success("Password reset successfully");
                    router.push("/sign-in");
                  }
                  setLoading(false);
                }}
                className="bg-card rounded-xl border p-8 shadow-sm"
              >
                <div className="text-center mb-6">
                    <div className="mx-auto block w-fit mb-4" >
                        <LogoIcon />
                    </div>
                    <h1 className="text-2xl font-bold">Reset Password</h1>
                    <p className="text-sm text-muted-foreground">Enter your new password below</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                        type="password"
                        required
                        name="password"
                        id="password"
                        placeholder="********"
                    />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        type="password"
                        required
                        name="confirmPassword"
                        id="confirmPassword"
                        placeholder="********"
                    />
                    </div>

                    <Button className="w-full" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                </div>
              </form>
          </div>
        </div>
      </div>
       <div className="bg-muted relative hidden lg:block border-l">
        <img
          src="/reset-password-visual.png"
          alt="Reset Password Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
        />
      </div>
    </div>
  );
}
