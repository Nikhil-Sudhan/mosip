import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageContainer from '../../components/PageContainer';
import StatCard from '../../components/StatCard';
import BatchList from '../../components/BatchList';
import Button from '../../components/Button';
import CredentialModal from '../../components/CredentialModal';
import BatchHistoryModal from '../../components/BatchHistoryModal';
import InspectionModal from '../../components/InspectionModal';
import { fetchBatches, recordInspection } from '../../api/batches';
import {
  fetchCredential,
  issueCredential,
} from '../../api/credentials';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [issuingBatchId, setIssuingBatchId] = useState(null);
  const [credentialModal, setCredentialModal] = useState({
    open: false,
    batch: null,
    data: null,
    loading: false,
  });
  const [historyModal, setHistoryModal] = useState({
    open: false,
    batch: null,
  });
  const [inspectionModal, setInspectionModal] = useState({
    open: false,
    batch: null,
  });

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: fetchBatches,
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
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setInspectionModal({ open: false, batch: null });
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Could not save inspection';
      toast.error(message);
    },
  });


  const stats = [
    { label: 'Total batches', value: batches.length, accent: 'primary' },
    {
      label: 'Awaiting QA',
      value: batches.filter((b) => b.status === 'SUBMITTED').length,
      accent: 'warning',
    },
    {
      label: 'Inspected (Ready)',
      value: batches.filter((b) => b.status === 'INSPECTED' && b.inspection?.result === 'PASS').length,
      accent: 'primary',
    },
    {
      label: 'Certificates issued',
      value: batches.filter((b) => b.status === 'CERTIFIED').length,
      accent: 'success',
    },
    {
      label: 'Rejected',
      value: batches.filter((b) => b.status === 'REJECTED').length,
      accent: 'danger',
    },
  ];

  const handleIssueCredential = async (batch) => {
    if (batch.status !== 'INSPECTED') {
      toast.error('Batch must be inspected and pass QA before credential can be issued');
      return;
    }
    
    if (batch.inspection?.result !== 'PASS') {
      toast.error('Batch inspection must pass before credential can be issued');
      return;
    }

    setIssuingBatchId(batch.id);
    try {
      await issueCredential(batch.id);
      toast.success('Credential generated successfully!');
      await queryClient.invalidateQueries({ queryKey: ['batches'] });
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        'Could not generate credential';
      toast.error(message);
    } finally {
      setIssuingBatchId(null);
    }
  };

  const handleViewCredential = async (batch) => {
    setCredentialModal({
      open: true,
      batch,
      data: null,
      loading: true,
    });
    try {
      const credential = await fetchCredential(batch.id);
      setCredentialModal({
        open: true,
        batch,
        data: credential,
        loading: false,
      });
    } catch (error) {
      setCredentialModal({
        open: false,
        batch: null,
        data: null,
        loading: false,
      });
      const message =
        error.response?.data?.error?.message || 'Failed to load credential';
      toast.error(message);
    }
  };


  return (
    <PageContainer
      title="Admin & QA Control Room"
      description="Monitor exporter activity and issue credentials when inspections are complete."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <section className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-white/50 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Latest Batches</h2>
          <p className="text-sm text-violet-700 font-medium mt-2">
            Review and manage all submitted batches
          </p>
        </div>
        {isLoading ? (
          <div className="rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent"></div>
            <p className="mt-4 text-sm text-violet-700 font-semibold">Loading batches…</p>
          </div>
        ) : (
          <BatchList
            batches={batches}
            canIssue
            issuingBatchId={issuingBatchId}
            onIssueCredential={handleIssueCredential}
            onViewCredential={handleViewCredential}
            onRecordInspection={(batch) =>
              setInspectionModal({ open: true, batch })
            }
            onViewHistory={(batch) =>
              setHistoryModal({
                open: true,
                batch,
              })
            }
          />
        )}
      </section>
      <CredentialModal
        open={credentialModal.open}
        credential={credentialModal.data}
        isLoading={credentialModal.loading}
        onClose={() =>
          setCredentialModal({
            open: false,
            batch: null,
            data: null,
            loading: false,
          })
        }
      />
      <BatchHistoryModal
        open={historyModal.open}
        batch={historyModal.batch}
        onClose={() => setHistoryModal({ open: false, batch: null })}
      />
      <InspectionModal
        open={inspectionModal.open}
        batch={inspectionModal.batch}
        isSubmitting={inspectionMutation.isPending}
        onSubmit={(values) =>
          inspectionMutation.mutate({
            batchId: inspectionModal.batch?.id,
            payload: values,
          })
        }
        onClose={() => setInspectionModal({ open: false, batch: null })}
      />
    </PageContainer>
  );
}


