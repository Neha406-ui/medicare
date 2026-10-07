export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-[#E8EEED] bg-white text-sm text-[#667085]">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C9E1E0] border-t-[#4F8A8B]" />
        {label}
      </div>
    </div>
  );
}
