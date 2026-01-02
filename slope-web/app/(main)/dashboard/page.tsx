'use client'

import React from 'react'
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
    Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from 'next/link'

export default function DashboardPage() {
    return (
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Top Row: Welcome & Stats Summary */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight lg:text-5xl italic">
                        Welcome back, <span className="text-primary not-italic underline decoration-primary/30 underline-offset-8">Shakib</span>!
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        You're in the top <span className="text-foreground font-bold italic">5%</span> of solvers this week. Keep it up!
                    </p>
                </div>
                
                <div className="flex gap-4 w-full lg:w-auto">
                    <Card className="flex-1 lg:flex-none min-w-[140px] bg-primary/5 border-primary/10 shadow-xl shadow-primary/5">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Solved</span>
                            <div className="text-3xl font-black italic text-primary">42</div>
                            <span className="text-[10px] text-muted-foreground mt-1">+12 this month</span>
                        </CardContent>
                    </Card>
                    <Card className="flex-1 lg:flex-none min-w-[140px] bg-orange-500/5 border-orange-500/10 shadow-xl shadow-orange-500/5">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Streak</span>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black italic text-orange-500">12</span>
                                <Flame className="size-6 text-orange-500 fill-orange-500" />
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1">Best: 24 days</span>
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
                                                <Badge className="bg-white/5 text-zinc-400 border-none font-bold uppercase text-[10px]">Hash Table</Badge>
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 text-sm max-w-md font-medium">
                                            Find two numbers such that they add up to a specific target. A classic foundation of competitive programming.
                                        </p>
                                    </div>
                                    <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase tracking-widest text-sm shadow-xl shadow-primary/20 border-b-4 border-primary/70 active:border-b-0 active:translate-y-[2px] transition-all">
                                        Solve Now <ChevronRight className="ml-2 size-4" />
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
                                    { label: 'Arrays & Hashing', val: 85, color: 'bg-green-500' },
                                    { label: 'Linked Lists', val: 42, color: 'bg-blue-500' },
                                    { label: 'Trees & Graphs', val: 18, color: 'bg-orange-500' },
                                    { label: 'Dynamic Programming', val: 5, color: 'bg-red-500' },
                                ].map((item) => (
                                    <div key={item.label} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="uppercase tracking-tight">{item.label}</span>
                                            <span className="italic">{item.val}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${item.val}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Activity className="size-4 text-primary" /> Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                 <div className="space-y-4">
                                    {[
                                        { title: 'Add Two Numbers', status: 'Accepted', time: '2h ago', points: '+50' },
                                        { title: 'Median of Two Sorted Arrays', status: 'In Progress', time: '5h ago', points: '---' },
                                        { title: 'Longest Substring...', status: 'Accepted', time: '1d ago', points: '+100' },
                                    ].map((act, i) => (
                                        <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-2 rounded-full",
                                                    act.status === 'Accepted' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-500'
                                                )} />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold truncate max-w-[150px]">{act.title}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{act.time}</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black italic text-primary">{act.points}</span>
                                        </div>
                                    ))}
                                 </div>
                                 <Button variant="ghost" className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                                    View Full History
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
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Current Standing</div>
                                    <div className="text-2xl font-black italic">Rank #452</div>
                                    <div className="text-[10px] font-bold text-muted-foreground">TOP <span className="text-primary">4.2%</span> WORLDWIDE</div>
                                </div>
                            </div>
                         </CardContent>
                    </Card>

                    {/* Weekly Contest Promo */}
                    <Card className="border-border/40 bg-zinc-950 shadow-xl group overflow-hidden">
                        <CardHeader className="pb-2">
                             <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                                <Star className="size-3 fill-primary" />
                                <span>Featured Contest</span>
                             </div>
                            <CardTitle className="text-xl font-black tracking-tighter italic text-white flex items-center justify-between">
                                WC432 <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-4">
                                <Clock className="size-4 text-zinc-500" />
                                <span className="text-xs font-bold text-zinc-400">Starts in 02:14:22</span>
                             </div>
                             <Button className="w-full bg-white text-black hover:bg-white/90 font-black italic uppercase tracking-widest text-[10px] h-10 shadow-xl shadow-white/5 transition-all active:scale-98">
                                Register Now
                             </Button>
                        </CardContent>
                    </Card>

                    {/* Recommended Problems */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Recommended</h3>
                        <div className="space-y-3">
                            {[
                                { title: 'Reverse Linked List', diff: 'Easy', slug: 'reverse-linked-list' },
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
