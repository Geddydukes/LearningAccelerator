import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Label } from '../ui/Label';
import { Separator } from '../ui/Separator';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Brain, 
  ArrowLeft, 
  Zap, 
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PATHS } from '../../routes/paths';

export function AuthForm() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.name);
      } else {
        await signIn(formData.email, formData.password);
      }
      
      // Navigate to main workspace on successful auth
      navigate(PATHS.workspace, { replace: true });
      
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated, redirect away from auth page
  useEffect(() => {
    if (!loading && user) {
      navigate(PATHS.workspace, { replace: true });
    }
  }, [loading, user, navigate]);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized curriculum adapted to your style'
    },
    {
      icon: Zap,
      title: 'Accelerated Progress',
      description: 'Learn 3x faster with proven methodologies'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise security'
    }
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/10 to-secondary/20 p-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />

      {/* Back to landing button */}
      <Button
        variant="ghost"
        className="absolute left-6 top-6 text-foreground/80 hover:bg-primary/10"
        onClick={() => navigate(PATHS.landing)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Landing
      </Button>

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-12 rounded-[2.5rem] border border-white/20 bg-background/70 p-10 shadow-2xl shadow-primary/10 backdrop-blur-lg lg:grid-cols-2">
        {/* Left side - Features */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-primary">Wisely</h1>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Excel at Everything
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                Don't Cheat, Master
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-8">
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6 text-primary-foreground shadow-lg shadow-primary/20">
                <div className="mb-4 flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Trusted by 10K+ learners</span>
                </div>
                <p className="text-sm text-primary/80">
                  Join a community of motivated learners who are transforming their careers and skills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md rounded-3xl border border-primary/30 bg-background/80 shadow-xl shadow-primary/10 backdrop-blur">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>

              <div>
                <CardTitle className="text-2xl font-bold">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
                  {isSignUp 
                    ? 'Start your learning journey today' 
                    : 'Sign in to continue your progress'
                  }
                </CardDescription>
              </div>

              <Badge className="mx-auto w-fit border border-primary/30 bg-primary/10 text-primary">
                🚀 AI-Powered Learning
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field (Sign Up only) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`border border-primary/20 bg-background/70 placeholder:text-muted-foreground focus:border-primary ${
                          errors.name ? 'border-red-400 focus:border-red-400' : ''
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <div className="flex items-center space-x-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 border border-primary/20 bg-background/70 placeholder:text-muted-foreground focus:border-primary ${
                        errors.email ? 'border-red-400 focus:border-red-400' : ''
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-10 pr-10 border border-primary/20 bg-background/70 placeholder:text-muted-foreground focus:border-primary ${
                        errors.password ? 'border-red-400 focus:border-red-400' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 transform p-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center space-x-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field (Sign Up only) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 border border-primary/20 bg-background/70 placeholder:text-muted-foreground focus:border-primary ${
                          errors.confirmPassword ? 'border-red-400 focus:border-red-400' : ''
                        }`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <div className="flex items-center space-x-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.confirmPassword}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* General Error */}
                {errors.general && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.general}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full border border-primary/30 bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground shadow-lg shadow-primary/20 transition hover:shadow-primary/40"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    </div>
                  )}
                </Button>
              </form>

              <Separator className="bg-primary/20" />

              {/* Toggle Sign In/Sign Up */}
              <div className="text-center">
                <p className="text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <Button
                    variant="link"
                    className="ml-2 h-auto p-0 font-semibold text-primary hover:text-primary/80"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Button>
                </p>
              </div>

              {/* Production Notice */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-primary/80">
                  <Shield className="mr-2 inline h-4 w-4" />
                  Secure authentication powered by Supabase
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}