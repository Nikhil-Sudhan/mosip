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
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <section className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-white/50 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Recent Batches</h2>
          <p className="text-sm text-violet-700 font-medium mt-2">
            Track your submitted agricultural batches
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

