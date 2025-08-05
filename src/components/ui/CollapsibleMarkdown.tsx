import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleMarkdownProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'card' | 'minimal';
  className?: string;
  icon?: React.ReactNode;
}

export const CollapsibleMarkdown: React.FC<CollapsibleMarkdownProps> = ({
  title,
  children,
  defaultOpen = false,
  variant = 'default',
  className = '',
  icon
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantClasses = {
    default: 'border border-gray-200 dark:border-gray-700 rounded-2xl',
    card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm',
    minimal: 'border-b border-gray-200 dark:border-gray-700'
  };

  const headerClasses = {
    default: 'p-4',
    card: 'p-6',
    minimal: 'py-4'
  };

  const contentClasses = {
    default: 'px-4 pb-4',
    card: 'px-6 pb-6',
    minimal: 'py-4'
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left ${headerClasses[variant]} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0 text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-gray-500 dark:text-gray-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`${contentClasses[variant]} prose prose-gray dark:prose-invert max-w-none`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Markdown content wrapper component
interface MarkdownContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`prose prose-gray dark:prose-invert max-w-none ${className}`}>
      {children}
    </div>
  );
};

// Pre-built sections for common use cases
interface LearningObjectivesProps {
  objectives: string[];
  defaultOpen?: boolean;
}

export const LearningObjectives: React.FC<LearningObjectivesProps> = ({
  objectives,
  defaultOpen = true
}) => (
  <CollapsibleMarkdown
    title="Learning Objectives"
    defaultOpen={defaultOpen}
    icon={<ChevronRight className="w-5 h-5" />}
  >
    <ul className="space-y-2">
      {objectives.map((objective, index) => (
        <li key={index} className="flex items-start space-x-2">
          <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
          <span>{objective}</span>
        </li>
      ))}
    </ul>
  </CollapsibleMarkdown>
);

interface KeyConceptsProps {
  concepts: string[];
  defaultOpen?: boolean;
}

export const KeyConcepts: React.FC<KeyConceptsProps> = ({
  concepts,
  defaultOpen = false
}) => (
  <CollapsibleMarkdown
    title="Key Concepts"
    defaultOpen={defaultOpen}
    icon={<ChevronRight className="w-5 h-5" />}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {concepts.map((concept, index) => (
        <div 
          key={index}
          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {concept}
          </span>
        </div>
      ))}
    </div>
  </CollapsibleMarkdown>
);

interface ResourcesProps {
  resources: Array<{
    title: string;
    type: 'article' | 'video' | 'exercise' | 'documentation';
    url: string;
    estimatedTime: number;
  }>;
  defaultOpen?: boolean;
}

export const Resources: React.FC<ResourcesProps> = ({
  resources,
  defaultOpen = false
}) => {
  const typeIcons = {
    article: '📖',
    video: '🎥',
    exercise: '💻',
    documentation: '📚'
  };

  return (
    <CollapsibleMarkdown
      title="Resources"
      defaultOpen={defaultOpen}
      icon={<ChevronRight className="w-5 h-5" />}
    >
      <div className="space-y-3">
        {resources.map((resource, index) => (
          <a
            key={index}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{typeIcons[resource.type]}</span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {resource.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {resource.estimatedTime} min • {resource.type}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
          </a>
        ))}
      </div>
    </CollapsibleMarkdown>
  );
};