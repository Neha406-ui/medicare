export function StatBlock({ label, value, helper, tone = 'default' }) {
  const classes = {
    default: 'border-[#E4E9E7] bg-white',
    success: 'border-[#DDEFE0] bg-[#F7FBF8]',
    warning: 'border-[#F0E3CA] bg-[#FFF9F2]',
    danger: 'border-[#F1D6D6] bg-[#FFF7F7]',
    info: 'border-[#DDEAF0] bg-[#F7FAFD]',
  };

  return (
    <div className={`rounded-2xl border p-4 ${classes[tone]}`}>
      <p className="text-xs uppercase tracking-[0.08em] text-[#7B8690]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#263238]">{value}</p>
      <p className="mt-1 text-xs text-[#667085]">{helper}</p>
    </div>
  );
}
