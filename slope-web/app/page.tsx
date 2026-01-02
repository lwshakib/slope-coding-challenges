import HeroSection from "@/components/hero-section";
import Pricing from "@/components/pricing";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeroSection />
      
      {/* Features Sneak Peek */}
      <section className="py-24 bg-zinc-950">
        <div className="container mx-auto px-4 max-w-7xl">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors space-y-4 group">
                 <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                    <span className="text-xl font-black italic">3k+</span>
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase tracking-tight">Vast Library</h3>
                 <p className="text-zinc-400 text-sm leading-relaxed">
                    Access a curated list of over 3,000+ technical problems covering every data structure and algorithm.
                 </p>
              </div>
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors space-y-4 group">
                 <div className="size-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <span className="text-xl font-black italic">⚡</span>
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase tracking-tight">Real-time Execution</h3>
                 <p className="text-zinc-400 text-sm leading-relaxed">
                    Our distributed code execution system provides instant results, even for complex test cases.
                 </p>
              </div>
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors space-y-4 group">
                 <div className="size-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                    <span className="text-xl font-black italic">🏆</span>
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase tracking-tight">Global Contests</h3>
                 <p className="text-zinc-400 text-sm leading-relaxed">
                    Compete in weekly and bi-weekly rounds to test your speed and accuracy against the best developers.
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
