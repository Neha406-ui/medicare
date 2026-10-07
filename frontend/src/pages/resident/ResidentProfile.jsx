import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import api from '../../services/api';

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) age -= 1;
  return age;
}

export function ResidentProfile() {
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/residents')
      .then(({ data }) => {
        if (isMounted) setResident(data[0] || null);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load your profile.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout role="Resident" title="Profile" subtitle="My personal details">
      {loading ? <LoadingState label="Loading your profile..." /> : null}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && !resident && <EmptyState title="Resident profile not found." />}
      {!loading && !error && resident && (
        <div className="rounded-2xl border border-[#E4E9E7] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F3F2] text-xl font-semibold text-[#4F8A8B]">
              {resident.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#263238]">{resident.full_name}</h1>
              <p className="text-sm text-[#667085]">
                {resident.age ?? calculateAge(resident.date_of_birth) ?? 'Age not recorded'}
                {' · Room '}{resident.room_number || 'Not assigned'}
                {resident.building ? ` · ${resident.building}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#F7FAFA] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Phone</p>
              <p className="mt-2 text-sm font-medium text-[#263238]">{resident.phone || 'Not provided'}</p>
            </div>
            <div className="rounded-xl bg-[#F7FAFA] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Assigned caretaker</p>
              <p className="mt-2 text-sm font-medium text-[#263238]">
                {resident.assigned_caretaker_id ? `Caretaker #${resident.assigned_caretaker_id}` : 'Not assigned'}
              </p>
            </div>
            <div className="rounded-xl bg-[#F7FAFA] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Emergency contact</p>
              <p className="mt-2 text-sm font-medium text-[#263238]">{resident.emergency_contact_name || 'Not provided'}</p>
              <p className="mt-1 text-sm text-[#667085]">{resident.emergency_contact_phone || ''}</p>
            </div>
            <div className="rounded-xl bg-[#F7FAFA] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Blood group</p>
              <p className="mt-2 text-sm font-medium text-[#263238]">{resident.blood_group || 'Not provided'}</p>
            </div>
            <div className="rounded-xl bg-[#F7FAFA] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Medical conditions</p>
              <p className="mt-2 text-sm text-[#263238]">{resident.medical_conditions || 'None recorded'}</p>
            </div>
            <div className="rounded-xl bg-[#F7FAFA] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[#7D8B92]">Allergies</p>
              <p className="mt-2 text-sm text-[#263238]">{resident.allergies || 'None recorded'}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
