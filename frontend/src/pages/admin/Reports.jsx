import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Filter } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { AdherenceChart } from '../../components/dashboard/AdherenceChart';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const inputClass = 'rounded-xl border border-[#DDE7E5] bg-white px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none';

function buildTrend(records) {
  const days = new Map();
  for (const record of records) {
    if (!['GIVEN', 'MISSED', 'REFUSED'].includes(record.status)) continue;
    const day = record.scheduled_time.slice(0, 10);
    const item = days.get(day) || { day, given: 0, resolved: 0 };
    item.resolved += 1;
    if (record.status === 'GIVEN') item.given += 1;
    days.set(day, item);
  }
  return [...days.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-7)
    .map((item) => ({
      name: new Date(`${item.day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
      adherence: Math.round((item.given / item.resolved) * 100),
    }));
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function Reports() {
  const [allRecords, setAllRecords] = useState([]);
  const [residents, setResidents] = useState([]);
  const [medications, setMedications] = useState([]);
  const [caretakers, setCaretakers] = useState([]);
  const [caretakerUsers, setCaretakerUsers] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [residentId, setResidentId] = useState('');
  const [medicationId, setMedicationId] = useState('');
  const [caretakerId, setCaretakerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get('/administrations'),
      api.get('/residents'),
      api.get('/medications'),
      api.get('/caretakers'),
      api.get('/users'),
    ])
      .then(([{ data: records }, { data: residentData }, { data: medicationData }, { data: caretakerData }, { data: users }]) => {
        if (!isMounted) return;
        setAllRecords(records);
        setResidents(residentData);
        setMedications(medicationData);
        setCaretakers(caretakerData);
        const userMap = Object.fromEntries(users.map((user) => [user.id, user.full_name]));
        setCaretakerUsers(Object.fromEntries(caretakerData.map((caretaker) => [caretaker.id, userMap[caretaker.user_id] || `Caretaker #${caretaker.id}`])));
      })
      .catch((apiError) => {
        if (isMounted) setError(apiError.response?.data?.detail || 'Unable to load report data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecords = useMemo(() => allRecords.filter((record) => {
    const scheduled = new Date(record.scheduled_time);
    return (!startDate || scheduled >= new Date(`${startDate}T00:00:00`))
      && (!endDate || scheduled <= new Date(`${endDate}T23:59:59.999`))
      && (!residentId || record.resident_id === Number(residentId))
      && (!medicationId || record.medication_id === Number(medicationId))
      && (!caretakerId || record.caretaker_id === Number(caretakerId));
  }), [allRecords, startDate, endDate, residentId, medicationId, caretakerId]);

  const summary = useMemo(() => {
    const resolved = filteredRecords.filter((record) => ['GIVEN', 'MISSED', 'REFUSED'].includes(record.status));
    const given = resolved.filter((record) => record.status === 'GIVEN').length;
    return {
      total: resolved.length,
      given,
      missed: resolved.filter((record) => record.status === 'MISSED').length,
      refused: resolved.filter((record) => record.status === 'REFUSED').length,
      adherence: resolved.length ? Math.round((given / resolved.length) * 100) : null,
    };
  }, [filteredRecords]);
  const trend = useMemo(() => buildTrend(filteredRecords), [filteredRecords]);

  const exportCsv = () => {
    const residentNames = Object.fromEntries(residents.map((resident) => [resident.id, resident.full_name]));
    const medicationNames = Object.fromEntries(medications.map((medication) => [medication.id, medication.medicine_name]));
    const rows = [
      ['Scheduled at', 'Resident', 'Medication', 'Status', 'Administered at', 'Administered by', 'Reason', 'Notes'],
      ...filteredRecords.map((record) => [
        record.scheduled_time,
        residentNames[record.resident_id] || record.resident_id,
        medicationNames[record.medication_id] || record.medication_id,
        record.status,
        record.administered_at || '',
        record.administered_by || '',
        record.missed_reason || '',
        record.notes || '',
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'medication-administration-report.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <DashboardLayout role="Administrator" title="Reports" subtitle="Healthcare insights">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#263238]">Medication reporting</h1>
          <p className="mt-1 text-sm text-[#667085]">Report results are calculated from persisted administration records.</p>
        </div>
        <Button onClick={exportCsv} disabled={loading || filteredRecords.length === 0} className="gap-2 rounded-xl px-4 py-2.5">
          <ArrowDownToLine size={16} /> Export CSV
        </Button>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <LoadingState label="Loading report data..." /> : null}
      {!loading && !error && (
        <>
          <section className="mb-6 rounded-2xl border border-[#E4E9E7] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Filter size={17} className="text-[#4F8A8B]" />
              <h2 className="font-semibold text-[#263238]">Filters</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <label className="text-xs text-[#667085]">Start date<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className={`${inputClass} mt-1 block w-full`} /></label>
              <label className="text-xs text-[#667085]">End date<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className={`${inputClass} mt-1 block w-full`} /></label>
              <label className="text-xs text-[#667085]">Resident<select value={residentId} onChange={(event) => setResidentId(event.target.value)} className={`${inputClass} mt-1 block w-full`}><option value="">All residents</option>{residents.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></label>
              <label className="text-xs text-[#667085]">Medication<select value={medicationId} onChange={(event) => setMedicationId(event.target.value)} className={`${inputClass} mt-1 block w-full`}><option value="">All medications</option>{medications.map((item) => <option key={item.id} value={item.id}>{item.medicine_name}</option>)}</select></label>
              <label className="text-xs text-[#667085]">Caretaker<select value={caretakerId} onChange={(event) => setCaretakerId(event.target.value)} className={`${inputClass} mt-1 block w-full`}><option value="">All caretakers</option>{caretakers.map((item) => <option key={item.id} value={item.id}>{caretakerUsers[item.id]}</option>)}</select></label>
            </div>
          </section>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Recorded doses', summary.total],
              ['Given', summary.given],
              ['Missed', summary.missed],
              ['Adherence', summary.adherence === null ? 'No history' : `${summary.adherence}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
                <p className="text-sm text-[#667085]">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#263238]">{value}</p>
                {label === 'Missed' && <p className="mt-1 text-xs text-[#667085]">{summary.refused} refused</p>}
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
            {trend.length > 0
              ? <AdherenceChart data={trend} />
              : <EmptyState title="No medication history available." description="Report charts will appear when doses have been recorded." />}
            <div className="rounded-2xl border border-[#E4E9E7] bg-white p-5">
              <h3 className="text-base font-semibold text-[#263238]">Applied report filters</h3>
              <div className="mt-4 space-y-3 text-sm text-[#475467]">
                <div className="rounded-xl bg-[#F7FAFA] p-3">Date range: {startDate || 'Any'} to {endDate || 'Any'}</div>
                <div className="rounded-xl bg-[#F7FAFA] p-3">Resident: {residents.find((item) => item.id === Number(residentId))?.full_name || 'All residents'}</div>
                <div className="rounded-xl bg-[#F7FAFA] p-3">Medication: {medications.find((item) => item.id === Number(medicationId))?.medicine_name || 'All medications'}</div>
                <div className="rounded-xl bg-[#F7FAFA] p-3">Caretaker: {caretakerUsers[caretakerId] || 'All caretakers'}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
