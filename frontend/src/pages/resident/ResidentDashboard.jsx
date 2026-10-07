import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export function ResidentDashboard() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [weeklyAdherence, setWeeklyAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/resident')
      .then(({ data }) => {
        setSchedule(data.today_medications || []);
        setWeeklyAdherence(data.weekly_adherence);
      })
      .catch(() => setError('Unable to load your medication schedule.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="Resident" userName={user?.name?.split(' ')[0] || 'Resident'} title="Home" subtitle="Daily medication overview">
      <div className="mb-6">
        <p className="text-base font-medium text-[#4F8A8B]">Good morning, {user?.name?.split(' ')[0] || 'Resident'}</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#263238]">Here are your medicines for today.</h1>
      </div>

      {loading ? <LoadingState label="Loading your schedule..." /> : null}
      {!loading && error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div> : null}

      {!loading && !error && schedule.length === 0 && (
        <EmptyState title="No medication schedule configured for today." />
      )}

      <div className="space-y-4">
        {!loading && !error && schedule.map((item) => (
          <div key={`${item.schedule_id}-${item.scheduled_time}`} className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-[#7D8B92]">{item.scheduled_time}</p>
                <h3 className="mt-1 text-2xl font-semibold text-[#263238]">{item.medicine_name}</h3>
                <p className="text-base text-[#667085]">{item.dosage} {item.unit}</p>
                <p className="mt-2 text-sm text-[#475467]">{item.instructions || 'No additional instructions recorded.'}</p>
              </div>
              <Badge tone={item.status === 'GIVEN' ? 'success' : item.status === 'MISSED' || item.status === 'REFUSED' || item.status === 'LATE' ? 'danger' : 'info'}>
                {item.status === 'GIVEN' ? 'Taken' : item.status === 'MISSED' ? 'Missed' : item.status === 'REFUSED' ? 'Refused' : item.status === 'LATE' ? 'Late' : 'Upcoming'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {!loading && !error && (
        <div className="mt-6 rounded-2xl border border-[#E4E9E7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#263238]">Medication adherence (last 7 days)</h2>
          {weeklyAdherence === null
            ? <p className="mt-2 text-sm text-[#667085]">No medication history available.</p>
            : <p className="mt-2 text-2xl font-semibold text-[#4F8A8B]">{weeklyAdherence}%</p>}
        </div>
      )}
    </DashboardLayout>
  );
}
