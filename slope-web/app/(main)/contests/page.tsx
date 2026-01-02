'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    Trophy, 
    Calendar, 
    Users, 
    Timer, 
    Rocket, 
    TrendingUp, 
    ChevronRight,
    Search,
    Filter,
    Flame,
    History,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface Contest {
    id: string;
    slug: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    prizes?: string;
    registrationCount: number;
    isRegistered?: boolean;
}

export default function ContestsPage() {
    const [contests, setContests] = useState<Contest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [registeringId, setRegisteringId] = useState<string | null>(null)
    const { data: session, isPending: isSessionLoading } = authClient.useSession()
    const router = useRouter()

    useEffect(() => {
        if (!isSessionLoading && !session) {
            router.push("/sign-in")
            return
        }

        const fetchContests = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/contests`, {
                    credentials: 'include',
                    cache: 'no-store'
                })
                if (!res.ok) throw new Error("Failed to fetch")
                const data = await res.json()
                setContests(data)
            } catch (error) {
                console.error("Failed to fetch contests:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (session) {
            fetchContests()
        }
    }, [session, isSessionLoading, router])

    const handleRegister = async (contestId: string) => {
        setRegisteringId(contestId)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/contests/${contestId}/register`, {
                method: 'POST',
                credentials: 'include'
            })
            
            if (res.ok) {
                toast.success("Successfully registered for the contest!")
                setContests(prev => prev.map(c => 
                    c.id === contestId ? { ...c, isRegistered: true, registrationCount: c.registrationCount + 1 } : c
                ))
            } else {
                const data = await res.json()
                toast.error(data.message || "Failed to register")
            }
        } catch (error) {
            toast.error("An error occurred during registration")
        } finally {
            setRegisteringId(null)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    return (
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Hero Section */}
            <div className="relative rounded-[3rem] overflow-hidden bg-zinc-950 border border-white/5 mb-16 p-12 lg:p-20 shadow-2xl">
                <div className="absolute top-0 right-0 size-96 bg-primary/20 rounded-full blur-[120px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 size-96 bg-blue-500/10 rounded-full blur-[120px] -ml-32 -mb-32" />
                
                <div className="relative z-10 max-w-2xl space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md">
                        <Flame className="size-4 fill-primary" />
                        <span>Compete & Win Rewards</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white italic">
                        The Arena of <span className="text-primary not-italic underline decoration-primary/50 underline-offset-8">Legends</span>
                    </h1>
                    <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                        Join thousands of developers in our weekly challenges. Show your skills, climb the leaderboard, and win exclusive prizes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                        <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95 group">
                            Explore Next Rounds
                            <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="outline" className="h-14 px-8 bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-sm backdrop-blur-md">
                            View Rankings
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                    {/* Active/Upcoming Contests */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground italic flex items-center gap-3">
                                <Rocket className="size-6 text-primary" /> Upcoming Contests
                            </h2>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="size-10 rounded-xl bg-muted/20 border border-border/40"><Search className="size-4" /></Button>
                                <Button variant="ghost" size="icon" className="size-10 rounded-xl bg-muted/20 border border-border/40"><Filter className="size-4" /></Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-3xl border border-dashed border-border/40">
                                    <Loader2 className="size-8 text-primary animate-spin mb-4" />
                                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading Arena...</p>
                                </div>
                            ) : contests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-3xl border border-dashed border-border/40">
                                    <Trophy className="size-8 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No upcoming contests scheduled.</p>
                                </div>
                            ) : (
                                contests.map((contest) => (
                                    <Card key={contest.id} className="group relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1 border-l-4 border-l-primary/50 hover:border-l-primary">
                                        <CardContent className="p-8">
                                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                                <div className="space-y-4 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className={cn(
                                                            "font-bold px-2 py-0 border-none uppercase text-[10px]",
                                                            contest.isRegistered ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                                                        )}>
                                                            {contest.isRegistered ? "REGISTERED" : "UPCOMING"}
                                                        </Badge>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                            <Calendar className="size-3.5" /> {formatDate(contest.startTime)} • {formatTime(contest.startTime)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black italic tracking-tight group-hover:text-primary transition-colors">
                                                            {contest.title}
                                                        </h3>
                                                        <p className="text-muted-foreground font-medium mt-1 leading-relaxed">
                                                            {contest.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-6 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="size-4 text-primary" />
                                                            <span className="text-sm font-bold">{(contest.registrationCount / 1000).toFixed(1)}k <span className="text-muted-foreground font-medium">Joined</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Timer className="size-4 text-primary" />
                                                            <span className="text-sm font-bold">90 Mins</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-yellow-500">
                                                            <Trophy className="size-4" />
                                                            <span className="text-sm font-bold lowercase tracking-tight">{contest.prizes}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row md:flex-col justify-end gap-3 min-w-[120px]">
                                                    {contest.isRegistered ? (
                                                        <Button disabled className="w-full h-12 bg-green-500/20 text-green-500 border border-green-500/30 font-black italic uppercase text-xs tracking-widest">
                                                            Registered
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            onClick={() => handleRegister(contest.id)}
                                                            disabled={registeringId === contest.id}
                                                            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase text-xs tracking-widest shadow-lg shadow-primary/10"
                                                        >
                                                            {registeringId === contest.id ? <Loader2 className="size-4 animate-spin" /> : "Register"}
                                                        </Button>
                                                    )}
                                                    <Link href={`/contests/${contest.slug}`}>
                                                        <Button variant="outline" className="w-full h-12 border-border/40 bg-background/50 text-xs font-bold uppercase tracking-widest">
                                                            Details
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Past Contests Table Area */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground italic flex items-center gap-3">
                            <History className="size-6 text-muted-foreground" /> Round History
                        </h2>
                        <div className="rounded-2xl border border-border/40 bg-card/20 shadow-xl overflow-hidden backdrop-blur-sm">
                            <div className="p-8 text-center space-y-4">
                                <Trophy className="size-12 text-muted-foreground/20 mx-auto" />
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold">Past Contest Records</h4>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Access the problems, editorials, and rankings of all previous rounds.</p>
                                </div>
                                <Button variant="secondary" className="font-bold uppercase tracking-widest text-xs px-8 h-11 bg-muted/40 border border-border/40">
                                    Browse Archive
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-12">
                     {/* Your Performance Card */}
                    <Card className="relative overflow-hidden border-primary/20 bg-background/40 backdrop-blur-xl shadow-2xl">
                        <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl" />
                        <CardHeader>
                            <CardTitle className="text-xl font-black italic tracking-tight flex items-center gap-2">
                                <TrendingUp className="size-5 text-primary" /> My Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Global Rating</div>
                                    <div className="text-3xl font-black italic text-primary">1,842</div>
                                </div>
                                <Badge className="bg-primary/10 text-primary border-primary/20 font-black italic py-1 px-4">Knight</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
                                    <div className="text-2xl font-black">12</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contests</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
                                    <div className="text-2xl font-black">452</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rank</div>
                                </div>
                            </div>

                             <div className="space-y-3 pt-4">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <span>Top Percentile</span>
                                    <span className="text-primary italic">TOP 4.2%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: '95.8%' }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rules & Tips */}
                    <Card className="border-border/40 bg-zinc-950/50 backdrop-blur shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-black italic tracking-tight uppercase">Arena Rules</CardTitle>
                            <CardDescription>Follow these to avoid disqualification.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { t: "Integrity First", d: "No plagiarism or code sharing during rounds." },
                                { t: "Time Matters", d: "Ranking is based on solution accuracy and time." },
                                { t: "Language Support", d: "All standard runtime languages are permitted." }
                            ].map(rule => (
                                <div key={rule.t} className="flex gap-4">
                                    <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                        <CheckCircle2 className="size-3.5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="text-sm font-bold uppercase tracking-tight">{rule.t}</h5>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{rule.d}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
