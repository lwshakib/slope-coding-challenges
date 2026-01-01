"use client";

import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Mail, GalleryVerticalEnd } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
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
                <div className="bg-card rounded-xl border p-8 shadow-sm text-center">
                    <div className="mx-auto block w-fit mb-4">
                        <LogoIcon />
                    </div>
                    <div className="mx-auto mb-4 mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h1 className="mb-2 text-xl font-bold">Check your email</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                      We've sent a password reset link to your email address.
                    </p>

                    <Button asChild className="w-full">
                      <Link href="/sign-in">Back to sign in</Link>
                    </Button>
                </div>
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block border-l">
            <img
            src="/forgot-password-visual.png"
            alt="Forgot Password Background"
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
                  const email = formData.get("email") as string;
        
                  if (!email) {
                    toast.error("Please enter your email");
                    setLoading(false);
                    return;
                  }
        
                  const { error } = await authClient.requestPasswordReset({
                    email,
                    redirectTo:
                      (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") +
                      "/reset-password",
                  });
        
                  if (error) {
                    toast.error(error.message || "Failed to send reset link");
                  } else {
                    setSubmitted(true);
                  }
                  setLoading(false);
                }}
                className="bg-card rounded-xl border p-8 shadow-sm"
              >
                <div className="text-center mb-6">
                    <div className="mx-auto block w-fit mb-4">
                        <LogoIcon />
                    </div>
                    <h1 className="text-2xl font-bold">Recover Password</h1>
                    <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        required
                        name="email"
                        id="email"
                        placeholder="name@example.com"
                    />
                    </div>

                    <Button className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                </div>

                <div className="mt-4 text-center text-sm">
                    Remembered your password?{" "}
                    <Link href="/sign-in" className="text-primary hover:underline font-medium">
                        Log in
                    </Link>
                </div>
              </form>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block border-l">
        <img
          src="/forgot-password-visual.png"
          alt="Forgot Password Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
        />
      </div>
    </div>
  );
}
