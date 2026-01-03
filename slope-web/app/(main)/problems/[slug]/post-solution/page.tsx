'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
    X, Send, Sparkles, Bold, Italic, List, ListOrdered, Quote, Code2, 
    Image as ImageIcon, Link as LinkIcon, ChevronDown, CheckCircle,
    Heading1, Heading2, Terminal, Info, Globe, MessageSquare, ThumbsUp
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'

export default function PostSolutionPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const slug = params.slug as string
    const submissionId = searchParams.get('submissionId')
    const { data: session } = authClient.useSession()

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [language, setLanguage] = useState("javascript")
    const [isPosting, setIsPosting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!submissionId) {
                setIsLoading(false)
                return
            }
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/submission/${submissionId}`, {
                    credentials: 'include'
                })
                if (response.ok) {
                    const data = await response.json()
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/problems/${slug}/solutions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    language,
                    code: content.split('\`\`\`')[1]?.split('\n').slice(1).join('\n') || "" // Very basic extraction
                }),
                credentials: 'include'
            })

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
            case 'javascript': return [javascript()];
            case 'python': return [python()];
            case 'cpp': return [cpp()];
            default: return [javascript()];
        }
    }

    if (isLoading) {
        return (
            <div className="h-screen bg-[#1a1a1a] flex items-center justify-center">
                <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="h-screen bg-[#1a1a1a] text-foreground flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-[#1a1a1a]/80 backdrop-blur-xl z-50">
                <div className="flex-1 max-w-2xl px-4">
                    <Input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter your title"
                        className="bg-transparent border-0 focus-visible:ring-0 text-xl font-bold placeholder:text-muted-foreground/40 h-10"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handlePost} 
                        disabled={isPosting || !title.trim() || !content.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                    >
                        {isPosting ? <Sparkles className="size-4 animate-spin" /> : <Send className="size-4" />}
                        Post
                    </Button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="h-12 border-b border-border/40 bg-[#1a1a1a] flex items-center px-6 gap-1">
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Bold className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Italic className="size-4" /></Button>
                <div className="w-px h-4 bg-border/40 mx-2" />
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><List className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><ListOrdered className="size-4" /></Button>
                <div className="w-px h-4 bg-border/40 mx-2" />
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Quote className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Code2 className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><ImageIcon className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><LinkIcon className="size-4" /></Button>
            </div>

            {/* Main Editor Area */}
            <main className="flex-1 flex overflow-hidden">
                {/* Editor Pane */}
                <div className="flex-1 border-r border-border/40 flex flex-col bg-[#1e1e1e]">
                    <div className="p-4 flex items-center gap-2">
                         <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 border border-border/40 rounded-md text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            <Sparkles className="size-3 text-primary" /> Tag
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 border border-border/40 rounded-md text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {language} <X className="size-3 cursor-pointer hover:text-foreground" />
                        </div>
                    </div>
                    <Textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 resize-none font-mono text-sm p-6 leading-relaxed"
                        placeholder="Write your solution here..."
                    />
                     <div className="px-6 py-2 border-t border-border/40 bg-muted/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Generated from the chosen submission
                    </div>
                </div>

                {/* Preview Pane */}
                <div className="flex-1 bg-[#1a1a1a] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border/40 bg-[#1a1a1a]/50">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Preview</h2>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-10 prose prose-invert prose-headings:font-black prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
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
                                    h1: ({children}) => <h1 className="text-3xl font-black tracking-tighter mt-12 mb-6 flex items-center gap-3">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-xl font-black tracking-tight mt-10 mb-5">{children}</h2>,
                                    ul: ({children}) => <ul className="space-y-2 list-disc pl-5 mb-6 text-muted-foreground">{children}</ul>,
                                    li: ({children}) => <li className="text-sm font-medium">{children}</li>,
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </ScrollArea>
                </div>
            </main>
        </div>
    )
}
