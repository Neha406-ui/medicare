import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const emptyForm = {
  username: '',
  full_name: '',
  password: '',
  employee_id: '',
  phone: '',
  shift_start: '',
  shift_end: '',
  status: 'active',
};

const inputClass = 'w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none';

export function CareTakers() {
  const [caretakers, setCaretakers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadCaretakers = useCallback(async () => {
    const [{ data: caretakerData }, { data: userData }] = await Promise.all([
      api.get('/caretakers'),
      api.get('/users'),
    ]);
    setCaretakers(caretakerData);
    setUsers(userData);
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.get('/caretakers'), api.get('/users')])
      .then(([{ data: caretakerData }, { data: userData }]) => {
        if (!isMounted) return;
        setCaretakers(caretakerData);
        setUsers(userData);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load caretaker records.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const userById = Object.fromEntries(users.map((user) => [user.id, user]));

  const createCaretaker = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/caretakers/accounts', {
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        password: form.password,
        employee_id: form.employee_id.trim(),
        phone: form.phone.trim() || null,
        shift_start: form.shift_start || null,
        shift_end: form.shift_end || null,
        status: form.status,
      });
      setIsOpen(false);
      setForm(emptyForm);
      setSuccess('Caretaker account created.');
      await loadCaretakers();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to create caretaker account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="Administrator" title="Care Takers" subtitle="Staff management">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Staff assignments</h1>
          <p className="mt-1 text-sm text-[#667085]">Caretaker accounts and assigned shifts.</p>
        </div>
        <Button onClick={() => { setError(''); setForm(emptyForm); setIsOpen(true); }} className="gap-2 rounded-xl px-4 py-2.5">
          <Plus size={17} /> Add caretaker
        </Button>
      </div>
      {error && !isOpen && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
      {loading ? <LoadingState label="Loading caretakers..." /> : null}
      {!loading && !error && caretakers.length === 0 && <EmptyState title="No caretaker accounts found." description="Create a caretaker account to assign residents and schedules." />}
      {!loading && !error && caretakers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {caretakers.map((person) => {
            const user = userById[person.user_id];
            const name = user?.full_name || `Caretaker #${person.id}`;
            return (
              <div key={person.id} className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3F2] text-lg font-semibold text-[#4F8A8B]">
                    {name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#263238]">{name}</h3>
                    <p className="text-sm text-[#667085]">Employee {person.employee_id}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm text-[#475467]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Shift</span>
                    <Badge tone="info">{person.shift_start || '—'} – {person.shift_end || '—'}</Badge>
                  </div>
                  <div className="flex items-center justify-between"><span>Phone</span><span className="font-medium text-[#263238]">{person.phone || user?.phone || 'Not provided'}</span></div>
                  <div className="flex items-center justify-between"><span>Username</span><span className="font-medium text-[#263238]">{user?.username || 'Not available'}</span></div>
                  <div className="flex items-center justify-between"><span>Status</span><Badge tone={person.status === 'active' ? 'success' : 'neutral'}>{person.status}</Badge></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => !saving && setIsOpen(false)} title="Create caretaker account">
        <form onSubmit={createCaretaker}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Full name *</span>
              <input className={inputClass} value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} minLength={2} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Username *</span>
              <input className={inputClass} value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} autoComplete="off" required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Initial password *</span>
              <input className={inputClass} type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Employee ID *</span>
              <input className={inputClass} value={form.employee_id} onChange={(event) => setForm((current) => ({ ...current, employee_id: event.target.value }))} minLength={2} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Phone</span>
              <input className={inputClass} type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Shift begins</span>
              <input className={inputClass} type="time" value={form.shift_start} onChange={(event) => setForm((current) => ({ ...current, shift_start: event.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Shift ends</span>
              <input className={inputClass} type="time" value={form.shift_end} onChange={(event) => setForm((current) => ({ ...current, shift_end: event.target.value }))} />
            </label>
            {error && <div role="alert" className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={saving} className="px-4 py-2" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="px-4 py-2">{saving ? 'Creating...' : 'Create account'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
