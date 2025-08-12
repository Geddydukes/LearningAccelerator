import React, { useState } from 'react';
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
  const { signIn, signUp } = useAuth();
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
      
      // Auth context will handle the user state update
      // Navigation will happen automatically via the App.tsx routing logic
      console.log('Auth successful:', formData);
      
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 relative overflow-hidden flex items-center justify-center p-6">
      {/* More dramatic metallic overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-300/20 via-transparent to-cyan-400/15 pointer-events-none" />
      
      {/* More dramatic animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-300/15 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      {/* Back to landing button */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-white hover:bg-white/10 border-white/20"
        onClick={() => navigate(PATHS.landing)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Landing
      </Button>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Features */}
        <div className="hidden lg:block">
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold">Wisely</h1>
              </div>
              <p className="text-xl text-blue-200 leading-relaxed">
                Excel at Everything
              </p>
              <p className="text-lg text-cyan-200 font-medium">
                Don't Cheat, Master
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-300/20 to-cyan-400/20 rounded-lg flex items-center justify-center border border-blue-300/30">
                      <Icon className="w-5 h-5 text-blue-200" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-blue-200">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">Trusted by 10K+ learners</span>
                </div>
                <p className="text-blue-200 text-sm">
                  Join a community of motivated learners who are transforming their careers and skills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border-white/10 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-blue-200 mt-2">
                  {isSignUp 
                    ? 'Start your learning journey today' 
                    : 'Sign in to continue your progress'
                  }
                </CardDescription>
              </div>

              <Badge className="w-fit mx-auto bg-blue-400/20 text-blue-200 border-blue-300/30">
                🚀 AI-Powered Learning
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field (Sign Up only) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Full Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 ${
                          errors.name ? 'border-red-400' : ''
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
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 ${
                        errors.email ? 'border-red-400' : ''
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
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 ${
                        errors.password ? 'border-red-400' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-blue-300 hover:text-white hover:bg-white/10"
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
                    <Label htmlFor="confirmPassword" className="text-white">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 ${
                          errors.confirmPassword ? 'border-red-400' : ''
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
                  className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white border-0 shadow-lg shadow-blue-400/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    </div>
                  )}
                </Button>
              </form>

              <Separator className="bg-white/20" />

              {/* Toggle Sign In/Sign Up */}
              <div className="text-center">
                <p className="text-blue-200">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <Button
                    variant="link"
                    className="text-blue-300 hover:text-white p-0 h-auto font-semibold ml-2"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Button>
                </p>
              </div>

              {/* Production Notice */}
              <div className="bg-blue-400/10 border border-blue-300/20 rounded-lg p-4 text-center">
                <p className="text-blue-200 text-sm">
                  <Shield className="w-4 h-4 inline mr-2" />
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