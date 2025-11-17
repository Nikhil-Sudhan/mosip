import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchBatches } from '../../api/batches';
import { fetchCredential } from '../../api/credentials';
import PageContainer from '../../components/PageContainer';
import Button from '../../components/Button';
import StatCard from '../../components/StatCard';
import BatchList from '../../components/BatchList';
import CredentialModal from '../../components/CredentialModal';
import BatchHistoryModal from '../../components/BatchHistoryModal';

export default function ExporterDashboard() {
  const navigate = useNavigate();
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

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: fetchBatches,
  });

  const stats = [
    {
      label: 'Active batches',
      value: batches.length,
      accent: 'primary',
    },
    {
      label: 'Awaiting QA',
      value: batches.filter((b) => b.status === 'SUBMITTED').length,
      accent: 'warning',
    },
    {
      label: 'Certified',
      value: batches.filter((b) => b.status === 'CERTIFIED').length,
      accent: 'success',
    },
  ];

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
      setCredentialModal((current) => ({
        ...current,
        loading: false,
      }));
      const notFound =
        error.response?.data?.error?.code === 'CREDENTIAL_NOT_FOUND';
      toast.error(notFound ? 'Credential not issued yet' : 'Failed to load VC');
      setCredentialModal({
        open: false,
        batch: null,
        data: null,
        loading: false,
      });
    }
  };

  return (
    <PageContainer
      title="Exporter workspace"
      description="Track all submitted agricultural batches and monitor QA progress."
      actions={
        <Button onClick={() => navigate('/exporter/new')}>
          Submit new batch
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <section className="mt-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent batches</h2>
        {isLoading ? (
          <div className="rounded-xl border border-slate-100 bg-white p-6 text-sm text-slate-500">
            Loading batches…
          </div>
        ) : (
          <BatchList
            batches={batches}
            canIssue={false}
            onViewCredential={handleViewCredential}
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
        onClose={() =>
          setHistoryModal({
            open: false,
            batch: null,
          })
        }
      />
    </PageContainer>
  );
}

