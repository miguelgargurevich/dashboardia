import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}


const Modal: React.FC<ModalProps> = ({ open, onClose, children, title, maxWidth = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
        <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl flex items-center justify-between">
          <div>
            {title && <h3 className="text-xl font-bold text-accent">{title}</h3>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600/20"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
