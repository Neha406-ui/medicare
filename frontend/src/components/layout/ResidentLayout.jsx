import { DashboardLayout } from './DashboardLayout';

export function ResidentLayout({ userName = 'Ramesh', title = 'Home', subtitle = 'Daily medication overview', children }) {
  return (
    <DashboardLayout role="Resident" userName={userName} title={title} subtitle={subtitle}>
      {children}
    </DashboardLayout>
  );
}
