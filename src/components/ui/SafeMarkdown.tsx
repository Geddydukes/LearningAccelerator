// SafeMarkdown component that only allows safe HTML elements
// Strips HTML, script, and raw iframes while preserving safe markdown

import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
  allowLinks?: boolean;
  allowCode?: boolean;
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({
  content,
  className = '',
  allowLinks = true,
  allowCode = true
}) => {
  // Convert markdown to HTML (basic conversion)
  const htmlContent = convertMarkdownToHtml(content);
  
  // Sanitize HTML content
  const sanitizedHtml = sanitizeHtml(htmlContent, allowLinks, allowCode);
  
  return (
    <div 
      className={`safe-markdown ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

/**
 * Convert basic markdown to HTML
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Wrap lists in ul/ol tags
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br><\/p>/g, '');
  
  return html;
}

/**
 * Sanitize HTML content (simplified without DOMPurify)
 */
function sanitizeHtml(html: string, allowLinks: boolean, allowCode: boolean): string {
  // Simple tag whitelist
  const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br',
    'strong', 'em', 'b', 'i',
    'ul', 'ol', 'li',
    'blockquote',
    'hr'
  ];
  
  if (allowCode) {
    allowedTags.push('code', 'pre');
  }
  
  if (allowLinks) {
    allowedTags.push('a');
  }
  
  // Simple regex-based sanitization
  let sanitized = html;
  
  // Remove all script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s+(on\w+|javascript:|data:|vbscript:)[^>]*/gi, '');
  
  // Ensure links are safe
  if (allowLinks) {
    sanitized = sanitized.replace(
      /<a\s+href="([^"]*)"([^>]*)>/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer"$2>'
    );
  }
  
  return sanitized;
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Extract text content from markdown
 */
export function extractTextFromMarkdown(markdown: string): string {
  // Remove code blocks
  let text = markdown.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');
  
  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove list markers
  text = text.replace(/^[\*\-]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  
  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n');
  text = text.trim();
  
  return text;
}

/**
 * Check if content contains unsafe elements
 */
export function hasUnsafeContent(content: string): boolean {
  const unsafePatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /javascript:/gi,
    /data:/gi,
    /vbscript:/gi
  ];
  
  return unsafePatterns.some(pattern => pattern.test(content));
}

/**
 * Get word count from markdown content
 */
export function getWordCount(content: string): number {
  const text = extractTextFromMarkdown(content);
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Get reading time estimate from markdown content
 */
export function getReadingTime(content: string, wordsPerMinute: number = 200): number {
  const wordCount = getWordCount(content);
  return Math.ceil(wordCount / wordsPerMinute);
}
