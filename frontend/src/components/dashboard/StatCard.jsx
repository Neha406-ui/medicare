export function StatCard({ icon: Icon, label, value, caption, tone = 'primary' }) {
  const tones = {
    primary: 'bg-[#E8F3F2] text-[#4F8A8B]',
    success: 'bg-[#EAF5EE] text-[#5F9E7A]',
    warning: 'bg-[#FFF6E5] text-[#C9974A]',
    danger: 'bg-[#FCEEEE] text-[#C96B6B]',
    info: 'bg-[#EDF4F8] text-[#668BA4]',
  };

  return (
    <div className="rounded-2xl border border-[#E4E9E7] bg-white p-5 shadow-[0_8px_20px_rgba(31,48,53,0.03)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#7D8B92]">Today</span>
      </div>

      <div className="mt-5">
        <p className="text-sm text-[#667085]">{label}</p>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[#263238]">{value}</h3>
        <p className="mt-2 text-xs text-[#667085]">{caption}</p>
      </div>
    </div>
  );
}
