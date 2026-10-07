import { useEffect, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export function MyMedicines() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/medications')
      .then(({ data }) => {
        const today = new Date().toISOString().slice(0, 10);
        if (isMounted) setMedications(data.filter((item) => (
          item.status === 'active'
          && (!item.start_date || item.start_date <= today)
          && (!item.end_date || item.end_date >= today)
        )));
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load your medications.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout role="Resident" title="My Medicines" subtitle="Medication overview">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#263238]">Your medicines</h1>
      </div>
      {loading ? <LoadingState label="Loading your medicines..." /> : null}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && medications.length === 0 && <EmptyState title="No medications found." />}
      {!loading && !error && (
        <div className="space-y-4">
          {medications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-[#263238]">{item.medicine_name}</p>
                  <p className="text-sm text-[#667085]">{item.dosage} {item.unit} · {item.instructions || 'No instructions recorded.'}</p>
                  <p className="mt-1 text-xs text-[#667085]">
                    {item.start_date ? `Started ${item.start_date}` : 'Start date not recorded'}
                    {item.end_date ? ` · Ends ${item.end_date}` : ''}
                  </p>
                </div>
                <Badge tone="primary">{item.frequency}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
