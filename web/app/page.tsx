'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
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
    Search, 
    Zap,
    Filter,
    Loader2
} from "lucide-react"
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
    const [displayLimit, setDisplayLimit] = useState(20)
    const observerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading) {
                    setDisplayLimit(prev => prev + 20);
                }
            },
            { threshold: 1.0 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [isLoading]);

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

    const displayedProblems = useMemo(() => {
        return filteredProblems.slice(0, displayLimit);
    }, [filteredProblems, displayLimit])

    const topics = useMemo(() => {
        const allTags = problems.flatMap(p => p.tags);
        return Array.from(new Set(allTags)).slice(0, 10);
    }, [problems]);

    return (
        <div className="min-h-screen w-full bg-zinc-50 dark:bg-black/95 flex flex-col">
            <main className="flex-1 pb-12">
                <div className="container mx-auto px-4 max-w-5xl animate-in fade-in duration-700">
                    
                    {/* Sticky Header Section */}
                    <div className="sticky top-0 z-50 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-xl py-6 space-y-4 border-b border-transparent transition-all">
                        
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
                            {topics.map((topic: string) => (
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
                    </div>

                    {/* Problem Table Wrapper */}
                    <div className="min-h-[400px] mt-6">
                        <Table>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-20">
                                            <Loader2 className="size-8 animate-spin mx-auto text-primary mb-2" />
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Loading challenges</span>
                                        </TableCell>
                                    </TableRow>
                                ) : displayedProblems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-20 text-muted-foreground font-medium">
                                            No problems matched your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedProblems.map((problem: Problem, index: number) => (
                                        <TableRow 
                                            key={problem.id} 
                                            className="hover:bg-primary/[0.03] transition-colors group cursor-pointer border-border/30 h-16"
                                        >
                                            <TableCell className="pl-6">
                                                <Link href={`/problems/${problem.slug}`} className="flex flex-col">
                                                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                                                        {index + 1}. {problem.title}
                                                    </span>
                                                    <div className="flex gap-2 mt-1">
                                                        {problem.tags?.slice(0, 3).map((tag: string) => (
                                                            <span key={tag} className="text-[10px] font-medium text-muted-foreground/60 hover:text-primary transition-colors">
                                                                #{tag.toLowerCase().replace(' ', '-')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
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
                        
                        {/* Bottom Sentinel for Infinite Scroll */}
                        <div ref={observerRef} className="h-10 w-full flex items-center justify-center mt-4">
                            {!isLoading && displayedProblems.length < filteredProblems.length && (
                                <Loader2 className="size-5 animate-spin text-primary/40" />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
