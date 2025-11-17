import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from './Button';
import InputField from './InputField';

const schema = z.object({
  productType: z.string().min(1, 'Product type is required'),
  variety: z.string().optional(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  originCountry: z.string().min(1, 'Origin is required'),
  destinationCountry: z.string().min(1, 'Destination is required'),
  harvestDate: z.string().min(4, 'Harvest date is required'),
  notes: z.string().optional(),
});

export default function BatchForm({ onSubmit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productType: '',
      variety: '',
      quantity: 1000,
      unit: 'kg',
      originCountry: '',
      destinationCountry: '',
      harvestDate: '',
      notes: '',
    },
  });

  const submitForm = async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value ?? '');
    });
    const files = document.getElementById('documents-input')?.files ?? [];
    Array.from(files).forEach((file) => {
      formData.append('documents', file);
    });

    await onSubmit(formData);
    reset();
    if (document.getElementById('documents-input')) {
      document.getElementById('documents-input').value = '';
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      className="grid gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2"
    >
      <InputField
        label="Product Type"
        name="productType"
        register={register}
        errors={errors}
      />
      <InputField
        label="Variety"
        name="variety"
        register={register}
        errors={errors}
      />
      <InputField
        label="Quantity"
        name="quantity"
        type="number"
        register={register}
        errors={errors}
      />
      <InputField
        label="Unit"
        name="unit"
        register={register}
        errors={errors}
        placeholder="kg / ton / bags"
      />
      <InputField
        label="Origin Country"
        name="originCountry"
        register={register}
        errors={errors}
      />
      <InputField
        label="Destination Country"
        name="destinationCountry"
        register={register}
        errors={errors}
      />
      <InputField
        label="Harvest Date"
        name="harvestDate"
        type="date"
        register={register}
        errors={errors}
      />
      <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
        <span className="font-medium">Notes</span>
        <textarea
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          {...register('notes')}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
        <span className="font-medium">
          Attachments (PDF, PNG, JPG – max 5 files / 5MB each)
        </span>
        <input
          id="documents-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          multiple
          className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm"
        />
      </label>
      <div className="md:col-span-2 flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit batch'}
        </Button>
      </div>
    </form>
  );
}

