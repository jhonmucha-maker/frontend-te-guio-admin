import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Dialog = ({
  open,
  onClose,
  children,
  maxWidth = 'md',
  fullScreen = false,
  className = '',
}) => {
  const dialogRef = useRef(null);

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full',
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={`
          relative bg-surface shadow-modal
          ${fullScreen
            ? 'w-full h-full rounded-none'
            : `${maxWidths[maxWidth]} w-full mx-4 rounded-card max-h-[90vh] overflow-auto`
          }
          ${className}
        `}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children, onClose, className = '' }) => (
  <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 sm:px-6 sm:py-4 ${className}`}>
    <div className="font-semibold text-lg text-gray-900">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X size={20} />
      </button>
    )}
  </div>
);

const DialogContent = ({ children, className = '' }) => (
  <div className={`px-4 py-4 sm:px-6 sm:py-5 ${className}`}>
    {children}
  </div>
);

const DialogFooter = ({ children, className = '' }) => (
  <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 sm:px-6 ${className}`}>
    {children}
  </div>
);

Dialog.Header = DialogHeader;
Dialog.Content = DialogContent;
Dialog.Footer = DialogFooter;

export default Dialog;
