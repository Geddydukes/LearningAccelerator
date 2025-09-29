import { Navigation } from "./components/Navigation"
import { HeroSection } from "./components/HeroSection"
import { SixPrinciples } from "./components/SixPrinciples"
import { PricingSection } from "./components/PricingSection"
import { FinalCTA } from "./components/FinalCTA"
import { useEffect } from "react"

export default function App() {
  useEffect(() => {
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]')
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const target = document.querySelector(link.getAttribute('href')!)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      })
    })

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReducedMotion) {
      // Add subtle scroll-based animations
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in')
            }
          })
        },
        { threshold: 0.1 }
      )

      // Observe sections for animation
      document.querySelectorAll('section').forEach((section) => {
        observer.observe(section)
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main>
        <HeroSection />
        <SixPrinciples />
        <PricingSection />
        <FinalCTA />
      </main>

      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-muted-foreground">
            © 2025 Wisely. All rights reserved.
          </div>
          <div className="flex space-x-6 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: animate-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}