import { ReactNode } from "react";

interface PrincipleCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
  proofElement: ReactNode;
  accentColor: string;
  imageSrc: string;
  imageAlt: string;
  darkBackground?: boolean;
  textOnRight?: boolean;
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
  const bgClass = darkBackground
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black'
    : 'bg-gradient-to-br from-white via-background to-secondary/10';
  const textColorClass = darkBackground ? 'text-white' : 'text-foreground';
  const mutedTextClass = darkBackground ? 'text-slate-300' : 'text-muted-foreground';
  
  const TextContent = (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border border-white/10 shadow-inner shadow-black/20`}
          style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
        >
          {icon}
        </div>
        <div>
          <h3 className={`text-2xl font-medium ${textColorClass}`}>{title}</h3>
          <p className={mutedTextClass}>{subtitle}</p>
        </div>
      </div>
      <p className={`text-lg leading-relaxed ${textColorClass}`}>{description}</p>
      <div
        className={`${
          darkBackground ? 'bg-white/5 border border-white/10' : 'bg-background/70 border border-border/40'
        } rounded-2xl p-6 shadow-lg shadow-black/5 backdrop-blur-lg`}
      >
        {proofElement}
      </div>
    </div>
  );

  const ImageContent = (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[rgba(59,130,246,0.18)] to-transparent blur-2xl" />
      <img
        src={imageSrc}
        alt={imageAlt}
        className="h-80 w-full max-w-md rounded-3xl object-cover shadow-xl shadow-black/10"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden h-80 w-full max-w-md items-center justify-center rounded-3xl bg-gray-200 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🖼️</div>
          <div className="text-sm">Image not available</div>
        </div>
      </div>
    </div>
  );

  return (
    <section className={`${bgClass} py-16`}> 
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
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
  );
} 