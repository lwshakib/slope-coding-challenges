'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Send, Settings, CheckCircle, XCircle, Code2, Terminal, BookOpen, Loader2, ListTree } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TestCase {
    input: string;
    expectedOutput: string;
    isPublic?: boolean;
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
    starterCode?: Record<string, string>;
}

export default function ProblemIDE() {
    const params = useParams()
    const slug = params.slug as string
    const [problem, setProblem] = useState<Problem | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [language, setLanguage] = useState("typescript")
    const [code, setCode] = useState("")

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/${slug}`)
                if (!response.ok) throw new Error('Problem not found')
                const data = await response.json()
                setProblem(data)
                
                // Set initial code based on default language
                if (data.starterCode && data.starterCode["typescript"]) {
                    setCode(data.starterCode["typescript"])
                }
            } catch (error) {
                console.error('Failed to fetch problem:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (slug) fetchProblem()
    }, [slug])

    const handleLanguageChange = (value: string) => {
        setLanguage(value)
        if (problem?.starterCode?.[value]) {
            setCode(problem.starterCode[value])
        }
    }

    const getLanguageExtension = (lang: string) => {
        if (lang === 'python') return [python()]
        return [javascript({ typescript: lang === 'typescript' })]
    }

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-10rem)] flex justify-center items-center">
                <Loader2 className="animate-spin size-10 text-primary" />
            </div>
        )
    }

    if (!problem) {
        return (
            <div className="h-[calc(100vh-10rem)] flex flex-col justify-center items-center gap-4">
                <h1 className="text-2xl font-bold">Problem Not Found</h1>
                <Button asChild>
                    <Link href="/problemset">Return to Problem Set</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-9rem)] w-full max-w-[1800px] mx-auto px-4 flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-card/50 backdrop-blur border border-border/40 p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="size-8 hover:bg-primary/10 hover:text-primary">
                        <Link href="/problemset">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-muted-foreground">#{problem.id}</span>
                        <h1 className="font-bold text-lg tracking-tight">{problem.title}</h1>
                        <Badge 
                            variant="outline"
                            className={cn(
                                "capitalize font-bold border-0 bg-opacity-10",
                                problem.difficulty === "Easy" && "bg-green-500 text-green-600",
                                problem.difficulty === "Medium" && "bg-orange-500 text-orange-600",
                                problem.difficulty === "Hard" && "bg-red-500 text-red-600"
                            )}
                        >
                            {problem.difficulty}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2 font-bold tracking-wide uppercase text-xs h-9">
                        <Play className="size-3.5 fill-current" /> Run
                    </Button>
                    <Button size="sm" className="gap-2 font-bold tracking-wide uppercase text-xs h-9 shadow-lg shadow-primary/20">
                        <Send className="size-3.5 fill-current" /> Submit
                    </Button>
                </div>
            </div>

            {/* Main Content Resizable Layout */}
            <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-xl border border-border/40 bg-background/50 backdrop-blur overflow-hidden shadow-2xl">
                
                {/* Left Panel: Description */}
                <ResizablePanel defaultSize={40} minSize={25} className="!overflow-visible">
                    <div className="h-full flex flex-col">
                        <div className="flex items-center gap-2 p-3 border-b border-border/40 bg-muted/20">
                            <BookOpen className="size-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</span>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                                <div className="whitespace-pre-wrap font-medium">
                                    {problem.description}
                                </div>
                            </div>
                            
                            <div className="mt-8 flex flex-wrap gap-2">
                                {problem.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-border/40 hover:bg-primary/50 transition-colors w-1.5" />

                {/* Right Panel: Code & Tests */}
                <ResizablePanel defaultSize={60}>
                    <ResizablePanelGroup direction="vertical">
                        
                        {/* Top Right: Code Editor */}
                        <ResizablePanel defaultSize={60} minSize={30}>
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between p-2 border-b border-border/40 bg-muted/20">
                                    <div className="flex items-center gap-2 px-2">
                                        <Code2 className="size-4 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Code</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select value={language} onValueChange={handleLanguageChange}>
                                            <SelectTrigger className="h-7 w-[130px] text-xs font-medium border-border/40 bg-background">
                                                <SelectValue placeholder="Language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="javascript">JavaScript</SelectItem>
                                                <SelectItem value="typescript">TypeScript</SelectItem>
                                                <SelectItem value="python">Python</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
                                            <Settings className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden relative group">
                                    <CodeMirror
                                        value={code}
                                        height="100%"
                                        theme={vscodeDark}
                                        extensions={getLanguageExtension(language)}
                                        onChange={(val) => setCode(val)}
                                        className="h-full text-[13px] font-mono"
                                    />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle className="bg-border/40 hover:bg-primary/50 transition-colors h-1.5" />

                        {/* Bottom Right: Test Cases & Results */}
                        <ResizablePanel defaultSize={40} minSize={20}>
                            <Tabs defaultValue="cases" className="h-full flex flex-col">
                                <div className="flex items-center justify-between px-2 pt-2 bg-muted/20 border-b border-border/40">
                                     <TabsList className="h-8 bg-transparent p-0 gap-4">
                                        <TabsTrigger value="cases" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all">
                                            <ListTree className="size-3.5 mr-2" /> Test Cases
                                        </TabsTrigger>
                                        <TabsTrigger value="results" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all">
                                            <Terminal className="size-3.5 mr-2" /> Test Results
                                        </TabsTrigger>
                                     </TabsList>
                                </div>
                                
                                <TabsContent value="cases" className="flex-1 mt-0 bg-card/30 p-0 overflow-hidden">
                                    {(() => {
                                        const publicCases = problem.testCases.filter(tc => tc.isPublic !== false);
                                        const hiddenCount = problem.testCases.filter(tc => tc.isPublic === false).length;

                                        if (publicCases.length === 0) {
                                            return (
                                                <div className="h-full flex items-center justify-center p-4 text-muted-foreground text-sm font-medium">
                                                    No public test cases available.
                                                </div>
                                            );
                                        }

                                        return (
                                            <Tabs defaultValue="case-0" className="flex-1 flex flex-col h-full">
                                                <div className="px-4 pt-4 border-b border-border/20 bg-muted/10">
                                                    <TabsList className="bg-transparent p-0 h-8 gap-2 w-full justify-start overflow-x-auto no-scrollbar">
                                                        {publicCases.map((_, idx) => (
                                                            <TabsTrigger 
                                                                key={idx} 
                                                                value={`case-${idx}`}
                                                                className="h-8 rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/40 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary transition-all"
                                                            >
                                                                Case {idx + 1}
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                </div>
                                                
                                                <div className="flex-1 relative">
                                                    {publicCases.map((tc, idx) => (
                                                        <TabsContent key={idx} value={`case-${idx}`} className="absolute inset-0 mt-0 p-4 overflow-auto">
                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5">
                                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                                        <div className="size-1.5 rounded-full bg-blue-500" />
                                                                        Input
                                                                    </div>
                                                                    <div className="rounded-lg bg-muted/40 p-3 text-sm font-mono text-foreground border border-border/30 shadow-sm">
                                                                        {tc.input}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                                        <div className="size-1.5 rounded-full bg-green-500" />
                                                                        Expected Output
                                                                    </div>
                                                                    <div className="rounded-lg bg-muted/40 p-3 text-sm font-mono text-foreground border border-border/30 shadow-sm">
                                                                        {tc.expectedOutput}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TabsContent>
                                                    ))}
                                                </div>

                                                {hiddenCount > 0 && (
                                                    <div className="p-2 border-t border-border/20 bg-muted/5 text-center">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-70">
                                                            + {hiddenCount} Hidden Cases
                                                        </span>
                                                    </div>
                                                )}
                                            </Tabs>
                                        );
                                    })()}
                                </TabsContent>
                                
                                <TabsContent value="results" className="flex-1 mt-0 bg-card/30 p-0 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center space-y-2 p-8">
                                        <div className="size-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                                            <Play className="size-5 text-muted-foreground/50 ml-1" />
                                        </div>
                                        <p className="text-sm font-bold">No results yet</p>
                                        <p className="text-xs max-w-[200px] mx-auto text-muted-foreground/60">Run your code to see test results here.</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
