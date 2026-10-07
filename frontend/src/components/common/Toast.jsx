export function Toast({ message, visible, onClose }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-2xl border border-[#D9EAE7] bg-[#F9FDFD] px-4 py-3 shadow-[0_16px_30px_rgba(31,48,53,0.12)]">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF5EE] text-[#5F9E7A]">
          ✓
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1E2A2E]">Success</p>
          <p className="text-xs text-[#667085]">{message}</p>
        </div>
        <button type="button" onClick={onClose} className="ml-2 text-[#667085] hover:text-[#263238]">×</button>
      </div>
    </div>
  );
}
