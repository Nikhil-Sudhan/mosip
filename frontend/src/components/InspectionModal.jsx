import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from './Button';

export default function InspectionModal({
  open,
  batch,
  onSubmit,
  isSubmitting,
  onClose,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      moisturePercent: 11.3,
      pesticidePPM: 0.05,
      organicStatus: 'India Organic Certified',
      isoCode: 'ISO 22000',
      result: 'PASS',
      notes: '',
    },
  });

  useEffect(() => {
    if (batch?.inspection) {
      reset({
        ...batch.inspection,
        result: batch.inspection.result || 'PASS',
      });
    } else {
      reset({
        moisturePercent: 11.3,
        pesticidePPM: 0.05,
        organicStatus: 'India Organic Certified',
        isoCode: 'ISO 22000',
        result: 'PASS',
        notes: '',
      });
    }
  }, [batch, reset]);

  if (!open || !batch) return null;

  const submitInspection = (values) => {
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              QA inspection
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {batch.productType}
            </h3>
            <p className="text-xs text-slate-500">
              Batch ID: {batch.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit(submitInspection)}
        >
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">Moisture %</span>
            <input
              type="number"
              step="0.1"
              {...register('moisturePercent', { valueAsNumber: true })}
              className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors?.moisturePercent ? 'border-danger' : 'border-slate-200'
              }`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">Pesticide PPM</span>
            <input
              type="number"
              step="0.01"
              {...register('pesticidePPM', { valueAsNumber: true })}
              className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors?.pesticidePPM ? 'border-danger' : 'border-slate-200'
              }`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">Organic status</span>
            <input
              type="text"
              {...register('organicStatus')}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">ISO code</span>
            <input
              type="text"
              {...register('isoCode')}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">Result</span>
            <select
              {...register('result')}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
            <span className="font-medium">Notes</span>
            <textarea
              rows={3}
              {...register('notes')}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save inspection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}




