import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout role="Administrator" title="Account & Settings" subtitle="Administrator account">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#263238]">Account & settings</h1>
        <p className="mt-1 text-sm text-[#667085]">Account details are loaded from your authenticated session.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#263238]">Signed-in administrator</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[#667085]">Name</dt><dd className="font-medium text-[#263238]">{user?.name || user?.full_name || 'Not available'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#667085]">Username</dt><dd className="font-medium text-[#263238]">{user?.username || 'Not available'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#667085]">Role</dt><dd className="font-medium text-[#263238]">{user?.role || 'Not available'}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-[#667085]">To end this session, use the Logout control in the navigation.</p>
        </section>
        <section className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#263238]">Audit records</h2>
          <p className="mt-2 text-sm text-[#667085]">Review persistent records for resident, medication, schedule, stock, and dose-administration changes.</p>
          <Link to="/admin/audit-logs" className="mt-4 inline-flex text-sm font-semibold text-[#4F8A8B] hover:underline">Open audit log</Link>
        </section>
      </div>
    </DashboardLayout>
  );
}
