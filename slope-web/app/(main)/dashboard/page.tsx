'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Trophy, 
    Flame, 
    Target, 
    Zap, 
    ChevronRight, 
    Clock, 
    Star, 
    ArrowUpRight,
    Search,
    Code2,
    BarChart3,
    Activity,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

interface Stats {
    totalSolved: number;
    streak: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
}

export default function DashboardPage() {
    const { data: session } = authClient.useSession();
    const [stats, setStats] = useState<Stats>({
        totalSolved: 0,
        streak: 1,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0
    });
    const [recentProblems, setRecentProblems] = useState<any[]>([]);
    const [featuredContest, setFeaturedContest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch problems to calculate stats
                const probRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/problems`, {
                    credentials: 'include'
                });
                const problems = await probRes.json();
                
                if (Array.isArray(problems)) {
                    const solved = problems.filter(p => p.status === 'solved');
                    setStats({
                        totalSolved: solved.length,
                        streak: 12, // Still mock for now as we don't track it in DB yet
                        easyCount: solved.filter(p => p.difficulty === 'Easy').length,
                        mediumCount: solved.filter(p => p.difficulty === 'Medium').length,
                        hardCount: solved.filter(p => p.difficulty === 'Hard').length,
                    });
                    setRecentProblems(problems.slice(0, 3));
                }

                // Fetch contests to get the first upcoming one
                const contestRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/contests`);
                const contests = await contestRes.json();
                if (Array.isArray(contests) && contests.length > 0) {
                    setFeaturedContest(contests[0]);
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Top Row: Welcome & Stats Summary */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight lg:text-5xl italic">
                        Welcome back, <span className="text-primary not-italic underline decoration-primary/30 underline-offset-8">{session?.user?.name?.split(' ')[0] || 'Coder'}</span>!
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        You're on the right path. Keep solving to climb the ranks.
                    </p>
                </div>
                
                <div className="flex gap-4 w-full lg:w-auto">
                    <Card className="flex-1 lg:flex-none min-w-[140px] bg-primary/5 border-primary/10 shadow-xl shadow-primary/5">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Solved</span>
                            <div className="text-3xl font-black italic text-primary">{stats.totalSolved}</div>
                            <span className="text-[10px] text-muted-foreground mt-1">Challenge yourself</span>
                        </CardContent>
                    </Card>
                    <Card className="flex-1 lg:flex-none min-w-[140px] bg-orange-500/5 border-orange-500/10 shadow-xl shadow-orange-500/5">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Streak</span>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black italic text-orange-500">{stats.streak}</span>
                                <Flame className="size-6 text-orange-500 fill-orange-500" />
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1">Days active</span>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Progress & Daily Task */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Daily Challenge Card */}
                    <Link href="/problems/two-sum">
                        <Card className="relative overflow-hidden border-primary/30 bg-zinc-950 group cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xl">
                             <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-primary/20" />
                             <CardContent className="p-8 relative z-10">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
                                            <Zap className="size-4 fill-primary" />
                                            <span>Daily Challenge</span>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black italic tracking-tight text-white mb-2">Two Sum</h2>
                                            <div className="flex gap-2">
                                                <Badge className="bg-green-500/10 text-green-500 border-none font-bold uppercase text-[10px]">Easy</Badge>
                                                <Badge className="bg-white/5 text-zinc-400 border-none font-bold uppercase text-[10px]">Array</Badge>
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 text-sm max-w-md font-medium">
                                            The classic foundation. Find two numbers that sum to target.
                                        </p>
                                    </div>
                                    <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase tracking-widest text-sm shadow-xl shadow-primary/20 border-b-4 border-primary/70 active:border-b-0 active:translate-y-[2px] transition-all" asChild>
                                        <Link href="/problems/two-sum">Solve Now <ChevronRight className="ml-2 size-4" /></Link>
                                    </Button>
                                </div>
                             </CardContent>
                        </Card>
                    </Link>

                    {/* Progress Detail */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <BarChart3 className="size-4 text-primary" /> Mastery Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-2">
                                {[
                                    { label: 'Easy', val: stats.easyCount, max: 3, color: 'bg-green-500' },
                                    { label: 'Medium', val: stats.mediumCount, max: 4, color: 'bg-orange-500' },
                                    { label: 'Hard', val: stats.hardCount, max: 1, color: 'bg-red-500' },
                                ].map((item) => (
                                    <div key={item.label} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="uppercase tracking-tight">{item.label}</span>
                                            <span className="italic">{item.val} / {item.max}</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${(item.val / item.max) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Activity className="size-4 text-primary" /> Explore More
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                 <div className="space-y-4">
                                    {recentProblems.map((prob, i) => (
                                        <Link key={prob.id} href={`/problems/${prob.slug}`}>
                                            <div className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "size-2 rounded-full",
                                                        prob.status === 'solved' ? 'bg-green-500' : 'bg-zinc-600'
                                                    )} />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold truncate max-w-[150px]">{prob.title}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{prob.difficulty}</span>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </Link>
                                    ))}
                                 </div>
                                 <Button variant="ghost" className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" asChild>
                                    <Link href="/problemset">View Problemset</Link>
                                 </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Leaderboard & Recommendations */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Rank Card */}
                    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 shadow-2xl">
                         <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-2xl bg-primary flex items-center justify-center border-b-4 border-primary/50 shadow-lg shadow-primary/20">
                                    <Trophy className="size-8 text-primary-foreground" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Global Standing</div>
                                    <div className="text-2xl font-black italic">Beginner</div>
                                    <div className="text-[10px] font-bold text-muted-foreground">TOP <span className="text-primary">{((total - stats.totalSolved)/total * 100).toFixed(1)}%</span> WORLDWIDE</div>
                                </div>
                            </div>
                         </CardContent>
                    </Card>

                    {/* Weekly Contest Promo */}
                    <Card className="border-border/40 bg-zinc-950 shadow-xl group overflow-hidden">
                        <CardHeader className="pb-2">
                             <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                                <Star className="size-3 fill-primary" />
                                <span>Upcoming Round</span>
                             </div>
                            <CardTitle className="text-xl font-black tracking-tighter italic text-white flex items-center justify-between">
                                {featuredContest?.title || "Next Friday Round"} <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-4">
                                <Clock className="size-4 text-zinc-500" />
                                <span className="text-xs font-bold text-zinc-400">
                                    {featuredContest ? new Date(featuredContest.startTime).toLocaleString() : "TBD"}
                                </span>
                             </div>
                             <Button className="w-full bg-white text-black hover:bg-white/90 font-black italic uppercase tracking-widest text-[10px] h-10 shadow-xl shadow-white/5 transition-all active:scale-98" asChild>
                                <Link href="/contests">Register Now</Link>
                             </Button>
                        </CardContent>
                    </Card>

                    {/* Recommended Problems */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Recommended</h3>
                        <div className="space-y-3">
                            {[
                                { title: 'Merge Intervals', diff: 'Medium', slug: 'merge-intervals' },
                                { title: 'Trapping Rain Water', diff: 'Hard', slug: 'trapping-rain-water' },
                            ].map((prob) => (
                                <Link key={prob.slug} href={`/problems/${prob.slug}`}>
                                    <div className="p-4 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 hover:border-primary/30 transition-all group flex items-center justify-between mb-3">
                                        <div className="space-y-1">
                                            <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">{prob.title}</div>
                                            <Badge className={cn(
                                                "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0 border-none",
                                                prob.diff === 'Easy' ? 'bg-green-500/10 text-green-500' :
                                                prob.diff === 'Medium' ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-red-500/10 text-red-500'
                                            )}>{prob.diff}</Badge>
                                        </div>
                                        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

const total = 8;
