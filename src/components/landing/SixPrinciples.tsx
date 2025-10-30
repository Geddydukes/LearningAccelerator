import { PrincipleCard } from "./PrincipleCard";
import {
  BookOpen,
  MessageCircle,
  Zap,
  Target,
  Code,
  Trophy,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";

export function SixPrinciples() {
  return (
    <section id="how-it-works" className="relative py-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl" />
      <div className="bg-background/60 py-16 text-center backdrop-blur">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight">
            Six principles that work
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Our AI agents operationalize proven learning science so every session compounds toward mastery.
          </p>
        </div>
      </div>

      <div className="space-y-0">
        <PrincipleCard
          title="Mastery Learning"
          subtitle="CLO Agent"
          description="Prerequisites and outcomes focus. Every skill builds on proven foundations. No gaps, no guessing."
          icon={<BookOpen className="w-8 h-8" />}
          accentColor="#3b82f6"
          imageSrc="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=400&fit=crop"
          imageAlt="Stack of books representing learning foundations"
          darkBackground={false}
          textOnRight={false}
          proofElement={
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground">
                  Weekly Mastery Check
                </span>
                <Badge className="bg-primary/20 text-primary">87% Complete</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-foreground">
                  <span>JavaScript Fundamentals</span>
                  <span>✓</span>
                </div>
                <div className="flex justify-between text-sm text-foreground">
                  <span>Async Programming</span>
                  <span>✓</span>
                </div>
                <div className="flex justify-between text-sm text-foreground">
                  <span>React Components</span>
                  <Progress value={75} className="w-24 h-2" />
                </div>
              </div>
            </div>
          }
        />

        <PrincipleCard
          title="Socratic Method"
          subtitle="Socratic Agent"
          description="Deep understanding through questioning. No passive consumption. Every concept challenged until clear."
          icon={<MessageCircle className="w-8 h-8" />}
          accentColor="#8b5cf6"
          imageSrc="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop"
          imageAlt="Marble bust of Socrates representing philosophical inquiry"
          darkBackground={true}
          textOnRight={true}
          proofElement={
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-left text-sm text-white shadow-lg shadow-black/20">
                <p>
                  <strong>Socrates:</strong> Why do you think React re-renders components?
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/90 shadow-lg shadow-black/20">
                <p>
                  <strong>You:</strong> When state changes?
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-left text-sm text-white shadow-lg shadow-black/20">
                <p>
                  <strong>Socrates:</strong> What about props changes? Walk me through what happens...
                </p>
              </div>
            </div>
          }
        />

        <PrincipleCard
          title="Daily Practice"
          subtitle="TA Agent"
          description="Bite-sized deliberate practice. Fifteen minutes daily beats weekend cramming every time."
          icon={<Zap className="w-8 h-8" />}
          accentColor="#10b981"
          imageSrc="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=400&fit=crop"
          imageAlt="Daily practice journal and pen representing consistent learning"
          darkBackground={false}
          textOnRight={false}
          proofElement={
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">
                Today's Micro-Tasks
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Build a custom hook (12 min)', checked: true },
                  { label: 'Debug async issue (8 min)', checked: true },
                  { label: 'Optimize render (15 min)', checked: false }
                ].map(item => (
                  <label
                    key={item.label}
                    className={`flex items-center gap-3 rounded-xl border border-border/30 bg-background/70 p-3 text-sm shadow-sm shadow-primary/10 ${
                      item.checked ? 'ring-1 ring-primary/40' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      readOnly
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          }
        />

        <PrincipleCard
          title="Daily Plans"
          subtitle="Instructor Agent"
          description="Single daily plan eliminates thrash. Know exactly what to work on for maximum progress."
          icon={<Target className="w-8 h-8" />}
          accentColor="#f59e0b"
          imageSrc="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500&h=400&fit=crop"
          imageAlt="Target dartboard representing focused daily goals"
          darkBackground={true}
          textOnRight={true}
          proofElement={
            <div className="space-y-3">
              <h4 className="font-medium text-white">
                Today's 45-Minute Focus
              </h4>
              <div className="space-y-2 text-sm text-white/80">
                {[
                  { label: 'Review useEffect patterns', time: '10 min' },
                  { label: 'Build cleanup example', time: '25 min' },
                  { label: 'Quiz dependency arrays', time: '10 min' }
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 shadow-inner shadow-black/30">
                    <span>• {item.label}</span>
                    <span className="text-xs uppercase tracking-wide text-white/70">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          }
        />

        <PrincipleCard
          title="Code Reviews"
          subtitle="Alex Agent"
          description="Production-ready feedback simulation. Get the criticism that makes you better, not bitter."
          icon={<Code className="w-8 h-8" />}
          accentColor="#ef4444"
          imageSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=400&fit=crop"
          imageAlt="Code on computer screen representing development work"
          darkBackground={false}
          textOnRight={false}
          proofElement={
            <div className="space-y-2 rounded-2xl bg-slate-950/80 p-5 font-mono text-sm text-slate-200 shadow-2xl shadow-primary/20">
              <div className="text-emerald-400">+ const [data, setData] = useState(null)</div>
              <div className="text-rose-400">- const [data, setData] = useState()</div>
              <div className="mt-3 text-slate-300">
                💡 <strong>Alex:</strong> Initialize with null for better type safety. TypeScript will thank you.
              </div>
            </div>
          }
        />

        <PrincipleCard
          title="Motivation System"
          subtitle="Built-in"
          description="Visible momentum without gimmicks. See progress accumulate into expertise over time."
          icon={<Trophy className="w-8 h-8" />}
          accentColor="#f97316"
          imageSrc="https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=500&h=400&fit=crop"
          imageAlt="Trophy and achievement symbols representing motivation and success"
          darkBackground={true}
          textOnRight={true}
          proofElement={
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Current Streak</span>
                <span className="text-2xl font-semibold text-white">47 days</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>Skills Mastered</span>
                  <span>12/20</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div className="rounded-full bg-white/10 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white/80">
                3 skills away from hireable
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
} 