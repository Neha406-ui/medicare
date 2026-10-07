import { DashboardLayout } from './DashboardLayout';

export function CareTakerLayout({ userName = 'Anita', title = "Today's Schedule", subtitle = 'Care tasks at a glance', children }) {
  return (
    <DashboardLayout role="Care Taker" userName={userName} title={title} subtitle={subtitle}>
      {children}
    </DashboardLayout>
  );
}
