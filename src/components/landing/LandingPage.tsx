import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, Sparkles, Users, Target, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import HeroCanvas from '../../../design-system/components/HeroCanvas';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [rippleCenter, setRippleCenter] = useState<[number, number]>([0.5, 0.5]);
  const [rippleStrength, setRippleStrength] = useState(0);
  const [rippleTime, setRippleTime] = useState(0);
  const [cameraZ, setCameraZ] = useState(8);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleWaterClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || hasInteracted) return;
    
    console.log('Water clicked!'); // Debug log
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    console.log('Click position (normalized):', { x, y }); // Debug log
    
    setRippleCenter([x, y]);
    setRippleStrength(1);
    setRippleTime(0);
    setCameraZ(2); // Dive deeper into water
    setHasInteracted(true);
    
    // Animate ripple time for expanding circles
    const startTime = Date.now();
    const animateRipple = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setRippleTime(elapsed);
      
      if (elapsed < 1.5) { // Ripple lasts 1.5 seconds
        requestAnimationFrame(animateRipple);
      }
    };
    animateRipple();
    
    // Sequence: Ripple (1.5s) -> Dive -> Surface -> Show content
    setTimeout(() => {
      setCameraZ(12); // Surface from water
    }, 1000);
    
    setTimeout(() => {
      setShowContent(true);
    }, 1800);
    
    // Reset ripple
    setTimeout(() => {
      setRippleStrength(0);
      setRippleTime(0);
      setCameraZ(8);
    }, 2500);
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Four specialized agents work together to accelerate your learning journey through personalized curriculum and interactive dialogue.",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: Users,
      title: "Socratic Method",
      description: "Engage in thought-provoking conversations that challenge your thinking and deepen understanding through guided questioning.",
      color: "from-emerald-400 to-emerald-600"
    },
    {
      icon: Target,
      title: "Code Review Excellence",
      description: "Get expert-level code analysis and recommendations from Alex, our lead engineer agent, to improve your technical skills.",
      color: "from-purple-400 to-purple-600"
    },
    {
      icon: Zap,
      title: "Brand Strategy Insights",
      description: "Develop compelling brand narratives and content strategies with AI-powered market analysis and engagement optimization.",
      color: "from-amber-400 to-amber-600"
    }
  ];

  if (user) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Screen Water Background */}
      <div 
        className="fixed inset-0 w-full h-full cursor-pointer"
        style={{ zIndex: 1 }}
        onClick={handleWaterClick}
      >
        <HeroCanvas
          className="fixed inset-0"
          rippleCenter={rippleCenter}
          rippleStrength={rippleStrength}
          rippleTime={rippleTime}
          cameraZ={cameraZ}
          reducedMotion={reducedMotion}
        />
      </div>
      
      {/* Overlay gradient for text readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" style={{ zIndex: 2 }} />
      
      {/* Initial Hero Content - Always visible */}
      <AnimatePresence>
        {!showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <div className="text-center px-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
                className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/40 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-8 border border-white/30"
              >
                <Brain className="w-12 h-12 text-white drop-shadow-lg" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-2xl"
              >
                Learning Accelerator
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="text-2xl md:text-3xl text-white/90 mb-4 font-light drop-shadow-lg"
              >
                Ripple of Knowledge
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md"
              >
                Experience the future of learning with our multi-agent AI platform.
                <br />
                <span className="text-white/60 text-base">Click the water to begin your journey</span>
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="flex justify-center"
              >
                <div className="animate-bounce">
                  <div className="w-8 h-8 border-2 border-white/60 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Appears after interaction */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen"
          >
            {/* Content Background */}
            <div className="bg-gradient-to-b from-transparent via-slate-50/95 to-slate-100/95 backdrop-blur-sm min-h-screen">
              
              {/* Welcome Section */}
              <section className="pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-4xl md:text-6xl font-bold text-slate-900 mb-6"
                  >
                    Welcome to the Deep
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-xl text-slate-700 mb-12 max-w-2xl mx-auto"
                  >
                    You've taken the plunge into a new dimension of learning. 
                    Let our AI agents guide you through the currents of knowledge.
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                  >
                    <Button
                      size="lg"
                      className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                      onClick={() => window.location.href = '/auth'}
                    >
                      Start Learning
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="lg"
                      className="px-8 py-4 text-lg text-slate-700 hover:bg-white/50"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Watch Demo
                    </Button>
                  </motion.div>
                </div>
              </section>

              {/* Floating Lily Pad Features */}
              <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                  >
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                      Four AI Agents, One Learning Journey
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                      Our specialized agents work in harmony like lily pads on a pond, 
                      each supporting your growth in different ways.
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 50, rotate: -5 }}
                        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                        whileHover={{ 
                          y: -10, 
                          scale: 1.02,
                          transition: { duration: 0.3 }
                        }}
                        transition={{ 
                          delay: index * 0.2, 
                          duration: 0.8,
                          type: "spring",
                          stiffness: 100
                        }}
                        viewport={{ once: true }}
                        className="relative"
                      >
                        {/* Feature Card */}
                        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 dark:border-gray-700/50">
                          {/* Subtle gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-2xl" />
                          
                          {/* Content */}
                          <div className="relative z-10 text-center">
                            <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                              <feature.icon className="w-8 h-8 text-white" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                              {feature.title}
                            </h3>
                            
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Floating bubbles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-4 h-4 bg-blue-200/30 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [-20, -100],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              </section>

              {/* CTA Section */}
              <section className="py-24 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-emerald-600/90 backdrop-blur-sm" />
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="relative z-10 max-w-4xl mx-auto text-center"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Ready to Dive Deeper?
                  </h2>
                  
                  <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                    Join thousands of learners who are making waves in their education journey.
                  </p>
                  
                  <Button
                    size="lg"
                    className="px-12 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100 shadow-2xl border border-blue-200"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Dive In Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};