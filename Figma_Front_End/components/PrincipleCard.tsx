import { Card } from "./ui/card"
import { ReactNode } from "react"
import { ImageWithFallback } from "./figma/ImageWithFallback"

interface PrincipleCardProps {
  title: string
  subtitle: string
  description: string
  icon: ReactNode
  proofElement: ReactNode
  accentColor: string
  imageSrc: string
  imageAlt: string
  darkBackground?: boolean
  textOnRight?: boolean
}

export function PrincipleCard({ 
  title, 
  subtitle, 
  description, 
  icon, 
  proofElement, 
  accentColor, 
  imageSrc,
  imageAlt,
  darkBackground = false,
  textOnRight = false
}: PrincipleCardProps) {
  const bgClass = darkBackground ? "bg-black" : "bg-gray-50"
  const textColorClass = darkBackground ? "text-white" : "text-foreground"
  const mutedTextClass = darkBackground ? "text-gray-300" : "text-muted-foreground"
  
  const TextContent = (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div 
          className={`w-16 h-16 rounded-full flex items-center justify-center`}
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </div>
        <div>
          <h3 className={`text-2xl font-medium ${textColorClass}`}>{title}</h3>
          <p className={mutedTextClass}>{subtitle}</p>
        </div>
      </div>
      <p className={`text-lg leading-relaxed ${textColorClass}`}>{description}</p>
      <div className={`${darkBackground ? 'bg-gray-900/50' : 'bg-background/50'} rounded-lg p-6 backdrop-blur-sm`}>
        {proofElement}
      </div>
    </div>
  )

  const ImageContent = (
    <div className="flex items-center justify-center">
      <ImageWithFallback
        src={imageSrc}
        alt={imageAlt}
        className="w-full max-w-md h-80 object-cover rounded-lg"
      />
    </div>
  )

  return (
    <section className={`${bgClass} py-16`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {textOnRight ? (
            <>
              {ImageContent}
              {TextContent}
            </>
          ) : (
            <>
              {TextContent}
              {ImageContent}
            </>
          )}
        </div>
      </div>
    </section>
  )
}