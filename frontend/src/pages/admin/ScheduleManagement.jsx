import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const inputClass = 'w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none';

function isEligibleForSchedule(medication) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return medication.status === 'active'
    && (!medication.start_date || medication.start_date <= today)
    && (!medication.end_date || medication.end_date >= today);
}

export function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [medications, setMedications] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ medication_id: '', scheduled_time: '', instructions: '' });

  const fetchData = useCallback(async () => {
    const [{ data: scheduleData }, { data: medicationData }, { data: residentData }] = await Promise.all([
      api.get('/schedules/today'),
      api.get('/medications'),
      api.get('/residents'),
    ]);
    return { scheduleData, medicationData, residentData };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchData()
      .then(({ scheduleData, medicationData, residentData }) => {
        if (!isMounted) return;
        setSchedules(scheduleData);
        setMedications(medicationData.filter(isEligibleForSchedule));
        setResidents(residentData);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load medication schedules.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const medicationLabels = useMemo(() => {
    const residentNames = Object.fromEntries(residents.map((resident) => [resident.id, resident.full_name]));
    return Object.fromEntries(medications.map((medication) => [
      medication.id,
      `${medication.medicine_name} — ${residentNames[medication.resident_id] || 'Resident'}`,
    ]));
  }, [medications, residents]);

  const reload = async () => {
    const { scheduleData, medicationData, residentData } = await fetchData();
    setSchedules(scheduleData);
    setMedications(medicationData.filter(isEligibleForSchedule));
    setResidents(residentData);
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ medication_id: '', scheduled_time: '', instructions: '' });
    setError('');
    setIsOpen(true);
  };

  const startEdit = (schedule) => {
    setEditing(schedule);
    setForm({
      medication_id: String(schedule.medication_id),
      scheduled_time: schedule.scheduled_time,
      instructions: schedule.instructions || '',
    });
    setError('');
    setIsOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editing) {
        await api.patch(`/schedules/${editing.id}`, {
          scheduled_time: form.scheduled_time,
          instructions: form.instructions || null,
        });
        setSuccess('Schedule updated and audit logged.');
      } else {
        await api.post('/schedules', {
          medication_id: Number(form.medication_id),
          scheduled_time: form.scheduled_time,
          instructions: form.instructions || null,
          is_active: true,
        });
        setSuccess('Medication schedule created.');
      }
      setIsOpen(false);
      await reload();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to save medication schedule.');
    } finally {
      setSaving(false);
    }
  };

  const disable = async (schedule) => {
    if (!window.confirm(`Disable ${schedule.medication} for ${schedule.resident}? Administration history will be retained.`)) return;
    setError('');
    setSuccess('');
    try {
      await api.patch(`/schedules/${schedule.id}`, { is_active: false });
      setSuccess('Schedule disabled; administration history was retained.');
      await reload();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to disable medication schedule.');
    }
  };

  const columns = [
    { key: 'resident', label: 'Resident', render: (value, row) => <><span className="font-medium">{value}</span><span className="block text-xs text-[#667085]">Room {row.room || 'not assigned'}</span></> },
    { key: 'medication', label: 'Medication', render: (value, row) => `${value} · ${row.dose} ${row.unit}` },
    { key: 'scheduled_time', label: 'Time' },
    { key: 'instructions', label: 'Instructions', render: (value) => value || '—' },
    { key: 'status', label: 'Today', render: (value) => <Badge tone={value === 'GIVEN' ? 'success' : value === 'MISSED' || value === 'REFUSED' ? 'danger' : 'warning'}>{value}</Badge> },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <div className="flex gap-3 whitespace-nowrap">
          <button type="button" onClick={() => startEdit(row)} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F8A8B] hover:underline"><Pencil size={14} /> Change time</button>
          <button type="button" onClick={() => disable(row)} className="text-sm font-medium text-[#B54747] hover:underline">Disable</button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="Administrator" title="Medication Schedule" subtitle="Schedule management">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Medication schedules</h1>
          <p className="mt-1 text-sm text-[#667085]">Manage timing without changing prescription dosage.</p>
        </div>
        <Button onClick={startCreate} className="gap-2 px-4 py-2.5"><Plus size={17} /> Add schedule</Button>
      </div>
      {error && !isOpen && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
      {loading ? <LoadingState label="Loading medication schedules..." /> : null}
      {!loading && !error && schedules.length === 0 && <EmptyState title="No medication schedule configured." description={medications.length > 0 ? 'Create a schedule from a current prescription.' : 'There are no current prescriptions available to schedule. Check medication status and start/end dates.'} action={medications.length > 0 ? <Button onClick={startCreate} className="mt-5 px-4 py-2">Add schedule</Button> : <Link to="/admin/medications" className="mt-5 inline-flex rounded-xl bg-[#4F8A8B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#447d7d]">Review medications</Link>} />}
      {!loading && !error && schedules.length > 0 && <DataTable columns={columns} rows={schedules} />}

      <Modal isOpen={isOpen} onClose={() => !saving && setIsOpen(false)} title={editing ? 'Change schedule time' : 'Add medication schedule'}>
        <form onSubmit={save} className="space-y-4">
          {!editing && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Active medication *</span>
              <select required className={inputClass} value={form.medication_id} onChange={(event) => setForm((current) => ({ ...current, medication_id: event.target.value }))}>
                <option value="">Select medication</option>
                {medications.map((medication) => <option key={medication.id} value={medication.id}>{medicationLabels[medication.id]}</option>)}
              </select>
              {medications.length === 0 && <span className="mt-1 block text-xs text-[#667085]">No current prescriptions are available. Review medication status and prescription dates on the <Link to="/admin/medications" className="font-semibold text-[#4F8A8B] underline">Medications</Link> page.</span>}
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#475467]">Scheduled time *</span>
            <input type="time" required className={inputClass} value={form.scheduled_time} onChange={(event) => setForm((current) => ({ ...current, scheduled_time: event.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#475467]">Operational instructions</span>
            <textarea rows={3} className={inputClass} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
          </label>
          <p className="text-xs text-[#667085]">Changing a schedule does not modify its medication or dosage.</p>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={saving} className="px-4 py-2" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || (!editing && medications.length === 0)} className="px-4 py-2">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create schedule'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
