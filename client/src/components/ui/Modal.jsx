import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, subtitle, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className="sheet relative"
      >
        <div className="grab" />
        <div className="flex items-center justify-between mb-2">
          {title && <h2>{title}</h2>}
          <button 
            type="button"
            onClick={onClose}
            className="icon-btn !w-8 !h-8 !border-0 text-[var(--muted)] hover:text-[var(--ink)] ml-auto"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {subtitle && <p className="sub">{subtitle}</p>}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
