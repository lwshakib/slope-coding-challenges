'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from "next-themes"
import { authClient } from "@/lib/auth-client"
import { Logo } from "@/components/logo"
import { 
    ArrowLeft, Play, Send, Settings, CheckCircle, XCircle, Code2, Terminal, BookOpen, Loader2, ListTree, History,
    LogOut, User, Moon, Sun, Laptop, ChevronDown, ChevronRight, X, Lightbulb, MessageSquare, ThumbsUp, SendHorizontal, Sparkles, Info,
    Clock, Cpu, BarChart3, ExternalLink, Trophy
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'

// ... interfaces ...
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
    functionName: string;
}

interface Submission {
    id: string;
    status: string;
    language: string;
    createdAt: string;
    code: string;
    output?: string;
    runtime?: number;
    memory?: number;
    notes?: string;
}

// Custom CodeMirror theme
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
        { tag: t.string, color: 'var(--chart-2)' },
        { tag: t.regexp, color: 'var(--chart-2)' },
        { tag: t.number, color: 'var(--chart-4)' },
        { tag: t.bool, color: 'var(--chart-4)' },
        { tag: t.null, color: 'var(--destructive)' },
        { tag: t.function(t.variableName), color: 'var(--chart-1)' },
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

export default function ContestProblemIDE() {
    const params = useParams()
    const router = useRouter()
    const { setTheme } = useTheme()
    const { data: session, isPending: isSessionLoading } = authClient.useSession()
    
    const slug = params.slug as string
    const index = parseInt(params.index as string)
    
    const [problem, setProblem] = useState<Problem | null>(null)
    const [contestId, setContestId] = useState<string | null>(null)
    const [totalProblems, setTotalProblems] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    
    const [language, setLanguage] = useState("javascript")
    const [code, setCode] = useState("")
    const [submissionId, setSubmissionId] = useState<string | null>(null)
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
    const [submissionOutput, setSubmissionOutput] = useState<string | null>(null)
    const [submissionRuntime, setSubmissionRuntime] = useState<number | null>(null)
    const [submissionMemory, setSubmissionMemory] = useState<number | null>(null)
    
    const [testId, setTestId] = useState<string | null>(null)
    const [testStatus, setTestStatus] = useState<string | null>(null)
    const [testOutput, setTestOutput] = useState<string | null>(null)
    const [testRuntime, setTestRuntime] = useState<number | null>(null)
    const [testMemory, setTestMemory] = useState<number | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRunningTest, setIsRunningTest] = useState(false)
    
    // Tabs States
    const [activeResultTab, setActiveResultTab] = useState("case-0")
    const [bottomTab, setBottomTab] = useState("cases")
    const [leftTab, setLeftTab] = useState("description")
    
    const codeMetadata = useRef({ language: "javascript", code: "" });

    // Fetch Contest Problem
    useEffect(() => {
        const fetchContestProblem = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/contests/s/${slug}/problem/${index}`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    const error = await response.json();
                    toast.error(error.message || "Failed to fetch problem");
                    router.push(`/contests/${slug}`);
                    return;
                }
                const data = await response.json();
                setProblem(data.problem);
                setContestId(data.contestId);
                setTotalProblems(data.totalProblems);
                
                // Set starter code if no saved code
                const savedCode = localStorage.getItem(`code-${data.problem.slug}-${language}`);
                const codeToSet = savedCode || data.problem.starterCode?.[language] || "";
                setCode(codeToSet);
                codeMetadata.current = { language, code: codeToSet };

            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("Internal server error");
            } finally {
                setIsLoading(false);
            }
        };

        if (slug && !isNaN(index) && !isSessionLoading) {
            if (!session) {
                router.push("/sign-in");
                return;
            }
            fetchContestProblem();
        }
    }, [slug, index, session, isSessionLoading]);

    // Persistence: Language
    useEffect(() => {
        const savedLanguage = localStorage.getItem('last-selected-language');
        if (savedLanguage) setLanguage(savedLanguage);
    }, []);

    // Persistence: Auto-save
    useEffect(() => {
        if (code && problem && language) {
            if (language === codeMetadata.current.language && code !== codeMetadata.current.code) {
                localStorage.setItem(`code-${problem.slug}-${language}`, code);
                codeMetadata.current.code = code;
            }
        }
    }, [code, problem, language]);

    // Handle Language Change
    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        localStorage.setItem('last-selected-language', value);
        if (problem) {
            const savedCode = localStorage.getItem(`code-${problem.slug}-${value}`);
            const codeToSet = savedCode || problem.starterCode?.[value] || "";
            setCode(codeToSet);
            codeMetadata.current = { language: value, code: codeToSet };
        }
    }

    const getLanguageExtension = (lang: string) => {
        if (lang === 'python') return [python()]
        if (lang === 'cpp') return [cpp()]
        return [javascript()]
    }

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

    const getParsedResults = (output: string | null) => {
        if (!output) return [];
        try {
            return JSON.parse(output);
        } catch (e) {
            return [];
        }
    }

    // Run Logic
    const handleRun = async () => {
        if (!problem) return;
        setIsRunningTest(true);
        setTestStatus("PENDING");
        setTestOutput(null);
        setBottomTab("test-result");
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/problems/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code, language, slug: problem.slug, contestId }),
            });
            const data = await response.json();
            if (data.submissionId) setTestId(data.submissionId);
            else setIsRunningTest(false);
        } catch (error) {
            console.error('Run error:', error);
            setIsRunningTest(false);
        }
    }

    // Submit Logic
    const handleSubmit = async () => {
        if (!problem) return;
        setIsSubmitting(true);
        setSubmissionStatus("PENDING");
        setSubmissionOutput(null);
        setLeftTab("result");
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/problems/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code, language, slug: problem.slug, contestId }),
            });
            const data = await response.json();
            if (data.submissionId) setSubmissionId(data.submissionId);
            else setIsSubmitting(false);
        } catch (error) {
            console.error('Submit error:', error);
            setIsSubmitting(false);
        }
    }

    // Poll Submission
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (submissionId && (submissionStatus === "PENDING" || !submissionStatus)) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/problems/submission/${submissionId}`, { credentials: 'include' });
                    const data = await res.json();
                    if (data.status !== "PENDING") {
                        setSubmissionStatus(data.status);
                        setSubmissionOutput(data.output);
                        setSubmissionRuntime(data.runtime);
                        setSubmissionMemory(data.memory);
                        setIsSubmitting(false);
                        clearInterval(interval);
                        
                        if (data.status === "ACCEPTED") {
                            toast.success("Correct Answer!");
                            // If it matches current problem, we might want to suggest going to next
                        }
                    }
                } catch (e) { clearInterval(interval); setIsSubmitting(false); }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [submissionId, submissionStatus]);

    // Poll Test Run
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (testId && (testStatus === "PENDING" || !testStatus)) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/problems/run/${testId}`, { credentials: 'include' });
                    const data = await res.json();
                    if (data.status !== "PENDING") {
                        setTestStatus(data.status);
                        setTestOutput(data.output);
                        setTestRuntime(data.runtime);
                        setTestMemory(data.memory);
                        setIsRunningTest(false);
                        clearInterval(interval);
                    }
                } catch (e) { clearInterval(interval); setIsRunningTest(false); }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [testId, testStatus]);

    if (isLoading || isSessionLoading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin size-10 text-primary" /></div>;
    }

    if (!problem) return null;

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-foreground">
            {/* Header */}
            <div className="h-14 border-b border-border/40 bg-background/95 backdrop-blur flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href={`/contests/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold uppercase tracking-widest text-[10px]">Back to Arena</span>
                    </Link>
                    <div className="h-6 w-px bg-border/40" />
                    <div className="flex items-center gap-2">
                         <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Trophy className="size-4 text-primary" />
                        </div>
                        <span className="font-black italic text-sm tracking-tighter uppercase">{slug.replace(/-/g, ' ')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                    <Button onClick={handleRun} variant="secondary" size="sm" className="gap-2 font-bold tracking-wide uppercase text-xs h-8 px-4" disabled={isRunningTest || isSubmitting}>
                        {isRunningTest ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />} Run
                    </Button>
                    <Button onClick={handleSubmit} size="sm" className="gap-2 font-bold tracking-wide uppercase text-xs h-8 px-5 shadow-xl shadow-primary/20" disabled={isSubmitting || isRunningTest}>
                        {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5 fill-current" />} Submit
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                         <span className="font-black italic text-xs uppercase tracking-tight text-foreground/80">Problem {index + 1} / {totalProblems}</span>
                         <Badge variant="outline" className="capitalize font-bold border-0 bg-primary/10 text-primary px-2 py-0.5 h-5 text-[10px]">
                            {problem.title}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Layout */}
            <div className="flex-1 overflow-hidden p-4">
                <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl border border-border/40 bg-background/50 backdrop-blur overflow-hidden shadow-2xl">
                    <ResizablePanel defaultSize={40} minSize={25}>
                        <Tabs value={leftTab} onValueChange={setLeftTab} className="h-full flex flex-col">
                            <div className="px-4 pt-2 bg-muted/20 border-b border-border/40">
                                <TabsList className="bg-transparent p-0 h-9 gap-4 w-full justify-start overflow-x-auto no-scrollbar">
                                    <TabsTrigger value="description" className="h-9 font-bold text-xs uppercase tracking-widest">Description</TabsTrigger>
                                    {(isSubmitting || submissionStatus) && <TabsTrigger value="result" className="h-9 font-bold text-xs uppercase tracking-widest text-primary">Result</TabsTrigger>}
                                </TabsList>
                            </div>
                            <TabsContent value="description" className="flex-1 mt-0 p-0 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="p-6">
                                        <h1 className="text-2xl font-black italic tracking-tighter mb-4 uppercase">{problem.title}</h1>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <div className="whitespace-pre-wrap font-medium text-muted-foreground leading-relaxed">
                                                {problem.description}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="result" className="flex-1 mt-0 bg-card/30 p-0 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="p-6 space-y-6">
                                        {isSubmitting ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                <Loader2 className="animate-spin size-8 text-primary" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Evaluating...</span>
                                            </div>
                                        ) : submissionStatus ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {submissionStatus === "ACCEPTED" ? (
                                                            <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                                <CheckCircle className="size-6 text-green-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                                <XCircle className="size-6 text-red-500" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h2 className={cn("text-2xl font-black italic uppercase", submissionStatus === "ACCEPTED" ? "text-green-500" : "text-red-500")}>
                                                                {submissionStatus}
                                                            </h2>
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                {submissionStatus === 'ACCEPTED' ? 'Great job! You solved this challenge.' : 'Check your code and try again.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-muted/30 border border-border/40 rounded-2xl p-6 space-y-4">
                                                    <div className="flex items-center gap-6">
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Clock className="size-3" /> Runtime</div>
                                                            <div className="text-xl font-black italic">{submissionRuntime?.toFixed(2) || 0} ms</div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Cpu className="size-3" /> Memory</div>
                                                            <div className="text-xl font-black italic">{submissionMemory?.toFixed(2) || 0} KB</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {submissionStatus === "ACCEPTED" && (
                                                    <div className={cn(
                                                        "rounded-2xl p-6 border-2",
                                                        index + 1 < totalProblems 
                                                            ? "bg-gradient-to-r from-green-500/5 to-primary/5 border-green-500/30" 
                                                            : "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/40"
                                                    )}>
                                                        {index + 1 < totalProblems ? (
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h3 className="font-bold text-sm">Ready for the next challenge?</h3>
                                                                    <p className="text-xs text-muted-foreground">Problem {index + 2} of {totalProblems} is now unlocked.</p>
                                                                </div>
                                                                <Button onClick={() => router.push(`/contest/${slug}/${index + 1}`)} className="gap-2 font-bold uppercase tracking-widest text-[10px] bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20">
                                                                    Next Problem <ChevronRight className="size-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Trophy className="size-8 text-amber-500" />
                                                                    <div>
                                                                        <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400">Contest Complete!</h3>
                                                                        <p className="text-xs text-muted-foreground">You've solved all problems in this contest.</p>
                                                                    </div>
                                                                </div>
                                                                <Button onClick={() => router.push(`/contests/${slug}`)} variant="outline" className="gap-2 font-bold uppercase tracking-widest text-[10px]">
                                                                    View Leaderboard
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : null}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="bg-border/40 w-1.5" />

                    <ResizablePanel defaultSize={60}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={60} minSize={30}>
                                <div className="h-full flex flex-col">
                                    <div className="flex items-center justify-between p-2 border-b border-border/40 bg-muted/20">
                                        <div className="flex items-center gap-2 px-2">
                                            <Code2 className="size-4 text-primary" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Editor</span>
                                        </div>
                                        <Select value={language} onValueChange={handleLanguageChange}>
                                            <SelectTrigger className="h-7 w-[130px] text-[10px] font-bold uppercase border-border/40 bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="javascript">JavaScript</SelectItem>
                                                <SelectItem value="python">Python</SelectItem>
                                                <SelectItem value="cpp">C++</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
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

                            <ResizableHandle withHandle className="bg-border/40 h-1.5" />

                            <ResizablePanel defaultSize={40} minSize={20}>
                                <Tabs value={bottomTab} onValueChange={setBottomTab} className="h-full flex flex-col">
                                    <div className="flex items-center gap-4 px-4 pt-2 bg-muted/20 border-b border-border/40">
                                        <TabsList className="bg-transparent p-0 h-9 gap-4">
                                            <TabsTrigger value="cases" className="h-9 font-bold text-xs uppercase tracking-widest">Test Cases</TabsTrigger>
                                            <TabsTrigger value="test-result" className="h-9 font-bold text-xs uppercase tracking-widest">Console</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <TabsContent value="cases" className="flex-1 mt-0 p-4">
                                        <ScrollArea className="h-full">
                                            <div className="space-y-4">
                                                {problem.testCases.filter(tc => tc.isPublic !== false).map((tc, idx) => (
                                                    <div key={idx} className="space-y-2">
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Case {idx + 1}</div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-muted/30 border border-border/40 rounded-xl p-3 font-mono text-xs">{tc.input}</div>
                                                            <div className="bg-muted/30 border border-border/40 rounded-xl p-3 font-mono text-xs">{tc.expectedOutput}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                    <TabsContent value="test-result" className="flex-1 mt-0 p-4 overflow-hidden">
                                        <ScrollArea className="h-full">
                                            {isRunningTest ? (
                                                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin size-4" /> Running...</div>
                                            ) : testStatus ? (
                                                <div className="space-y-4">
                                                    <div className={cn("text-lg font-black italic uppercase", testStatus === "ACCEPTED" ? "text-green-500" : "text-red-500")}>{testStatus}</div>
                                                    {(() => {
                                                        const results = getParsedResults(testOutput);
                                                        if (results.length === 0) {
                                                            return <pre className="text-xs font-mono text-muted-foreground bg-muted/10 p-4 rounded-xl border border-border/40 overflow-auto whitespace-pre-wrap">{testOutput}</pre>;
                                                        }
                                                        return (
                                                            <div className="space-y-3">
                                                                {results.map((r: any, idx: number) => (
                                                                    <div key={idx} className={cn(
                                                                        "p-3 rounded-xl border",
                                                                        r.status === "PASSED" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                                                                    )}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            {r.status === "PASSED" ? <CheckCircle className="size-4 text-green-500" /> : <XCircle className="size-4 text-red-500" />}
                                                                            <span className={cn("text-xs font-bold uppercase", r.status === "PASSED" ? "text-green-500" : "text-red-500")}>Case {idx + 1}</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                                                                            <div>
                                                                                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Input</div>
                                                                                <div className="bg-muted/20 rounded p-2 truncate">{r.input}</div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Expected</div>
                                                                                <div className="bg-muted/20 rounded p-2 truncate">{r.expected}</div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Output</div>
                                                                                <div className={cn("rounded p-2 truncate", r.status === "PASSED" ? "bg-green-500/10" : "bg-red-500/10")}>{r.actual || r.error}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/30">Run code to see results</div>}
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
