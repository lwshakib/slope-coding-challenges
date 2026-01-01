'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircle2, ChevronLeft, Play, Send, Code2, Beaker, Info } from "lucide-react"
import Link from 'next/link'

interface TestCase {
    input: string;
    expectedOutput: string;
}

interface Problem {
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    category: string;
    tags: string[];
    testCases: TestCase[];
}

export default function ProblemDetailPage() {
    const params = useParams()
    const slug = params.slug as string
    const [problem, setProblem] = useState<Problem | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/${slug}`)
                if (!response.ok) throw new Error('Problem not found')
                const data = await response.json()
                setProblem(data)
            } catch (error) {
                console.error('Failed to fetch problem:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (slug) fetchProblem()
    }, [slug])

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!problem) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Problem Not Found</h1>
                <Button asChild>
                    <Link href="/problemset">Back to Problem Set</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Navigation Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" asChild className="group">
                    <Link href="/problemset">
                        <ChevronLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Problem Set
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Problem Description */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight">{problem.id}. {problem.title}</h1>
                            <Badge 
                                className={cn(
                                    "font-bold px-3 py-1",
                                    problem.difficulty === "Easy" && "bg-green-500/10 text-green-600 border-green-500/20",
                                    problem.difficulty === "Medium" && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                                    problem.difficulty === "Hard" && "bg-red-500/10 text-red-600 border-red-500/20"
                                )}
                            >
                                {problem.difficulty}
                            </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {problem.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-muted/50 text-muted-foreground hover:bg-muted font-medium">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Card className="border-border/40 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/30">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground font-mono">
                                <Info className="size-4 text-primary" /> Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed font-sans mt-4">
                                {problem.description}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Examples & Test Cases */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Beaker className="size-24 rotate-12" />
                        </div>
                        <CardHeader className="border-b border-border/40 bg-muted/40 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground font-mono">
                                    <Beaker className="size-4 text-primary" /> Test Cases
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                     <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-widest border-border/40">
                                        <Play className="size-3 mr-1.5 fill-current" /> Run
                                     </Button>
                                     <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest bg-primary shadow-lg shadow-primary/20">
                                        <Send className="size-3 mr-1.5 fill-current" /> Submit
                                     </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/20">
                                {problem.testCases.map((tc, idx) => (
                                    <div key={idx} className="p-6 space-y-4 hover:bg-primary/[0.02] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Example {idx + 1}</span>
                                            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <CheckCircle2 className="size-2.5 text-primary" />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Input</span>
                                                <pre className="bg-muted/50 p-3 rounded-lg border border-border/30 text-xs font-mono text-foreground overflow-x-auto">
                                                    {tc.input}
                                                </pre>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Expected Output</span>
                                                <pre className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-xs font-mono text-primary font-bold overflow-x-auto">
                                                    {tc.expectedOutput}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/40 bg-muted/20 border-dashed">
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Code2 className="size-5 text-primary" />
                            </div>
                            <h3 className="text-sm font-bold">Code Editor Coming Soon</h3>
                            <p className="text-xs text-muted-foreground">We're building an integrated development environment to test your solutions directly in the browser.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
