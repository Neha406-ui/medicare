import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';

export function DashboardLayout({ role, userName, title, subtitle, children }) {
  const { user } = useAuth();
  const activeRole = user?.role || role || 'administrator';
  const activeUserName = user?.name || userName || 'Admin User';

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#263238]">
      <Sidebar />

      <main className="lg:ml-[260px]">
        <Topbar
          title={title}
          subtitle={subtitle}
          userName={activeUserName}
          userRole={
            activeRole === 'administrator'
              ? 'Administrator'
              : activeRole === 'caretaker'
                ? 'Care Taker'
                : 'Resident'
          }
        />
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
