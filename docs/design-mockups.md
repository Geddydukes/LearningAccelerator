# Design Mockups: Visual Implementation Guides

## Option 1: Command Palette Interface

### Main Dashboard Layout
```tsx
// components/workspace/CommandPaletteDashboard.tsx
import { Command } from 'cmdk'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export const CommandPaletteDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Learning Accelerator
              </h1>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                Pro
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Avatar>
                <AvatarImage src="/user-avatar.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Command Palette */}
        <Card className="p-8 mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              What would you like to learn today?
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Type or speak your learning goal, and I'll create a personalized path for you
            </p>
          </div>
          
          <Command className="w-full">
            <div className="flex items-center border rounded-lg px-4 py-3 bg-white">
              <Search className="w-4 h-4 text-slate-400 mr-3" />
              <Command.Input 
                placeholder="e.g., 'Learn React hooks', 'Practice system design', 'Review algorithms'"
                className="flex-1 border-0 outline-none bg-transparent text-lg"
              />
              <Button size="sm" className="ml-3">
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </Command>
        </Card>

        {/* AI Assistant Panel */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                I'll help you with React hooks
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Here's your personalized learning path with our AI agents:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AgentCard 
                  name="CLO - Curriculum Architect"
                  description="Creates structured learning paths"
                  progress={75}
                  status="active"
                />
                <AgentCard 
                  name="Socratic Inquisitor"
                  description="Asks thought-provoking questions"
                  progress={45}
                  status="ready"
                />
                <AgentCard 
                  name="Alex - Lead Engineer"
                  description="Provides code examples and reviews"
                  progress={90}
                  status="completed"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Learning Context */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-0 shadow-lg bg-white/90">
            <div className="flex items-center space-x-3 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Learning Streak</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900">7 days</div>
            <Progress value={70} className="mt-2" />
          </Card>
          
          <Card className="p-6 border-0 shadow-lg bg-white/90">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold">Weekly Goal</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900">85%</div>
            <Progress value={85} className="mt-2" />
          </Card>
          
          <Card className="p-6 border-0 shadow-lg bg-white/90">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">XP Earned</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900">2,450</div>
            <Progress value={60} className="mt-2" />
          </Card>
        </div>
      </main>
    </div>
  )
}
```

## Option 2: Conversational Interface

### Chat-Based Dashboard
```tsx
// components/workspace/ConversationDashboard.tsx
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export const ConversationDashboard = () => {
  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Learning Accelerator</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              Session Active
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Progress: 65% | Time: 23 min | Streak: 7 days
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="max-w-2xl bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                <p>I want to learn React hooks</p>
                <span className="text-xs text-blue-200 mt-2 block">2:34 PM</span>
              </div>
            </div>

            {/* CLO Agent Response */}
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/clo-avatar.jpg" />
                <AvatarFallback className="bg-blue-500 text-white">CLO</AvatarFallback>
              </Avatar>
              <Card className="max-w-2xl p-4 border-0 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-slate-900 dark:text-white">CLO - Curriculum Architect</span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  I'll create a comprehensive curriculum for React hooks. Let me structure this into manageable modules:
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Module 1: useState fundamentals</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Module 2: useEffect patterns</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Circle className="w-4 h-4 text-slate-400" />
                    <span>Module 3: Custom hooks</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 mt-3 block">2:35 PM</span>
              </Card>
            </div>

            {/* Socratic Agent Response */}
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/socratic-avatar.jpg" />
                <AvatarFallback className="bg-purple-500 text-white">S</AvatarFallback>
              </Avatar>
              <Card className="max-w-2xl p-4 border-0 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-slate-900 dark:text-white">Socratic Inquisitor</span>
                  <Badge variant="secondary" className="text-xs">Questioning</Badge>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  Before we dive in, let me ask: What's your experience level with JavaScript? 
                  This will help me tailor the questions to your current knowledge.
                </p>
                <span className="text-xs text-slate-500 mt-3 block">2:36 PM</span>
              </Card>
            </div>

            {/* Alex Agent Response */}
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/alex-avatar.jpg" />
                <AvatarFallback className="bg-orange-500 text-white">A</AvatarFallback>
              </Avatar>
              <Card className="max-w-2xl p-4 border-0 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-slate-900 dark:text-white">Alex - Lead Engineer</span>
                  <Badge variant="secondary" className="text-xs">Code Review</Badge>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  Here's a practical example to get you started:
                </p>
                <div className="mt-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <pre className="text-sm text-slate-800 dark:text-slate-200">
{`function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`}
                  </pre>
                </div>
                <span className="text-xs text-slate-500 mt-3 block">2:37 PM</span>
              </Card>
            </div>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-white dark:bg-slate-800 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input 
                placeholder="Type your question or learning goal..."
                className="flex-1"
              />
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
              <Button size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Option 3: Adaptive Workspace

### Dynamic Learning Interface
```tsx
// components/workspace/AdaptiveWorkspace.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const AdaptiveWorkspace = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Learning Accelerator</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                React Hooks
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Session: 23 min | Streak: 7 days
              </div>
              <Progress value={65} className="w-24" />
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Panel - Learning Progress */}
          <div className="col-span-3">
            <Card className="p-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">useState</span>
                    <span className="text-sm text-emerald-600">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">useEffect</span>
                    <span className="text-sm text-blue-600">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Custom Hooks</span>
                    <span className="text-sm text-slate-600">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                  Current Focus
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Mastering useEffect cleanup patterns
                </p>
              </div>
            </Card>
          </div>

          {/* Center Panel - Active Session */}
          <div className="col-span-6">
            <Card className="p-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Active Learning Session</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  useEffect
                </Badge>
              </div>
              
              <div className="prose prose-slate max-w-none">
                <h4>Understanding useEffect Cleanup</h4>
                <p>
                  When you use useEffect, you might want to clean up after the effect runs. 
                  This is especially important for subscriptions, timers, and other side effects.
                </p>
                
                <div className="my-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <h5 className="font-semibold mb-2">Example:</h5>
                  <pre className="text-sm text-slate-800 dark:text-slate-200">
{`useEffect(() => {
  const timer = setInterval(() => {
    console.log('Timer tick');
  }, 1000);

  // Cleanup function
  return () => {
    clearInterval(timer);
  };
}, []);`}
                  </pre>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Practice Exercise
                  </Button>
                  <Button variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Read More
                  </Button>
                  <Button>
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - AI Agents */}
          <div className="col-span-3">
            <Card className="p-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">AI Agents</h3>
              
              <div className="space-y-4">
                <AgentStatusCard 
                  name="CLO"
                  status="active"
                  description="Curriculum planning"
                  progress={85}
                />
                
                <AgentStatusCard 
                  name="Socratic"
                  status="ready"
                  description="Ready to question"
                  progress={60}
                />
                
                <AgentStatusCard 
                  name="Alex"
                  status="completed"
                  description="Code review done"
                  progress={100}
                />
                
                <AgentStatusCard 
                  name="Brand"
                  status="idle"
                  description="Awaiting input"
                  progress={0}
                />
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Quick Actions
                </h4>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask Question
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Code className="w-4 h-4 mr-2" />
                    Code Review
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    Set Goal
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Insights */}
        <div className="mt-8">
          <Card className="p-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">Learning Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">7</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Day Streak</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2,450</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">XP Earned</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">85%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Weekly Goal</div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

const AgentStatusCard = ({ name, status, description, progress }) => (
  <div className="p-3 border rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium text-sm">{name}</span>
      <Badge 
        variant={status === 'active' ? 'default' : 'secondary'}
        className="text-xs"
      >
        {status}
      </Badge>
    </div>
    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
      {description}
    </p>
    <Progress value={progress} className="h-1" />
  </div>
)
```

## Component Library Setup

### shadcn/ui Installation
```bash
# Install shadcn/ui
npx shadcn@latest init

# Install core components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add command
npx shadcn@latest add tabs
npx shadcn@latest add progress
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add scroll-area
```

### Theme Configuration
```typescript
// components.json
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Custom Color Palette
```typescript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
``` 