import { Bell, Search } from 'lucide-react';

export function Topbar({ title, subtitle, userName, userRole }) {
  const displayName = userName || 'Admin';
  const shortName = displayName.split(' ')[0] || 'A';

  return (
    <header className="sticky top-0 z-20 flex h-[84px] items-center justify-between border-b border-[#E4E9E7] bg-white/90 px-5 backdrop-blur-sm lg:px-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7D8B92]">{subtitle}</p>
        <h2 className="mt-1 text-xl font-semibold text-[#263238]">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#E4E9E7] text-[#667085] hover:bg-[#F4F8F7] sm:flex" aria-label="Search">
          <Search size={18} />
        </button>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E9E7] text-[#667085] hover:bg-[#F4F8F7]" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#C96B6B]" />
        </button>

        <div className="ml-1 flex items-center gap-3 border-l border-[#E4E9E7] pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#263238]">{displayName}</p>
            <p className="text-[11px] text-[#667085]">{userRole}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4F8A8B] text-sm font-semibold text-white">
            {shortName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
