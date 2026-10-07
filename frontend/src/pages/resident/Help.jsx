import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function Help() {
  return (
    <DashboardLayout role="Resident" title="Help" subtitle="Support and assistance">
      <div className="rounded-2xl border border-[#E4E9E7] bg-white p-6">
        <h1 className="text-2xl font-semibold text-[#263238]">Need help?</h1>
        <div className="mt-5 space-y-4 text-sm text-[#475467]">
          <p>For help with medication or your daily schedule, contact your assigned caretaker or facility administrator.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
