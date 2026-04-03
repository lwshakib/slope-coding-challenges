'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Logo } from '@/components/logo'
import { 
    Bell, 
    Search, 
    User,
    Menu,
    X,
    Flame,
    Sun,
    Moon,
    Laptop,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"

const navItems = [
    { name: 'Profile', href: '/profile', icon: User },
]

export function AppHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const { setTheme } = useTheme()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
            <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
                
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2 shrink-0">
                        <Logo />
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all group",
                                        isActive 
                                            ? "text-primary bg-primary/5" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <Icon className={cn("size-4 transition-transform group-hover:scale-110", isActive && "fill-primary/20")} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Middle: Search (Hidden on small screens) */}
                <div className="hidden md:flex items-center flex-1 max-w-md relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search problems, users..." 
                        className="pl-10 h-10 bg-muted/30 border-border/20 focus-visible:ring-primary/20 transition-all rounded-xl"
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 h-5 flex items-center gap-1 px-1.5 rounded border border-border/40 bg-background text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden sm:flex items-center gap-1 mr-2 px-3 py-1.5 rounded-full bg-orange-500/5 border border-orange-500/10">
                        <Flame className="size-4 text-orange-500 fill-orange-500" />
                        <span className="text-xs font-black text-orange-500">12</span>
                    </div>

                    <Button variant="ghost" size="icon" className="size-10 rounded-xl relative hover:bg-muted">
                        <Bell className="size-5 text-muted-foreground" />
                        <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary border-2 border-background" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 rounded-xl border border-border/20 bg-muted/20 hover:bg-muted/40 transition-all">
                                <div className="relative size-5">
                                    <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute inset-0 size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border/40 bg-background/95 backdrop-blur-xl p-1">
                            <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg px-3 py-2 cursor-pointer">
                                <Sun className="size-4 mr-2" /> Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg px-3 py-2 cursor-pointer">
                                <Moon className="size-4 mr-2" /> Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg px-3 py-2 cursor-pointer">
                                <Laptop className="size-4 mr-2" /> System
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/profile">
                        <Button variant="ghost" className="h-10 px-2 rounded-xl border border-border/20 bg-muted/20 hover:bg-muted/40 transition-all">
                            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <User className="size-4 text-primary" />
                            </div>
                            <span className="hidden sm:inline ml-2 text-xs font-bold uppercase tracking-widest">Profile</span>
                        </Button>
                    </Link>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="lg:hidden size-10 rounded-xl border border-border/20 bg-muted/20"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Nav */}
            <div className={cn(
                "lg:hidden overflow-hidden transition-all duration-300 bg-background/95 backdrop-blur-xl border-b border-border/40",
                isMobileMenuOpen ? "max-h-96 py-4" : "max-h-0"
            )}>
                <div className="container px-4 space-y-2">
                    {navItems.map((item) => {
                         const Icon = item.icon
                         const isActive = pathname === item.href
                         return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                                    isActive 
                                        ? "text-primary bg-primary/5" 
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className="size-4" />
                                {item.name}
                            </Link>
                         )
                    })}
                </div>
            </div>
        </header>
    )
}
