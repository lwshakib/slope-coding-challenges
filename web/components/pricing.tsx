"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NumberFlow from "@number-flow/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, Check, Star, Zap, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
];

export default function SimplePricing() {
  const [frequency, setFrequency] = useState<string>("monthly");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="pricing"
      className="not-prose relative flex w-full flex-col gap-16 overflow-hidden px-4 py-24 text-center sm:px-8 bg-background"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/5 absolute -top-[10%] left-[50%] h-[40%] w-[60%] -translate-x-1/2 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center space-y-2">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 mb-4 rounded-full px-4 py-1 text-sm font-bold uppercase tracking-widest"
          >
            <Sparkles className="text-primary mr-2 h-3.5 w-3.5 animate-pulse" />
            Pricing Plans
          </Badge>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-black italic tracking-tighter sm:text-6xl uppercase text-foreground leading-none"
          >
            Invest in your <span className="text-primary not-italic">future</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground max-w-md pt-4 text-lg font-medium"
          >
            Join 50,000+ developers mastering the art of coding. Choose a plan that fits your ambition.
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
            className="bg-muted/50 inline-block rounded-full p-1 border border-border/40"
          >
            <TabsList className="bg-transparent h-10">
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-background rounded-full transition-all duration-300 px-8 font-bold uppercase text-[10px] tracking-widest h-8"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="data-[state=active]:bg-background rounded-full transition-all duration-300 px-8 font-bold uppercase text-[10px] tracking-widest h-8"
              >
                Yearly
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/15 ml-2 border-none text-[8px]"
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
                  "bg-card relative h-full w-full text-left transition-all duration-500 border-border/40 rounded-[2.5rem] p-4 flex flex-col",
                  plan.popular
                    ? "ring-primary/40 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)] ring-2 border-primary/20"
                    : "hover:border-primary/30 shadow-xl",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 right-0 left-0 mx-auto w-fit">
                    <Badge className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 shadow-xl font-bold uppercase tracking-widest text-[10px] italic">
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
                          ? "bg-primary/10 text-primary border-primary/20 scale-110"
                          : "bg-muted text-muted-foreground border-border/40"
                      )}
                    >
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle
                          className={cn(
                            "text-2xl font-black italic tracking-tight uppercase",
                            plan.popular ? "text-primary" : "text-foreground"
                          )}
                        >
                          {plan.name}
                        </CardTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{plan.id === 'free' ? 'Starter' : plan.id === 'pro' ? 'Professional' : 'Institutional'}</p>
                    </div>
                  </div>
                  <CardDescription className="mt-6 flex-grow">
                    <p className="text-muted-foreground font-medium italic leading-relaxed">{plan.description}</p>
                    <div className="pt-6">
                      {/* Billed frequency display */}
                      {typeof plan.price[frequency as keyof typeof plan.price] === "number" ? (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black italic tracking-tighter text-foreground">$</span>
                            <NumberFlow
                              className={cn(
                                "text-6xl font-black italic tracking-tighter",
                                plan.popular ? "text-primary" : "text-foreground"
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
                            <span className="text-muted-foreground font-black italic text-xl uppercase tracking-tighter">/mo</span>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">
                             Billed {frequency}
                          </span>
                        </div>
                      ) : (
                        <div className="h-[90px] flex items-center">
                            <span
                              className={cn(
                                "text-4xl font-black italic tracking-tighter uppercase",
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
                <CardContent className="grid gap-4 pb-8 flex-grow">
                  <div className="h-px w-full bg-border/40 mb-2" />
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
                          "flex h-5 w-5 items-center justify-center rounded-full border shrink-0",
                          plan.popular
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border/40"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span
                        className={cn("font-bold",
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
                      "w-full h-14 font-black italic uppercase tracking-widest text-sm transition-all duration-500 rounded-[1.25rem]",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground border-b-4 border-primary/50 active:border-b-0 active:translate-y-1"
                        : "hover:bg-muted font-bold text-foreground border-2 border-border/40 hover:border-primary/30"
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
  );
}
