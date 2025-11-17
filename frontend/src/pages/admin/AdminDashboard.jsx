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
  fetchTemplates,
  createTemplate,
} from '../../api/credentials';
import { createUser } from '../../api/users';

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
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'EXPORTER',
    organization: '',
  });
  const [templateForm, setTemplateForm] = useState({
    name: 'Digital Product Passport',
    description: 'Standard template for agri exports',
    schemaUrl: 'https://mosip.io/dpp/schema/v1',
    fields: 'product.name,product.quantity,inspection.moisturePercent',
  });

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: fetchBatches,
  });
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const inspectionMutation = useMutation({
    mutationFn: ({ batchId, payload }) => recordInspection(batchId, payload),
    onSuccess: () => {
      toast.success('Inspection saved');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setInspectionModal({ open: false, batch: null });
    },
    onError: () => toast.error('Could not save inspection'),
  });

  const userMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('User created');
      setUserForm({
        email: '',
        password: '',
        role: 'EXPORTER',
        organization: '',
      });
    },
    onError: (error) => {
      const message =
        error.response?.data?.error?.message || 'Failed to create user';
      toast.error(message);
    },
  });

  const templateMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      toast.success('Template saved');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => toast.error('Failed to save template'),
  });

  const stats = [
    { label: 'Total batches', value: batches.length, accent: 'primary' },
    {
      label: 'Awaiting QA',
      value: batches.filter((b) => b.status === 'SUBMITTED').length,
      accent: 'warning',
    },
    {
      label: 'Certificates issued',
      value: batches.filter((b) => b.status === 'CERTIFIED').length,
      accent: 'success',
    },
  ];

  const handleIssueCredential = async (batch) => {
    setIssuingBatchId(batch.id);
    try {
      await issueCredential(batch.id);
      toast.success('Credential generated successfully');
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

  const quickLinks = [
    {
      title: 'Create exporter or customs logins',
      description:
        'Use POST /api/users with role EXPORTER or CUSTOMS. Add organization name so dashboards show branding.',
    },
    {
      title: 'Assign QA partners',
      description:
        'Share QA accounts so they can update inspections and push batches to CERTIFIED.',
    },
    {
      title: 'Rotate default admin',
      description:
        'Create a new admin user, sign in, then disable the seeded account in users.json.',
    },
  ];

  return (
    <PageContainer
      title="Admin & QA control room"
      description="Monitor exporter activity, manage role access, and issue credentials when inspections are complete."
      actions={<Button onClick={() => toast.success('User guide coming soon')}>View setup guide</Button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <section className="mt-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Latest batches</h2>
        {isLoading ? (
          <div className="rounded-xl border border-slate-100 bg-white p-6 text-sm text-slate-500">
            Loading batches…
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
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Playbook
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Invite new portal user
          </h2>
          <p className="text-sm text-slate-500">
            Create exporter, QA, or customs credentials instantly.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 text-sm text-slate-600"
            onSubmit={(event) => {
              event.preventDefault();
              userMutation.mutate(userForm);
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="font-medium">Email</span>
              <input
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Password</span>
              <input
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                required
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Organization</span>
              <input
                type="text"
                value={userForm.organization}
                onChange={(event) =>
                  setUserForm((prev) => ({
                    ...prev,
                    organization: event.target.value,
                  }))
                }
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Role</span>
              <select
                value={userForm.role}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, role: event.target.value }))
                }
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="EXPORTER">Exporter</option>
                <option value="QA">QA</option>
                <option value="CUSTOMS">Customs</option>
                <option value="IMPORTER">Importer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <Button type="submit" disabled={userMutation.isPending}>
              {userMutation.isPending ? 'Creating…' : 'Create user'}
            </Button>
          </form>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Certificate templates
          </h2>
          <p className="text-sm text-slate-500">
            Control the schema fields included in each Digital Product Passport.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 text-sm text-slate-600"
            onSubmit={(event) => {
              event.preventDefault();
              const fields = templateForm.fields
                .split(',')
                .map((field) => field.trim())
                .filter(Boolean);
              templateMutation.mutate({
                name: templateForm.name,
                description: templateForm.description,
                schemaUrl: templateForm.schemaUrl,
                fields,
              });
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="font-medium">Template name</span>
              <input
                type="text"
                value={templateForm.name}
                onChange={(event) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Description</span>
              <textarea
                rows={2}
                value={templateForm.description}
                onChange={(event) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Schema URL</span>
              <input
                type="url"
                value={templateForm.schemaUrl}
                onChange={(event) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    schemaUrl: event.target.value,
                  }))
                }
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Fields (comma separated)</span>
              <input
                type="text"
                value={templateForm.fields}
                onChange={(event) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    fields: event.target.value,
                  }))
                }
                className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <Button type="submit" disabled={templateMutation.isPending}>
              {templateMutation.isPending ? 'Saving…' : 'Save template'}
            </Button>
          </form>
          <div className="mt-4 space-y-3">
            {templates.slice(0, 3).map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600"
              >
                <p className="font-semibold text-slate-900">
                  {template.name}
                </p>
                <p>{template.description}</p>
                <p className="text-xs text-slate-500">
                  Fields: {template.fields?.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
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


