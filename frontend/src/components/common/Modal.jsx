export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10262A]/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-2xl border border-[#E6ECE9] bg-white p-6 shadow-[0_20px_50px_rgba(38,50,56,0.12)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[#263238]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E9E7] text-[#667085] hover:bg-[#F4F8F7]"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="text-sm text-[#475467]">{children}</div>

        {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
