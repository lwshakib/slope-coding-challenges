'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Trophy, 
    Clock, 
    Star, 
    Code2,
    Activity,
    Loader2,
    Calendar,
    Mail,
    User as UserIcon,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Sunrise,
    Brain,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from 'next/link'

interface UserProfile {
    id: string;
    name: string;
    email: string;
    image: string | null;
    points: number;
    createdAt: string;
    solvedCount: number;
    recentSubmissions: {
        id: string;
        problemSlug: string;
        status: string;
        language: string;
        createdAt: string;
    }[];
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/profile`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 text-primary animate-spin" />
            </div>
        )
    }

    if (!profile) return null;

    return (
        <div className="container mx-auto px-4 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Profile Header Card */}
            <Card className="relative overflow-hidden border-border/40 bg-card shadow-2xl mb-8 group">
                <div className="absolute top-0 right-0 size-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-primary/20" />
                <CardContent className="p-8 md:p-12 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <div className="relative">
                            <div className="size-32 rounded-3xl bg-primary/10 border-4 border-primary/20 flex items-center justify-center overflow-hidden shadow-2xl relative z-10">
                                {profile.image ? (
                                    <img src={profile.image} alt={profile.name} className="size-full object-cover" />
                                ) : (
                                    <UserIcon className="size-16 text-primary" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 size-10 rounded-xl bg-primary flex items-center justify-center border-4 border-card z-20 shadow-lg">
                                <Trophy className="size-5 text-primary-foreground" />
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase">{profile.name}</h1>
                                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[10px] h-5 tracking-widest">PRO</Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground font-medium text-sm">
                                    <span className="flex items-center gap-1.5"><Mail className="size-3.5" /> {profile.email}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                                <div className="bg-muted/50 border border-border/40 rounded-xl px-4 py-2 flex flex-col items-center md:items-start">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Points</span>
                                    <span className="text-xl font-black italic tracking-tighter text-foreground">{profile.points}</span>
                                </div>
                                <div className="bg-muted/50 border border-border/40 rounded-xl px-4 py-2 flex flex-col items-center md:items-start">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rank</span>
                                    <span className="text-xl font-black italic tracking-tighter text-primary">#1,248</span>
                                </div>
                                <div className="bg-muted/50 border border-border/40 rounded-xl px-4 py-2 flex flex-col items-center md:items-start">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Solved</span>
                                    <span className="text-xl font-black italic tracking-tighter text-green-500">{profile.solvedCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[140px]">
                            <Button className="font-bold uppercase tracking-widest text-[10px] h-10 shadow-xl border-b-2 border-primary/50">Edit Profile</Button>
                            <Button variant="outline" className="font-bold uppercase tracking-widest text-[10px] h-10 border-border/40 hover:bg-muted">Settings</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Stats Summary */}
                <div className="lg:col-span-8 space-y-8">
                    <section className="p-12 text-center bg-card border border-border/40 rounded-[3rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 size-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mt-32 transition-all group-hover:bg-primary/10" />
                        <Activity className="size-16 text-primary/20 mx-auto mb-6" />
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Guest Explorer Mode</h2>
                        <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                            You are currently exploring Slope as a guest. All features are open for competition, and your progress is tracked locally in this session.
                        </p>
                        <div className="flex justify-center gap-4 mt-10">
                            {[
                                { l: "Global Arena", h: "/contests", i: Trophy },
                                { l: "Problem Set", h: "/problemset", i: Code2 }
                            ].map(btn => (
                                <Link key={btn.l} href={btn.h}>
                                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-border/40 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
                                        <btn.i className="size-3.5" /> {btn.l}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Badges & achievements */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Star className="size-4 text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Achievements</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { name: 'Early Bird', icon: Sunrise, unlocked: true, color: 'text-orange-500' },
                                { name: 'Problem Solver', icon: Brain, unlocked: true, color: 'text-purple-500' },
                                { name: 'Ace', icon: Trophy, unlocked: false, color: 'text-yellow-500' },
                                { name: 'Speedster', icon: Zap, unlocked: false, color: 'text-blue-500' },
                            ].map((badge) => (
                                <Card key={badge.name} className={cn(
                                    "border-border/40 bg-card/20 transition-all",
                                    !badge.unlocked && "opacity-40 grayscale"
                                )}>
                                    <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                                        <badge.icon className={cn("size-8", badge.unlocked && badge.color)} />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{badge.name}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Trophy className="size-4 text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Global Skills</h2>
                        </div>
                        <div className="bg-card/20 border border-border/40 rounded-3xl p-6 flex flex-wrap gap-2">
                            {['Arrays', 'Strings', 'DP', 'Graphs', 'Trees'].map((skill) => (
                                <Badge key={skill} className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 cursor-default transition-colors">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
