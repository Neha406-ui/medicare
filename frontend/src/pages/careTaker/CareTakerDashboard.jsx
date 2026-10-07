import { useCallback, useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { MedicationConfirmation } from '../../components/medication/MedicationConfirmation';
import { MissedMedicationModal } from '../../components/medication/MissedMedicationModal';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const statusTone = {
  PENDING: 'warning',
  DUE: 'warning',
  LATE: 'danger',
  GIVEN: 'success',
  MISSED: 'danger',
  REFUSED: 'danger',
};

export function CareTakerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [medications, setMedications] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showMissed, setShowMissed] = useState(false);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ medication_id: '', scheduled_time: '', instructions: '' });
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSchedule = useCallback(async () => {
    const [{ data }, { data: medicationData }] = await Promise.all([
      api.get('/dashboard/caretaker'),
      api.get('/medications'),
    ]);
    setTasks(data.today_schedule || []);
    setMedications(medicationData.filter((medication) => medication.status === 'active'));
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.get('/dashboard/caretaker'), api.get('/medications')])
      .then(([{ data }, { data: medicationData }]) => {
        if (isMounted) setTasks(data.today_schedule || []);
        if (isMounted) setMedications(medicationData.filter((medication) => medication.status === 'active'));
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load today’s medication schedule.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const openConfirm = (item) => {
    setSelectedItem(item);
    setShowConfirmation(true);
  };

  const openMissed = (item) => {
    setSelectedItem(item);
    setShowMissed(true);
  };

  const handleConfirmGiven = async (scheduleId) => {
    setSaving(true);
    setError('');
    try {
      await api.post(`/administrations/${scheduleId}/given`, {});
      await loadSchedule();
      setShowConfirmation(false);
      setSelectedItem(null);
      setToast('Medication administration was saved.');
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to save the medication administration.');
    } finally {
      setSaving(false);
    }
  };

  const handleMissed = async (scheduleId, reason, notes) => {
    setSaving(true);
    setError('');
    try {
      const endpoint = reason === 'Resident refused' ? 'refused' : 'missed';
      await api.post(`/administrations/${scheduleId}/${endpoint}`, { reason, notes: notes || null });
      await loadSchedule();
      setShowMissed(false);
      setSelectedItem(null);
      setToast(reason === 'Resident refused' ? 'Refusal was saved.' : 'Missed medication was saved.');
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to save the medication status.');
    } finally {
      setSaving(false);
    }
  };

  const openScheduleEditor = (task) => {
    setEditingSchedule(task);
    setScheduleForm({
      medication_id: '',
      scheduled_time: task.scheduled_time,
      instructions: task.instructions || '',
    });
    setError('');
    setShowScheduleEditor(true);
  };

  const openNewSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({ medication_id: '', scheduled_time: '', instructions: '' });
    setError('');
    setShowScheduleEditor(true);
  };

  const handleScheduleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingSchedule) {
        await api.patch(`/schedules/${editingSchedule.id}`, {
          scheduled_time: scheduleForm.scheduled_time,
          instructions: scheduleForm.instructions || null,
        });
      } else {
        await api.post('/schedules', {
          medication_id: Number(scheduleForm.medication_id),
          scheduled_time: scheduleForm.scheduled_time,
          instructions: scheduleForm.instructions || null,
          is_active: true,
        });
      }
      await loadSchedule();
      setShowScheduleEditor(false);
      setToast(editingSchedule ? 'Schedule updated and audit logged.' : 'Medication schedule created.');
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to save medication schedule.');
    } finally {
      setSaving(false);
    }
  };

  const disableSchedule = async (task) => {
    if (!window.confirm(`Disable the ${task.medication} schedule for ${task.resident}? Existing administration history will be kept.`)) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/schedules/${task.id}`, { is_active: false });
      await loadSchedule();
      setToast('Schedule disabled. Existing history was retained.');
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to disable medication schedule.');
    } finally {
      setSaving(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Caregiver';

  return (
    <DashboardLayout role="Care Taker" title="Today's Schedule" subtitle="Care tasks at a glance">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-base font-medium text-[#4F8A8B]">Good morning, {firstName}</p>
          <h1 className="mt-1 max-w-3xl text-3xl font-semibold text-[#263238]">Today’s medication schedule</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#E4E9E7] bg-white px-3 py-2 text-sm text-[#475467]">
          <Clock3 size={16} className="text-[#4F8A8B]" />
          {new Date().toLocaleDateString()}
        </div>
      </div>
      <div className="mb-5 flex justify-end">
        <Button className="px-4 py-2" onClick={openNewSchedule}>Add schedule</Button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading today's medication schedule..." />
      ) : !error && tasks.length === 0 ? (
        <EmptyState title="No medication tasks are assigned for today." />
      ) : null}

      {!loading && !error && tasks.length > 0 && (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-[#E4E9E7] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3F2] text-sm font-semibold text-[#4F8A8B]">
                    {task.scheduled_time?.slice(0, 5) || '--:--'}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.1em] text-[#7D8B92]">{task.scheduled_time}</p>
                    <p className="mt-1 text-lg font-semibold text-[#263238]">{task.resident}</p>
                    <p className="text-sm text-[#667085]">Room {task.room || 'not assigned'}</p>
                  </div>
                </div>
                <div className="min-w-[180px] rounded-xl bg-[#F7FAFA] p-3">
                  <p className="text-sm font-medium text-[#263238]">{task.medication}</p>
                  <p className="text-xs text-[#667085]">{task.dose} {task.unit}</p>
                  <p className="mt-1 text-xs text-[#667085]">{task.instructions || 'No instructions recorded.'}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-[#667085]">
                  {task.administered_by && <span>Recorded by {task.administered_by}</span>}
                  <Badge tone={statusTone[task.status] || 'info'}>{task.status}</Badge>
                  {task.missed_reason && <span>{task.missed_reason}</span>}
                </div>
                {['PENDING', 'LATE'].includes(task.status) && (
                  <div className="flex gap-3">
                    <Button variant="secondary" disabled={saving} className="px-4 py-2.5" onClick={() => openMissed(task)}>
                      Mark missed / refused
                    </Button>
                    <Button disabled={saving} className="px-4 py-2.5" onClick={() => openConfirm(task)}>
                      Mark as given
                    </Button>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="ghost" disabled={saving} className="px-3 py-2" onClick={() => openScheduleEditor(task)}>
                    Change time
                  </Button>
                  <Button variant="ghost" disabled={saving} className="px-3 py-2 text-[#B54747]" onClick={() => disableSchedule(task)}>
                    Disable
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MedicationConfirmation
        isOpen={showConfirmation}
        onClose={() => !saving && setShowConfirmation(false)}
        item={selectedItem}
        onConfirm={handleConfirmGiven}
      />
      <MissedMedicationModal
        isOpen={showMissed}
        onClose={() => !saving && setShowMissed(false)}
        item={selectedItem}
        onConfirm={handleMissed}
      />
      <Modal
        isOpen={showScheduleEditor}
        onClose={() => !saving && setShowScheduleEditor(false)}
        title={editingSchedule ? 'Change schedule' : 'Add medication schedule'}
      >
        <form onSubmit={handleScheduleSave} className="space-y-4">
          {!editingSchedule && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#263238]">Assigned medication</span>
              <select
                required
                value={scheduleForm.medication_id}
                onChange={(event) => setScheduleForm((current) => ({ ...current, medication_id: event.target.value }))}
                className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238]"
              >
                <option value="">Select medication</option>
                {medications.map((medication) => (
                  <option key={medication.id} value={medication.id}>
                    {medication.medicine_name} — {medication.dosage} {medication.unit}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#263238]">Scheduled time</span>
            <input
              type="time"
              required
              value={scheduleForm.scheduled_time}
              onChange={(event) => setScheduleForm((current) => ({ ...current, scheduled_time: event.target.value }))}
              className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#263238]">Operational instructions</span>
            <textarea
              rows={3}
              value={scheduleForm.instructions}
              onChange={(event) => setScheduleForm((current) => ({ ...current, instructions: event.target.value }))}
              className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238]"
            />
          </label>
          <p className="text-xs text-[#667085]">This changes schedule timing only, not the prescribed dosage.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={saving} className="px-4 py-2" onClick={() => setShowScheduleEditor(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!editingSchedule && medications.length === 0)} className="px-4 py-2">
              {saving ? 'Saving...' : editingSchedule ? 'Save time' : 'Create schedule'}
            </Button>
          </div>
        </form>
      </Modal>
      <Toast message={toast} visible={Boolean(toast)} onClose={() => setToast('')} />
    </DashboardLayout>
  );
}
