export function SearchInput({ value, onChange, placeholder = 'Search', className = '' }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-[#DDE7E5] bg-white px-3 py-2.5 text-sm text-[#667085] ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16L21 21" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-sm text-[#263238] placeholder:text-[#8A959D] focus:outline-none"
      />
    </div>
  );
}
