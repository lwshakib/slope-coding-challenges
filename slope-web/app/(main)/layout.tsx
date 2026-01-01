"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen w-full">
                {children}
        </div>
    );
}
