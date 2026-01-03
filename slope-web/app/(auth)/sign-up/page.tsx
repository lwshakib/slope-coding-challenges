"use client";

import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GalleryVerticalEnd } from "lucide-react";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    await authClient.signUp.email(
      {
        email,
        password,
        name: `${firstName} ${lastName}`,
        callbackURL:
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/",
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          setLoading(false);
          router.push("/sign-in?verify=true");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
          setLoading(false);
        },
      }
    );
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: process.env.NEXT_PUBLIC_BASE_URL +"/problemset",
    });
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted relative hidden lg:block border-r">
        <img
          src="/sign-up-visual.png"
          alt="Sign Up Background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
        />
      </div>
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
             <div className="bg-card rounded-xl border p-8 shadow-sm">
                <div className="text-center mb-6">
                    <div className="mx-auto block w-fit mb-4">
                        <LogoIcon />
                    </div>
                    <h1 className="text-2xl font-bold">Create Account</h1>
                    <p className="text-sm text-muted-foreground">Join us to get started</p>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="firstname">First name</Label>
                        <Input
                        type="text"
                        required
                        name="firstname"
                        id="firstname"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastname">Last name</Label>
                        <Input
                        type="text"
                        required
                        name="lastname"
                        id="lastname"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        type="email"
                        required
                        name="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="pwd">Password</Label>
                    <Input
                        type="password"
                        required
                        name="pwd"
                        id="pwd"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>

                    <Button
                    className="w-full"
                    onClick={handleSignUp}
                    disabled={loading}
                    >
                    {loading ? "Creating Account..." : "Sign Up"}
                    </Button>
                </div>

                <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <hr className="border-dashed" />
                    <span className="text-muted-foreground text-xs uppercase">Or continue with</span>
                    <hr className="border-dashed" />
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 256 262"
                        className="mr-2"
                    >
                        <path
                        fill="#4285f4"
                        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                        ></path>
                        <path
                        fill="#34a853"
                        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                        ></path>
                        <path
                        fill="#fbbc05"
                        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                        ></path>
                        <path
                        fill="#eb4335"
                        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                        ></path>
                    </svg>
                    Continue with Google
                    </Button>
                </div>

                <div className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="text-primary hover:underline font-medium">
                        Log in
                    </Link>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
