import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export function MedicationConfirmation({ isOpen, onClose, item, onConfirm }) {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Medication"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="px-4 py-2.5">Cancel</Button>
          <Button onClick={() => onConfirm(item.id)} className="px-4 py-2.5">Confirm Medication Given</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F7FAFA] p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#7D8B92]">Resident</p>
            <p className="mt-2 text-sm font-medium text-[#263238]">{item.resident}</p>
          </div>
          <div className="rounded-xl bg-[#F7FAFA] p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#7D8B92]">Medication</p>
            <p className="mt-2 text-sm font-medium text-[#263238]">{item.medication || item.medicine}</p>
          </div>
          <div className="rounded-xl bg-[#F7FAFA] p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#7D8B92]">Dosage</p>
            <p className="mt-2 text-sm font-medium text-[#263238]">{item.dose ? `${item.dose} ${item.unit || ''}` : item.dosage}</p>
          </div>
          <div className="rounded-xl bg-[#F7FAFA] p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#7D8B92]">Scheduled time</p>
            <p className="mt-2 text-sm font-medium text-[#263238]">{item.scheduled_time || item.time}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#F7FAFA] p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#7D8B92]">Instructions</p>
          <p className="mt-2 text-sm text-[#475467]">{item.instructions || 'No additional instructions recorded.'}</p>
        </div>
      </div>
    </Modal>
  );
}
