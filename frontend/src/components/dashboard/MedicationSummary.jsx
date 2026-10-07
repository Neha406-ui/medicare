import { Badge } from '../common/Badge';

export function MedicationSummary({ schedule = [] }) {
  return (
    <div className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#263238]">Medication status</h3>
        <Badge tone="info">Today</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {schedule.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#F8FBFB] px-3 py-3">
            <div>
              <p className="text-sm font-medium text-[#263238]">{item.resident}</p>
              <p className="text-xs text-[#667085]">{item.medication || item.medicine} · {item.time || item.scheduled_time || 'Time not recorded'}</p>
            </div>
            <Badge tone={item.status === 'GIVEN' || item.status === 'Given' ? 'success' : item.status === 'MISSED' || item.status === 'REFUSED' || item.status === 'Missed' ? 'danger' : 'warning'}>
              {item.status}
            </Badge>
          </div>
        ))}
        {schedule.length === 0 && <p className="py-5 text-center text-sm text-[#667085]">No medication administration history available.</p>}
      </div>
    </div>
  );
}
