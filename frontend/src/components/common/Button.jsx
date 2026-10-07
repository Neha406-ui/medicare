export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8A8B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary: 'bg-[#4F8A8B] text-white hover:bg-[#447d7d]',
    secondary: 'border border-[#D6E1DF] bg-white text-[#263238] hover:bg-[#F2F7F6]',
    ghost: 'bg-[#EEF6F5] text-[#4F8A8B] hover:bg-[#E2F0EE]',
    danger: 'bg-[#FCEEEE] text-[#C96B6B] hover:bg-[#F7E1E1]',
    muted: 'bg-[#EEF1F1] text-[#263238] hover:bg-[#E3E8E8]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
