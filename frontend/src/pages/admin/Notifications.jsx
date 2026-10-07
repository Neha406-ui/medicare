import { useEffect, useState } from 'react';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data);
  };

  useEffect(() => {
    let isMounted = true;
    api.get('/notifications')
      .then(({ data }) => {
        if (isMounted) setNotifications(data);
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load notifications.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const markRead = async (id) => {
    setError('');
    try {
      await api.post(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to mark notification as read.');
    }
  };

  const markAllRead = async () => {
    setError('');
    try {
      await api.post('/notifications/read-all');
      await loadNotifications();
    } catch (apiError) {
      setError(apiError.response?.data?.detail || 'Unable to mark notifications as read.');
    }
  };

  return (
    <DashboardLayout role="Administrator" title="Notifications" subtitle="System updates">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Your notifications</h1>
          <p className="mt-1 text-sm text-[#667085]">Alerts and updates for your account.</p>
        </div>
        {notifications.some((item) => !item.is_read) && (
          <Button variant="secondary" className="px-4 py-2" onClick={markAllRead}>Mark all read</Button>
        )}
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <LoadingState label="Loading notifications..." /> : null}
      {!loading && !error && notifications.length === 0 && <EmptyState title="You're all caught up." />}
      {!loading && !error && (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${item.is_read ? 'border-[#E4E9E7] bg-white' : 'border-[#BFD9D5] bg-[#F2F8F7]'}`}>
              <div>
                <p className="text-sm font-semibold text-[#263238]">{item.title}</p>
                <p className="mt-1 text-sm text-[#475467]">{item.message}</p>
                <p className="mt-2 text-xs text-[#667085]">{new Date(item.created_at).toLocaleString()} · {item.notification_type}</p>
              </div>
              {!item.is_read && <Button variant="ghost" className="shrink-0 px-3 py-2" onClick={() => markRead(item.id)}>Mark read</Button>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
