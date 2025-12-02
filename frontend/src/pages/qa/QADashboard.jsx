import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageContainer from '../../components/PageContainer';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import InspectionModal from '../../components/InspectionModal';
import { fetchPendingInspections, scheduleInspection } from '../../api/qa';
import { fetchBatches, recordInspection } from '../../api/batches';

export default function QADashboard() {
  const queryClient = useQueryClient();
  const [inspectionModal, setInspectionModal] = useState({
    open: false,
    batch: null,
  });
  const [scheduleModal, setScheduleModal] = useState({
    open: false,
    batch: null,
  });

  const { data: pendingInspections = [], isLoading } = useQuery({
    queryKey: ['qa-pending-inspections'],
    queryFn: fetchPendingInspections,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ batchId, payload }) => scheduleInspection(batchId, payload),
    onSuccess: () => {
      toast.success('Inspection scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['qa-pending-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setScheduleModal({ open: false, batch: null });
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Could not schedule inspection';
      toast.error(message);
    },
  });

  const inspectionMutation = useMutation({
    mutationFn: ({ batchId, payload }) => recordInspection(batchId, payload),
    onSuccess: (data, variables) => {
      const result = variables.payload.result;
      if (result === 'PASS') {
        toast.success('Inspection passed! Batch is ready for credential issuance.');
      } else {
        toast.error('Inspection failed. Batch has been rejected.');
      }
      queryClient.invalidateQueries({ queryKey: ['qa-pending-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setInspectionModal({ open: false, batch: null });
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Could not save inspection';
      toast.error(message);
    },
  });

  const stats = [
    {
      label: 'Pending inspections',
      value: pendingInspections.filter((b) => b.status === 'QA_ASSIGNED').length,
      accent: 'warning',
    },
    {
      label: 'Scheduled',
      value: pendingInspections.filter((b) => b.status === 'INSPECTION_SCHEDULED').length,
      accent: 'primary',
    },
    {
      label: 'Total assigned',
      value: pendingInspections.length,
      accent: 'primary',
    },
  ];

  const handleScheduleInspection = (batch) => {
    setScheduleModal({ open: true, batch });
  };

  const handleSubmitSchedule = (formData) => {
    scheduleMutation.mutate({
      batchId: scheduleModal.batch.id,
      payload: formData,
    });
  };

  const handleRecordInspection = (batch) => {
    setInspectionModal({ open: true, batch });
  };

  const handleSubmitInspection = (formData) => {
    inspectionMutation.mutate({
      batchId: inspectionModal.batch.id,
      payload: formData,
    });
  };

  return (
    <PageContainer
      title="QA Agency Dashboard"
      description="Manage inspection requests and schedule physical or virtual inspections for assigned batches."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Pending Inspection Requests
        </h2>
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : pendingInspections.length === 0 ? (
          <div className="text-center py-8 text-slate-500 rounded-2xl border border-slate-100 bg-white">
            No pending inspections. New batches will appear here when assigned to your agency.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Batch #</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Exporter</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Scheduled</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pendingInspections.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {batch.batch_number}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {batch.product_type} {batch.variety ? `(${batch.variety})` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {batch.exporter_organization || batch.exporter_email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          batch.status === 'QA_ASSIGNED'
                            ? 'bg-yellow-50 text-yellow-700'
                            : batch.status === 'INSPECTION_SCHEDULED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {batch.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {batch.inspection_scheduled_at
                        ? new Date(batch.inspection_scheduled_at).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {batch.status === 'QA_ASSIGNED' && (
                          <Button
                            size="sm"
                            onClick={() => handleScheduleInspection(batch)}
                          >
                            Schedule
                          </Button>
                        )}
                        {(batch.status === 'INSPECTION_SCHEDULED' ||
                          batch.status === 'QA_ASSIGNED') && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleRecordInspection(batch)}
                          >
                            Record QA
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {scheduleModal.open && (
        <ScheduleInspectionModal
          batch={scheduleModal.batch}
          onClose={() => setScheduleModal({ open: false, batch: null })}
          onSubmit={handleSubmitSchedule}
          isLoading={scheduleMutation.isPending}
        />
      )}

      {inspectionModal.open && (
        <InspectionModal
          batch={inspectionModal.batch}
          onClose={() => setInspectionModal({ open: false, batch: null })}
          onSubmit={handleSubmitInspection}
          isLoading={inspectionMutation.isPending}
        />
      )}
    </PageContainer>
  );
}

function ScheduleInspectionModal({ batch, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    scheduledAt: '',
    type: 'PHYSICAL',
    location: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.scheduledAt) {
      toast.error('Please select a date and time');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Schedule Inspection
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Batch: {batch?.batch_number} - {batch?.product_type}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Inspection Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="PHYSICAL">Physical</option>
              <option value="VIRTUAL">Virtual</option>
            </select>
          </div>
          {formData.type === 'PHYSICAL' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Warehouse address, facility name, etc."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional instructions or notes..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

