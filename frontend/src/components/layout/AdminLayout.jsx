import { DashboardLayout } from './DashboardLayout';

export function AdminLayout({ userName = 'Neha', title = 'Dashboard', subtitle = 'Administration overview', children }) {
  return (
    <DashboardLayout role="Administrator" userName={userName} title={title} subtitle={subtitle}>
      {children}
    </DashboardLayout>
  );
}
