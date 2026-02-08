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
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={hideCloseButton ? undefined : onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-primary-gray-850 rounded-lg shadow-xl max-w-2xl w-full border border-primary-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-gray-700">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="text-primary-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
