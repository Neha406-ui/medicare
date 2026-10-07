import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Modal } from '../../components/common/Modal';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const emptyForm = {
  medicine_name: '',
  category: '',
  current_stock: '0',
  minimum_stock: '0',
  unit: '',
  expiry_date: '',
  batch_number: '',
};

const inputClass = 'w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none';

function inventoryStatus(item) {
  if (item.expiry_date && item.expiry_date < new Date().toISOString().slice(0, 10)) return 'Expired';
  if (item.current_stock <= 0) return 'Critical';
  if (item.current_stock <= item.minimum_stock) return 'Low Stock';
  return 'In Stock';
}

function statusTone(value) {
  return value === 'In Stock' ? 'success' : value === 'Low Stock' ? 'warning' : value === 'Critical' || value === 'Expired' ? 'danger' : 'neutral';
}

export function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = useCallback(async () => (await api.get('/inventory')).data, []);

  useEffect(() => {
    let isMounted = true;
    fetchItems()
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load inventory.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchItems]);

  const loadItems = async () => {
    setError('');
    setLoading(true);
    try {
      setItems(await fetchItems());
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setIsOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...item, category: item.category || '', expiry_date: item.expiry_date || '', batch_number: item.batch_number || '' });
    setError('');
    setIsOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      medicine_name: form.medicine_name.trim(),
      category: form.category.trim() || null,
      current_stock: Number(form.current_stock),
      minimum_stock: Number(form.minimum_stock),
      unit: form.unit.trim(),
      expiry_date: form.expiry_date || null,
      batch_number: form.batch_number.trim() || null,
    };
    try {
      if (editing) {
        await api.put(`/inventory/${editing.id}`, payload);
        setSuccess('Inventory record updated.');
      } else {
        await api.post('/inventory', payload);
        setSuccess('Inventory record added.');
      }
      setIsOpen(false);
      await loadItems();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to save inventory record.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Delete the inventory batch for ${item.medicine_name}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/inventory/${item.id}`);
      setSuccess('Inventory batch deleted.');
      await loadItems();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to delete inventory batch.');
    }
  };

  const columns = [
    { key: 'medicine_name', label: 'Medicine' },
    { key: 'category', label: 'Category', render: (value) => value || '—' },
    { key: 'current_stock', label: 'Current stock' },
    { key: 'minimum_stock', label: 'Minimum stock' },
    { key: 'unit', label: 'Unit' },
    { key: 'expiry_date', label: 'Expiry date', render: (value) => value || '—' },
    { key: 'status', label: 'Status', render: (value) => <Badge tone={statusTone(value)}>{value}</Badge> },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <div className="flex gap-3">
          <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F8A8B] hover:underline"><Pencil size={14} /> Edit</button>
          <button type="button" onClick={() => removeItem(row)} className="text-sm font-medium text-[#B54747] hover:underline">Delete</button>
        </div>
      ),
    },
  ];
  const rows = items.map((item) => ({ ...item, status: inventoryStatus(item) }));

  return (
    <DashboardLayout role="Administrator" title="Inventory" subtitle="Stock overview">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Inventory management</h1>
          <p className="mt-1 text-sm text-[#667085]">Monitor medicine levels and expiry readiness across the facility.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-xl px-4 py-2.5"><Plus size={17} /> Add stock</Button>
      </div>
      {error && !isOpen && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
      {loading ? <LoadingState label="Loading inventory..." /> : null}
      {!loading && !error && items.length === 0 && <EmptyState title="No inventory records available." description="Add a stock record to begin tracking inventory." />}
      {!loading && !error && items.length > 0 && <DataTable columns={columns} rows={rows} emptyMessage="No inventory records available." />}

      <Modal isOpen={isOpen} onClose={() => !saving && setIsOpen(false)} title={editing ? 'Edit inventory batch' : 'Add inventory batch'}>
        <form onSubmit={handleSave}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Medicine name *</span>
              <input className={inputClass} value={form.medicine_name} onChange={(event) => setForm((current) => ({ ...current, medicine_name: event.target.value }))} required minLength={2} />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Category</span>
              <input className={inputClass} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Unit *</span>
              <input className={inputClass} value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Current stock *</span>
              <input className={inputClass} type="number" min="0" step="any" value={form.current_stock} onChange={(event) => setForm((current) => ({ ...current, current_stock: event.target.value }))} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Minimum stock *</span>
              <input className={inputClass} type="number" min="0" step="any" value={form.minimum_stock} onChange={(event) => setForm((current) => ({ ...current, minimum_stock: event.target.value }))} required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Expiry date</span>
              <input className={inputClass} type="date" value={form.expiry_date} onChange={(event) => setForm((current) => ({ ...current, expiry_date: event.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-[#475467]">Batch number</span>
              <input className={inputClass} value={form.batch_number} onChange={(event) => setForm((current) => ({ ...current, batch_number: event.target.value }))} />
            </label>
            {error && <div role="alert" className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="secondary" className="px-4 py-2" disabled={saving} onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" className="px-4 py-2" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add stock'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
