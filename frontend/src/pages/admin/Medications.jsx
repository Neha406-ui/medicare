import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { SearchInput } from '../../components/common/SearchInput';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const emptyForm = {
  resident_id: '',
  medicine_name: '',
  dosage: '',
  unit: '',
  frequency: '',
  start_date: '',
  end_date: '',
  instructions: '',
  prescribing_doctor: '',
  status: 'active',
};

const inputClass = 'w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none';

function medicationToForm(medication) {
  return {
    ...medication,
    start_date: medication.start_date || '',
    end_date: medication.end_date || '',
    instructions: medication.instructions || '',
    prescribing_doctor: medication.prescribing_doctor || '',
  };
}

export function Medications() {
  const [medications, setMedications] = useState([]);
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    const [{ data: medicationData }, { data: residentData }] = await Promise.all([
      api.get('/medications'),
      api.get('/residents'),
    ]);
    return { medicationData, residentData };
  }, []);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { medicationData, residentData } = await fetchData();
      setMedications(medicationData);
      setResidents(residentData);
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to load medication records.');
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    let isMounted = true;
    fetchData()
      .then(({ medicationData, residentData }) => {
        if (!isMounted) return;
        setMedications(medicationData);
        setResidents(residentData);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load medication records.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const residentNames = useMemo(
    () => Object.fromEntries(residents.map((resident) => [resident.id, resident.full_name])),
    [residents],
  );
  const visibleMedications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return medications.filter((medication) => (
      !term
      || medication.medicine_name.toLowerCase().includes(term)
      || (medication.prescribing_doctor || '').toLowerCase().includes(term)
      || (residentNames[medication.resident_id] || '').toLowerCase().includes(term)
    ));
  }, [medications, residentNames, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setIsOpen(true);
  };

  const openEdit = (medication) => {
    setEditing(medication);
    setForm(medicationToForm(medication));
    setError('');
    setIsOpen(true);
  };

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      resident_id: Number(form.resident_id),
      medicine_name: form.medicine_name.trim(),
      dosage: form.dosage.trim(),
      unit: form.unit.trim(),
      frequency: form.frequency.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      instructions: form.instructions.trim() || null,
      prescribing_doctor: form.prescribing_doctor.trim() || null,
      status: form.status,
    };
    try {
      if (editing) {
        await api.put(`/medications/${editing.id}`, payload);
        setSuccess('Medication record updated.');
      } else {
        await api.post('/medications', payload);
        setSuccess('Medication record created.');
      }
      setIsOpen(false);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to save medication record.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (medication) => {
    if (!window.confirm(`Deactivate ${medication.medicine_name}? Existing administration history will be retained.`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/medications/${medication.id}`);
      setSuccess(`${medication.medicine_name} was deactivated.`);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to deactivate medication.');
    }
  };

  return (
    <DashboardLayout role="Administrator" title="Medications" subtitle="Medication management">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Medication registry</h1>
          <p className="mt-1 text-sm text-[#667085]">Manage resident medication tracking records.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-xl px-4 py-2.5"><Plus size={17} /> Add medication</Button>
      </div>
      {error && !isOpen && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput placeholder="Search medication, doctor, or resident" className="w-full md:max-w-sm" value={search} onChange={setSearch} />
        {!loading && <div className="text-sm text-[#667085]">{visibleMedications.length} medication records</div>}
      </div>
      {loading ? <LoadingState label="Loading medication records..." /> : null}
      {!loading && !error && medications.length === 0 && <EmptyState title="No medications found." description="Add a medication record to start tracking a resident's medication plan." />}
      {!loading && !error && medications.length > 0 && visibleMedications.length === 0 && <EmptyState title="No medications match your search." />}
      {!loading && !error && visibleMedications.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleMedications.map((medication) => (
            <div key={medication.id} className="rounded-2xl border border-[#E4E9E7] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[#667085]">{residentNames[medication.resident_id] || 'Resident record unavailable'}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#263238]">{medication.medicine_name}</h3>
                </div>
                <Badge tone={medication.status === 'active' ? 'success' : 'info'}>{medication.status}</Badge>
              </div>
              <div className="mt-5 space-y-3 text-sm text-[#475467]">
                <div className="flex justify-between gap-4"><span>Dosage</span><strong className="text-[#263238]">{medication.dosage} {medication.unit}</strong></div>
                <div className="flex justify-between gap-4"><span>Frequency</span><strong className="text-[#263238]">{medication.frequency}</strong></div>
                <div className="flex justify-between gap-4"><span>Prescribing doctor</span><strong className="text-[#263238]">{medication.prescribing_doctor || 'Not recorded'}</strong></div>
                <div className="flex justify-between gap-4"><span>Instructions</span><span className="text-right text-[#263238]">{medication.instructions || 'None recorded'}</span></div>
                <div className="flex justify-between gap-4"><span>Dates</span><span className="text-right text-[#263238]">{medication.start_date || '—'} – {medication.end_date || '—'}</span></div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <button type="button" onClick={() => openEdit(medication)} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F8A8B] hover:underline"><Pencil size={14} /> Edit</button>
                {medication.status === 'active' && <button type="button" onClick={() => deactivate(medication)} className="text-sm font-medium text-[#B54747] hover:underline">Deactivate</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => !saving && setIsOpen(false)} title={editing ? 'Edit medication record' : 'Add medication record'}>
        <form onSubmit={handleSave}>
          <div className="grid max-h-[65vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Resident *</span>
              <select className={inputClass} name="resident_id" value={form.resident_id} onChange={handleChange} required disabled={Boolean(editing)}>
                <option value="">Select resident</option>
                {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.full_name}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Medicine name *</span>
              <input className={inputClass} name="medicine_name" value={form.medicine_name} onChange={handleChange} minLength={2} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Dosage *</span>
              <input className={inputClass} name="dosage" value={form.dosage} onChange={handleChange} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Unit *</span>
              <input className={inputClass} name="unit" value={form.unit} onChange={handleChange} required />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Frequency *</span>
              <input className={inputClass} name="frequency" value={form.frequency} onChange={handleChange} minLength={2} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Start date</span>
              <input className={inputClass} type="date" name="start_date" value={form.start_date} onChange={handleChange} />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">End date</span>
              <input className={inputClass} type="date" name="end_date" value={form.end_date} onChange={handleChange} />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Prescribing doctor</span>
              <input className={inputClass} name="prescribing_doctor" value={form.prescribing_doctor} onChange={handleChange} />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Instructions</span>
              <textarea className={inputClass} name="instructions" value={form.instructions} onChange={handleChange} rows={2} />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Status</span>
              <select className={inputClass} name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            {error && <div role="alert" className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="secondary" className="px-4 py-2" disabled={saving} onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" className="px-4 py-2" disabled={saving || residents.length === 0}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create medication'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
