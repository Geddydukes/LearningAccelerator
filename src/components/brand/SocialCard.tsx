import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Copy, 
  ExternalLink, 
  Edit3, 
  Heart, 
  MessageCircle, 
  Share, 
  Eye,
  Linkedin,
  Twitter,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface SocialContent {
  title: string;
  body: string;
  estimatedEngagement: number;
  tags?: string[];
  metrics?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
}

interface SocialCardProps {
  platform: 'linkedin' | 'twitter' | 'blog';
  content: SocialContent;
  onCopy: () => void;
  onPublish: () => void;
  variant?: 'preview' | 'edit';
  className?: string;
}

export const SocialCard: React.FC<SocialCardProps> = ({
  platform,
  content,
  onCopy,
  onPublish,
  variant = 'preview',
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(variant === 'edit');
  const [editedContent, setEditedContent] = useState(content);

  const platformConfig = {
    linkedin: {
      icon: Linkedin,
      color: 'bg-blue-600',
      name: 'LinkedIn',
      maxLength: 3000,
      placeholder: 'Share your professional insights...'
    },
    twitter: {
      icon: Twitter,
      color: 'bg-black',
      name: 'Twitter/X',
      maxLength: 280,
      placeholder: 'What\'s happening?'
    },
    blog: {
      icon: FileText,
      color: 'bg-emerald-600',
      name: 'Blog Post',
      maxLength: 10000,
      placeholder: 'Write your blog post...'
    }
  };

  const config = platformConfig[platform];
  const PlatformIcon = config.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent.body);
      toast.success('Content copied to clipboard!');
      onCopy();
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save the edited content
    toast.success('Content updated!');
  };

  const formatEngagement = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center`}>
              <PlatformIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {config.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {platform === 'blog' ? 'Article' : 'Post'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title (for blog posts) */}
        {platform === 'blog' && (
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editedContent.title}
                onChange={(e) => setEditedContent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
                placeholder="Blog post title..."
              />
            ) : (
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editedContent.title}
              </h4>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="relative">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent.body}
                onChange={(e) => setEditedContent(prev => ({ ...prev, body: e.target.value }))}
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={config.placeholder}
                maxLength={config.maxLength}
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{editedContent.body.length} / {config.maxLength}</span>
                <div className="space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {editedContent.body}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {editedContent.tags && editedContent.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {editedContent.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Estimated Engagement */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>Est. {formatEngagement(editedContent.estimatedEngagement)} {platform === 'blog' ? 'views' : 'likes'}</span>
          </div>
          
          {content.metrics && (
            <>
              {content.metrics.likes && (
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{formatEngagement(content.metrics.likes)}</span>
                </div>
              )}
              {content.metrics.shares && (
                <div className="flex items-center space-x-1">
                  <Share className="w-4 h-4" />
                  <span>{formatEngagement(content.metrics.shares)}</span>
                </div>
              )}
              {content.metrics.comments && (
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{formatEngagement(content.metrics.comments)}</span>
                </div>
              )}
              {content.metrics.views && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{formatEngagement(content.metrics.views)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </Button>
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={onPublish}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Publish</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Social Content Grid
interface SocialContentGridProps {
  contents: Array<{
    platform: 'linkedin' | 'twitter' | 'blog';
    content: SocialContent;
  }>;
  onCopy: (platform: string) => void;
  onPublish: (platform: string) => void;
  className?: string;
}

export const SocialContentGrid: React.FC<SocialContentGridProps> = ({
  contents,
  onCopy,
  onPublish,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {contents.map((item, index) => (
        <motion.div
          key={`${item.platform}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <SocialCard
            platform={item.platform}
            content={item.content}
            onCopy={() => onCopy(item.platform)}
            onPublish={() => onPublish(item.platform)}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Social Analytics Summary
interface SocialAnalyticsProps {
  totalFollowers: number;
  engagementRate: number;
  contentViews: number;
  authorityScore: number;
  className?: string;
}

export const SocialAnalytics: React.FC<SocialAnalyticsProps> = ({
  totalFollowers,
  engagementRate,
  contentViews,
  authorityScore,
  className = ''
}) => {
  const metrics = [
    {
      label: 'Total Followers',
      value: totalFollowers,
      format: (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toString(),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Engagement Rate',
      value: engagementRate,
      format: (val: number) => `${val.toFixed(1)}%`,
      icon: Heart,
      color: 'text-red-600'
    },
    {
      label: 'Content Views',
      value: contentViews,
      format: (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toString(),
      icon: Eye,
      color: 'text-emerald-600'
    },
    {
      label: 'Authority Score',
      value: authorityScore,
      format: (val: number) => `${val} pts`,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className="p-4 text-center">
            <div className={`w-8 h-8 ${metric.color} mx-auto mb-2 flex items-center justify-center`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.format(metric.value)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {metric.label}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};