import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingState } from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export function CareTakerProfile() {
  const { user } = useAuth();
  const [caretaker, setCaretaker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/caretakers')
      .then(({ data }) => {
        if (isMounted) setCaretaker(data[0] || null);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load your caretaker profile.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout role="Care Taker" title="My Profile" subtitle="Care team account">
      {loading ? <LoadingState label="Loading your profile..." /> : null}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && !caretaker && <div className="rounded-2xl border border-dashed border-[#D7E1DF] bg-[#F9FBFB] px-6 py-12 text-center text-sm text-[#667085]">Your caretaker profile has not been configured. Contact an administrator.</div>}
      {!loading && !error && caretaker && (
        <div className="rounded-2xl border border-[#E4E9E7] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F3F2] text-xl font-semibold text-[#4F8A8B]">
              {(user?.name || user?.full_name || 'Care Taker').split(' ').map((part) => part[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#263238]">{user?.name || user?.full_name || 'Care Taker'}</h1>
              <p className="text-sm text-[#667085]">Employee {caretaker.employee_id}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[#F7FAFA] p-4"><p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Shift</p><p className="mt-2 text-sm font-medium text-[#263238]">{caretaker.shift_start || '—'} – {caretaker.shift_end || '—'}</p></div>
            <div className="rounded-xl bg-[#F7FAFA] p-4"><p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Phone</p><p className="mt-2 text-sm font-medium text-[#263238]">{caretaker.phone || user?.phone || 'Not provided'}</p></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
