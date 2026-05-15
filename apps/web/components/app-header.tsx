"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Logo } from "@/components/logo"
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
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
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
} from "@workspace/ui/components/dropdown-menu"

const navItems = [{ name: "Profile", href: "/profile", icon: User }]

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center space-x-2">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold tracking-widest uppercase transition-all",
                    isActive
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-transform group-hover:scale-110",
                      isActive && "fill-primary/20"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Middle: Search (Hidden on small screens) */}
        <div className="group relative hidden max-w-md flex-1 items-center md:flex">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search problems, users..."
            className="h-10 rounded-xl border-border/20 bg-muted/30 pl-10 transition-all focus-visible:ring-primary/20"
          />
          <kbd className="absolute top-1/2 right-3 flex h-5 -translate-y-1/2 items-center gap-1 rounded border border-border/40 bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="mr-2 hidden items-center gap-1 rounded-full border border-orange-500/10 bg-orange-500/5 px-3 py-1.5 sm:flex">
            <Flame className="size-4 fill-orange-500 text-orange-500" />
            <span className="text-xs font-black text-orange-500">12</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-xl hover:bg-muted"
          >
            <Bell className="size-5 text-muted-foreground" />
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full border-2 border-background bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl border border-border/20 bg-muted/20 transition-all hover:bg-muted/40"
              >
                <div className="relative size-5">
                  <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute inset-0 size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-border/40 bg-background/95 p-1 backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="cursor-pointer rounded-lg px-3 py-2"
              >
                <Sun className="mr-2 size-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="cursor-pointer rounded-lg px-3 py-2"
              >
                <Moon className="mr-2 size-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="cursor-pointer rounded-lg px-3 py-2"
              >
                <Laptop className="mr-2 size-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/profile">
            <Button
              variant="ghost"
              className="h-10 rounded-xl border border-border/20 bg-muted/20 px-2 transition-all hover:bg-muted/40"
            >
              <div className="flex size-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <User className="size-4 text-primary" />
              </div>
              <span className="ml-2 hidden text-xs font-bold tracking-widest uppercase sm:inline">
                Profile
              </span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl border border-border/20 bg-muted/20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "overflow-hidden border-b border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 lg:hidden",
          isMobileMenuOpen ? "max-h-96 py-4" : "max-h-0"
        )}
      >
        <div className="container space-y-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold tracking-widest uppercase transition-all",
                  isActive
                    ? "bg-primary/5 text-primary"
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
