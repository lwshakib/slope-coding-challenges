'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { authClient } from '@/lib/auth-client'
import { 
    LayoutDashboard, 
    Code2, 
    Trophy, 
    Settings, 
    Bell, 
    Search, 
    User,
    ChevronDown,
    Menu,
    X,
    Flame,
    LogOut
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
} from "@/components/ui/dropdown-menu"

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Problems', href: '/problemset', icon: Code2 },
    { name: 'Contests', href: '/contests', icon: Trophy },
]

export function AppHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const { data: session } = authClient.useSession()

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login")
                }
            }
        })
    }

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
                            <Button variant="ghost" className="h-10 px-2 rounded-xl border border-border/20 bg-muted/20 hover:bg-muted/40 transition-all">
                                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2 border border-primary/20">
                                    <User className="size-4 text-primary" />
                                </div>
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">
                                    {session?.user?.name?.split(' ')[0] || 'User'}
                                </span>
                                <ChevronDown className="ml-1 size-3 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40 bg-background/95 backdrop-blur-xl p-2 shadow-2xl">
                            <DropdownMenuLabel className="px-3 py-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">{session?.user?.name || 'User'}</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{session?.user?.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/40 mx-2" />
                            <DropdownMenuItem className="rounded-lg px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
                                <User className="size-4 mr-3" /> Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
                                <Settings className="size-4 mr-3" /> Settings
                            </DropdownMenuItem>
                             <DropdownMenuSeparator className="bg-border/40 mx-2" />
                            <DropdownMenuItem 
                                onClick={handleLogout}
                                className="rounded-lg px-3 py-2 cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
                            >
                                <LogOut className="size-4 mr-3" /> Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
