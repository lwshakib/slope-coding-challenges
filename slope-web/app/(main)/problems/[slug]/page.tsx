'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from "next-themes"
import { authClient } from "@/lib/auth-client"
import { Logo } from "@/components/logo"
import { 
    ArrowLeft, Play, Send, Settings, CheckCircle, XCircle, Code2, Terminal, BookOpen, Loader2, ListTree, History,
    LogOut, User, Moon, Sun, Laptop, ChevronDown, X, Lightbulb, MessageSquare, ThumbsUp, SendHorizontal, Sparkles, Info,
    Clock, Cpu, BarChart3, ExternalLink
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
    editorial?: {
        approach: string;
        solutionCode: Record<string, string>;
    };
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
    const router = useRouter()
    const { setTheme } = useTheme()
    const { data: session } = authClient.useSession()
    const slug = params.slug as string
    const [problem, setProblem] = useState<Problem | null>(null)
    const [problemList, setProblemList] = useState<Problem[]>([])
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

    const [submittedCode, setSubmittedCode] = useState<string | null>(null)
    const [submittedLanguage, setSubmittedLanguage] = useState<string | null>(null)
    const [submissionNotes, setSubmissionNotes] = useState<string>("")
    const [distributionData, setDistributionData] = useState<any[]>([])
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRunningTest, setIsRunningTest] = useState(false)
    const [isSavingNotes, setIsSavingNotes] = useState(false)
    const [selectedColor, setSelectedColor] = useState('zinc-500')
    const [isCodeExpanded, setIsCodeExpanded] = useState(false)
    
    // Tabs States
    const [activeResultTab, setActiveResultTab] = useState("case-0")
    const [bottomTab, setBottomTab] = useState("cases")
    const [leftTab, setLeftTab] = useState("description")
    
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
    const [communitySolutions, setCommunitySolutions] = useState<any[]>([])
    const [isLoadingSolutions, setIsLoadingSolutions] = useState(false)
    const [selectedCommunitySolution, setSelectedCommunitySolution] = useState<any | null>(null)
    const [solutionComments, setSolutionComments] = useState<any[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [isPostingComment, setIsPostingComment] = useState(false)
    const codeMetadata = useRef({ language: "javascript", code: "" });

    // Persistence: Load language from local storage
    useEffect(() => {
        const savedLanguage = localStorage.getItem('last-selected-language');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        }
    }, []);

    // Persistence: Load code from local storage or starter code
    useEffect(() => {
        if (problem && slug && language) {
            const savedCode = localStorage.getItem(`code-${slug}-${language}`);
            const codeToSet = savedCode || problem.starterCode?.[language] || "";
            setCode(codeToSet);
            // Update metadata to indicate this code belongs to the NEW language
            codeMetadata.current = { language, code: codeToSet };
        }
    }, [slug, language, problem]);

    // Persistence: Auto-save code to local storage
    useEffect(() => {
        if (code && slug && language) {
            // ONLY save if the code in state actually belongs to the current language
            // and it has actually changed since we last loaded/saved it.
            if (language === codeMetadata.current.language && code !== codeMetadata.current.code) {
                try {
                    localStorage.setItem(`code-${slug}-${language}`, code);
                    codeMetadata.current.code = code;
                } catch (e) {
                    console.error("Failed to save to local storage:", e);
                }
            }
        }
    }, [code, slug, language]);

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

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/${slug}`, {
                    credentials: 'include'
                })
                if (!response.ok) throw new Error('Problem not found')
                const data = await response.json()
                setProblem(data)
            } catch (error) {
                console.error('Failed to fetch problem:', error)
            } finally {
                setIsLoading(false)
            }
        }

        const fetchProblemList = async () => {
             try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems`, {
                    credentials: 'include'
                })
                if (response.ok) {
                    const data = await response.json()
                    // Handle both array and object responses
                    const list = Array.isArray(data) ? data : (data.problems || [])
                    setProblemList(list)
                }
             } catch (e) { console.error("Failed to fetch problem list:", e) }
        }

        if (slug) {
            // Reset existing state for new problem
            setProblem(null);
            setCode("");
            setSubmissionStatus(null);
            setSubmissionOutput(null);
            setSubmissionId(null);
            setSubmittedCode(null);
            setSubmittedLanguage(null);
            setSubmissionNotes("");
            setIsSubmitting(false);
            setBottomTab("cases");
            setLeftTab("description");
            setActiveResultTab("case-0");
            
            fetchProblem();
            fetchProblemList();
            fetchCommunitySolutions();
        }
    }, [slug])

    const fetchDistribution = async (lang: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/${slug}/distribution?language=${lang}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setDistributionData(data);
            }
        } catch (e) {
            console.error("Failed to fetch distribution:", e);
        }
    }

    const fetchCommunitySolutions = async () => {
        setIsLoadingSolutions(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/${slug}/solutions`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCommunitySolutions(data);
            }
        } catch (e) {
            console.error("Failed to fetch community solutions:", e);
        } finally {
            setIsLoadingSolutions(false);
        }
    }

    const handleViewSolution = async (sol: any) => {
        setSelectedCommunitySolution(sol);
        setIsLoadingComments(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/solutions/${sol.id}/comments`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSolutionComments(data);
            }
        } catch (e) {
            console.error("Failed to fetch comments:", e);
        } finally {
            setIsLoadingComments(false);
        }
    }

    const handleLikeSolution = async (solutionId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/solutions/${solutionId}/like`, {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                // Update local state
                setCommunitySolutions(prev => prev.map(s => s.id === solutionId ? { ...s, likes: s.likes + 1 } : s));
                if (selectedCommunitySolution?.id === solutionId) {
                    setSelectedCommunitySolution((prev: any) => ({ ...prev, likes: prev.likes + 1 }));
                }
            }
        } catch (e) {
            console.error("Failed to like solution:", e);
        }
    }

    const handlePostComment = async () => {
        if (!newComment.trim() || !selectedCommunitySolution) return;
        setIsPostingComment(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/solutions/${selectedCommunitySolution.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSolutionComments(prev => [...prev, data]);
                setNewComment("");
                // Update local count in the list
                setCommunitySolutions(prev => prev.map(s => 
                    s.id === selectedCommunitySolution.id 
                    ? { ...s, _count: { ...s._count, comments: s._count.comments + 1 } } 
                    : s
                ));
            }
        } catch (e) {
            console.error("Failed to post comment:", e);
        } finally {
            setIsPostingComment(false);
        }
    }

    // Polling for Submission Status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const startTime = Date.now();
        if (submissionId && (submissionStatus === "PENDING" || !submissionStatus)) {
            interval = setInterval(async () => {
                const elapsed = Date.now() - startTime;
                if (elapsed > 10000) { // 10 seconds timeout
                    setSubmissionStatus("TIMEOUT");
                    setIsSubmitting(false);
                    clearInterval(interval);
                    return;
                }

                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/submission/${submissionId}`, {
                        credentials: 'include',
                        cache: 'no-store'
                    });
                    const data = await response.json();
                    if (data.status !== "PENDING") {
                        setSubmissionStatus(data.status);
                        setSubmissionOutput(data.output);
                        setSubmittedCode(data.code);
                        setSubmittedLanguage(data.language);
                        setSubmissionNotes(data.notes || "");
                        setSubmissionRuntime(data.runtime);
                        setSubmissionMemory(data.memory);
                        setIsSubmitting(false);
                        if (data.status === "ACCEPTED") {
                            fetchDistribution(data.language);
                        }
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Failed to poll submission status:', error);
                    clearInterval(interval);
                    setIsSubmitting(false);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [submissionId, submissionStatus]);

    // Polling for Test Run Status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const startTime = Date.now();
        if (testId && (testStatus === "PENDING" || !testStatus)) {
            interval = setInterval(async () => {
                const elapsed = Date.now() - startTime;
                if (elapsed > 10000) { // 10 seconds timeout
                    setTestStatus("TIMEOUT");
                    setIsRunningTest(false);
                    clearInterval(interval);
                    return;
                }

                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/run/${testId}`, {
                        credentials: 'include',
                        cache: 'no-store'
                    });
                    const data = await response.json();
                    if (data.status !== "PENDING") {
                        setTestStatus(data.status);
                        setTestOutput(data.output);
                        setTestRuntime(data.runtime);
                        setTestMemory(data.memory);
                        setIsRunningTest(false);
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Failed to poll test status:', error);
                    clearInterval(interval);
                    setIsRunningTest(false);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [testId, testStatus]);

    const handleSaveNotes = async (val: string) => {
        setSubmissionNotes(val);
        if (submissionId) {
            setIsSavingNotes(true);
            try {
                await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/submission/${submissionId}/notes`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ notes: val })
                });
            } catch (error) {
                console.error('Failed to save notes:', error);
            } finally {
                setIsSavingNotes(false);
            }
        }
    }

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

    const handleViewSubmission = (sub: Submission) => {
        setSubmissionId(sub.id);
        setSubmissionStatus(sub.status);
        setSubmissionOutput(sub.output || null);
        setSubmittedCode(sub.code);
        setSubmittedLanguage(sub.language);
        setSubmissionNotes(sub.notes || "");
        setSubmissionRuntime(sub.runtime || null);
        setSubmissionMemory(sub.memory || null);
        setLeftTab("result");
    }



    useEffect(() => {
        if (slug && leftTab === "submissions") {
            fetchSubmissions();
        }
        if (slug && leftTab === "solutions") {
            fetchCommunitySolutions();
        }
    }, [slug, leftTab]);

    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        localStorage.setItem('last-selected-language', value);
    }

    const getLanguageExtension = (lang: string) => {
        if (lang === 'python') return [python()]
        if (lang === 'cpp') return [cpp()]
        return [javascript()]
    }

    const handleRun = async () => {
        setIsRunningTest(true);
        setTestStatus("PENDING");
        setTestOutput(null);
        setBottomTab("test-result");
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    code,
                    language,
                    slug
                }),
            })
            
            const data = await response.json()
            if (data.submissionId) {
                setTestId(data.submissionId);
            } else {
                setIsRunningTest(false);
            }
            
        } catch (error) {
            console.error('Failed to run:', error)
            setIsRunningTest(false);
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmissionStatus("PENDING");
        setSubmissionOutput(null);
        setSubmittedCode(code);
        setSubmittedLanguage(language);
        setSubmissionNotes("");
        setLeftTab("result");
        
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
                    slug
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

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/sign-in")
                }
            }
        })
    }

    if (isLoading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <Loader2 className="animate-spin size-10 text-primary" />
            </div>
        )
    }

    if (!problem) {
        return (
            <div className="h-screen flex flex-col justify-center items-center gap-4">
                <h1 className="text-2xl font-bold">Problem Not Found</h1>
                <Button asChild>
                    <Link href="/problemset">Return to Problem Set</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden animate-in fade-in duration-500 bg-background text-foreground">
            {/* Unified IDE Header */}
            <div className="h-14 border-b border-border/40 bg-background/95 backdrop-blur flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center space-x-2 shrink-0">
                        <Logo iconSize={24} textSize="1.2rem" />
                    </Link>
                    <div className="h-6 w-px bg-border/40" />
                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none group">
                                <ListTree className="size-4 group-hover:text-primary transition-colors" />
                                <span className="font-medium hover:underline decoration-border/40 underline-offset-4">Problem List</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 border-r border-border/40 flex flex-col h-full">
                            <SheetHeader className="p-4 border-b border-border/40 bg-muted/20 shrink-0">
                                <SheetTitle className="flex items-center gap-2 text-lg">
                                    <ListTree className="size-5 text-primary" />
                                    Problems
                                </SheetTitle>
                                <SheetDescription className="text-xs">
                                    Browse all available challenges
                                </SheetDescription>
                            </SheetHeader>
                            <ScrollArea className="flex-1">
                                <div className="flex flex-col p-2 gap-1">
                                    {problemList.map(p => (
                                        <SheetClose key={p.id} asChild>
                                            <Link href={`/problems/${p.slug}`} className={cn(
                                                "group flex items-start justify-between p-3 rounded-xl transition-all duration-200 border",
                                                p.slug === slug 
                                                    ? "bg-primary/10 border-primary/20 shadow-sm" 
                                                    : "hover:bg-muted/50 border-transparent hover:border-border/40"
                                            )}>
                                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                    <span className={cn(
                                                        "text-sm font-semibold leading-tight break-words transition-colors", 
                                                        p.slug === slug ? "text-primary" : "text-foreground group-hover:text-primary"
                                                    )}>
                                                        {p.title}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">#{p.id}</span>
                                                </div>
                                                <Badge 
                                                    variant="outline"
                                                    className={cn(
                                                        "ml-3 shrink-0 whitespace-nowrap px-2 py-0.5 border-0 flex items-center h-5 text-[10px] font-bold uppercase tracking-tight",
                                                        p.difficulty === "Easy" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                                                        p.difficulty === "Medium" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                                                        p.difficulty === "Hard" && "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                                    )}
                                                >
                                                    {p.difficulty}
                                                </Badge>
                                            </Link>
                                        </SheetClose>
                                    ))}
                                    {problemList.length === 0 && (
                                        <div className="p-8 text-center text-sm text-muted-foreground">
                                            Loading problems...
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                    <Button onClick={handleRun} variant="secondary" size="sm" className="gap-2 font-bold tracking-wide uppercase text-xs h-8 px-4 bg-muted/50 hover:bg-muted" disabled={isRunningTest || isSubmitting}>
                        {isRunningTest ? (
                             <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                             <Play className="size-3.5 fill-current" />
                        )} 
                        Run
                    </Button>
                    <Button onClick={handleSubmit} size="sm" className={cn(
                        "gap-2 font-bold tracking-wide uppercase text-xs h-8 px-5 shadow-lg shadow-primary/20 transition-all",
                        isSubmitting && "opacity-80 cursor-not-allowed"
                    )} disabled={isSubmitting || isRunningTest}>
                        {isSubmitting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Send className="size-3.5 fill-current" />
                        )} 
                        Submit
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-3">
                         <span className="font-medium text-sm text-foreground/80 tracking-tight hidden md:block">{problem.title}</span>
                         <Badge 
                            variant="outline"
                            className={cn(
                                "capitalize font-bold border-0 bg-opacity-10 px-2 py-0.5 h-5 text-[10px]",
                                problem.difficulty === "Easy" && "bg-green-500 text-green-600",
                                problem.difficulty === "Medium" && "bg-orange-500 text-orange-600",
                                problem.difficulty === "Hard" && "bg-red-500 text-red-600"
                            )}
                        >
                            {problem.difficulty}
                        </Badge>
                     </div>
                     <div className="h-6 w-px bg-border/40" />
                     
                     {/* User Dropdown */}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 rounded-full border border-border/20 bg-muted/20 hover:bg-muted/40 p-0 overflow-hidden">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="User" className="size-full object-cover" />
                                ) : (
                                    <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                                        {session?.user?.name?.[0] || 'U'}
                                    </div>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40 bg-background/95 backdrop-blur-xl p-2 shadow-2xl">
                            <DropdownMenuLabel className="px-3 py-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">{session?.user?.name || 'User'}</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{session?.user?.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/40 mx-2" />
                            
                            <Link href="/profile">
                                <DropdownMenuItem className="rounded-lg px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
                                    <User className="size-4 mr-2" /> Profile
                                </DropdownMenuItem>
                            </Link>
                            
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="rounded-lg px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
                                    <div className="relative size-4 mr-1">
                                        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                        <Moon className="absolute inset-0 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    </div>
                                    <span>Appearance</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="rounded-xl border-border/40 bg-background/95 backdrop-blur-xl p-1">
                                        <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg px-3 py-2 cursor-pointer">
                                            <Sun className="size-4 mr-2" /> Light
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg px-3 py-2 cursor-pointer">
                                            <Moon className="size-4 mr-2" /> Dark
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg px-3 py-2 cursor-pointer">
                                            <Laptop className="size-4 mr-2" /> System
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            <DropdownMenuItem className="rounded-lg px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
                                <Settings className="size-4 mr-2" /> Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40 mx-2" />
                            <DropdownMenuItem 
                                onClick={handleLogout}
                                className="rounded-lg px-3 py-2 cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
                            >
                                <LogOut className="size-4 mr-2" /> Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Content Resizable Layout */}
            <div className="flex-1 overflow-hidden p-4">
                <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl border border-border/40 bg-background/50 backdrop-blur overflow-hidden shadow-2xl">
                
                {/* Left Panel: Tabs (Description, Submissions, Result) */}
                <ResizablePanel defaultSize={40} minSize={25} className="!overflow-visible">
                    <Tabs value={leftTab} onValueChange={setLeftTab} className="h-full flex flex-col">
                        <div className="px-4 pt-2 bg-muted/20 border-b border-border/40">
                             <TabsList className="bg-transparent p-0 h-9 gap-4 w-full justify-start overflow-x-auto no-scrollbar">
                                <TabsTrigger value="description" className="h-9 rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/40 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all shrink-0">
                                    <BookOpen className="size-3.5 mr-2" /> Description
                                </TabsTrigger>
                                <TabsTrigger value="editorial" className="h-9 rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/40 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all shrink-0">
                                    <Lightbulb className="size-3.5 mr-2" /> Editorial
                                </TabsTrigger>
                                <TabsTrigger value="solutions" className="h-9 rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/40 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all shrink-0">
                                    <MessageSquare className="size-3.5 mr-2" /> Solutions
                                </TabsTrigger>
                                <TabsTrigger value="submissions" className="h-9 rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/40 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all shrink-0">
                                    <History className="size-3.5 mr-2" /> Submissions
                                </TabsTrigger>
                                 {(isSubmitting || submissionStatus) && (
                                    <div className="relative group">
                                        <TabsTrigger value="result" className={cn(
                                            "h-9 rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/40 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 pr-8 font-bold text-xs uppercase tracking-widest transition-all",
                                            (!submissionStatus || submissionStatus === "PENDING") && "text-muted-foreground",
                                            submissionStatus === "ACCEPTED" && "text-green-500",
                                            (submissionStatus && submissionStatus !== "ACCEPTED" && submissionStatus !== "PENDING") && "text-red-500"
                                        )}>
                                            {(!submissionStatus || submissionStatus === "PENDING") ? "Running..." : (
                                                submissionStatus === "ACCEPTED" ? "Accepted" : 
                                                submissionStatus === "TIMEOUT" ? "Timeout" : "Wrong Answer"
                                            )}
                                        </TabsTrigger>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSubmissionStatus(null);
                                                setLeftTab("description");
                                            }}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                )}
                             </TabsList>
                        </div>

                        {/* Description Tab */}
                        <TabsContent value="description" className="flex-1 mt-0 p-0 overflow-hidden">
                             <ScrollArea className="h-full">
                                <div className="p-6">
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
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Editorial Tab */}
                        <TabsContent value="editorial" className="flex-1 mt-0 p-0 overflow-hidden">
                             <ScrollArea className="h-full">
                                <div className="p-6 space-y-8">
                                    {problem.editorial ? (
                                        <>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <BookOpen className="size-4 text-primary" />
                                                    </div>
                                                    <h3 className="text-base font-bold tracking-tight">Approach</h3>
                                                </div>
                                                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium text-sm bg-muted/20 p-4 rounded-xl border border-border/40">
                                                    {problem.editorial.approach}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Code2 className="size-4 text-primary" />
                                                    </div>
                                                    <h3 className="text-base font-bold tracking-tight">Official Solution</h3>
                                                </div>
                                                <div className="rounded-xl border border-border/40 overflow-hidden bg-background/50">
                                                    <Tabs defaultValue={Object.keys(problem.editorial.solutionCode)[0]}>
                                                        <div className="bg-muted/30 px-4 pt-2 border-b border-border/40">
                                                            <TabsList className="bg-transparent p-0 h-9 gap-4 w-full justify-start">
                                                                {Object.keys(problem.editorial.solutionCode).map(lang => (
                                                                    <TabsTrigger key={lang} value={lang} className="h-9 rounded-t-lg rounded-b-none border border-transparent data-[state=active]:border-border/40 data-[state=active]:bg-background px-4 font-bold text-[10px] uppercase tracking-widest transition-all">
                                                                        {lang}
                                                                    </TabsTrigger>
                                                                ))}
                                                            </TabsList>
                                                        </div>
                                                        {Object.entries(problem.editorial.solutionCode).map(([lang, code]) => (
                                                            <TabsContent key={lang} value={lang} className="mt-0">
                                                                <div className="p-0 font-mono text-sm overflow-auto max-h-[400px]">
                                                                    <CodeMirror
                                                                        value={code}
                                                                        height="auto"
                                                                        theme={shadcnTheme}
                                                                        extensions={getLanguageExtension(lang)}
                                                                        readOnly={true}
                                                                        basicSetup={{ lineNumbers: true, foldGutter: true }}
                                                                    />
                                                                </div>
                                                            </TabsContent>
                                                        ))}
                                                    </Tabs>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-4">
                                            <div className="size-16 rounded-full bg-muted/20 flex items-center justify-center">
                                                <Lightbulb className="size-8 opacity-20" />
                                            </div>
                                            <p className="text-sm font-medium">Editorial is coming soon.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Solutions Tab */}
                        <TabsContent value="solutions" className="flex-1 mt-0 p-0 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-6 space-y-6">
                                    {selectedCommunitySolution ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center justify-between">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setSelectedCommunitySolution(null)}
                                                    className="gap-2 text-[10px] font-bold uppercase tracking-widest h-8 px-2 hover:bg-muted"
                                                >
                                                    <ArrowLeft className="size-3" /> Back to solutions
                                                </Button>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleLikeSolution(selectedCommunitySolution.id)} className="h-8 gap-1.5 font-bold text-[10px] uppercase tracking-wider hover:bg-muted">
                                                        <ThumbsUp className="size-3" /> {selectedCommunitySolution.likes}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <h2 className="text-2xl font-black tracking-tighter">{selectedCommunitySolution.title}</h2>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-8 border border-border/40">
                                                            <AvatarImage src={selectedCommunitySolution.user.image} />
                                                            <AvatarFallback className="text-xs font-bold">{selectedCommunitySolution.user.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold">{selectedCommunitySolution.user.name}</span>
                                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Shared on {new Date(selectedCommunitySolution.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-p:text-muted-foreground/90 prose-p:leading-relaxed bg-muted/10 p-6 rounded-2xl border border-border/40">
                                                    <ReactMarkdown
                                                        components={{
                                                            code({node, inline, className, children, ...props}: any) {
                                                                const match = /language-(\w+)/.exec(className || '')
                                                                return !inline && match ? (
                                                                    <div className="rounded-xl border border-border/40 overflow-hidden my-6">
                                                                        <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
                                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{match[1]}</span>
                                                                        </div>
                                                                        <CodeMirror
                                                                            value={String(children).replace(/\n$/, '')}
                                                                            theme={vscodeDark}
                                                                            extensions={getLanguageExtension(match[1])}
                                                                            readOnly={true}
                                                                            basicSetup={{ lineNumbers: true, foldGutter: false }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                )
                                                            },
                                                            h1: ({children}) => <h1 className="text-xl font-black tracking-tight mt-8 mb-4 flex items-center gap-3 border-l-4 border-primary pl-4">{children}</h1>,
                                                            h2: ({children}) => <h2 className="text-lg font-black tracking-tight mt-6 mb-3">{children}</h2>,
                                                            ul: ({children}) => <ul className="space-y-2 list-disc pl-5 mb-6 text-muted-foreground">{children}</ul>,
                                                            li: ({children}) => <li className="text-sm font-medium">{children}</li>,
                                                            blockquote: ({children}) => <blockquote className="border-l-4 border-muted px-4 italic text-muted-foreground/60">{children}</blockquote>
                                                        }}
                                                    >
                                                        {selectedCommunitySolution.content}
                                                    </ReactMarkdown>
                                                </div>

                                                <div className="space-y-6 pt-8 border-t border-border/40">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="size-4 text-muted-foreground" />
                                                        <h3 className="text-xs font-bold uppercase tracking-widest">Discussion ({solutionComments.length})</h3>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="relative group">
                                                            <Textarea 
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                placeholder="Share your thoughts..."
                                                                className="min-h-[100px] bg-muted/20 border-border/40 focus-visible:ring-primary/20 p-4 text-sm font-medium rounded-xl resize-none"
                                                            />
                                                            <Button 
                                                                size="sm" 
                                                                disabled={isPostingComment || !newComment.trim()}
                                                                onClick={handlePostComment}
                                                                className="absolute bottom-3 right-3 gap-2 font-bold text-[10px] uppercase tracking-widest h-8"
                                                            >
                                                                {isPostingComment ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                                                                Comment
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {isLoadingComments ? (
                                                                <div className="flex justify-center py-8">
                                                                    <Loader2 className="animate-spin size-6 text-primary" />
                                                                </div>
                                                            ) : solutionComments.length === 0 ? (
                                                                <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/40">
                                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">No comments yet. Start the conversation!</p>
                                                                </div>
                                                            ) : (
                                                                solutionComments.map((comment) => (
                                                                    <div key={comment.id} className="p-4 rounded-xl border border-border/40 bg-card/20 space-y-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="size-6 border border-border/40">
                                                                                <AvatarImage src={comment.user.image} />
                                                                                <AvatarFallback className="text-[10px] font-bold">{comment.user.name[0]}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="flex items-baseline gap-2">
                                                                                <span className="text-xs font-bold">{comment.user.name}</span>
                                                                                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-xs font-medium leading-relaxed text-muted-foreground/90 pl-8">{comment.content}</p>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <MessageSquare className="size-4 text-primary" />
                                                    </div>
                                                    <h3 className="text-base font-bold tracking-tight">Community Solutions</h3>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => router.push(`/problems/${slug}/post-solution`)}
                                                    className="gap-2 font-bold text-[10px] uppercase tracking-widest h-8 px-4"
                                                >
                                                    <SendHorizontal className="size-3" /> Post Solution
                                                </Button>
                                            </div>

                                            {isLoadingSolutions ? (
                                                <div className="flex flex-col items-center justify-center h-[200px] gap-4">
                                                    <Loader2 className="animate-spin size-6 text-primary" />
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Fetching solutions...</p>
                                                </div>
                                            ) : communitySolutions.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-4 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                                                    <MessageSquare className="size-8 opacity-10" />
                                                    <p className="text-sm font-medium">Be the first to share a solution!</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {communitySolutions.map((sol) => (
                                                        <div key={sol.id} onClick={() => handleViewSolution(sol)} className="group p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/50 transition-all duration-300 cursor-pointer">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex gap-4">
                                                                    <div className="size-10 rounded-full border border-border/40 bg-background overflow-hidden shrink-0 mt-1">
                                                                        {sol.user.image ? (
                                                                            <img src={sol.user.image} className="size-full object-cover" alt="" />
                                                                        ) : (
                                                                            <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs uppercase">
                                                                                {sol.user.name[0]}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <h4 className="font-bold text-sm leading-tight text-foreground group-hover:text-primary transition-colors">{sol.title}</h4>
                                                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                                                            <span>{sol.user.name}</span>
                                                                            <span className="size-1 rounded-full bg-border" />
                                                                            <span>{new Date(sol.createdAt).toLocaleDateString()}</span>
                                                                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 bg-primary/5 text-primary border-0">{sol.language}</Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleLikeSolution(sol.id); }} className="h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-wider">
                                                                        <ThumbsUp className="size-3" /> {sol.likes}
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-wider">
                                                                        <MessageSquare className="size-3" /> {sol._count.comments}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Submissions Tab */}
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
                                             <div key={sub.id} onClick={() => handleViewSubmission(sub)} className="p-3 rounded-lg border border-border/40 bg-background/40 hover:bg-background/60 transition-colors group cursor-pointer">
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
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </ScrollArea>
                             )}
                        </TabsContent>

                        {/* Result Tab (For Submissions) */}
                        <TabsContent value="result" className="flex-1 mt-0 bg-card/30 p-0 overflow-hidden">
                            {isSubmitting ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                    <Loader2 className="animate-spin size-8 text-primary" />
                                    <span className="text-sm font-bold">Evaluating Submission...</span>
                                </div>
                            ) : submissionStatus ? (
                                <ScrollArea className="h-full">
                                    <div className="p-6 space-y-8">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <h2 className={cn(
                                                            "text-2xl font-black tracking-tight",
                                                            submissionStatus === "ACCEPTED" ? "text-green-500" : "text-red-500"
                                                        )}>
                                                            {submissionStatus === "ACCEPTED" ? "Accepted" : 
                                                             submissionStatus === "TIMEOUT" ? "Timeout" : "Wrong Answer"}
                                                        </h2>
                                                     {submissionStatus === "TIMEOUT" ? (
                                                         <div className="flex items-center gap-2 text-destructive mt-1">
                                                             <Clock className="size-3.5" />
                                                             <span className="text-xs font-semibold">The request timed out. We're still processing it, please check back in your submissions history.</span>
                                                         </div>
                                                     ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 px-2 py-1 rounded-md border border-border/40">
                                                            {(() => {
                                                                const results = getParsedResults(submissionOutput);
                                                                const passed = results.filter((r: any) => r.status === "PASSED").length;
                                                                return `${passed} / ${results.length || problem?.testCases.length || 0}`;
                                                            })()} testcases passed
                                                        </span>
                                                     )}
                                                  </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="size-6 border border-border/40">
                                                            <AvatarImage src={session?.user?.image || ""} />
                                                            <AvatarFallback className="text-[10px] font-bold">{session?.user?.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="text-xs font-medium">
                                                            <span className="font-bold">{session?.user?.name}</span>
                                                            <span className="text-muted-foreground ml-2">submitted at {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => setLeftTab("editorial")}
                                                        className="h-9 gap-2 font-bold text-[10px] uppercase tracking-widest bg-muted/20 border-border/40 hover:bg-muted/40"
                                                    >
                                                        <BookOpen className="size-3.5" /> Editorial
                                                    </Button>
                                                    {submissionStatus === "ACCEPTED" && (
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => router.push(`/problems/${slug}/post-solution?submissionId=${submissionId}`)}
                                                            className="h-9 gap-2 font-bold text-[10px] uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
                                                        >
                                                            <Send className="size-3.5" /> Solution
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Runtime & Memory Stats - Matching Image 2 */}
                                            {submissionStatus === "ACCEPTED" && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-muted/30 border border-border/40 rounded-2xl p-6 space-y-4 relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                                <Clock className="size-12" />
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                <Clock className="size-3.5" /> Runtime
                                                                <Info className="size-3 text-muted-foreground/40 cursor-help" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-3xl font-black tracking-tight">{(submissionRuntime || 0).toFixed(2)} ms</span>
                                                                    <span className="text-xs font-bold text-muted-foreground">
                                                                        Beats <span className="text-foreground">
                                                                            {distributionData.length > 0 
                                                                                ? (distributionData.filter(d => d.runtime > (submissionRuntime || 0)).length / distributionData.length * 100).toFixed(2)
                                                                                : "100.00"}%
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
                                                                    <Sparkles className="size-3" /> Analyze Complexity
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="bg-muted/30 border border-border/40 rounded-2xl p-6 space-y-4 relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                                <Cpu className="size-12" />
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                <Cpu className="size-3.5" /> Memory
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-3xl font-black tracking-tight">{(submissionMemory || 0).toFixed(2)} KB</span>
                                                                    <span className="text-xs font-bold text-muted-foreground">
                                                                        Beats <span className="text-foreground">
                                                                            {distributionData.length > 0 
                                                                                ? (distributionData.filter(d => d.memory > (submissionMemory || 0)).length / distributionData.length * 100).toFixed(2)
                                                                                : "100.00"}%
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Real Runtime Distribution Chart */}
                                                    <div className="bg-muted/30 border border-border/40 rounded-2xl p-6 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Runtime Distribution</h3>
                                                            <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Your runtime is in the top bracket</div>
                                                        </div>
                                                        <div className="h-40 flex items-end gap-1 px-2 relative">
                                                            {(() => {
                                                                if (distributionData.length === 0) return null;
                                                                
                                                                const runtimes = distributionData.map(d => d.runtime);
                                                                const min = Math.min(...runtimes, submissionRuntime || 0);
                                                                const max = Math.max(...runtimes, submissionRuntime || 0);
                                                                const range = (max - min) || 1;
                                                                const binsCount = 40;
                                                                const binWidth = range / binsCount;
                                                                
                                                                const bins = Array(binsCount).fill(0);
                                                                distributionData.forEach(d => {
                                                                    const binIdx = Math.min(binsCount - 1, Math.floor((d.runtime - min) / binWidth));
                                                                    bins[binIdx]++;
                                                                });
                                                                
                                                                const myBinIdx = Math.min(binsCount - 1, Math.floor(((submissionRuntime || 0) - min) / binWidth));
                                                                const maxFreq = Math.max(...bins, 1);

                                                                return bins.map((freq, i) => {
                                                                    const isSelf = i === myBinIdx;
                                                                    const height = (freq / maxFreq) * 90 + 5;
                                                                    return (
                                                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                                            <div 
                                                                                className={cn(
                                                                                    "w-full rounded-t-sm transition-all duration-300",
                                                                                    isSelf ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/40"
                                                                                )}
                                                                                style={{ height: `${height}%` }}
                                                                            />
                                                                            {isSelf && (
                                                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                                                                     <Avatar className="size-5 border-2 border-primary shadow-xl">
                                                                                        <AvatarImage src={session?.user?.image || ""} />
                                                                                        <AvatarFallback className="text-[8px]">{session?.user?.name?.[0]}</AvatarFallback>
                                                                                    </Avatar>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                        <div className="flex justify-between px-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono">
                                                            {(() => {
                                                                if (distributionData.length === 0) return null;
                                                                const runtimes = distributionData.map(d => d.runtime);
                                                                const min = Math.min(...runtimes, submissionRuntime || 0);
                                                                const max = Math.max(...runtimes, submissionRuntime || 0);
                                                                const step = (max - min) / 6;
                                                                return Array.from({ length: 7 }).map((_, i) => (
                                                                    <span key={i}>{(min + step * i).toFixed(0)}ms</span>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        {(() => {
                                            const results = getParsedResults(submissionOutput);
                                            const failed = results.find((r: any) => r.status !== "PASSED");
                                            const displayCase = failed || results[0];
                                            
                                            if (!displayCase) return null;

                                            return (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Input</h3>
                                                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                                 <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                                                     <Terminal className="size-3" /> Use Testcase
                                                                 </button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {parseInput(displayCase.input).map((param, i) => (
                                                                <div key={param.name} className="bg-muted/30 border border-border/40 p-4 rounded-xl space-y-2">
                                                                    <div className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">{param.name} =</div>
                                                                    <div className="text-sm font-mono font-medium text-foreground">{param.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Output</h3>
                                                        <div className="bg-muted/30 border border-border/40 p-4 rounded-xl">
                                                            <div className="text-sm font-mono font-medium text-foreground">
                                                                 {submissionStatus !== "ACCEPTED" ? (
                                                                     <span className="text-red-500 bg-red-500/10 px-0.5 rounded italic">{displayCase.actual || displayCase.error}</span>
                                                                 ) : (
                                                                     displayCase.actual
                                                                 )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expected</h3>
                                                        <div className="bg-muted/30 border border-border/40 p-4 rounded-xl">
                                                            <div className="text-sm font-mono font-medium text-foreground">{displayCase.expected}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground italic bg-muted/10 p-2 rounded-lg border border-border/20 max-w-max">
                                                         <Info className="size-3" />
                                                         This doesn't support visualization.
                                                    </div>

                                                    {submittedCode && (
                                                         <div className="space-y-4 pt-4">
                                                             <div className="flex items-center justify-between">
                                                                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                     Code | <span className="text-foreground">{submittedLanguage}</span>
                                                                 </h3>
                                                                 <div className="flex items-center gap-2">
                                                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                                                                        <History className="size-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                                                                        <BarChart3 className="size-4" />
                                                                    </Button>
                                                                 </div>
                                                             </div>
                                                             <div className="rounded-2xl border border-border/40 overflow-hidden bg-[#1e1e1e] relative group">
                                                                 <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-background/80 backdrop-blur font-bold text-[10px] uppercase tracking-widest">
                                                                        <ExternalLink className="size-3" /> Full Screen
                                                                    </Button>
                                                                 </div>
                                                                 <div className={cn(
                                                                     "transition-all duration-300 overflow-hidden",
                                                                     isCodeExpanded ? "max-h-none" : "max-h-[300px]"
                                                                 )}>
                                                                     <CodeMirror
                                                                         value={submittedCode}
                                                                         height="auto"
                                                                         theme={shadcnTheme}
                                                                         extensions={getLanguageExtension(submittedLanguage || "javascript")}
                                                                         readOnly={true}
                                                                         basicSetup={{ lineNumbers: true, foldGutter: true }}
                                                                         className="text-xs"
                                                                     />
                                                                 </div>
                                                                 <div className="flex justify-center p-3 border-t border-border/40 bg-muted/5">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                                                                        className="h-6 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <ChevronDown className={cn("size-3 transition-transform", isCodeExpanded && "rotate-180")} />
                                                                        View {isCodeExpanded ? "less" : "more"}
                                                                    </Button>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                    )}

                                                    {/* More Challenges - Matching Image 1 */}
                                                    <div className="space-y-4 pt-4">
                                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">More challenges</h3>
                                                        <div className="flex flex-wrap gap-3">
                                                            {[
                                                                { id: '15', title: '3Sum' },
                                                                { id: '18', title: '4Sum' },
                                                                { id: '167', title: 'Two Sum II - Input Array Is Sorted' }
                                                            ].map((c) => (
                                                                <Link key={c.id} href={`/problems/${c.title.toLowerCase().replace(/ /g, '-')}`} className="group">
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border border-border/40 hover:border-primary/50 rounded-lg transition-all">
                                                                        <div className="size-1.5 rounded-full bg-yellow-500" />
                                                                        <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">{c.id}. {c.title}</span>
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Notes Section - Matching Image 2 */}
                                        <div className="space-y-4 pt-8 border-t border-border/40">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Write your notes here</h3>
                                                </div>
                                                {isSavingNotes && (
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Saving...</span>
                                                )}
                                            </div>
                                            <div className="space-y-4 bg-muted/20 rounded-2xl border border-border/40 overflow-hidden focus-within:border-primary/50 transition-all">
                                                <Textarea 
                                                    value={submissionNotes}
                                                    onChange={(e) => handleSaveNotes(e.target.value)}
                                                    placeholder="Write your notes here..."
                                                    className="w-full min-h-[160px] bg-transparent border-0 focus-visible:ring-0 text-sm italic py-4 px-6 resize-none"
                                                />
                                                <div className="px-6 py-4 bg-muted/10 border-t border-border/40 flex flex-col gap-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select related tags</div>
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">0/5</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {[
                                                            { color: 'bg-zinc-500', name: 'zinc-500' },
                                                            { color: 'bg-yellow-500', name: 'yellow-500' },
                                                            { color: 'bg-blue-500', name: 'blue-500' },
                                                            { color: 'bg-green-500', name: 'green-500' },
                                                            { color: 'bg-pink-500', name: 'pink-500' },
                                                            { color: 'bg-purple-500', name: 'purple-500' },
                                                        ].map((dot, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={() => setSelectedColor(dot.name)}
                                                                className={cn(
                                                                    "size-6 rounded-full border-2 border-transparent transition-all hover:scale-110 flex items-center justify-center",
                                                                    dot.color,
                                                                    selectedColor === dot.name && "border-white/40 ring-2 ring-primary/20"
                                                                )}
                                                            >
                                                                {selectedColor === dot.name && <CheckCircle className="size-3 text-white" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            ) : null}
                        </TabsContent>
                    </Tabs>
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
                                        <TabsTrigger value="test-result" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-bold text-xs uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all">
                                            <Terminal className="size-3.5 mr-2" /> Test Results
                                        </TabsTrigger>
                                     </TabsList>
                                 </div>
                                 
                                 <TabsContent value="test-result" className="flex-1 mt-0 bg-card/30 p-0 flex flex-col overflow-hidden">
                                    {isRunningTest ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background/20 backdrop-blur-sm">
                                            <div className="relative">
                                                <div className="size-16 rounded-full border-2 border-primary/20 animate-[spin_3s_linear_infinite]" />
                                                <div className="size-16 rounded-full border-t-2 border-primary animate-spin absolute inset-0" />
                                                <Loader2 className="animate-spin size-6 text-primary absolute inset-0 m-auto" />
                                            </div>
                                            <div className="space-y-1 text-center">
                                                <p className="text-sm font-bold tracking-tight text-foreground">Running Test Cases</p>
                                            </div>
                                        </div>
                                    ) : testStatus ? (
                                        (() => {
                                            const results = getParsedResults(testOutput);
                                            const totalRuntime = results.reduce((acc: number, r: any) => acc + (r.runtime || 0), 0);
                                            const isAccepted = testStatus === "ACCEPTED";
                                            
                                             if (testStatus === "TIMEOUT") {
                                                return (
                                                    <div className="p-6 space-y-4">
                                                        <div className="flex items-center gap-2 text-destructive">
                                                            <Clock className="size-5" />
                                                            <h3 className="text-lg font-bold">Request Timeout</h3>
                                                        </div>
                                                        <div className="text-sm font-medium text-muted-foreground">
                                                            The request took too long to process. Please try again.
                                                        </div>
                                                    </div>
                                                );
                                            }

                                             if (results.length === 0 && testStatus !== "PENDING") {
                                                return (
                                                    <div className="p-6 space-y-4">
                                                        <div className="flex items-center gap-2 text-destructive">
                                                            <XCircle className="size-5" />
                                                            <h3 className="text-lg font-bold">Execution Error</h3>
                                                        </div>
                                                        <pre className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-xs font-mono text-destructive overflow-auto whitespace-pre-wrap">
                                                            {testOutput}
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
                                                                 {isAccepted ? "Accepted" : 
                                                                  testStatus === "TIMEOUT" ? "Timeout" : "Wrong Answer"}
                                                             </h2>
                                                             <span className="text-xs font-bold text-muted-foreground/60 mt-1">
                                                                 Runtime: {totalRuntime} ms
                                                             </span>
                                                         </div>
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
                                                <p className="text-xs max-w-[240px] mx-auto text-muted-foreground/50 leading-relaxed font-medium">Run your code against sample test cases.</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="cases" className="flex-1 mt-0 bg-card/30 p-0 flex flex-col overflow-hidden">
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
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
