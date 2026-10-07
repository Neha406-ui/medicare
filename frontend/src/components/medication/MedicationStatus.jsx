import { Badge } from '../common/Badge';

export function MedicationStatus({ status }) {
  const tones = {
    Given: 'success',
    Due: 'warning',
    Missed: 'danger',
    Late: 'warning',
    Upcoming: 'info',
  };

  return <Badge tone={tones[status] || 'neutral'}>{status}</Badge>;
}
