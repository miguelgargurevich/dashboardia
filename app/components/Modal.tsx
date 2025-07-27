import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, title, maxWidth = "max-w-lg" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`bg-secondary rounded-2xl shadow-2xl border border-accent/20 w-full ${maxWidth} mx-4 relative`}>
        <button
          className="absolute top-3 right-3 text-accent hover:text-red-400 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        {title && <div className="px-6 pt-6 pb-2 text-xl font-bold text-accent">{title}</div>}
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
