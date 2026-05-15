"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "next-themes"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Moon,
  Sun,
  ArrowDownLeft,
  MessageCircle,
  Globe,
  User,
  Code2,
  Search,
  Zap,
  Filter,
  Loader2,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

interface Problem {
  id: string
  slug: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
  acceptance: string
  status: "solved" | "attempted" | "todo"
  tags: string[]
}

export default function Home() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [displayLimit, setDisplayLimit] = useState(20)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const { theme, setTheme } = useTheme()

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          setDisplayLimit((prev) => prev + 20)
        }
      },
      { threshold: 1.0 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [isLoading])

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/problems`,
          {
            credentials: "include",
          }
        )
        const json = await response.json()
        const data = json.data || json
        if (Array.isArray(data)) {
          setProblems(data)
        }
      } catch (error) {
        console.error("Failed to fetch problems:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProblems()
  }, [])

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesDifficulty =
        difficultyFilter === "all" ||
        p.difficulty.toLowerCase() === difficultyFilter.toLowerCase()
      return matchesSearch && matchesDifficulty
    })
  }, [problems, searchQuery, difficultyFilter])

  const displayedProblems = useMemo(() => {
    return filteredProblems.slice(0, displayLimit)
  }, [filteredProblems, displayLimit])

  const topics = useMemo(() => {
    const allTags = problems.flatMap((p) => p.tags)
    return Array.from(new Set(allTags)).slice(0, 10)
  }, [problems])

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 dark:bg-black/95">
      <main className="flex-1 pb-12">
        <div className="relative container mx-auto max-w-5xl animate-in px-4 duration-700 fade-in">
          {/* Floating Theme Toggle */}
          <div className="fixed top-6 right-6 z-[60]">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="group size-11 rounded-full border border-border/20 bg-background/80 shadow-xl backdrop-blur-md transition-all duration-300 hover:bg-muted"
            >
              <Sun className="size-[1.2rem] scale-100 rotate-0 text-foreground transition-all group-hover:text-primary dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-[1.2rem] scale-0 rotate-90 text-foreground transition-all group-hover:text-primary dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* Sticky Header Section */}
          <div className="sticky top-0 z-50 space-y-4 border-b border-transparent bg-zinc-50/80 py-6 backdrop-blur-xl transition-all dark:bg-black/80">
            {/* Topics Bar */}
            <div className="scrollbar-hide no-scrollbar flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={searchQuery === "" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSearchQuery("")}
                className="shrink-0 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                All Topics
              </Button>
              {topics.map((topic: string) => (
                <Button
                  key={topic}
                  variant={searchQuery === topic ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSearchQuery(topic)}
                  className="shrink-0 rounded-full border-border/50 hover:bg-muted"
                >
                  {topic}
                </Button>
              ))}
            </div>

            {/* Filter Section */}
            <div className="py-2">
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <div className="relative w-full flex-1">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search question titles or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-xl border-border/10 bg-background/40 pl-10 focus-visible:ring-primary/20"
                  />
                </div>
                <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto md:w-auto">
                  <Select
                    value={difficultyFilter}
                    onValueChange={setDifficultyFilter}
                  >
                    <SelectTrigger className="h-11 min-w-[130px] rounded-xl border-border/10 bg-background/40">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl border-border/10"
                  >
                    <Filter className="size-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      const random =
                        problems[Math.floor(Math.random() * problems.length)]
                      if (random)
                        window.location.href = `/problems/${random.slug}`
                    }}
                    className="h-11 shrink-0 rounded-xl bg-primary px-6 font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90"
                  >
                    Pick Random
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Table Wrapper */}
          <div className="mt-6 min-h-[400px]">
            <Table>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-20 text-center">
                      <Loader2 className="mx-auto mb-2 size-8 animate-spin text-primary" />
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        Loading challenges
                      </span>
                    </TableCell>
                  </TableRow>
                ) : displayedProblems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="py-20 text-center font-medium text-muted-foreground"
                    >
                      No problems matched your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedProblems.map((problem: Problem, index: number) => (
                    <TableRow
                      key={problem.id}
                      className="group h-16 cursor-pointer border-border/30 transition-colors hover:bg-primary/[0.03]"
                    >
                      <TableCell className="pl-6">
                        <Link
                          href={`/problems/${problem.slug}`}
                          className="flex flex-col"
                        >
                          <span className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                            {index + 1}. {problem.title}
                          </span>
                          <div className="mt-1 flex gap-2">
                            {problem.tags?.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-[10px] font-medium text-muted-foreground/60 transition-colors hover:text-primary"
                              >
                                #{tag.toLowerCase().replace(" ", "-")}
                              </span>
                            ))}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge
                          className={cn(
                            "border-none px-3 py-1 font-bold shadow-sm",
                            problem.difficulty === "Easy" &&
                              "bg-green-500/10 text-green-600 group-hover:bg-green-500/20 dark:text-green-400",
                            problem.difficulty === "Medium" &&
                              "bg-orange-500/10 text-orange-600 group-hover:bg-orange-500/20 dark:text-orange-400",
                            problem.difficulty === "Hard" &&
                              "bg-red-500/10 text-red-600 group-hover:bg-red-500/20 dark:text-red-400"
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
            <div
              ref={observerRef}
              className="mt-4 flex h-10 w-full items-center justify-center"
            >
              {!isLoading &&
                displayedProblems.length < filteredProblems.length && (
                  <Loader2 className="size-5 animate-spin text-primary/40" />
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
