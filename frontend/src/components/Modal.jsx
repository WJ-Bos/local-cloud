import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, hideCloseButton = false }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !hideCloseButton) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, hideCloseButton]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={hideCloseButton ? undefined : onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#111113] rounded-xl shadow-2xl max-w-3xl w-full border border-white/[0.08]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
            <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="text-primary-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
