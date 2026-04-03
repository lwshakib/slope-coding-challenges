"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function MainLayout({children}: {children: React.ReactNode}) {
    const pathname = usePathname();
    const isProblemPage = pathname?.startsWith("/problems/");

    return (
        <div className="min-h-screen w-full bg-zinc-50 dark:bg-black/95 flex flex-col">
            <main className={cn(
                "flex-1",
                "py-6"
            )}>
                {children}
            </main>
        </div>
    );
}
