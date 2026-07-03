"use client";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">

        <div className="p-8 pb-2 border-b border-zinc-200">
          <h2 className="text-[24px] text-right text-zinc-700 font-medium">{title}</h2>
        </div>

        <div className="p-8 pt-6">
          {children}
        </div>

        <div className="flex justify-end px-8 pb-8">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-medium transition-all border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;