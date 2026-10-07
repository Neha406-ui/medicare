export function Badge({ children, tone = 'neutral', className = '', compact = false }) {
  const tones = {
    neutral: 'bg-[#F3F5F5] text-[#4B5861]',
    success: 'bg-[#EAF5EE] text-[#5F9E7A]',
    warning: 'bg-[#FFF6E5] text-[#C9974A]',
    danger: 'bg-[#FCEEEE] text-[#C96B6B]',
    info: 'bg-[#EDF4F8] text-[#668BA4]',
    primary: 'bg-[#E8F3F2] text-[#4F8A8B]',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px]'} ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
