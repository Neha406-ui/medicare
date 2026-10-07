import { useEffect, useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/admin/audit-logs', { params: { limit: 200 } })
      .then(({ data }) => {
        if (isMounted) setLogs(data);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load audit logs.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const columns = [
    { key: 'created_at', label: 'When', render: (value) => new Date(value).toLocaleString() },
    { key: 'action', label: 'Action' },
    { key: 'entity_type', label: 'Record type' },
    { key: 'entity_id', label: 'Record ID', render: (value) => value ?? '—' },
    { key: 'user_id', label: 'User ID', render: (value) => value ?? 'System' },
    { key: 'description', label: 'Details' },
  ];

  return (
    <DashboardLayout role="Administrator" title="Administration Records" subtitle="Audited system activity">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#263238]">Audit log</h1>
        <p className="mt-1 text-sm text-[#667085]">Persistent records of administrative and medication-management changes.</p>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <LoadingState label="Loading audit records..." /> : null}
      {!loading && !error && logs.length === 0 && <EmptyState title="No audit records available." />}
      {!loading && !error && logs.length > 0 && <DataTable columns={columns} rows={logs} />}
    </DashboardLayout>
  );
}
