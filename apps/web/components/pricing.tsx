"use client"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import NumberFlow from "@number-flow/react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Sparkles, ArrowRight, Check, Star, Zap, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Star,
    price: {
      monthly: "Free forever",
      yearly: "Free forever",
    },
    description:
      "Perfect for students getting started with algorithmic challenges.",
    features: [
      "Access to 3,000+ problems",
      "Standard runtime environment",
      "Public discussion forums",
      "Basic statistical tracking",
      "Join weekly contests",
      "Community support",
    ],
    cta: "Get started for free",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    price: {
      monthly: 9,
      yearly: 7,
    },
    description: "For serious developers aiming for top-tier tech roles.",
    features: [
      "Detailed editorial solutions",
      "Priority code execution",
      "Integrated debugger",
      "Company-specific tags",
      "Mock interview sessions",
      "Custom learning paths",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Campus",
    icon: Shield,
    price: {
      monthly: "Custom pricing",
      yearly: "Custom pricing",
    },
    description: "For universities and coding bootcamps/teams.",
    features: [
      "Everything in Pro",
      "Private contest platform",
      "Student progress analytics",
      "LMS integration",
      "Dedicated account manager",
      "Bulk student licensing",
      "24/7 technical support",
    ],
    cta: "Contact our team",
  },
]

export default function SimplePricing() {
  const [frequency, setFrequency] = useState<string>("monthly")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      id="pricing"
      className="not-prose relative flex w-full flex-col gap-16 overflow-hidden bg-background px-4 py-24 text-center sm:px-8"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] left-[50%] h-[40%] w-[60%] -translate-x-1/2 rounded-full bg-primary/5 opacity-50 blur-3xl" />
      </div>

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center space-y-2">
          <Badge
            variant="outline"
            className="mb-4 rounded-full border-primary/20 bg-primary/5 px-4 py-1 text-sm font-bold tracking-widest uppercase"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5 animate-pulse text-primary" />
            Pricing Plans
          </Badge>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl leading-none font-black tracking-tighter text-foreground uppercase italic sm:text-6xl"
          >
            Invest in your{" "}
            <span className="text-primary not-italic">future</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-md pt-4 text-lg font-medium text-muted-foreground"
          >
            Join 50,000+ developers mastering the art of coding. Choose a plan
            that fits your ambition.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Tabs
            defaultValue={frequency}
            onValueChange={setFrequency}
            className="inline-block rounded-full border border-border/40 bg-muted/50 p-1"
          >
            <TabsList className="h-10 bg-transparent">
              <TabsTrigger
                value="monthly"
                className="h-8 rounded-full px-8 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 data-[state=active]:bg-background"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="h-8 rounded-full px-8 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 data-[state=active]:bg-background"
              >
                Yearly
                <Badge
                  variant="secondary"
                  className="ml-2 border-none bg-primary/10 text-[8px] text-primary hover:bg-primary/15"
                >
                  Save 20%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="mt-8 grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -8 }}
              className="flex"
            >
              <Card
                className={cn(
                  "relative flex h-full w-full flex-col rounded-[2.5rem] border-border/40 bg-card p-4 text-left transition-all duration-500",
                  plan.popular
                    ? "border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)] ring-2 ring-primary/40"
                    : "shadow-xl hover:border-primary/30"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 right-0 left-0 mx-auto w-fit">
                    <Badge className="rounded-full bg-primary px-4 py-1.5 text-[10px] font-bold tracking-widest text-primary-foreground uppercase italic shadow-xl">
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className={cn("pb-6", plan.popular && "pt-10")}>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500",
                        plan.popular
                          ? "scale-110 border-primary/20 bg-primary/10 text-primary"
                          : "border-border/40 bg-muted text-muted-foreground"
                      )}
                    >
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle
                        className={cn(
                          "text-2xl font-black tracking-tight uppercase italic",
                          plan.popular ? "text-primary" : "text-foreground"
                        )}
                      >
                        {plan.name}
                      </CardTitle>
                      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                        {plan.id === "free"
                          ? "Starter"
                          : plan.id === "pro"
                            ? "Professional"
                            : "Institutional"}
                      </p>
                    </div>
                  </div>
                  <CardDescription className="mt-6 flex-grow">
                    <p className="leading-relaxed font-medium text-muted-foreground italic">
                      {plan.description}
                    </p>
                    <div className="pt-6">
                      {/* Billed frequency display */}
                      {typeof plan.price[
                        frequency as keyof typeof plan.price
                      ] === "number" ? (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black tracking-tighter text-foreground italic">
                              $
                            </span>
                            <NumberFlow
                              className={cn(
                                "text-6xl font-black tracking-tighter italic",
                                plan.popular
                                  ? "text-primary"
                                  : "text-foreground"
                              )}
                              format={{
                                style: "decimal",
                                maximumFractionDigits: 0,
                              }}
                              value={
                                plan.price[
                                  frequency as keyof typeof plan.price
                                ] as number
                              }
                            />
                            <span className="text-xl font-black tracking-tighter text-muted-foreground uppercase italic">
                              /mo
                            </span>
                          </div>
                          <span className="mt-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                            Billed {frequency}
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-[90px] items-center">
                          <span
                            className={cn(
                              "text-4xl font-black tracking-tighter uppercase italic",
                              plan.popular ? "text-primary" : "text-foreground"
                            )}
                          >
                            {plan.price[frequency as keyof typeof plan.price]}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid flex-grow gap-4 pb-8">
                  <div className="mb-2 h-px w-full bg-border/40" />
                  {plan.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          plan.popular
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/40 bg-muted text-muted-foreground"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span
                        className={cn(
                          "font-bold",
                          plan.popular
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </CardContent>
                <CardFooter className="pt-auto">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className={cn(
                      "h-14 w-full rounded-[1.25rem] text-sm font-black tracking-widest uppercase italic transition-all duration-500",
                      plan.popular
                        ? "border-b-4 border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 active:translate-y-1 active:border-b-0"
                        : "border-2 border-border/40 font-bold text-foreground hover:border-primary/30 hover:bg-muted"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
