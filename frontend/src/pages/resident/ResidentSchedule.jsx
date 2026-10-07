import { useEffect, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const statusTone = {
  PENDING: 'warning',
  GIVEN: 'success',
  MISSED: 'danger',
  REFUSED: 'danger',
};

export function ResidentSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/dashboard/resident')
      .then(({ data }) => {
        if (isMounted) setSchedule(data.today_medications || []);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load your schedule.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout role="Resident" title="Today's Schedule" subtitle="Your medication plan">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#263238]">Medication schedule</h1>
      </div>
      {loading ? <LoadingState label="Loading your schedule..." /> : null}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && schedule.length === 0 && <EmptyState title="No medication schedule configured for today." />}
      {!loading && !error && schedule.length > 0 && (
        <div className="space-y-4">
          {schedule.map((item) => (
            <div key={item.schedule_id} className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[#7D8B92]">{item.scheduled_time}</p>
                  <p className="mt-1 text-xl font-semibold text-[#263238]">{item.medicine_name}</p>
                  <p className="text-sm text-[#667085]">{item.dosage} {item.unit} · {item.instructions || 'No additional instructions recorded.'}</p>
                </div>
                <Badge tone={statusTone[item.status] || 'info'}>
                  {item.status === 'GIVEN' ? 'Taken' : item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
