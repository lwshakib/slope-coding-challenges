import HeroSection from "@/components/hero-section";
import Pricing from "@/components/pricing";
import Footer from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Zap, Trophy, Check, Library } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeroSection />
      
      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl font-black italic tracking-tighter sm:text-5xl uppercase text-foreground">Features tailored for <span className="text-primary not-italic">growth</span></h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                    Everything you need to master technical interviews and solve complex algorithmic challenges.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-8 rounded-[2rem] bg-card border border-border/40 hover:border-primary/30 transition-all space-y-4 group shadow-xl">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                     <Library className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">Vast Library</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                     Access a curated list of over 3,000+ technical problems covering every data structure and algorithm.
                  </p>
               </div>
               <div className="p-8 rounded-[2rem] bg-card border border-border/40 hover:border-primary/30 transition-all space-y-4 group shadow-xl">
                  <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform">
                     <Zap className="size-6 fill-current" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">Real-time Execution</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                     Our distributed code execution system provides instant results, even for complex test cases.
                  </p>
               </div>
               <div className="p-8 rounded-[2rem] bg-card border border-border/40 hover:border-primary/30 transition-all space-y-4 group shadow-xl">
                  <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                     <Trophy className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">Global Contests</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                     Compete in weekly and bi-weekly rounds to test your speed and accuracy against the best developers.
                  </p>
               </div>
            </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 space-y-8">
                    <div className="space-y-4 text-center lg:text-left">
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 font-bold uppercase tracking-widest text-[10px]">Solutions for Teams</Badge>
                        <h2 className="text-4xl font-black italic tracking-tighter sm:text-6xl uppercase leading-[0.9] text-foreground">Built for <span className="text-primary not-italic underline decoration-primary/30 underline-offset-8">engineers</span> by engineers</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                           Whether you're a student preparing for your first internship or a senior engineer aiming for FAANG, Slope provides the environment you need to excel.
                        </p>
                    </div>
                    
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            'Integrated Development Environment (IDE)',
                            'Multiple Search & Filter Options',
                            'Detailed Editorial & Solutions',
                            'AI-Powered Code Suggestions'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 font-bold text-foreground bg-secondary/30 p-4 rounded-2xl border border-border/40">
                                <div className="size-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 transition-transform group-hover:scale-110">
                                    <Check className="size-3.5 stroke-[3]" />
                                </div>
                                <span className="text-sm uppercase tracking-tight">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1 w-full relative">
                    <div className="relative rounded-[2rem] overflow-hidden border border-border/40 bg-card aspect-video shadow-2xl group">
                         <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
                         <div className="absolute inset-0 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-700">
                             <div className="p-8 rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl space-y-4 w-64">
                                 <div className="h-2 w-24 bg-primary/20 rounded-full" />
                                 <div className="h-2 w-32 bg-muted rounded-full" />
                                 <div className="h-12 w-full bg-primary/10 rounded-xl" />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-3xl mx-auto text-center space-y-8">
                <h2 className="text-3xl font-black italic tracking-tighter sm:text-5xl uppercase leading-none text-foreground">Our Mission: Democratize <span className="text-primary not-italic">Technical</span> Interviews</h2>
                <div className="space-y-6 text-muted-foreground text-lg leading-relaxed font-medium">
                    <p>
                        Slope was born out of a simple observation: technical interviewing is harder than it needs to be. The barrier to entry for top-tier tech companies shouldn't be your access to premium education.
                    </p>
                    <p>
                        We're building a platform that focuses on <strong>quality over quantity</strong>. Every problem on Slope is hand-vetted to ensure it provides meaningful learning value.
                    </p>
                </div>
            </div>
        </div>
      </section>

      <Pricing />
      <Footer />
    </div>
  );
}
