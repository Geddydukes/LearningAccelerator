import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SideNav } from './SideNav';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      const focusableElements = drawerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-80 max-w-[80vw] z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="relative h-full bg-white dark:bg-gray-800 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Menu
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Navigation */}
              <div className="flex-1 overflow-y-auto">
                <SideNav />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
} 