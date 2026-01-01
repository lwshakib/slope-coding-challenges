'use client'

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { 
    CheckCircle2, 
    Circle, 
    Clock, 
    Search, 
    Trophy, 
    Flame, 
    TrendingUp, 
    Calendar,
    ChevronRight,
    ArrowUpRight,
    Zap,
    Filter,
    BarChart3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

import { useState, useEffect } from 'react'
import Link from 'next/link'

const topics = [
    "Array", "String", "Hash Table", "Dynamic Programming", "Math", "Sorting", "Greedy", "Depth-First Search", "Binary Search", "Tree"
]

interface Problem {
    id: string;
    slug: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    acceptance: string;
    status: "solved" | "attempted" | "todo";
    tags: string[];
}

export default function ProblemSetPage() {
    const [problems, setProblems] = useState<Problem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems`)
                const data = await response.json()
                setProblems(data)
            } catch (error) {
                console.error('Failed to fetch problems:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProblems()
    }, [])
    return (
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
                        <Zap className="size-4 fill-primary" />
                        <span>PREMIUM LEARNING PATHS ACTIVE</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        Problem <span className="text-primary italic">Set</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Sharpen your skills with over 3,000+ technical interview questions.
                    </p>
                </div>
                <div className="flex gap-4">
                     <Card className="bg-primary/5 border-primary/10 px-4 py-2 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Solved</span>
                        <span className="text-2xl font-black text-primary">18 / 3.2k</span>
                     </Card>
                     <Card className="bg-orange-500/5 border-orange-500/10 px-4 py-2 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Streak</span>
                        <div className="flex items-center gap-1">
                            <span className="text-2xl font-black text-orange-500">12</span>
                            <Flame className="size-5 text-orange-500 fill-orange-500" />
                        </div>
                     </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-9 space-y-6">
                    
                    {/* Topics Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        <Button variant="ghost" size="sm" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                            All Topics
                        </Button>
                        {topics.map(topic => (
                            <Button key={topic} variant="outline" size="sm" className="rounded-full shrink-0 border-border/50 hover:bg-muted">
                                {topic}
                            </Button>
                        ))}
                    </div>

                    {/* Filter Section */}
                    <Card className="border-border/40 bg-card/40 backdrop-blur-md overflow-hidden shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search question titles..." 
                                        className="pl-10 bg-background/40 border-border/40 focus-visible:ring-primary/20 h-11"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                    <Select defaultValue="all">
                                        <SelectTrigger className="w-[130px] bg-background/40 h-11">
                                            <SelectValue placeholder="Difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select defaultValue="all">
                                        <SelectTrigger className="w-[130px] bg-background/40 h-11">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Status</SelectItem>
                                            <SelectItem value="todo">Todo</SelectItem>
                                            <SelectItem value="solved">Solved</SelectItem>
                                            <SelectItem value="attempted">Attempted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 border-border/40">
                                        <Filter className="size-4" />
                                    </Button>
                                    <Button className="bg-primary hover:bg-primary/90 h-11 px-6 font-semibold shrink-0 shadow-lg shadow-primary/20">
                                        Pick Random
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Problem Table Wrapper */}
                    <div className="rounded-2xl border border-border/40 bg-card/20 shadow-xl overflow-hidden backdrop-blur-sm">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="w-[80px] text-center font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Title</TableHead>
                                    <TableHead className="hidden md:table-cell font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Solution</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Acceptance</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Difficulty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            Loading problems...
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    problems.map((problem) => (
                                        <TableRow 
                                            key={problem.id} 
                                            className="hover:bg-primary/[0.03] transition-colors group cursor-pointer border-border/30 h-16"
                                        >
                                            <TableCell className="text-center">
                                                {problem.status === "solved" ? (
                                                    <div className="flex justify-center">
                                                        <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                            <CheckCircle2 className="size-4 text-green-500" />
                                                        </div>
                                                    </div>
                                                ) : problem.status === "attempted" ? (
                                                    <div className="flex justify-center">
                                                        <div className="size-8 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                            <Clock className="size-4 text-orange-500" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <div className="size-8 rounded-full bg-muted/20 flex items-center justify-center border border-transparent">
                                                            <Circle className="size-4 text-muted-foreground/20" />
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/problems/${problem.slug}`} className="flex flex-col">
                                                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                                                        {problem.id}. {problem.title}
                                                    </span>
                                                    <div className="flex gap-2 mt-1">
                                                        {problem.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-[10px] font-medium text-muted-foreground/60 hover:text-primary transition-colors">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold bg-muted/30 px-2 py-1 rounded-md w-fit border border-border/50">
                                                    < Zap className="size-3 text-yellow-500 fill-yellow-500" /> video
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-mono text-muted-foreground font-medium">
                                                    {problem.acceptance}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    className={cn(
                                                        "font-bold px-3 py-1 border-none shadow-sm",
                                                        problem.difficulty === "Easy" && "bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500/20",
                                                        problem.difficulty === "Medium" && "bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/20",
                                                        problem.difficulty === "Hard" && "bg-red-500/10 text-red-600 dark:text-red-400 group-hover:bg-red-500/20"
                                                    )}
                                                >
                                                    {problem.difficulty}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">1-10</span> of <span className="font-semibold text-foreground">3,245</span> problems
                        </p>
                        <Pagination className="mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" className="border-border/40" />
                                </PaginationItem>
                                <PaginationItem className="hidden sm:block">
                                    <PaginationLink href="#" isActive className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-none">1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem className="hidden sm:block">
                                    <PaginationLink href="#" className="border-border/40">2</PaginationLink>
                                </PaginationItem>
                                <PaginationItem className="hidden sm:block">
                                    <PaginationLink href="#" className="border-border/40">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext href="#" className="border-border/40" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>

                {/* Sidebar area */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Progress Card */}
                    <Card className="border-border/40 shadow-xl overflow-hidden group">
                         <div className="h-1.5 w-full bg-muted">
                            <div className="h-full bg-gradient-to-r from-primary to-primary/60 w-[15%] group-hover:w-[18%] transition-all duration-1000" />
                         </div>
                        <CardHeader className="pb-3 pt-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center">
                                    <BarChart3 className="mr-2 size-4 text-primary" /> Progress
                                </CardTitle>
                                <Badge variant="secondary" className="bg-primary/5 text-[10px]">Lvl 4</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-8">
                             <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="space-y-1 p-2 bg-green-500/5 rounded-xl border border-green-500/10">
                                    <div className="text-xs font-bold text-green-600 uppercase tracking-tighter">Easy</div>
                                    <div className="text-lg font-black italic">12</div>
                                </div>
                                <div className="space-y-1 p-2 bg-orange-500/5 rounded-xl border border-orange-500/10">
                                    <div className="text-xs font-bold text-orange-600 uppercase tracking-tighter">Med</div>
                                    <div className="text-lg font-black italic">5</div>
                                </div>
                                <div className="space-y-1 p-2 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <div className="text-xs font-bold text-red-600 uppercase tracking-tighter">Hard</div>
                                    <div className="text-lg font-black italic">1</div>
                                </div>
                             </div>
                             
                             <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground tracking-widest">
                                    <span>Overall Mastery</span>
                                    <span className="text-primary italic">18 / 3245</span>
                                </div>
                                <div className="relative h-2 w-full bg-muted rounded-full">
                                    <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: '15%' }} />
                                    <div className="absolute top-0 left-0 h-full w-[1.5%] bg-blue-400 rounded-full blur-[1px]" />
                                </div>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Leaderboard */}
                    <Card className="border-border/40 bg-card/40 backdrop-blur-md shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center">
                                <Trophy className="mr-2 size-4 text-yellow-500" /> Top Solvers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {[
                                { name: "lwshakib", score: "24.5k", rank: 1, avatar: "🟢" },
                                { name: "professor", score: "22.1k", rank: 2, avatar: "🔵" },
                                { name: "antigravity", score: "19.8k", rank: 3, avatar: "🔴" }
                            ].map((user) => (
                                <div key={user.name} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "size-7 rounded-full flex items-center justify-center text-[10px] font-black border-2",
                                            user.rank === 1 ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]" :
                                            user.rank === 2 ? "bg-zinc-400/10 border-zinc-400/30 text-zinc-500" :
                                            "bg-orange-500/10 border-orange-500/30 text-orange-500"
                                        )}>
                                            {user.rank}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{user.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Contributor</span>
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-muted-foreground">{user.score}</span>
                                </div>
                            ))}
                            <Button variant="link" className="w-full text-xs text-primary font-bold uppercase tracking-widest hover:no-underline hover:text-primary/80 transition-colors" asChild>
                                <a href="#" className="flex items-center justify-center">
                                    Global Rankings <ArrowUpRight className="ml-1 size-3" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Upcoming Contest */}
                    <Card className="relative overflow-hidden border-primary/30 bg-primary/5 shadow-primary/10 shadow-xl group">
                        <div className="absolute -right-8 -top-8 size-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
                        <CardHeader className="pb-2">
                             <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                                <Calendar className="size-3" />
                                <span>Upcoming Event</span>
                             </div>
                            <CardTitle className="text-2xl font-black tracking-tighter italic">Weekly Contest 432</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    {[
                                        { l: 'D', v: '02' }, { l: 'H', v: '14' }, { l: 'M', v: '22' }
                                    ].map(t => (
                                        <div key={t.l} className="flex flex-col items-center bg-background/60 backdrop-blur-sm border border-primary/20 rounded-lg px-3 py-1 min-w-[50px]">
                                            <span className="text-lg font-black text-primary leading-tight">{t.v}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground leading-none">{t.l}</span>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black italic tracking-widest uppercase text-xs h-10 shadow-lg shadow-primary/20 border-b-4 border-primary/70 active:border-b-0 active:translate-y-[2px] transition-all">
                                    Register Now
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                                    14.5k Participants Already Joined
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Support section */}
            <div className="mt-20 border-t border-border/40 pt-10 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="hover:text-primary cursor-pointer transition-colors">Copyright © 2026 Slope</span>
                    <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
                    <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
                </div>
                <div className="flex items-center gap-4">
                     <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                     <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Server Status: Operational</span>
                </div>
            </div>
        </div>
    )
}