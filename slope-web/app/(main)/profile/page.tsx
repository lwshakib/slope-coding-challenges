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
import { authClient } from '@/lib/auth-client'

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
    const { data: session } = authClient.useSession();
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

        if (session) {
            fetchProfile();
        }
    }, [session]);

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
                {/* Stats & Activity */}
                <div className="lg:col-span-8 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Activity className="size-4 text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h2>
                        </div>

                        <div className="space-y-3">
                            {profile.recentSubmissions.length > 0 ? profile.recentSubmissions.map((sub) => (
                                <Link key={sub.id} href={`/problems/${sub.problemSlug}`}>
                                    <Card className="border-border/40 bg-card/20 hover:bg-card/40 hover:border-primary/20 transition-all group overflow-hidden">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center border",
                                                    sub.status === 'ACCEPTED' 
                                                        ? "bg-green-500/10 border-green-500/20 text-green-500" 
                                                        : "bg-red-500/10 border-red-500/20 text-red-500"
                                                )}>
                                                    {sub.status === 'ACCEPTED' ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                                                        {sub.problemSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-border/40 font-bold uppercase">{sub.language}</Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                                        <Clock className="size-3" /> {new Date(sub.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest italic",
                                                    sub.status === 'ACCEPTED' ? "text-green-500" : "text-red-500"
                                                )}>{sub.status}</div>
                                                <ChevronRight className="size-4 text-zinc-700 group-hover:text-primary transition-colors" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )) : (
                                <div className="p-12 text-center bg-muted/20 border border-dashed border-border/40 rounded-3xl">
                                    <Code2 className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">No submissions yet</p>
                                    <Button variant="link" className="text-primary font-bold uppercase text-[10px] tracking-widest mt-2" asChild>
                                        <Link href="/problemset">Start Solving</Link>
                                    </Button>
                                </div>
                            )}
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
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Skills</h2>
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
