'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Send, Settings, CheckCircle, XCircle, Code2, Terminal, BookOpen, Loader2, ListTree, History } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'

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
    timeComplexity?: string;
    spaceComplexity?: string;
}

interface Submission {
    id: string;
    status: string;
    language: string;
    createdAt: string;
    output?: string;
    runtime?: number;
}

// Custom CodeMirror theme that strictly follows shadcn design system tokens
const shadcnTheme = createTheme({
    theme: 'dark',
    settings: {
        background: 'transparent',
        foreground: 'var(--foreground)',
        caret: 'var(--primary)',
        selection: 'var(--accent)',
        selectionMatch: 'var(--accent)',
        lineHighlight: 'var(--muted)',
        gutterBackground: 'transparent',
        gutterForeground: 'var(--muted-foreground)',
        gutterBorder: 'transparent',
    },
    styles: [
        { tag: t.comment, color: 'var(--muted-foreground)' },
        { tag: t.lineComment, color: 'var(--muted-foreground)' },
        { tag: t.blockComment, color: 'var(--muted-foreground)' },
        { tag: t.docComment, color: 'var(--muted-foreground)' },
        
        { tag: t.keyword, color: 'var(--primary)' },
        { tag: t.controlKeyword, color: 'var(--primary)' },
        { tag: t.operatorKeyword, color: 'var(--primary)' },
        { tag: t.definitionKeyword, color: 'var(--primary)' },
        { tag: t.moduleKeyword, color: 'var(--primary)' },
        
        { tag: t.string, color: 'var(--chart-2)' }, // Greenish in dark mode usually
        { tag: t.regexp, color: 'var(--chart-2)' },
        
        { tag: t.number, color: 'var(--chart-4)' }, // Orange/Yellowish
        { tag: t.bool, color: 'var(--chart-4)' },
        { tag: t.null, color: 'var(--destructive)' },
        
        { tag: t.function(t.variableName), color: 'var(--chart-1)' }, // Blueish
        { tag: t.function(t.propertyName), color: 'var(--chart-1)' },
        
        { tag: t.variableName, color: 'var(--foreground)' },
        { tag: t.propertyName, color: 'var(--foreground)' },
        { tag: t.definition(t.variableName), color: 'var(--foreground)' },
        { tag: t.definition(t.propertyName), color: 'var(--foreground)' },
        
        { tag: t.typeName, color: 'var(--chart-5)' },
        { tag: t.className, color: 'var(--chart-5)' },
        
        { tag: t.operator, color: 'var(--muted-foreground)' },
        { tag: t.punctuation, color: 'var(--muted-foreground)' },
        { tag: t.bracket, color: 'var(--muted-foreground)' },
        { tag: t.meta, color: 'var(--muted-foreground)' },
    ],
});
// Custom CodeMirror theme that follows shadcn design system


export default function ProblemIDE() {
    const params = useParams()
    const slug = params.slug as string
    const [problem, setProblem] = useState<Problem | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [language, setLanguage] = useState("javascript")
    const [code, setCode] = useState("")
    const [submissionId, setSubmissionId] = useState<string | null>(null)
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
    const [submissionOutput, setSubmissionOutput] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeResultTab, setActiveResultTab] = useState("case-0")
    const [bottomTab, setBottomTab] = useState("cases")
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)

    const parseInput = (input: string) => {
        const parts: { name: string, value: string }[] = [];
        let current = "";
        let bracketCount = 0;
        for (let i = 0; i < input.length; i++) {
            if (input[i] === "[" || input[i] === "{") bracketCount++;
            if (input[i] === "]" || input[i] === "}") bracketCount--;
            if (input[i] === "," && bracketCount === 0) {
                const [name, val] = current.split("=");
                if (name && val) parts.push({ name: name.trim(), value: val.trim() });
                current = "";
            } else {
                current += input[i];
            }
        }
        const [name, val] = current.split("=");
        if (name && val) parts.push({ name: name.trim(), value: val.trim() });
        return parts;
    }

    const getParsedResults = () => {
        if (!submissionOutput) return [];
        try {
            return JSON.parse(submissionOutput);
        } catch (e) {
            return [];
        }
    }

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/${slug}`, {
                    credentials: 'include'
                })
                if (!response.ok) throw new Error('Problem not found')
                const data = await response.json()
                setProblem(data)
                
                // Set initial code based on default language
                if (data.starterCode && data.starterCode["javascript"]) {
                    setCode(data.starterCode["javascript"])
                }
            } catch (error) {
                console.error('Failed to fetch problem:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (slug) fetchProblem()
    }, [slug])

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (submissionId && (submissionStatus === "PENDING" || !submissionStatus)) {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/submission/${submissionId}`, {
                        credentials: 'include',
                        cache: 'no-store'
                    });
                    const data = await response.json();
                    
                    console.log('Poll result:', data.status);
                    
                    if (data.status !== "PENDING") {
                        setSubmissionStatus(data.status);
                        setSubmissionOutput(data.output);
                        setIsSubmitting(false);
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Failed to poll submission status:', error);
                    clearInterval(interval);
                }
            }, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [submissionId, submissionStatus]);

    const fetchSubmissions = async () => {
        setIsLoadingSubmissions(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/submissions/${slug}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setSubmissions(data);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    useEffect(() => {
        if (slug && bottomTab === "submissions") {
            fetchSubmissions();
        }
    }, [slug, bottomTab]);

    const handleLanguageChange = (value: string) => {
        setLanguage(value)
        if (problem?.starterCode?.[value]) {
            setCode(problem.starterCode[value])
        }
    }

    const getLanguageExtension = (lang: string) => {
        if (lang === 'python') return [python()]
        if (lang === 'cpp') return [cpp()]
        return [javascript()]
    }

    const handleRunOrSubmit = async (type: "test" | "submit") => {
        setIsSubmitting(true);
        setSubmissionStatus("PENDING");
        setSubmissionOutput(null);
        setBottomTab("results");
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    code,
                    language,
                    slug,
                    submitType: type
                }),
            })
            
            const data = await response.json()
            if (data.submissionId) {
                setSubmissionId(data.submissionId);
            } else {
                setIsSubmitting(false);
            }
            
        } catch (error) {
            console.error('Failed to submit:', error)
            setIsSubmitting(false);
        }
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
        <div className="h-screen w-full flex flex-col gap-4 p-4 overflow-hidden animate-in fade-in duration-500">
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
                    <Button onClick={() => handleRunOrSubmit("test")} variant="outline" size="sm" className="gap-2 font-bold tracking-wide uppercase text-xs h-9">
                        <Play className="size-3.5 fill-current" /> Run
                    </Button>
                    <Button onClick={() => handleRunOrSubmit("submit")} size="sm" className="gap-2 font-bold tracking-wide uppercase text-xs h-9 shadow-lg shadow-primary/20">
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
                            
                                <div className="mt-6 flex flex-col gap-4">
                                    {problem.timeComplexity && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Time Complexity:</span>
                                            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary bg-primary/5">{problem.timeComplexity}</Badge>
                                        </div>
                                    )}
                                    {problem.spaceComplexity && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Space Complexity:</span>
                                            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary bg-primary/5">{problem.spaceComplexity}</Badge>
                                        </div>
                                    )}
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
                                                <SelectItem value="python">Python</SelectItem>
                                                <SelectItem value="cpp">C++</SelectItem>
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
                                        theme={shadcnTheme}
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
                            <Tabs value={bottomTab} onValueChange={setBottomTab} className="h-full flex flex-col">
                                <div className="flex items-center justify-between px-2 pt-2 bg-muted/20 border-b border-border/40">
                                     <TabsList className="h-8 bg-transparent p-0 gap-4">
                                        <TabsTrigger value="cases" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all">
                                            <ListTree className="size-3.5 mr-2" /> Test Cases
                                        </TabsTrigger>
                                        <TabsTrigger value="results" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all">
                                            <Terminal className="size-3.5 mr-2" /> Test Results
                                        </TabsTrigger>
                                        <TabsTrigger value="submissions" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all">
                                            <History className="size-3.5 mr-2" /> Submissions
                                        </TabsTrigger>
                                     </TabsList>
                                 </div>
                                 
                                 <TabsContent value="submissions" className="flex-1 mt-0 bg-card/30 p-4 overflow-hidden">
                                     {isLoadingSubmissions ? (
                                         <div className="h-full flex items-center justify-center">
                                             <Loader2 className="animate-spin size-6 text-primary" />
                                         </div>
                                     ) : submissions.length === 0 ? (
                                         <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                                             No submissions yet.
                                         </div>
                                     ) : (
                                         <ScrollArea className="h-full pr-4">
                                             <div className="space-y-3">
                                                 {submissions.map((sub) => (
                                                     <div key={sub.id} className="p-3 rounded-lg border border-border/40 bg-background/40 hover:bg-background/60 transition-colors group">
                                                         <div className="flex items-center justify-between gap-4">
                                                             <div className="flex items-center gap-3">
                                                                 {sub.status === "ACCEPTED" ? (
                                                                     <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                                         <CheckCircle className="size-4 text-green-500" />
                                                                     </div>
                                                                 ) : (
                                                                     <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                                         <XCircle className="size-4 text-red-500" />
                                                                     </div>
                                                                 )}
                                                                 <div>
                                                                     <div className={cn(
                                                                         "text-sm font-bold",
                                                                         sub.status === "ACCEPTED" ? "text-green-500" : "text-red-500"
                                                                     )}>
                                                                         {sub.status}
                                                                     </div>
                                                                     <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                                         {new Date(sub.createdAt).toLocaleString()}
                                                                     </div>
                                                                 </div>
                                                             </div>
                                                             <div className="flex items-center gap-4">
                                                                <div className="text-right">
                                                                    <div className="text-xs font-mono text-foreground">{sub.language}</div>
                                                                    {sub.runtime !== undefined && (
                                                                        <div className="text-[10px] text-muted-foreground font-mono">{sub.runtime}ms</div>
                                                                    )}
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Code2 className="size-4" />
                                                                </Button>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </ScrollArea>
                                     )}
                                </TabsContent>
                                
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
                                
                                <TabsContent value="results" className="flex-1 mt-0 bg-card/30 p-0 flex flex-col overflow-hidden">
                                    {isSubmitting ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background/20 backdrop-blur-sm">
                                            <div className="relative">
                                                <div className="size-16 rounded-full border-2 border-primary/20 animate-[spin_3s_linear_infinite]" />
                                                <div className="size-16 rounded-full border-t-2 border-primary animate-spin absolute inset-0" />
                                                <Loader2 className="animate-spin size-6 text-primary absolute inset-0 m-auto" />
                                            </div>
                                            <div className="space-y-1 text-center">
                                                <p className="text-sm font-bold tracking-tight text-foreground">Evaluating your solution</p>
                                                <p className="text-xs text-muted-foreground animate-pulse font-medium">Running through test cases...</p>
                                            </div>
                                        </div>
                                    ) : submissionStatus ? (
                                        (() => {
                                            const results = getParsedResults();
                                            const totalRuntime = results.reduce((acc: number, r: any) => acc + (r.runtime || 0), 0);
                                            const isAccepted = submissionStatus === "ACCEPTED";
                                            
                                            if (results.length === 0 && submissionStatus !== "PENDING") {
                                                return (
                                                    <div className="p-6 space-y-4">
                                                        <div className="flex items-center gap-2 text-destructive">
                                                            <XCircle className="size-5" />
                                                            <h3 className="text-lg font-bold">Execution Error</h3>
                                                        </div>
                                                        <pre className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-xs font-mono text-destructive overflow-auto whitespace-pre-wrap">
                                                            {submissionOutput}
                                                        </pre>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="h-full flex flex-col overflow-hidden">
                                                    {/* Success/Failure Header */}
                                                    <div className="p-4 flex items-center justify-between border-b border-border/20 bg-muted/5">
                                                        <div className="flex items-center gap-3">
                                                            <h2 className={cn(
                                                                "text-xl font-black tracking-tight",
                                                                isAccepted ? "text-green-500" : "text-destructive"
                                                            )}>
                                                                {isAccepted ? "Accepted" : "Wrong Answer"}
                                                            </h2>
                                                            <span className="text-xs font-bold text-muted-foreground/60 mt-1">
                                                                Runtime: {totalRuntime} ms
                                                            </span>
                                                        </div>
                                                        {!isAccepted && (
                                                            <Button variant="ghost" size="sm" className="text-blue-500 font-bold hover:text-blue-600 hover:bg-blue-500/5 text-xs">
                                                                Diff
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* Test Case Selection */}
                                                    <div className="px-4 pt-3 border-b border-border/10 bg-muted/5">
                                                        <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="w-full">
                                                            <TabsList className="bg-transparent p-0 h-9 gap-3 w-full justify-start overflow-x-auto no-scrollbar">
                                                                {results.map((res: any, idx: number) => (
                                                                    <TabsTrigger 
                                                                        key={idx} 
                                                                        value={`case-${idx}`}
                                                                        className={cn(
                                                                            "h-9 rounded-t-lg rounded-b-none border border-transparent px-4 font-bold text-xs uppercase tracking-wider transition-all gap-2",
                                                                            "data-[state=active]:border-border/20 data-[state=active]:bg-background data-[state=active]:text-foreground",
                                                                            res.status === "PASSED" ? "text-green-500/70" : "text-destructive/70"
                                                                        )}
                                                                    >
                                                                        {res.status === "PASSED" ? (
                                                                            <CheckCircle className="size-3" />
                                                                        ) : (
                                                                            <XCircle className="size-3" />
                                                                        )}
                                                                        Case {idx + 1}
                                                                    </TabsTrigger>
                                                                ))}
                                                            </TabsList>
                                                        </Tabs>
                                                    </div>

                                                    {/* Selected Case Details */}
                                                    <div className="flex-1 overflow-auto p-4 space-y-6">
                                                        {results.map((res: any, idx: number) => (
                                                            <div key={idx} className={cn(activeResultTab === `case-${idx}` ? "block" : "hidden", "space-y-6")}>
                                                                {/* Input */}
                                                                <div className="space-y-3">
                                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Input</h4>
                                                                    <div className="space-y-2">
                                                                        {parseInput(res.input).map((part, pIdx) => (
                                                                            <div key={pIdx} className="space-y-1">
                                                                                <div className="text-[11px] font-bold text-muted-foreground/80 font-mono ml-1">{part.name} =</div>
                                                                                <div className="bg-muted/30 border border-border/20 rounded-lg p-3 pt-2 font-mono text-sm shadow-sm group hover:border-border/40 transition-colors">
                                                                                    {part.value}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Output */}
                                                                <div className="space-y-3">
                                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Output</h4>
                                                                    <div className={cn(
                                                                        "rounded-lg p-3 font-mono text-sm border shadow-sm transition-all",
                                                                        res.status === "PASSED" 
                                                                            ? "bg-muted/30 border-border/20" 
                                                                            : "bg-destructive/5 border-destructive/20 text-destructive"
                                                                    )}>
                                                                        {res.actual || res.error || "No output"}
                                                                    </div>
                                                                </div>

                                                                {/* Expected */}
                                                                <div className="space-y-3">
                                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Expected</h4>
                                                                    <div className="bg-muted/30 border border-border/20 rounded-lg p-3 font-mono text-sm shadow-sm">
                                                                        {res.expected}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                                            <div className="size-20 rounded-full bg-muted/5 flex items-center justify-center mx-auto border border-border/5 group-hover:scale-105 transition-transform duration-500">
                                                <Play className="size-8 text-muted-foreground/20 ml-1" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-foreground tracking-tight">Ready to Run</p>
                                                <p className="text-xs max-w-[240px] mx-auto text-muted-foreground/50 leading-relaxed font-medium">Submit your code to see comprehensive test results and performance analysis here.</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
