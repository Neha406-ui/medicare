import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Phone, Pill, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

function displayDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : 'Not provided';
}

export function ResidentDetails() {
  const { residentId } = useParams();
  const [resident, setResident] = useState(null);
  const [medications, setMedications] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get(`/residents/${residentId}`),
      api.get('/medications'),
      api.get('/schedules/today'),
    ])
      .then(([residentResponse, medicationResponse, scheduleResponse]) => {
        if (!isMounted) return;
        setError('');
        setResident(residentResponse.data);
        setMedications(medicationResponse.data.filter((medication) => medication.resident_id === Number(residentId)));
        setSchedule(scheduleResponse.data.filter((item) => item.resident_id === Number(residentId)));
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load resident profile. Please try again.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [residentId]);

  return (
    <DashboardLayout role="Administrator" title="Resident Profile" subtitle="Resident overview">
      <div className="mb-5">
        <Link to="/admin/residents" className="inline-flex items-center gap-2 text-sm font-medium text-[#4F8A8B] hover:underline">
          <ArrowLeft size={16} /> Back to residents
        </Link>
      </div>

      {isLoading ? (
        <LoadingState label="Loading resident profile..." />
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : resident ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr]">
            <div className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F3F2] text-xl font-semibold text-[#4F8A8B]">
                  {resident.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[#263238]">{resident.full_name}</h2>
                  <p className="text-sm text-[#667085]">
                    {resident.age ? `Age ${resident.age}` : `Born ${displayDate(resident.date_of_birth)}`}
                    {' · Room '}{resident.room_number || 'Not assigned'}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-[#F7FAFA] px-3 py-3">
                  <span className="text-sm text-[#667085]">Profile status</span>
                  <Badge tone={resident.status === 'active' ? 'success' : 'info'}>{resident.status}</Badge>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#F7FAFA] px-3 py-3 text-sm text-[#475467]">
                  <UserRound size={16} className="text-[#4F8A8B]" />
                  Caretaker ID: {resident.assigned_caretaker_id ?? 'Not assigned'}
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#F7FAFA] px-3 py-3 text-sm text-[#475467]">
                  <Phone size={16} className="text-[#4F8A8B]" />
                  Emergency: {resident.emergency_contact_name || 'Not provided'}
                  {resident.emergency_contact_phone ? ` · ${resident.emergency_contact_phone}` : ''}
                </div>
                <div className="rounded-xl bg-[#F7FAFA] px-3 py-3 text-sm text-[#475467]">
                  <p><span className="font-medium text-[#263238]">Phone:</span> {resident.phone || 'Not provided'}</p>
                  <p className="mt-1"><span className="font-medium text-[#263238]">Date of birth:</span> {displayDate(resident.date_of_birth)}</p>
                  <p className="mt-1"><span className="font-medium text-[#263238]">Blood group:</span> {resident.blood_group || 'Not provided'}</p>
                  <p className="mt-1"><span className="font-medium text-[#263238]">Admission:</span> {displayDate(resident.admission_date)}</p>
                </div>
                <div className="rounded-xl bg-[#F7FAFA] px-3 py-3 text-sm text-[#475467]">
                  <p className="font-medium text-[#263238]">Medical conditions</p>
                  <p className="mt-1">{resident.medical_conditions || 'None recorded.'}</p>
                  <p className="mt-3 font-medium text-[#263238]">Allergies</p>
                  <p className="mt-1">{resident.allergies || 'None recorded.'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
                <div className="mb-4 flex items-center gap-2 text-[#263238]">
                  <Pill size={18} className="text-[#4F8A8B]" />
                  <h3 className="text-lg font-semibold">Medications</h3>
                </div>
                {medications.length === 0 ? (
                  <EmptyState title="No medications found." />
                ) : (
                  <div className="space-y-3">
                    {medications.map((item) => (
                      <div key={item.id} className="flex flex-col justify-between gap-2 rounded-xl bg-[#F7FAFA] p-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-medium text-[#263238]">{item.medicine_name}</p>
                          <p className="text-xs text-[#667085]">
                            {item.dosage} {item.unit} · {item.instructions || 'No instructions recorded'}
                          </p>
                        </div>
                        <Badge tone={item.status === 'active' ? 'success' : 'info'}>{item.frequency} · {item.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
                <div className="mb-4 flex items-center gap-2 text-[#263238]">
                  <CalendarDays size={18} className="text-[#4F8A8B]" />
                  <h3 className="text-lg font-semibold">Today’s schedule</h3>
                </div>
                {schedule.length === 0 ? (
                  <EmptyState title="No medication schedule configured for today." />
                ) : (
                  <div className="space-y-3">
                    {schedule.map((item) => (
                      <div key={`${item.medication_id}-${item.scheduled_time}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF2F1] p-3">
                        <div>
                          <p className="font-medium text-[#263238]">{item.medication}</p>
                          <p className="text-xs text-[#667085]">
                            {item.scheduled_time} · {item.dose} {item.unit} · {item.instructions || 'No instructions'}
                          </p>
                        </div>
                        <Badge tone={item.status === 'GIVEN' ? 'success' : item.status === 'MISSED' ? 'danger' : 'warning'}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
