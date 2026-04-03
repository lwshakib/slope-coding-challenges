'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
    ArrowUpRight,
    Zap,
    Filter,
    BarChart3,
    Loader2,
    Code2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from 'next/link'

interface Problem {
    id: string;
    slug: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    category: string;
    acceptance: string;
    status: "solved" | "attempted" | "todo";
    tags: string[];
}

export default function Home() {
    const [problems, setProblems] = useState<Problem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [difficultyFilter, setDifficultyFilter] = useState('all')

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/problems`, {
                    credentials: 'include'
                })
                const data = await response.json()
                if (Array.isArray(data)) {
                    setProblems(data)
                }
            } catch (error) {
                console.error('Failed to fetch problems:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProblems()
    }, [])

    const filteredProblems = useMemo(() => {
        return problems.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesDifficulty = difficultyFilter === 'all' || p.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
            return matchesSearch && matchesDifficulty;
        })
    }, [problems, searchQuery, difficultyFilter])

    const solvedCount = problems.filter(p => p.status === 'solved').length;
    const totalCount = problems.length;

    const topics = useMemo(() => {
        const allTags = problems.flatMap(p => p.tags);
        return Array.from(new Set(allTags)).slice(0, 10);
    }, [problems]);

    return (
        <div className="min-h-screen w-full bg-zinc-50 dark:bg-black/95 flex flex-col">
            <main className="flex-1 py-12">
                <div className="container mx-auto px-4 max-w-5xl animate-in fade-in duration-700">

                    <div className="space-y-6">
                            
                            {/* Topics Bar */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                                <Button 
                                    variant={searchQuery === '' ? "secondary" : "ghost"} 
                                    size="sm" 
                                    onClick={() => setSearchQuery('')}
                                    className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
                                >
                                    All Topics
                                </Button>
                                {topics.map(topic => (
                                    <Button 
                                        key={topic} 
                                        variant={searchQuery === topic ? "secondary" : "outline"} 
                                        size="sm" 
                                        onClick={() => setSearchQuery(topic)}
                                        className="rounded-full shrink-0 border-border/50 hover:bg-muted"
                                    >
                                        {topic}
                                    </Button>
                                ))}
                            </div>

                            {/* Filter Section */}
                            <div className="py-2">
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search question titles or tags..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 bg-background/40 border-border/10 focus-visible:ring-primary/20 h-11 rounded-xl"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                            <SelectTrigger className="min-w-[130px] bg-background/40 h-11 rounded-xl border-border/10">
                                                <SelectValue placeholder="Difficulty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Levels</SelectItem>
                                                <SelectItem value="easy">Easy</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="hard">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 border-border/10 rounded-xl">
                                            <Filter className="size-4" />
                                        </Button>
                                        <Button 
                                            onClick={() => {
                                                const random = problems[Math.floor(Math.random() * problems.length)];
                                                if (random) window.location.href = `/problems/${random.slug}`;
                                            }}
                                            className="bg-primary hover:bg-primary/90 h-11 px-6 font-semibold shrink-0 shadow-lg shadow-primary/20 rounded-xl"
                                        >
                                            Pick Random
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Problem Table Wrapper */}
                            <div className="min-h-[400px]">
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
                                                <TableCell colSpan={5} className="text-center py-20">
                                                    <Loader2 className="size-8 animate-spin mx-auto text-primary mb-2" />
                                                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading challenges</span>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredProblems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium">
                                                    No problems matched your filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProblems.map((problem) => (
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
                                                                {problem.tags?.slice(0, 3).map(tag => (
                                                                    <span key={tag} className="text-[10px] font-medium text-muted-foreground/60 hover:text-primary transition-colors">
                                                                        #{tag.toLowerCase().replace(' ', '-')}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold bg-muted/30 px-2 py-1 rounded-md w-fit border border-border/50">
                                                            <Zap className="size-3 text-yellow-500 fill-yellow-500" /> video
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
                        </div>

                    {/* Footer */}
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
            </main>
        </div>
    )
}
