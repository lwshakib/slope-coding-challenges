"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Input } from "@workspace/ui/components/input"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  X,
  Send,
  Sparkles,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code2,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  CheckCircle,
  Heading1,
  Heading2,
  Terminal,
  Info,
  Globe,
  MessageSquare,
  ThumbsUp,
  Sun,
  Moon,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@workspace/ui/lib/utils"
import CodeMirror from "@uiw/react-codemirror"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { cpp } from "@codemirror/lang-cpp"

export default function PostSolutionPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const submissionId = searchParams.get("submissionId")

  const { theme, setTheme } = useTheme()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [isPosting, setIsPosting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      if (e.key.toLowerCase() === "d" && !isInput) {
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [theme, setTheme])

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) {
        setIsLoading(false)
        return
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/submission/${submissionId}`,
          {
            credentials: "include",
          }
        )
        if (response.ok) {
          const json = await response.json()
          const data = json.data || json
          setLanguage(data.language)

          const template = `# Intuition\n${data.notes || "<!-- Describe your first thoughts on how to solve this problem. -->"}\n\n# Approach\n<!-- Describe your approach to solving the problem. -->\n\n# Complexity\n- Time complexity:\n<!-- Add your time complexity here, e.g. $$O(n)$$ -->\n\n- Space complexity:\n<!-- Add your space complexity here, e.g. $$O(n)$$ -->\n\n# Code\n\`\`\`${data.language}\n${data.code}\n\`\`\``
          setContent(template)
        }
      } catch (error) {
        console.error("Failed to fetch submission:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubmission()
  }, [submissionId])

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) return

    setIsPosting(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/problems/${slug}/solutions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            language,
            code:
              content.split("\`\`\`")[1]?.split("\n").slice(1).join("\n") || "", // Very basic extraction
          }),
          credentials: "include",
        }
      )

      if (response.ok) {
        router.push(`/problems/${slug}?tab=solutions`)
      }
    } catch (error) {
      console.error("Failed to post solution:", error)
    } finally {
      setIsPosting(false)
    }
  }

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case "javascript":
        return [javascript()]
      case "python":
        return [python()]
      case "cpp":
        return [cpp()]
      default:
        return [javascript()]
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background font-sans text-foreground">
      {/* Header */}
      <header className="z-50 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-xl">
        <div className="max-w-2xl flex-1 px-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your title"
            className="!dark:bg-transparent h-14 border-none !bg-transparent text-2xl font-black shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex items-center gap-4">
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
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePost}
            disabled={isPosting || !title.trim() || !content.trim()}
            className="gap-2 bg-green-600 font-bold text-white hover:bg-green-700"
          >
            {isPosting ? (
              <Sparkles className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Post
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex h-12 items-center gap-1 border-b border-border/40 bg-background px-6">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <Italic className="size-4" />
        </Button>
        <div className="mx-2 h-4 w-px bg-border/40" />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <List className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <ListOrdered className="size-4" />
        </Button>
        <div className="mx-2 h-4 w-px bg-border/40" />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <Quote className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <Code2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <ImageIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
        >
          <LinkIcon className="size-4" />
        </Button>
      </div>

      {/* Main Editor Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Editor Pane */}
        <div className="flex flex-1 flex-col border-r border-border/40 bg-muted/5">
          <div className="flex items-center gap-2 p-4">
            <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
              <Sparkles className="size-3 text-primary" /> Tag
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
              {language}{" "}
              <X className="size-3 cursor-pointer hover:text-foreground" />
            </div>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 resize-none border-0 bg-transparent p-6 font-mono text-sm leading-relaxed focus-visible:ring-0"
            placeholder="Write your solution here..."
          />
          <div className="border-t border-border/40 bg-muted/5 px-6 py-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Generated from the chosen submission
          </div>
        </div>

        {/* Preview Pane */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          <div className="border-b border-border/40 bg-background/50 p-4">
            <h2 className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">
              Preview
            </h2>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto">
            <div
              className={cn(
                "prose prose-headings:font-black prose-p:leading-relaxed max-w-none p-10",
                theme === "dark" ? "prose-invert" : ""
              )}
            >
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "")
                    return !inline && match ? (
                      <div className="my-6 overflow-hidden rounded-xl border border-border/40">
                        <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2">
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            {match[1]}
                          </span>
                        </div>
                        <CodeMirror
                          value={String(children).replace(/\n$/, "")}
                          theme={theme === "dark" ? vscodeDark : "light"}
                          extensions={getLanguageExtension(match[1] as string)}
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
                  h1: ({ children }) => (
                    <h1 className="mt-12 mb-6 flex items-center gap-3 text-3xl font-black tracking-tighter">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-10 mb-5 text-xl font-black tracking-tight">
                      {children}
                    </h2>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-6 list-disc space-y-2 pl-5 text-muted-foreground">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm font-medium">{children}</li>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
