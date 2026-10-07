import { useEffect, useState } from 'react';
import { AlertTriangle, Clock3, ClipboardList, Package, Pill, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { AdherenceChart } from '../../components/dashboard/AdherenceChart';
import { MedicationSummary } from '../../components/dashboard/MedicationSummary';
import { StatCard } from '../../components/dashboard/StatCard';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/admin')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout role="Administrator" userName={user?.name || 'Administrator'} title="Dashboard" subtitle="Administration overview"><div className="rounded-2xl border border-[#E4E9E7] bg-white p-6 text-[#475467]">Loading dashboard data...</div></DashboardLayout>;
  if (error) return <DashboardLayout role="Administrator" userName={user?.name || 'Administrator'} title="Dashboard" subtitle="Administration overview"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div></DashboardLayout>;

  const chartData = stats?.weekly_adherence?.filter((day) => day.adherence !== null) || [];

  return (
    <DashboardLayout role="Administrator" userName={user?.name?.split(' ')[0] || 'Admin'} title="Dashboard" subtitle="Administration overview">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-base font-medium text-[#4F8A8B]">Good morning</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#263238]">Here is today’s overview</h1>
        </div>
        <Link to="/admin/medications" className="rounded-xl bg-[#4F8A8B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#447d7d]">Manage medications</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Total Residents" value={stats?.total_residents ?? 0} caption="Residents currently staying" tone="primary" />
        <StatCard icon={Pill} label="Today’s Medication Doses" value={stats?.scheduled_today ?? 0} caption="Medication doses scheduled" tone="info" />
        <StatCard icon={Clock3} label="Completed Doses" value={stats?.given_today ?? 0} caption="Successfully administered" tone="success" />
        <StatCard icon={ClipboardList} label="Pending Doses" value={stats?.pending_today ?? 0} caption="Require caregiver action" tone="warning" />
        <StatCard icon={AlertTriangle} label="Missed / Refused Doses" value={(stats?.missed_today ?? 0) + (stats?.refused_today ?? 0)} caption="Need follow-up review" tone="danger" />
        <StatCard icon={Package} label="Low Stock Medicines" value={stats?.low_stock ?? 0} caption="Products need replenishment" tone="warning" />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div>
          {chartData.length > 0
            ? <AdherenceChart data={chartData} />
            : <EmptyState title="No medication administration history available." description="Adherence trends will appear after doses are recorded." />}
        </div>
        <div className="space-y-6">
          <MedicationSummary schedule={stats?.recent_administrations ?? []} />
          <div className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
            <h3 className="text-base font-semibold text-[#263238]">Recent alerts</h3>
            <div className="mt-4 space-y-3">
              {(stats?.alerts ?? []).slice(0, 4).map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl bg-[#F8FBFB] p-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4F8A8B]" />
                  <p className="text-sm text-[#475467]">{item.message}</p>
                </div>
              ))}
              {(stats?.alerts ?? []).length === 0 && <p className="py-4 text-sm text-[#667085]">No current alerts.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#263238]">Recent activity</h3>
              <p className="text-xs text-[#667085]">Latest care updates</p>
            </div>
            <Badge tone="primary">Live</Badge>
          </div>

          <div className="space-y-4">
            {(stats?.recent_administrations ?? []).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 border-b border-[#EEF2F1] pb-3 last:border-none last:pb-0">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#C9974A]" />
                <p className="text-sm text-[#475467]">{entry.resident} — {entry.medication} marked {entry.status}</p>
              </div>
            ))}
            {(stats?.recent_administrations ?? []).length === 0 && <p className="py-5 text-sm text-[#667085]">No recent medication activity.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
