import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { SearchInput } from '../../components/common/SearchInput';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function CareTakerResidents() {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/residents')
      .then(({ data }) => {
        if (isMounted) setResidents(data);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load assigned residents. Please try again.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredResidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return residents;
    return residents.filter((resident) => (
      resident.full_name.toLowerCase().includes(term)
      || (resident.room_number || '').toLowerCase().includes(term)
      || (resident.building || '').toLowerCase().includes(term)
    ));
  }, [residents, search]);

  return (
    <DashboardLayout role="Care Taker" title="Residents" subtitle="Assigned residents">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Resident overview</h1>
          <p className="mt-1 text-sm text-[#667085]">Review residents assigned to your care.</p>
        </div>
        <SearchInput
          placeholder="Search resident or room"
          className="w-full md:max-w-xs"
          value={search}
          onChange={setSearch}
        />
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {isLoading ? (
        <LoadingState label="Loading assigned residents..." />
      ) : error ? null : residents.length === 0 ? (
        <EmptyState title="No residents are assigned to you yet." />
      ) : filteredResidents.length === 0 ? (
        <EmptyState title="No assigned residents match your search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResidents.map((resident) => (
            <div key={resident.id} className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3F2] text-sm font-semibold text-[#4F8A8B]">
                  {resident.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#263238]">{resident.full_name}</h3>
                  <p className="text-sm text-[#667085]">
                    Room {resident.room_number || 'not assigned'}{resident.building ? ` · ${resident.building}` : ''}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-[#475467]">
                <div className="flex items-center justify-between">
                  <span>Age</span>
                  <span className="font-medium text-[#263238]">
                    {resident.age ?? calculateAge(resident.date_of_birth) ?? 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phone</span>
                  <span className="font-medium text-[#263238]">{resident.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Profile status</span>
                  <Badge tone={resident.status === 'active' ? 'success' : 'info'}>{resident.status}</Badge>
                </div>
              </div>
              {resident.medical_conditions && (
                <div className="mt-4 rounded-xl bg-[#F7FAFA] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">Medical conditions</p>
                  <p className="mt-1 text-sm text-[#475467]">{resident.medical_conditions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
