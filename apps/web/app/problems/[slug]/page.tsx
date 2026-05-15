"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Logo } from "@/components/logo"
import {
  ArrowLeft,
  Play,
  Send,
  Settings,
  CheckCircle,
  XCircle,
  Code2,
  Terminal,
  BookOpen,
  Loader2,
  ListTree,
  History,
  LogOut,
  User,
  Moon,
  Sun,
  Laptop,
  ChevronDown,
  X,
  Lightbulb,
  MessageSquare,
  ThumbsUp,
  SendHorizontal,
  Sparkles,
  Info,
  Clock,
  Cpu,
  BarChart3,
  ExternalLink,
} from "lucide-react"
import ReactMarkdown from "react-markdown"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
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
} from "@workspace/ui/components/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@workspace/ui/components/sheet"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { cpp } from "@codemirror/lang-cpp"
import { createTheme } from "@uiw/codemirror-themes"
import { tags as t } from "@lezer/highlight"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

interface TestCase {
  input: string
  expectedOutput: string
  isPublic?: boolean
}

interface Problem {
  id: string
  slug: string
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
  tags: string[]
  testCases: TestCase[]
  starterCode?: Record<string, string>
  timeComplexity?: string
  spaceComplexity?: string
  editorial?: {
    approach: string
    solutionCode: Record<string, string>
  }
}

interface Submission {
  id: string
  status: string
  language: string
  createdAt: string
  code: string
  output?: string
  runtime?: number
  memory?: number
  notes?: string
}

export default function ProblemIDE() {
  const params = useParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const slug = (params.slug as string) || ""

  const editorTheme = useMemo(
    () =>
      createTheme({
        theme: (theme === "dark" ? "dark" : "light") as "dark" | "light",
        settings: {
          background: "transparent",
          foreground: "var(--foreground)",
          caret: "var(--primary)",
          selection: "var(--accent)",
          selectionMatch: "var(--accent)",
          lineHighlight: "var(--muted)",
          gutterBackground: "transparent",
          gutterForeground: "var(--muted-foreground)",
          gutterBorder: "transparent",
        },
        styles: [
          { tag: t.comment, color: "var(--muted-foreground)" },
          { tag: t.lineComment, color: "var(--muted-foreground)" },
          { tag: t.blockComment, color: "var(--muted-foreground)" },
          { tag: t.docComment, color: "var(--muted-foreground)" },

          { tag: t.keyword, color: "#ec4899" }, // pink-500
          { tag: t.controlKeyword, color: "#ec4899" },
          { tag: t.operatorKeyword, color: "#ec4899" },
          { tag: t.definitionKeyword, color: "#ec4899" },
          { tag: t.moduleKeyword, color: "#ec4899" },

          { tag: t.string, color: "#10b981" }, // emerald-500
          { tag: t.regexp, color: "#10b981" },

          { tag: t.number, color: "#f59e0b" }, // amber-500
          { tag: t.bool, color: "#f59e0b" },
          { tag: t.null, color: "#ef4444" }, // red-500

          { tag: t.function(t.variableName), color: "#3b82f6" }, // blue-500
          { tag: t.function(t.propertyName), color: "#3b82f6" },

          { tag: t.variableName, color: "var(--foreground)" },
          { tag: t.propertyName, color: "var(--foreground)" },
          { tag: t.definition(t.variableName), color: "var(--foreground)" },
          { tag: t.definition(t.propertyName), color: "var(--foreground)" },

          { tag: t.typeName, color: "#8b5cf6" }, // purple-500
          { tag: t.className, color: "#8b5cf6" },

          { tag: t.operator, color: "#ec4899" },
          { tag: t.punctuation, color: "var(--muted-foreground)" },
          { tag: t.bracket, color: "var(--muted-foreground)" },
          { tag: t.meta, color: "var(--muted-foreground)" },
        ],
      }),
    [theme]
  )
  const [problem, setProblem] = useState<Problem | null>(null)
  const [problemList, setProblemList] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [language, setLanguage] = useState("cpp")
  const [code, setCode] = useState("")

  // Toggle theme with 'D' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d" && e.target === document.body) {
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [theme, setTheme])
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)
  const [submissionOutput, setSubmissionOutput] = useState<string | null>(null)
  const [submissionRuntime, setSubmissionRuntime] = useState<number | null>(
    null
  )
  const [submissionMemory, setSubmissionMemory] = useState<number | null>(null)

  const [testId, setTestId] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [testOutput, setTestOutput] = useState<string | null>(null)
  const [testRuntime, setTestRuntime] = useState<number | null>(null)
  const [testMemory, setTestMemory] = useState<number | null>(null)

  const [submittedCode, setSubmittedCode] = useState<string | null>(null)
  const [submittedLanguage, setSubmittedLanguage] = useState<string | null>(
    null
  )
  const [submissionNotes, setSubmissionNotes] = useState<string>("")
  const [distributionData, setDistributionData] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [selectedColor, setSelectedColor] = useState("zinc-500")
  const [isCodeExpanded, setIsCodeExpanded] = useState(false)

  // Tabs States
  const [activeResultTab, setActiveResultTab] = useState("case-0")
  const [bottomTab, setBottomTab] = useState("cases")
  const [leftTab, setLeftTab] = useState("description")

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const [communitySolutions, setCommunitySolutions] = useState<any[]>([])
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false)
  const [selectedCommunitySolution, setSelectedCommunitySolution] = useState<
    any | null
  >(null)
  const [solutionComments, setSolutionComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isPostingComment, setIsPostingComment] = useState(false)
  const codeMetadata = useRef({ language: "cpp", code: "" })

  // Persistence: Load language from local storage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("last-selected-language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Persistence: Load code from local storage or starter code
  useEffect(() => {
    if (problem && slug && language) {
      const savedCode = localStorage.getItem(`code-${slug}-${language}`)
      const codeToSet = savedCode || problem.starterCode?.[language] || ""
      setCode(codeToSet)
      // Update metadata to indicate this code belongs to the NEW language
      codeMetadata.current = { language, code: codeToSet }
    }
  }, [slug, language, problem])

  // Persistence: Auto-save code to local storage
  useEffect(() => {
    if (code && slug && language) {
      // ONLY save if the code in state actually belongs to the current language
      // and it has actually changed since we last loaded/saved it.
      if (
        language === codeMetadata.current.language &&
        code !== codeMetadata.current.code
      ) {
        try {
          localStorage.setItem(`code-${slug}-${language}`, code)
          codeMetadata.current.code = code
        } catch (e) {
          console.error("Failed to save to local storage:", e)
        }
      }
    }
  }, [code, slug, language])

  const parseInput = (input: string) => {
    const parts: { name: string; value: string }[] = []
    let current = ""
    let bracketCount = 0
    for (let i = 0; i < input.length; i++) {
      if (input[i] === "[" || input[i] === "{") bracketCount++
      if (input[i] === "]" || input[i] === "}") bracketCount--
      if (input[i] === "," && bracketCount === 0) {
        const [name, val] = current.split("=")
        if (name && val) parts.push({ name: name.trim(), value: val.trim() })
        current = ""
      } else {
        current += input[i]
      }
    }
    const [name, val] = current.split("=")
    if (name && val) parts.push({ name: name.trim(), value: val.trim() })
    return parts
  }

  const getParsedResults = (output: string | null) => {
    if (!output) return []
    try {
      return JSON.parse(output)
    } catch (e) {
      return []
    }
  }

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/${slug}`,
          {
            credentials: "include",
          }
        )
        if (!response.ok) throw new Error("Problem not found")
        const json = await response.json()
        const data = json.data || json
        setProblem(data)
      } catch (error) {
        console.error("Failed to fetch problem:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchProblemList = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems`,
          {
            credentials: "include",
          }
        )
        if (response.ok) {
          const json = await response.json()
          const data = json.data || json
          // Handle both array and object responses
          const list = Array.isArray(data) ? data : data.problems || []
          setProblemList(list)
        }
      } catch (e) {
        console.error("Failed to fetch problem list:", e)
      }
    }

    if (slug) {
      // Reset existing state for new problem
      setProblem(null)
      setCode("")
      setSubmissionStatus(null)
      setSubmissionOutput(null)
      setSubmissionId(null)
      setSubmittedCode(null)
      setSubmittedLanguage(null)
      setSubmissionNotes("")
      setIsSubmitting(false)
      setBottomTab("cases")
      setLeftTab("description")
      setActiveResultTab("case-0")

      fetchProblem()
      fetchProblemList()
      fetchCommunitySolutions()
    }
  }, [slug])

  const fetchDistribution = async (lang: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/${slug}/distribution?language=${lang}`,
        {
          credentials: "include",
        }
      )
      if (response.ok) {
        const json = await response.json()
        const data = json.data || json
        setDistributionData(data)
      }
    } catch (e) {
      console.error("Failed to fetch distribution:", e)
    }
  }

  const fetchCommunitySolutions = async () => {
    setIsLoadingSolutions(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/${slug}/solutions`,
        {
          credentials: "include",
        }
      )
      if (response.ok) {
        const json = await response.json()
        const data = json.data || json
        setCommunitySolutions(data)
      }
    } catch (e) {
      console.error("Failed to fetch community solutions:", e)
    } finally {
      setIsLoadingSolutions(false)
    }
  }

  const handleViewSolution = async (sol: any) => {
    setSelectedCommunitySolution(sol)
    setIsLoadingComments(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/solutions/${sol.id}/comments`,
        {
          credentials: "include",
        }
      )
      if (response.ok) {
        const json = await response.json()
        const data = json.data || json
        setSolutionComments(data)
      }
    } catch (e) {
      console.error("Failed to fetch comments:", e)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleLikeSolution = async (solutionId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/solutions/${solutionId}/like`,
        {
          method: "POST",
          credentials: "include",
        }
      )
      if (response.ok) {
        // Update local state
        setCommunitySolutions((prev) =>
          prev.map((s) =>
            s.id === solutionId ? { ...s, likes: s.likes + 1 } : s
          )
        )
        if (selectedCommunitySolution?.id === solutionId) {
          setSelectedCommunitySolution((prev: any) => ({
            ...prev,
            likes: prev.likes + 1,
          }))
        }
      }
    } catch (e) {
      console.error("Failed to like solution:", e)
    }
  }

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedCommunitySolution) return
    setIsPostingComment(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/solutions/${selectedCommunitySolution.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newComment }),
          credentials: "include",
        }
      )
      if (response.ok) {
        const json = await response.json()
        const data = json.data || json
        setSolutionComments((prev) => [...prev, data])
        setNewComment("")
        // Update local count in the list
        setCommunitySolutions((prev) =>
          prev.map((s) =>
            s.id === selectedCommunitySolution.id
              ? {
                  ...s,
                  _count: { ...s._count, comments: s._count.comments + 1 },
                }
              : s
          )
        )
      }
    } catch (e) {
      console.error("Failed to post comment:", e)
    } finally {
      setIsPostingComment(false)
    }
  }

  // Polling for Submission Status
  useEffect(() => {
    let interval: NodeJS.Timeout
    const startTime = Date.now()
    if (submissionId && (submissionStatus === "PENDING" || !submissionStatus)) {
      interval = setInterval(async () => {
        const elapsed = Date.now() - startTime
        if (elapsed > 10000) {
          // 10 seconds timeout
          setSubmissionStatus("TIMEOUT")
          setIsSubmitting(false)
          clearInterval(interval)
          return
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/submission/${submissionId}`,
            {
              credentials: "include",
              cache: "no-store",
            }
          )
          const json = await response.json()
          const data = json.data || json
          if (data.status !== "PENDING") {
            setSubmissionStatus(data.status)
            setSubmissionOutput(data.output)
            setSubmittedCode(data.code)
            setSubmittedLanguage(data.language)
            setSubmissionNotes(data.notes || "")
            setSubmissionRuntime(data.runtime)
            setSubmissionMemory(data.memory)
            setIsSubmitting(false)
            if (data.status === "ACCEPTED") {
              fetchDistribution(data.language)
            }
            clearInterval(interval)
          }
        } catch (error) {
          console.error("Failed to poll submission status:", error)
          clearInterval(interval)
          setIsSubmitting(false)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [submissionId, submissionStatus])

  // Polling for Test Run Status
  useEffect(() => {
    let interval: NodeJS.Timeout
    const startTime = Date.now()
    if (testId && (testStatus === "PENDING" || !testStatus)) {
      interval = setInterval(async () => {
        const elapsed = Date.now() - startTime
        if (elapsed > 10000) {
          // 10 seconds timeout
          setTestStatus("TIMEOUT")
          setIsRunningTest(false)
          clearInterval(interval)
          return
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/run/${testId}`,
            {
              credentials: "include",
              cache: "no-store",
            }
          )
          const json = await response.json()
          const data = json.data || json
          if (data.status !== "PENDING") {
            setTestStatus(data.status)
            setTestOutput(data.output)
            setTestRuntime(data.runtime)
            setTestMemory(data.memory)
            setIsRunningTest(false)
            clearInterval(interval)
          }
        } catch (error) {
          console.error("Failed to poll test status:", error)
          clearInterval(interval)
          setIsRunningTest(false)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [testId, testStatus])

  const handleSaveNotes = async (val: string) => {
    setSubmissionNotes(val)
    if (submissionId) {
      setIsSavingNotes(true)
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/submission/${submissionId}/notes`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ notes: val }),
          }
        )
      } catch (error) {
        console.error("Failed to save notes:", error)
      } finally {
        setIsSavingNotes(false)
      }
    }
  }

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/submissions/${slug}`,
        {
          credentials: "include",
        }
      )
      const json = await response.json()
      const data = json.data || json
      if (Array.isArray(data)) {
        setSubmissions(data)
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  const handleViewSubmission = (sub: Submission) => {
    setSubmissionId(sub.id)
    setSubmissionStatus(sub.status)
    setSubmissionOutput(sub.output || null)
    setSubmittedCode(sub.code)
    setSubmittedLanguage(sub.language)
    setSubmissionNotes(sub.notes || "")
    setSubmissionRuntime(sub.runtime || null)
    setSubmissionMemory(sub.memory || null)
    setLeftTab("result")
  }

  useEffect(() => {
    if (slug && leftTab === "submissions") {
      fetchSubmissions()
    }
    if (slug && leftTab === "solutions") {
      fetchCommunitySolutions()
    }
  }, [slug, leftTab])

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    localStorage.setItem("last-selected-language", value)
  }

  const getLanguageExtension = (lang: string) => {
    if (lang === "python") return [python()]
    if (lang === "cpp") return [cpp()]
    return [javascript({ jsx: true, typescript: true })]
  }

  const handleRun = async () => {
    setIsRunningTest(true)
    setTestStatus("PENDING")
    setTestOutput(null)
    setBottomTab("test-result")

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            code,
            language,
            slug,
          }),
        }
      )

      const json = await response.json()
      const data = json.data || json
      if (data.submissionId) {
        setTestId(data.submissionId)
      } else {
        setIsRunningTest(false)
      }
    } catch (error) {
      console.error("Failed to run:", error)
      setIsRunningTest(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionStatus("PENDING")
    setSubmissionOutput(null)
    setSubmittedCode(code)
    setSubmittedLanguage(language)
    setSubmissionNotes("")
    setLeftTab("result")

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            code,
            language,
            slug,
          }),
        }
      )

      const json = await response.json()
      const data = json.data || json
      if (data.submissionId) {
        setSubmissionId(data.submissionId)
      } else {
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Failed to submit:", error)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Problem Not Found</h1>
        <Button asChild>
          <Link href="/problemset">Return to Problem Set</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full animate-in flex-col overflow-hidden bg-background text-foreground duration-500 fade-in">
      {/* Unified IDE Header */}
      <div className="z-50 flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center space-x-2">
            <Logo iconSize={24} textSize="1.2rem" />
          </Link>
          <div className="h-6 w-px bg-border/40" />
          <Sheet>
            <SheetTrigger asChild>
              <button className="group flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground">
                <ListTree className="size-4 transition-colors group-hover:text-primary" />
                <span className="font-medium decoration-border/40 underline-offset-4 hover:underline">
                  Problem List
                </span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex h-full w-[85vw] flex-col border-r border-border/40 p-0 sm:w-[400px]"
            >
              <SheetHeader className="shrink-0 border-b border-border/40 bg-muted/20 p-4">
                <SheetTitle className="flex items-center gap-2 text-lg">
                  <ListTree className="size-5 text-primary" />
                  Problems
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Browse all available challenges
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                  {problemList.map((p, index) => (
                    <SheetClose key={p.id} asChild>
                      <Link
                        href={`/problems/${p.slug}`}
                        className={cn(
                          "group flex items-start justify-between rounded-xl border p-3 transition-all duration-200",
                          p.slug === slug
                            ? "border-primary/20 bg-primary/10 shadow-sm"
                            : "border-transparent hover:border-border/40 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span
                            className={cn(
                              "text-sm leading-tight font-semibold break-words transition-colors",
                              p.slug === slug
                                ? "text-primary"
                                : "text-foreground group-hover:text-primary"
                            )}
                          >
                            {p.title}
                          </span>
                          <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                            #{index + 1}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-3 flex h-5 shrink-0 items-center border-0 px-2 py-0.5 text-[10px] font-bold tracking-tight whitespace-nowrap uppercase",
                            p.difficulty === "Easy" &&
                              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                            p.difficulty === "Medium" &&
                              "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                            p.difficulty === "Hard" &&
                              "bg-rose-500/15 text-rose-600 dark:text-rose-400"
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

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
          <Button
            onClick={handleRun}
            variant="secondary"
            size="sm"
            className="h-8 gap-2 bg-muted/50 px-4 text-xs font-bold tracking-wide uppercase hover:bg-muted"
            disabled={isRunningTest || isSubmitting}
          >
            {isRunningTest ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
            Run
          </Button>
          <Button
            onClick={handleSubmit}
            size="sm"
            className={cn(
              "h-8 gap-2 px-5 text-xs font-bold tracking-wide uppercase shadow-lg shadow-primary/20 transition-all",
              isSubmitting && "cursor-not-allowed opacity-80"
            )}
            disabled={isSubmitting || isRunningTest}
          >
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
            <span className="hidden text-sm font-medium tracking-tight text-foreground/80 md:block">
              {problem.title}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "bg-opacity-10 h-5 border-0 px-2 py-0.5 text-[10px] font-bold capitalize",
                problem.difficulty === "Easy" && "bg-green-500 text-green-600",
                problem.difficulty === "Medium" &&
                  "bg-orange-500 text-orange-600",
                problem.difficulty === "Hard" && "bg-red-500 text-red-600"
              )}
            >
              {problem.difficulty}
            </Badge>
          </div>
          <div className="h-6 w-px bg-border/40" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative size-9 overflow-hidden rounded-full border border-border/20 bg-muted/20 transition-all duration-300 hover:bg-muted/40"
          >
            <Sun className="size-[1.2rem] scale-100 rotate-0 text-foreground transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-[1.2rem] scale-0 rotate-90 text-foreground transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Main IDE Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: Description, Submissions, Solutions */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <Tabs
              value={leftTab}
              onValueChange={setLeftTab}
              className="flex h-full flex-col"
            >
              <div className="flex shrink-0 items-center border-b border-border/40 bg-muted/20 px-4 pt-2">
                <TabsList className="h-9 gap-6 bg-transparent p-0">
                  <TabsTrigger
                    value="description"
                    className="h-full rounded-none border-b-2 border-transparent px-0 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <BookOpen className="mr-2 size-3.5" /> Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="submissions"
                    className="h-full rounded-none border-b-2 border-transparent px-0 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <History className="mr-2 size-3.5" /> Submissions
                  </TabsTrigger>
                  <TabsTrigger
                    value="solutions"
                    className="h-full rounded-none border-b-2 border-transparent px-0 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <Lightbulb className="mr-2 size-3.5" /> Solutions
                  </TabsTrigger>
                  {submissionStatus && (
                    <TabsTrigger
                      value="result"
                      className="h-full rounded-none border-b-2 border-transparent px-0 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      <CheckCircle className="mr-2 size-3.5" /> Result
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent
                value="description"
                className="mt-0 flex flex-1 flex-col overflow-hidden bg-card/30 p-0"
              >
                <ScrollArea className="h-full flex-1">
                  <div className="mx-auto max-w-3xl space-y-8 p-8">
                    <div className="space-y-4">
                      <h1 className="text-3xl font-black tracking-tight">
                        {problem.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          className={cn(
                            "border-0 px-3 py-1 text-[10px] font-black tracking-widest uppercase",
                            problem.difficulty === "Easy" &&
                              "bg-emerald-500/10 text-emerald-500",
                            problem.difficulty === "Medium" &&
                              "bg-amber-500/10 text-amber-500",
                            problem.difficulty === "Hard" &&
                              "bg-rose-500/10 text-rose-500"
                          )}
                        >
                          {problem.difficulty}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-border/40 bg-muted/30 px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
                        >
                          {problem.category}
                        </Badge>
                        <div className="mx-1 h-4 w-px bg-border/40" />
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <ThumbsUp className="size-3.5" />
                          <span className="text-xs font-bold">1.2k</span>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert prose-headings:font-black prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/40 prose-pre:rounded-xl max-w-none">
                      <ReactMarkdown>{problem.description}</ReactMarkdown>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                      {problem.tags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer border-border/40 bg-muted/50 px-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all hover:border-primary/40 hover:text-primary"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="submissions"
                className="mt-0 flex flex-1 flex-col overflow-hidden bg-card/30 p-0"
              >
                <ScrollArea className="h-full flex-1">
                  <div className="space-y-4 p-4">
                    {isLoadingSubmissions ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="size-6 animate-spin text-primary" />
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No submissions yet
                      </div>
                    ) : (
                      submissions.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => handleViewSubmission(sub)}
                          className="group cursor-pointer rounded-2xl border border-border/40 bg-muted/20 p-4 transition-all hover:border-primary/30 hover:bg-muted/40"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "text-[10px] font-black tracking-widest uppercase",
                                  sub.status === "ACCEPTED"
                                    ? "text-emerald-500"
                                    : "text-rose-500"
                                )}
                              >
                                {sub.status}
                              </span>
                              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                {sub.language}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground/60">
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold">
                            <div className="flex items-center gap-1.5 text-foreground/80">
                              <Clock className="size-3 text-primary" />
                              <span>{sub.runtime || 0} ms</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-foreground/80">
                              <Cpu className="size-3 text-primary" />
                              <span>
                                {((sub.memory || 0) / 1024 / 1024).toFixed(1)}{" "}
                                MB
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="solutions"
                className="mt-0 flex flex-1 flex-col overflow-hidden bg-card/30 p-0"
              >
                {selectedCommunitySolution ? (
                  <div className="flex h-full flex-col overflow-hidden bg-background">
                    <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCommunitySolution(null)}
                        className="h-8 gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase hover:text-foreground"
                      >
                        <ArrowLeft className="size-3.5" /> Back to solutions
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleLikeSolution(selectedCommunitySolution.id)
                          }
                          className="h-8 gap-2 border-border/40 text-xs font-bold hover:bg-primary/5"
                        >
                          <ThumbsUp className="size-3.5" />{" "}
                          {selectedCommunitySolution.likes}
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="space-y-8 p-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {selectedCommunitySolution.user.name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold">
                                {selectedCommunitySolution.user.name}
                              </p>
                              <p className="text-[10px] font-medium text-muted-foreground">
                                {new Date(
                                  selectedCommunitySolution.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <h2 className="text-xl font-black tracking-tight">
                            {selectedCommunitySolution.title}
                          </h2>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                              Solution Code
                            </h3>
                            <Badge
                              variant="outline"
                              className="border-border/40 bg-muted/30 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
                            >
                              {selectedCommunitySolution.language}
                            </Badge>
                          </div>
                          <div className="overflow-hidden rounded-2xl border border-border/40 bg-muted/5 shadow-xl">
                            <CodeMirror
                              value={selectedCommunitySolution.code}
                              height="auto"
                              theme={editorTheme}
                              extensions={getLanguageExtension(
                                selectedCommunitySolution.language
                              )}
                              readOnly={true}
                              basicSetup={{
                                lineNumbers: true,
                                foldGutter: true,
                              }}
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-6 border-t border-border/40 pt-6">
                          <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            Comments ({solutionComments.length})
                          </h3>
                          <div className="space-y-6">
                            {solutionComments.map((comment) => (
                              <div key={comment.id} className="flex gap-4">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                  {comment.user.name?.[0]}
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold">
                                      {comment.user.name}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                      {new Date(
                                        comment.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm leading-relaxed text-foreground/80">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4 pt-4">
                            <Avatar className="size-8 shrink-0 border border-border/40">
                              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                YOU
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                              <Textarea
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[100px] resize-none rounded-xl border-border/40 bg-muted/20 px-4 py-4 text-sm italic focus-visible:ring-primary/20"
                              />
                              <Button
                                onClick={handlePostComment}
                                disabled={
                                  isPostingComment || !newComment.trim()
                                }
                                className="h-9 gap-2 rounded-lg px-6 text-xs font-bold tracking-widest uppercase"
                              >
                                {isPostingComment ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <MessageSquare className="size-3.5" />
                                )}
                                Post Comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <ScrollArea className="h-full flex-1">
                    <div className="space-y-4 p-4">
                      <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                          Community Solutions
                        </h3>
                      </div>
                      {isLoadingSolutions ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                      ) : communitySolutions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          No solutions shared yet
                        </div>
                      ) : (
                        communitySolutions.map((sol) => (
                          <div
                            key={sol.id}
                            onClick={() => handleViewSolution(sol)}
                            className="group cursor-pointer space-y-4 rounded-2xl border border-border/40 bg-muted/10 p-5 transition-all hover:border-primary/30 hover:bg-muted/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="size-6 border border-border/40">
                                  <AvatarImage src={sol.user.image} />
                                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                    {sol.user.name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[11px] font-bold text-foreground/80">
                                  {sol.user.name}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-border/40 bg-muted/20 text-[9px] font-bold tracking-widest uppercase"
                              >
                                {sol.language}
                              </Badge>
                            </div>
                            <h4 className="line-clamp-1 text-sm font-bold transition-colors group-hover:text-primary">
                              {sol.title}
                            </h4>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <ThumbsUp className="size-3" />
                                <span>{sol.likes}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="size-3" />
                                <span>{sol._count.comments}</span>
                              </div>
                              <span className="ml-auto font-medium opacity-60">
                                {new Date(sol.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <TabsContent
                value="result"
                className="mt-0 flex flex-1 flex-col overflow-hidden bg-card/30 p-0"
              >
                {isSubmitting ? (
                  <div className="flex h-full flex-col items-center justify-center gap-6 bg-background/50 backdrop-blur-sm">
                    <div className="relative">
                      <div className="size-24 animate-[spin_4s_linear_infinite] rounded-full border-2 border-primary/10" />
                      <div className="absolute inset-0 size-24 animate-spin rounded-full border-t-2 border-primary" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                          <Cpu className="size-6 animate-pulse text-primary" />
                        </div>
                      </div>
                    </div>
                    <div className="animate-in space-y-2 text-center duration-700 fade-in slide-in-from-bottom-4">
                      <h3 className="text-xl font-black tracking-tight text-foreground">
                        Evaluating Solution
                      </h3>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                        Running against hidden test cases
                      </p>
                    </div>
                  </div>
                ) : submissionStatus ? (
                  <ScrollArea className="h-full flex-1">
                    <div className="mx-auto max-w-3xl space-y-12 p-8">
                      {/* Status Banner - Matching Image 1 */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 p-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "flex size-10 items-center justify-center rounded-xl",
                                submissionStatus === "ACCEPTED"
                                  ? "bg-emerald-500/20 text-emerald-500"
                                  : "bg-rose-500/20 text-rose-500"
                              )}
                            >
                              {submissionStatus === "ACCEPTED" ? (
                                <CheckCircle className="size-6" />
                              ) : (
                                <XCircle className="size-6" />
                              )}
                            </div>
                            <div>
                              <h2
                                className={cn(
                                  "text-xl font-bold tracking-tight",
                                  submissionStatus === "ACCEPTED"
                                    ? "text-emerald-500"
                                    : "text-rose-500"
                                )}
                              >
                                {submissionStatus === "ACCEPTED"
                                  ? "Accepted"
                                  : "Submission Failed"}
                              </h2>
                              <div className="flex items-center gap-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                <span>{submissionRuntime || 0}ms</span>
                                <span className="size-1 rounded-full bg-border" />
                                <span>
                                  {(
                                    (submissionMemory || 0) /
                                    1024 /
                                    1024
                                  ).toFixed(1)}
                                  MB
                                </span>
                              </div>
                            </div>
                          </div>
                          {submissionStatus === "ACCEPTED" && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/problems/${slug}/post-solution?submissionId=${submissionId}`
                                )
                              }
                              className="h-9 gap-2 rounded-lg border-border/40 px-4 text-xs font-bold transition-all hover:bg-primary/5"
                            >
                              <Sparkles className="size-3.5 text-primary" />
                              Post Solution
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 rounded-xl border border-border/20 bg-muted/10 p-4">
                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                              Runtime
                            </p>
                            <p className="text-xl font-bold">
                              {submissionRuntime || 0}{" "}
                              <span className="text-xs font-medium text-muted-foreground">
                                ms
                              </span>
                            </p>
                          </div>
                          <div className="space-y-1 rounded-xl border border-border/20 bg-muted/10 p-4">
                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                              Memory
                            </p>
                            <p className="text-xl font-bold">
                              {((submissionMemory || 0) / 1024 / 1024).toFixed(
                                1
                              )}{" "}
                              <span className="text-xs font-medium text-muted-foreground">
                                MB
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Code Section with Expandable Toggle */}
                      {submittedCode && (
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            Your submitted code
                          </h3>
                          <div className="overflow-hidden rounded-3xl border border-border/40 bg-muted/5 shadow-2xl">
                            <div
                              className={cn(
                                "overflow-hidden transition-all duration-300",
                                isCodeExpanded ? "max-h-none" : "max-h-[300px]"
                              )}
                            >
                              <CodeMirror
                                value={submittedCode}
                                height="auto"
                                theme={editorTheme}
                                extensions={getLanguageExtension(
                                  submittedLanguage || "javascript"
                                )}
                                readOnly={true}
                                basicSetup={{
                                  lineNumbers: true,
                                  foldGutter: true,
                                }}
                                className="text-xs"
                              />
                            </div>
                            <div className="flex justify-center border-t border-border/40 bg-muted/5 p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setIsCodeExpanded(!isCodeExpanded)
                                }
                                className="h-6 gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase hover:text-foreground"
                              >
                                <ChevronDown
                                  className={cn(
                                    "size-3 transition-transform",
                                    isCodeExpanded && "rotate-180"
                                  )}
                                />
                                View {isCodeExpanded ? "less" : "more"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* More Challenges Section */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                          More challenges
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { id: "15", title: "3Sum" },
                            { id: "18", title: "4Sum" },
                            {
                              id: "167",
                              title: "Two Sum II - Input Array Is Sorted",
                            },
                          ].map((c) => (
                            <Link
                              key={c.id}
                              href={`/problems/${c.title.toLowerCase().replace(/ /g, "-")}`}
                              className="group"
                            >
                              <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-1.5 transition-all hover:border-primary/50">
                                <div className="size-1.5 rounded-full bg-yellow-500" />
                                <span className="text-xs font-bold text-foreground/80 transition-colors group-hover:text-primary">
                                  {c.id}. {c.title}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div className="space-y-4 border-t border-border/40 pt-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                              Write your notes here
                            </h3>
                          </div>
                          {isSavingNotes && (
                            <span className="animate-pulse text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                              Saving...
                            </span>
                          )}
                        </div>
                        <div className="space-y-4 overflow-hidden rounded-2xl border border-border/40 bg-muted/20 transition-all focus-within:border-primary/50">
                          <Textarea
                            value={submissionNotes}
                            onChange={(e) => handleSaveNotes(e.target.value)}
                            placeholder="Write your notes here..."
                            className="min-h-[160px] w-full resize-none border-0 bg-transparent px-6 py-4 text-sm italic focus-visible:ring-0"
                          />
                          <div className="flex flex-col gap-4 border-t border-border/40 bg-muted/10 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                Select related tags
                              </div>
                              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                0/5
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {[
                                { color: "bg-zinc-500", name: "zinc-500" },
                                { color: "bg-yellow-500", name: "yellow-500" },
                                { color: "bg-blue-500", name: "blue-500" },
                                { color: "bg-green-500", name: "green-500" },
                                { color: "bg-pink-500", name: "pink-500" },
                                { color: "bg-purple-500", name: "purple-500" },
                              ].map((dot, i) => (
                                <button
                                  key={i}
                                  onClick={() => setSelectedColor(dot.name)}
                                  className={cn(
                                    "flex size-6 items-center justify-center rounded-full border-2 border-transparent transition-all hover:scale-110",
                                    dot.color,
                                    selectedColor === dot.name &&
                                      "border-white/40 ring-2 ring-primary/20"
                                  )}
                                >
                                  {selectedColor === dot.name && (
                                    <CheckCircle className="size-3 text-white" />
                                  )}
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

          <ResizableHandle
            withHandle
            className="w-1.5 bg-border/40 transition-colors hover:bg-primary/50"
          />

          {/* Right Panel: Code & Tests */}
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
              {/* Top Right: Code Editor */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 p-2">
                    <div className="flex items-center gap-2 px-2">
                      <Code2 className="size-4 text-primary" />
                      <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                        Code
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={language}
                        onValueChange={handleLanguageChange}
                      >
                        <SelectTrigger className="h-7 w-[130px] border-border/40 bg-background text-xs font-medium">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="group relative flex-1 overflow-hidden">
                    <CodeMirror
                      value={code}
                      height="100%"
                      theme={editorTheme}
                      extensions={getLanguageExtension(language)}
                      onChange={(val) => setCode(val)}
                      className="h-full font-mono text-[13px]"
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle
                withHandle
                className="h-1.5 bg-border/40 transition-colors hover:bg-primary/50"
              />

              {/* Bottom Right: Test Cases & Results */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <Tabs
                  value={bottomTab}
                  onValueChange={setBottomTab}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-2 pt-2">
                    <TabsList className="h-8 gap-4 bg-transparent p-0">
                      <TabsTrigger
                        value="cases"
                        className="h-full rounded-none border-b-2 border-transparent px-2 text-xs font-bold tracking-widest text-muted-foreground uppercase transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                      >
                        <ListTree className="mr-2 size-3.5" /> Test Cases
                      </TabsTrigger>
                      <TabsTrigger
                        value="test-result"
                        className="h-full rounded-none border-b-2 border-transparent px-2 text-xs font-bold tracking-widest text-muted-foreground uppercase transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                      >
                        <Terminal className="mr-2 size-3.5" /> Test Results
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="test-result"
                    className="mt-0 flex flex-1 flex-col overflow-hidden bg-card/30 p-0"
                  >
                    {isRunningTest ? (
                      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background/20 text-muted-foreground backdrop-blur-sm">
                        <div className="relative">
                          <div className="size-16 animate-[spin_3s_linear_infinite] rounded-full border-2 border-primary/20" />
                          <div className="absolute inset-0 size-16 animate-spin rounded-full border-t-2 border-primary" />
                          <Loader2 className="absolute inset-0 m-auto size-6 animate-spin text-primary" />
                        </div>
                        <div className="space-y-1 text-center">
                          <p className="text-sm font-bold tracking-tight text-foreground">
                            Running Test Cases
                          </p>
                        </div>
                      </div>
                    ) : testStatus ? (
                      (() => {
                        const results = getParsedResults(testOutput)
                        const totalRuntime = results.reduce(
                          (acc: number, r: any) => acc + (r.runtime || 0),
                          0
                        )
                        const isAccepted = testStatus === "ACCEPTED"

                        if (testStatus === "TIMEOUT") {
                          return (
                            <div className="space-y-4 p-6">
                              <div className="flex items-center gap-2 text-destructive">
                                <Clock className="size-5" />
                                <h3 className="text-lg font-bold">
                                  Request Timeout
                                </h3>
                              </div>
                              <div className="text-sm font-medium text-muted-foreground">
                                The request took too long to process. Please try
                                again.
                              </div>
                            </div>
                          )
                        }

                        if (results.length === 0 && testStatus !== "PENDING") {
                          return (
                            <div className="space-y-4 p-6">
                              <div className="flex items-center gap-2 text-destructive">
                                <XCircle className="size-5" />
                                <h3 className="text-lg font-bold">
                                  Execution Error
                                </h3>
                              </div>
                              <pre className="overflow-auto rounded-lg border border-destructive/20 bg-destructive/10 p-4 font-mono text-xs whitespace-pre-wrap text-destructive">
                                {testOutput}
                              </pre>
                            </div>
                          )
                        }

                        return (
                          <div className="flex h-full flex-col overflow-hidden">
                            {/* Success/Failure Header */}
                            <div className="flex items-center justify-between border-b border-border/20 bg-muted/5 p-4">
                              <div className="flex items-center gap-3">
                                <h2
                                  className={cn(
                                    "text-xl font-black tracking-tight",
                                    isAccepted
                                      ? "text-green-500"
                                      : "text-destructive"
                                  )}
                                >
                                  {isAccepted
                                    ? "Accepted"
                                    : testStatus === "TIMEOUT"
                                      ? "Timeout"
                                      : "Wrong Answer"}
                                </h2>
                                <span className="mt-1 text-xs font-bold text-muted-foreground/60">
                                  Runtime: {totalRuntime} ms
                                </span>
                              </div>
                            </div>

                            {/* Test Case Selection */}
                            <div className="border-b border-border/10 bg-muted/5 px-4 pt-3">
                              <Tabs
                                value={activeResultTab}
                                onValueChange={setActiveResultTab}
                                className="w-full"
                              >
                                <TabsList className="no-scrollbar h-9 w-full justify-start gap-3 overflow-x-auto bg-transparent p-0">
                                  {results.map((res: any, idx: number) => (
                                    <TabsTrigger
                                      key={idx}
                                      value={`case-${idx}`}
                                      className={cn(
                                        "h-9 gap-2 rounded-t-lg rounded-b-none border border-transparent px-4 text-xs font-bold tracking-wider uppercase transition-all",
                                        "data-[state=active]:border-border/20 data-[state=active]:bg-background data-[state=active]:text-foreground",
                                        res.status === "PASSED"
                                          ? "text-green-500/70"
                                          : "text-destructive/70"
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
                            <div className="flex-1 space-y-6 overflow-auto p-4">
                              {results.map((res: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    activeResultTab === `case-${idx}`
                                      ? "block"
                                      : "hidden",
                                    "space-y-6"
                                  )}
                                >
                                  {/* Input */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase">
                                      Input
                                    </h4>
                                    <div className="space-y-2">
                                      {parseInput(res.input).map(
                                        (part, pIdx) => (
                                          <div key={pIdx} className="space-y-1">
                                            <div className="ml-1 font-mono text-[11px] font-bold text-muted-foreground/80">
                                              {part.name} =
                                            </div>
                                            <div className="group rounded-lg border border-border/20 bg-muted/30 p-3 pt-2 font-mono text-sm shadow-sm transition-colors hover:border-border/40">
                                              {part.value}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  {/* Output */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase">
                                      Output
                                    </h4>
                                    <div
                                      className={cn(
                                        "rounded-lg border p-3 font-mono text-sm shadow-sm transition-all",
                                        res.status === "PASSED"
                                          ? "border-border/20 bg-muted/30"
                                          : "border-destructive/20 bg-destructive/5 text-destructive"
                                      )}
                                    >
                                      {res.actual || res.error || "No output"}
                                    </div>
                                  </div>

                                  {/* Expected */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase">
                                      Expected
                                    </h4>
                                    <div className="rounded-lg border border-border/20 bg-muted/30 p-3 font-mono text-sm shadow-sm">
                                      {res.expected}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
                        <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-border/5 bg-muted/5 transition-transform duration-500 group-hover:scale-105">
                          <Play className="ml-1 size-8 text-muted-foreground/20" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold tracking-tight text-foreground">
                            Ready to Run
                          </p>
                          <p className="mx-auto max-w-[240px] text-xs leading-relaxed font-medium text-muted-foreground/50">
                            Run your code against sample test cases.
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent
                    value="cases"
                    className="mt-0 flex flex-1 flex-col overflow-hidden bg-card/30 p-0"
                  >
                    {(() => {
                      const testCases = problem?.testCases || []
                      const publicCases = testCases.filter(
                        (tc: any) => tc.isPublic !== false
                      )
                      const hiddenCount = testCases.filter(
                        (tc: any) => tc.isPublic === false
                      ).length

                      if (publicCases.length === 0) {
                        return (
                          <div className="flex h-full items-center justify-center p-4 text-sm font-medium text-muted-foreground">
                            No public test cases available.
                          </div>
                        )
                      }

                      return (
                        <Tabs
                          defaultValue="case-0"
                          className="flex h-full flex-1 flex-col"
                        >
                          <div className="border-b border-border/20 bg-muted/10 px-4 pt-4">
                            <TabsList className="no-scrollbar h-8 w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
                              {publicCases.map((_, idx) => (
                                <TabsTrigger
                                  key={idx}
                                  value={`case-${idx}`}
                                  className="h-8 rounded-t-lg rounded-b-none border border-transparent px-4 text-xs font-bold tracking-wider text-muted-foreground uppercase transition-all data-[state=active]:border-border/40 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                >
                                  Case {idx + 1}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </div>

                          <div className="relative flex-1">
                            {publicCases.map((tc, idx) => (
                              <TabsContent
                                key={idx}
                                value={`case-${idx}`}
                                className="absolute inset-0 mt-0 overflow-auto p-4"
                              >
                                <div className="space-y-4">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                      <div className="size-1.5 rounded-full bg-blue-500" />
                                      Input
                                    </div>
                                    <div className="rounded-lg border border-border/30 bg-muted/40 p-3 font-mono text-sm text-foreground shadow-sm">
                                      {tc.input}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                      <div className="size-1.5 rounded-full bg-green-500" />
                                      Expected Output
                                    </div>
                                    <div className="rounded-lg border border-border/30 bg-muted/40 p-3 font-mono text-sm text-foreground shadow-sm">
                                      {tc.expectedOutput}
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            ))}
                          </div>

                          {hiddenCount > 0 && (
                            <div className="border-t border-border/20 bg-muted/5 p-2 text-center">
                              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
                                + {hiddenCount} Hidden Cases
                              </span>
                            </div>
                          )}
                        </Tabs>
                      )
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
