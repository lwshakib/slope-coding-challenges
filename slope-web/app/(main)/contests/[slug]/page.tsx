'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
    Trophy, 
    Calendar, 
    Users, 
    Timer, 
    Medal,
    ChevronRight,
    ArrowLeft,
    Loader2,
    Lock,
    Unlock,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from 'next/link'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface ContestDetail extends Contest {
    problems: { slug: string; title: string, isLocked: boolean; isCompleted: boolean }[];
    isRegistered: boolean;
    registrationCount: number;
    currentProgressIndex: number;
}

interface Contest {
    id: string;
    slug: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    prizes?: string;
}

export default function ContestDetailPage() {
    const { slug } = useParams()
    const [contest, setContest] = useState<ContestDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRegistering, setIsRegistering] = useState(false)
    const { data: session, isPending: isSessionLoading } = authClient.useSession()
    const router = useRouter()

    useEffect(() => {
        if (!isSessionLoading && !session) {
            router.push("/sign-in")
            return
        }

        const fetchContest = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/contests/s/${slug}`, {
                    credentials: 'include'
                })
                if (res.ok) {
                    const data = await res.json()
                    setContest(data)
                } else {
                    toast.error("Contest not found")
                }
            } catch (error) {
                console.error("Failed to fetch contest:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (session && slug) {
            fetchContest()
        }
    }, [slug, session, isSessionLoading, router])

    const handleRegister = async () => {
        if (!contest) return;
        setIsRegistering(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/contests/${contest.id}/register`, {
                method: 'POST',
                credentials: 'include'
            })
            if (res.ok) {
                toast.success("Successfully registered!")
                setContest(prev => prev ? { ...prev, isRegistered: true, registrationCount: prev.registrationCount + 1 } : null)
            } else {
                const data = await res.json()
                toast.error(data.message || "Failed to register")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsRegistering(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 text-primary animate-spin" />
            </div>
        )
    }

    if (!contest) return <div className="text-center py-20 font-bold">Contest not found</div>

    const isLive = new Date() >= new Date(contest.startTime) && new Date() <= new Date(contest.endTime)
    const isEnded = new Date() > new Date(contest.endTime)
    const canEnter = contest.isRegistered && (isLive || isEnded)

    return (
        <div className="container mx-auto px-4 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link href="/contests" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
                <ArrowLeft className="size-4" /> Back to Arena
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Header Info */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className={cn(
                                "font-black px-2 py-0 border-none uppercase text-[10px]",
                                isLive ? "bg-red-500/10 text-red-500 animate-pulse" : 
                                isEnded ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                            )}>
                                {isLive ? "● LIVE NOW" : isEnded ? "ENDED" : "UPCOMING"}
                            </Badge>
                            {contest.isRegistered && (
                                <Badge variant="outline" className="border-green-500/30 text-green-500 font-bold uppercase text-[10px] flex items-center gap-1">
                                    <CheckCircle2 className="size-3" /> Registered
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black italic tracking-tighter text-foreground">
                            {contest.title}
                        </h1>
                        <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                            {contest.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="p-4 rounded-2xl bg-card border border-border/40 text-center space-y-1">
                            <Calendar className="size-4 mx-auto text-primary mb-2" />
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date</div>
                            <div className="text-sm font-black italic">{new Date(contest.startTime).toLocaleDateString()}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border/40 text-center space-y-1">
                            <Timer className="size-4 mx-auto text-primary mb-2" />
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Starts</div>
                            <div className="text-sm font-black italic">{new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border/40 text-center space-y-1">
                            <Users className="size-4 mx-auto text-primary mb-2" />
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Joined</div>
                            <div className="text-sm font-black italic">{contest.registrationCount}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border/40 text-center space-y-1">
                            <Medal className="size-4 mx-auto text-yellow-500 mb-2" />
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prize</div>
                            <div className="text-sm font-black italic text-yellow-500">{contest.prizes || "Glory"}</div>
                        </div>
                    </div>

                    {/* Problems Section */}
                    <section className="space-y-6 pt-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight">Challenge Set</h2>
                            {!canEnter && (
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1.5 rounded-full border border-border/40">
                                    <Lock className="size-3.5" /> Locked until Round starts
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {contest.problems.map((prob, idx) => {
                                const isLocked = prob.isLocked;
                                return (
                                    <div 
                                        key={prob.slug}
                                        className={cn(
                                            "p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between group",
                                            canEnter 
                                                ? (isLocked ? "bg-muted/10 border-dashed border-border/20 opacity-70 grayscale cursor-not-allowed" : "bg-card hover:bg-primary/[0.03] border-border/40 hover:border-primary/30 cursor-pointer")
                                                : "bg-muted/10 border-dashed border-border/40 opacity-70 grayscale"
                                        )}
                                        onClick={() => {
                                            if (canEnter && !isLocked) {
                                                router.push(`/contest/${slug}/${idx}`);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "size-12 rounded-2xl flex items-center justify-center text-xl font-black italic",
                                                prob.isCompleted ? "bg-green-500/10 text-green-500" : "bg-muted/40 text-muted-foreground"
                                            )}>
                                                {prob.isCompleted ? <CheckCircle2 className="size-6" /> : (idx + 1)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                                    {(canEnter && !isLocked) ? prob.title : "Problem " + (idx + 1)}
                                                </h3>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground/60 p-0 border-none">
                                                        100 Points
                                                    </Badge>
                                                    {canEnter && isLocked && (
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-red-500/60 p-0 border-none flex items-center gap-1">
                                                            <Lock className="size-2.5" /> Solve Previous to Unlock
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {(canEnter && !isLocked) ? (
                                            <Button size="icon" variant="ghost" className="rounded-xl group-hover:bg-primary group-hover:text-white">
                                                <ChevronRight className="size-5" />
                                            </Button>
                                        ) : (
                                            <Lock className="size-5 text-muted-foreground/40" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Sidebar Sticky Actions */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                    <Card className="border-primary/20 bg-zinc-950 shadow-2xl overflow-hidden">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Round Registration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-10">
                            {contest.isRegistered ? (
                                <div className="space-y-6">
                                    <div className="text-center p-6 rounded-3xl bg-green-500/5 border border-green-500/10">
                                        <Unlock className="size-12 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-black italic uppercase tracking-tight text-green-500">Access Granted</h3>
                                        <p className="text-xs text-muted-foreground mt-2 font-medium">You are registered. Return here when the clock strikes zero to begin.</p>
                                    </div>
                                    <Button 
                                        disabled={!canEnter} 
                                        onClick={() => router.push(`/contest/${slug}/${contest.currentProgressIndex}`)}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic tracking-widest uppercase text-sm shadow-xl shadow-primary/20 group"
                                    >
                                        {isLive ? "Enter Arena" : isEnded ? "View Problems" : "Awaiting Start..."}
                                        <ChevronRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6 text-center">
                                     <div className="text-center p-6 rounded-3xl bg-primary/5 border border-primary/10">
                                        <Trophy className="size-12 text-primary mx-auto mb-4" />
                                        <h3 className="text-lg font-black italic uppercase tracking-tight text-white">Join the Fight</h3>
                                        <p className="text-xs text-zinc-400 mt-2 font-medium">Secure your spot in this round to compete for the {contest.prizes || "weekly"} glory.</p>
                                    </div>
                                    <Button 
                                        onClick={handleRegister} 
                                        disabled={isRegistering || isEnded}
                                        className="w-full h-14 bg-white text-black hover:bg-white/90 font-black italic tracking-widest uppercase text-sm shadow-xl transition-all active:scale-95"
                                    >
                                        {isRegistering ? <Loader2 className="size-5 animate-spin" /> : isEnded ? "Registration Closed" : "Register Now"}
                                    </Button>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No registration fee • All levels welcome</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Rules */}
                    <div className="mt-8 p-6 rounded-3xl bg-muted/30 border border-border/40 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                             <Medal className="size-3.5 text-yellow-500" /> Scoring Rules
                        </h4>
                        <ul className="space-y-3">
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary font-bold">1.</span>
                                Accuracy first: Wrong submissions deduct points.
                            </li>
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary font-bold">2.</span>
                                Clock parity: Earlier completion ranks higher for tied scores.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
