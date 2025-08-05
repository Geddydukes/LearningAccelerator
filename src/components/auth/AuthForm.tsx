import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Brain } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../hooks/useDatabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});
type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;
type MagicLinkData = z.infer<typeof magicLinkSchema>;

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, sendMagicLink } = useAuth();
  const { refreshData } = useDatabase();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<SignUpData>({
    resolver: zodResolver(
      useMagicLink ? magicLinkSchema : isSignUp ? signUpSchema : signInSchema
    ),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    }
  });

  // Watch form values for debugging
  const watchedValues = watch();
  console.log('Form values:', watchedValues);
  console.log('Form errors:', errors);
  const onSubmit = async (data: SignUpData) => {
    console.log('Submitting form with data:', data);
    setLoading(true);
    try {
      if (useMagicLink) {
        await sendMagicLink(data.email);
        toast.success('Magic link sent to your email!');
      } else if (isSignUp) {
        await signUp(data.email, data.password, data.name);
        toast.success('Account created successfully!');
        // Initialize user data after signup
        setTimeout(() => refreshData(), 1000);
      } else {
        await signIn(data.email, data.password);
        toast.success('Welcome back!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('Auth error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setUseMagicLink(false);
    reset({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
  };

  const toggleMagicLink = () => {
    setUseMagicLink(!useMagicLink);
    reset({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Learning Accelerator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Multi-Agent Learning Platform
          </p>
        </div>

        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {useMagicLink ? 'Magic Link' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {useMagicLink 
                ? 'Enter your email to receive a magic link'
                : isSignUp 
                ? 'Start your learning journey today'
                : 'Sign in to continue your learning'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && !useMagicLink && (
              <Input
                label="Full Name"
                icon={<User className="w-5 h-5" />}
                {...register('name')}
                error={errors.name?.message}
                placeholder="Enter your full name"
              />
            )}

            <Input
              label="Email"
              type="email"
              icon={<Mail className="w-5 h-5" />}
              {...register('email')}
              error={errors.email?.message}
              placeholder="Enter your email"
              autoComplete="email"
            />

            {!useMagicLink && (
              <>
                <Input
                  label="Password"
                  type="password"
                  icon={<Lock className="w-5 h-5" />}
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="Enter your password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />

                {isSignUp && (
                  <Input
                    label="Confirm Password"
                    type="password"
                    icon={<Lock className="w-5 h-5" />}
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {useMagicLink 
                ? 'Send Magic Link'
                : isSignUp 
                ? 'Create Account'
                : 'Sign In'
              }
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={toggleMagicLink}
              type="button"
            >
              {useMagicLink ? 'Use Password' : 'Use Magic Link'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};