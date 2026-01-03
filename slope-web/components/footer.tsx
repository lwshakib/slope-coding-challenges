"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import {
  Github,
  Linkedin,
  Twitter,
  Moon,
  Sun,
  ArrowDownLeft,
  MessageCircle,
} from "lucide-react";
import { Logo } from "./logo";

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
    { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
    { icon: Github, label: "GitHub", href: "https://github.com" },
    { icon: MessageCircle, label: "Discord", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
  ],
  bottomLinks: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
  ],
});

export default function FooterSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentYear = new Date().getFullYear();

  if (!mounted) return null;

  return (
    <footer className="w-full bg-background border-t border-border/40">
      <div className="relative w-full px-5 py-16">
        {/* Top Section */}
        <div className="container m-auto grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-5">
          {/* Company Info */}
          <div className="space-y-8 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo />
            </Link>
            <p className="text-muted-foreground max-w-sm font-medium leading-relaxed italic">
              The premier platform for technical interview preparation. Master algorithms, compete in global rounds, and land your dream role at top tech companies.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {data().socialLinks.map(({ icon: Icon, label, href }) => (
                  <Button
                    key={label}
                    size="icon"
                    variant="outline"
                    asChild
                    className="hover:bg-primary hover:text-primary-foreground border-border/40 cursor-pointer shadow-none transition-all duration-500 hover:scale-110 hover:-rotate-12"
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
                className="hover:bg-primary hover:text-primary-foreground border-border/40 cursor-pointer shadow-none transition-all duration-500 hover:scale-110 hover:rotate-12"
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
              <h4 className="text-sm font-black italic uppercase tracking-widest text-foreground">Subscribe to Slope Monthly</h4>
              <div className="relative w-full">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-xl bg-muted/50 border-border/40 focus:border-primary/50 transition-all font-medium"
                  required
                />
                <Button
                  type="submit"
                  className="absolute top-1.5 right-1.5 h-9 rounded-lg font-bold uppercase tracking-widest text-[10px] px-4"
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
                  <h3 className="mb-6 text-sm font-black italic tracking-widest uppercase text-foreground border-l-4 border-primary pl-4">
                    {section}
                  </h3>
                  <ul className="space-y-4">
                    {data().navigation[section].map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="group text-muted-foreground hover:text-primary font-bold text-sm flex items-center gap-2 transition-all duration-300"
                        >
                          <ArrowDownLeft className="h-3 w-3 rotate-[225deg] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
        <div className="mt-16 pt-8 border-t border-border/40 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-6">
              <span className="text-[10px] font-black italic tracking-tighter text-foreground uppercase text-3xl opacity-20">Slope</span>
              <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
                &copy; {currentYear} Slope Academy. All rights reserved.
              </p>
          </div>
          <div className="flex items-center gap-8">
            {data().bottomLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <span className="absolute inset-x-0 bottom-0 left-0 -z-10 h-32 w-full bg-gradient-to-t from-primary/5 to-transparent opacity-50" />
      </div>
    </footer>
  );
}
