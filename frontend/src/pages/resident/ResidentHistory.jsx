import { useEffect, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Not recorded';
}

export function ResidentHistory() {
  const [records, setRecords] = useState([]);
  const [medicationNames, setMedicationNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.get('/administrations'), api.get('/medications')])
      .then(([{ data: history }, { data: medications }]) => {
        if (!isMounted) return;
        setRecords(history);
        setMedicationNames(Object.fromEntries(medications.map((item) => [item.id, item.medicine_name])));
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load your medication history.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout role="Resident" title="Medication History" subtitle="Your medication records">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#263238]">Medication history</h1>
      </div>
      {loading ? <LoadingState label="Loading medication history..." /> : null}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && records.length === 0 && <EmptyState title="No medication administration history available." />}
      {!loading && !error && (
        <div className="space-y-3">
          {records.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[#E4E9E7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#263238]">{medicationNames[item.medication_id] || 'Medication record'}</p>
                <p className="text-xs text-[#667085]">
                  Scheduled {formatDate(item.scheduled_time)}
                  {item.administered_at ? ` · Administered ${formatDate(item.administered_at)}` : ''}
                </p>
                {item.administered_by && <p className="mt-1 text-xs text-[#667085]">Recorded by {item.administered_by}</p>}
                {item.missed_reason && <p className="mt-1 text-xs text-[#667085]">Reason: {item.missed_reason}</p>}
                {item.notes && <p className="mt-1 text-sm text-[#475467]">{item.notes}</p>}
              </div>
              <Badge tone={item.status === 'GIVEN' ? 'success' : item.status === 'MISSED' || item.status === 'REFUSED' ? 'danger' : 'info'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
