export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D7E1DF] bg-[#F9FBFB] px-6 py-12 text-center">
      <p className="text-lg font-semibold text-[#263238]">{title}</p>
      {description && <p className="mt-2 text-sm text-[#667085]">{description}</p>}
      {action}
    </div>
  );
}
