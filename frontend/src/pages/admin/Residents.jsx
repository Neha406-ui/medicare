import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { SearchInput } from '../../components/common/SearchInput';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const emptyForm = {
  full_name: '',
  username: '',
  password: '',
  date_of_birth: '',
  age: '',
  gender: '',
  phone: '',
  room_number: '',
  building: '',
  blood_group: '',
  allergies: '',
  medical_conditions: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  admission_date: '',
  assigned_caretaker_id: '',
  status: 'active',
};

const fieldClassName = 'w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none';
const labelClassName = 'mb-1.5 block text-sm font-medium text-[#475467]';

function residentToForm(resident) {
  return {
    ...emptyForm,
    ...resident,
    username: '',
    password: '',
    date_of_birth: resident.date_of_birth || '',
    age: resident.age ?? '',
    admission_date: resident.admission_date || '',
    assigned_caretaker_id: resident.assigned_caretaker_id ?? '',
  };
}

function residentPayload(form, creating) {
  const payload = {
    full_name: form.full_name.trim(),
    date_of_birth: form.date_of_birth || null,
    age: form.age === '' ? null : Number(form.age),
    gender: form.gender || null,
    phone: form.phone.trim() || null,
    room_number: form.room_number.trim() || null,
    building: form.building.trim() || null,
    blood_group: form.blood_group || null,
    allergies: form.allergies.trim() || null,
    medical_conditions: form.medical_conditions.trim() || null,
    emergency_contact_name: form.emergency_contact_name.trim() || null,
    emergency_contact_phone: form.emergency_contact_phone.trim() || null,
    admission_date: form.admission_date || null,
    assigned_caretaker_id: form.assigned_caretaker_id ? Number(form.assigned_caretaker_id) : null,
    status: form.status,
  };

  if (creating) {
    payload.username = form.username.trim();
    payload.password = form.password;
  }

  return payload;
}

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

export function Residents() {
  const [residents, setResidents] = useState([]);
  const [caretakers, setCaretakers] = useState([]);
  const [caretakerNames, setCaretakerNames] = useState({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchResidentData = useCallback(async () => {
    const [{ data: residentData }, { data: caretakerData }, { data: users }] = await Promise.all([
        api.get('/residents'),
        api.get('/caretakers'),
        api.get('/users'),
      ]);
    return {
      residentData,
      caretakerData,
      caretakerNames: Object.fromEntries(caretakerData.map((caretaker) => [
        caretaker.id,
        Object.fromEntries(users.map((user) => [user.id, user.full_name]))[caretaker.user_id] || `Caretaker #${caretaker.id}`,
      ])),
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchResidentData()
      .then(({ residentData, caretakerData, caretakerNames: names }) => {
        if (!isMounted) return;
        setResidents(residentData);
        setCaretakers(caretakerData);
        setCaretakerNames(names);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load residents. Please try again.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchResidentData]);

  const loadResidents = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { residentData, caretakerData, caretakerNames: names } = await fetchResidentData();
      setResidents(residentData);
      setCaretakers(caretakerData);
      setCaretakerNames(names);
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to load residents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return residents;
    return residents.filter((resident) => (
      resident.full_name.toLowerCase().includes(term)
      || (resident.room_number || '').toLowerCase().includes(term)
      || (resident.building || '').toLowerCase().includes(term)
    ));
  }, [residents, search]);

  const openCreateForm = () => {
    setEditingResident(null);
    setForm(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEditForm = (resident) => {
    setEditingResident(resident);
    setForm(residentToForm(resident));
    setError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = residentPayload(form, !editingResident);
      if (editingResident) {
        await api.put(`/residents/${editingResident.id}`, payload);
        setSuccess('Resident information updated.');
      } else {
        await api.post('/residents', payload);
        setSuccess('Resident and login account created.');
      }
      setIsModalOpen(false);
      await loadResidents();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to save resident. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deactivateResident = async (resident) => {
    if (!window.confirm(`Deactivate ${resident.full_name}'s account? Their records will be retained.`)) return;
    setError('');
    setSuccess('');
    try {
      await api.put(`/residents/${resident.id}`, {
        ...resident,
        status: 'inactive',
      });
      setSuccess(`${resident.full_name} was deactivated. Their records were retained.`);
      await loadResidents();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to deactivate resident. Please try again.');
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Resident',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F3F2] text-sm font-semibold text-[#4F8A8B]">
            {value.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="font-medium text-[#263238]">{value}</p>
            <p className="text-xs text-[#667085]">Room {row.room_number || 'Not assigned'}</p>
          </div>
        </div>
      ),
    },
    { key: 'age', label: 'Age', render: (value, row) => value ?? calculateAge(row.date_of_birth) ?? '—' },
    { key: 'room_number', label: 'Room', render: (value) => value || '—' },
    {
      key: 'assigned_caretaker_id',
      label: 'Caretaker',
      render: (value) => value
        ? caretakerNames[value] || `Caretaker #${value}`
        : 'Unassigned',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge tone={value === 'active' ? 'success' : 'info'}>
          {value || 'active'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <Link to={`/admin/residents/${value}`} className="text-sm font-medium text-[#4F8A8B] hover:underline">
            View
          </Link>
          <button type="button" onClick={() => openEditForm(row)} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F8A8B] hover:underline">
            <Pencil size={14} /> Edit
          </button>
          {row.status === 'active' && (
            <button type="button" onClick={() => deactivateResident(row)} className="text-sm font-medium text-[#B54747] hover:underline">
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="Administrator" title="Residents" subtitle="Resident management">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Resident directory</h1>
          <p className="mt-1 text-sm text-[#667085]">Manage resident profiles and assigned care support.</p>
        </div>
        <Button onClick={openCreateForm} className="gap-2 rounded-xl px-4 py-2.5">
          <Plus size={17} /> Add Resident
        </Button>
      </div>

      {error && !isModalOpen && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          placeholder="Search resident or room"
          className="w-full md:max-w-sm"
          value={search}
          onChange={setSearch}
        />
        {!isLoading && (
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <span>Showing</span>
            <span className="font-semibold text-[#263238]">{filteredResidents.length}</span>
            <span>of {residents.length} residents</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Loading residents..." />
      ) : error ? null : residents.length === 0 ? (
        <EmptyState
          title="No residents registered yet."
          description="Add a resident to create their profile and login account."
          action={<Button onClick={openCreateForm} className="mt-5 px-4 py-2">Add Resident</Button>}
        />
      ) : (
        <DataTable columns={columns} rows={filteredResidents} emptyMessage="No residents match your search." />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingResident ? 'Edit resident' : 'Add resident'}
      >
        <form onSubmit={handleSave}>
          <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
            <section>
              <h4 className="mb-3 font-semibold text-[#263238]">Personal information</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={labelClassName}>Full name *</span>
                  <input className={fieldClassName} name="full_name" value={form.full_name} onChange={handleFormChange} minLength={2} required />
                </label>
                {!editingResident && (
                  <>
                    <label>
                      <span className={labelClassName}>Login username *</span>
                      <input className={fieldClassName} name="username" value={form.username} onChange={handleFormChange} autoComplete="off" required />
                    </label>
                    <label>
                      <span className={labelClassName}>Initial password *</span>
                      <input className={fieldClassName} name="password" type="password" value={form.password} onChange={handleFormChange} minLength={8} autoComplete="new-password" required />
                    </label>
                  </>
                )}
                <label>
                  <span className={labelClassName}>Date of birth</span>
                  <input className={fieldClassName} name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Age</span>
                  <input className={fieldClassName} name="age" type="number" min="0" max="130" value={form.age} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Gender</span>
                  <input className={fieldClassName} name="gender" value={form.gender || ''} onChange={handleFormChange} maxLength={30} />
                </label>
                <label>
                  <span className={labelClassName}>Phone</span>
                  <input className={fieldClassName} name="phone" type="tel" value={form.phone || ''} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Room number</span>
                  <input className={fieldClassName} name="room_number" value={form.room_number || ''} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Building</span>
                  <input className={fieldClassName} name="building" value={form.building || ''} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Blood group</span>
                  <input className={fieldClassName} name="blood_group" value={form.blood_group || ''} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Assign caretaker</span>
                  <select className={fieldClassName} name="assigned_caretaker_id" value={form.assigned_caretaker_id} onChange={handleFormChange}>
                    <option value="">Unassigned</option>
                    {caretakers.map((caretaker) => (
                      <option key={caretaker.id} value={caretaker.id}>
                        {caretakerNames[caretaker.id] || `Caretaker #${caretaker.id}`} ({caretaker.employee_id})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
            <section>
              <h4 className="mb-3 font-semibold text-[#263238]">Medical and emergency information</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className={labelClassName}>Medical conditions</span>
                  <textarea className={fieldClassName} name="medical_conditions" value={form.medical_conditions || ''} onChange={handleFormChange} rows={2} />
                </label>
                <label>
                  <span className={labelClassName}>Allergies</span>
                  <textarea className={fieldClassName} name="allergies" value={form.allergies || ''} onChange={handleFormChange} rows={2} />
                </label>
                <label>
                  <span className={labelClassName}>Emergency contact name</span>
                  <input className={fieldClassName} name="emergency_contact_name" value={form.emergency_contact_name || ''} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Emergency contact phone</span>
                  <input className={fieldClassName} name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone || ''} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Admission date</span>
                  <input className={fieldClassName} name="admission_date" type="date" value={form.admission_date} onChange={handleFormChange} />
                </label>
                <label>
                  <span className={labelClassName}>Status</span>
                  <select className={fieldClassName} name="status" value={form.status} onChange={handleFormChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </section>
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-4 py-2">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="px-4 py-2">
              {isSaving ? 'Saving...' : editingResident ? 'Save changes' : 'Create resident'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
