import { useState } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

const reasons = [
  'Resident refused',
  'Resident sleeping',
  'Medicine unavailable',
  'Resident outside',
  'Medical instruction',
  'Other',
];

export function MissedMedicationModal({ isOpen, onClose, item, onConfirm }) {
  const [reason, setReason] = useState(reasons[0]);
  const [notes, setNotes] = useState('');

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Missed Medication"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="px-4 py-2.5">Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(item.id, reason, notes)} className="px-4 py-2.5">
            {reason === 'Resident refused' ? 'Record Refused Dose' : 'Record Missed Dose'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-[#F7FAFA] p-3 text-sm text-[#475467]">
          <p className="font-medium text-[#263238]">{item.resident}</p>
          <p className="mt-1">{item.medication || item.medicine} · {item.dose ? `${item.dose} ${item.unit || ''}` : item.dosage}</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#263238]">Reason</label>
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none">
            {reasons.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#263238]">Additional notes</label>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="4" className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-2.5 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none" placeholder="Optional notes about the missed dose..." />
        </div>
      </div>
    </Modal>
  );
}
