"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "next-themes"
import { Input } from "@workspace/ui/components/input"
import {
  Moon,
  Sun,
  ArrowDownLeft,
  MessageCircle,
  Globe,
  User,
  Code2,
} from "lucide-react"
import { Logo } from "./logo"

const data = () => ({
  navigation: {
    platform: [
      { name: "Problemset", href: "/problemset" },
      { name: "Contests", href: "/contests" },
      { name: "Leaderboard", href: "/leaderboard" },
      { name: "Pricing", href: "#pricing" },
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Brand Assets", href: "#" },
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "Community Discord", href: "#" },
      { name: "Service Status", href: "#" },
      { name: "Help Center", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  },
  socialLinks: [
    { icon: Globe, label: "Twitter", href: "https://twitter.com" },
    { icon: Code2, label: "GitHub", href: "https://github.com" },
    { icon: MessageCircle, label: "Discord", href: "#" },
    { icon: User, label: "LinkedIn", href: "#" },
  ],
  bottomLinks: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
  ],
})

export default function FooterSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentYear = new Date().getFullYear()

  if (!mounted) return null

  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="relative w-full px-5 py-16">
        {/* Top Section */}
        <div className="container m-auto grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="space-y-8 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo />
            </Link>
            <p className="max-w-sm leading-relaxed font-medium text-muted-foreground italic">
              The premier platform for technical interview preparation. Master
              algorithms, compete in global rounds, and land your dream role at
              top tech companies.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {data().socialLinks.map(({ icon: Icon, label, href }) => (
                  <Button
                    key={label}
                    size="icon"
                    variant="outline"
                    asChild
                    className="cursor-pointer border-border/40 shadow-none transition-all duration-500 hover:scale-110 hover:-rotate-12 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Link href={href}>
                      <Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="cursor-pointer border-border/40 shadow-none transition-all duration-500 hover:scale-110 hover:rotate-12 hover:bg-primary hover:text-primary-foreground"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="w-full max-w-sm space-y-4 pt-4"
            >
              <h4 className="text-sm font-black tracking-widest text-foreground uppercase italic">
                Subscribe to Slope Monthly
              </h4>
              <div className="relative w-full">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-xl border-border/40 bg-muted/50 font-medium transition-all focus:border-primary/50"
                  required
                />
                <Button
                  type="submit"
                  className="absolute top-1.5 right-1.5 h-9 rounded-lg px-4 text-[10px] font-bold tracking-widest uppercase"
                >
                  Join
                </Button>
              </div>
            </form>
          </div>

          {/* Navigation Links */}
          <div className="grid w-full grid-cols-2 items-start justify-between gap-12 lg:col-span-3">
            {(["platform", "company", "resources", "legal"] as const).map(
              (section) => (
                <div key={section} className="w-full">
                  <h3 className="mb-6 border-l-4 border-primary pl-4 text-sm font-black tracking-widest text-foreground uppercase italic">
                    {section}
                  </h3>
                  <ul className="space-y-4">
                    {data().navigation[section].map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="group flex items-center gap-2 text-sm font-bold text-muted-foreground transition-all duration-300 hover:text-primary"
                        >
                          <ArrowDownLeft className="h-3 w-3 -translate-x-2 rotate-[225deg] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border/40 pt-8 md:flex-row">
          <div className="flex items-center gap-6">
            <span className="text-3xl text-[10px] font-black tracking-tighter text-foreground uppercase italic opacity-20">
              Slope
            </span>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              &copy; {currentYear} Slope Academy. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-8">
            {data().bottomLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <span className="absolute inset-x-0 bottom-0 left-0 -z-10 h-32 w-full bg-gradient-to-t from-primary/5 to-transparent opacity-50" />
      </div>
    </footer>
  )
}
