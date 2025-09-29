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
    <section id="how-it-works" className="py-0">
      <div className="text-center py-16 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-medium mb-4">
            Six principles that work
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our AI agents implement proven learning science to
            build real expertise faster
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
              <div className="flex justify-between items-center">
                <span className="text-foreground">
                  Weekly Mastery Check
                </span>
                <Badge variant="secondary">87% Complete</Badge>
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
              <div className="bg-gray-800 p-3 rounded text-white">
                <p className="text-sm">
                  <strong>Socrates:</strong> Why do you think
                  React re-renders components?
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded text-white">
                <p className="text-sm">
                  <strong>You:</strong> When state changes?
                </p>
              </div>
              <div className="bg-gray-800 p-3 rounded text-white">
                <p className="text-sm">
                  <strong>Socrates:</strong> What about props
                  changes? Walk me through what happens...
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">
                    Build a custom hook (12 min)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">
                    Debug async issue (8 min)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-foreground">
                    Optimize render (15 min)
                  </span>
                </div>
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
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>• Review useEffect patterns</span>
                  <span>10 min</span>
                </div>
                <div className="flex justify-between">
                  <span>• Build cleanup example</span>
                  <span>25 min</span>
                </div>
                <div className="flex justify-between">
                  <span>• Quiz dependency arrays</span>
                  <span>10 min</span>
                </div>
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
            <div className="bg-gray-900 p-4 rounded font-mono text-sm space-y-2">
              <div className="text-green-400">
                + const [data, setData] = useState(null)
              </div>
              <div className="text-red-400">
                - const [data, setData] = useState()
              </div>
              <div className="text-gray-300 mt-2">
                💡 <strong>Alex:</strong> Initialize with null
                for better type safety. TypeScript will thank
                you.
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
                <span className="text-white">
                  Current Streak
                </span>
                <span className="text-2xl font-medium text-white">
                  47 days
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Skills Mastered</span>
                  <span>12/20</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div className="text-center text-sm text-gray-300">
                3 skills away from hireable
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
} 