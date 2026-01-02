"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppHeader } from "@/components/app-header";

export default function MainLayout({children}: {children: React.ReactNode}) {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/sign-in");
        }
    }, [isPending, session, router]);

    if (isPending) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen w-full bg-zinc-50 dark:bg-black/95">
            <AppHeader />
            <main className="py-12">
                {children}
            </main>
        </div>
    );
}
