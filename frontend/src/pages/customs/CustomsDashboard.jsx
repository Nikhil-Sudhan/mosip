import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';
import PageContainer from '../../components/PageContainer';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import VerificationResult from '../../components/VerificationResult';
import {
  fetchVerificationActivity,
  verifyById,
} from '../../api/verification';

function extractCredentialId(payload) {
  if (!payload) return '';
  try {
    const url = new URL(payload);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || payload;
  } catch {
    return payload;
  }
}

export default function CustomsDashboard() {
  const [credentialId, setCredentialId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(false);

  const { data: activity = [] } = useQuery({
    queryKey: ['verification-activity'],
    queryFn: fetchVerificationActivity,
    refetchInterval: 10000,
  });

  const verifyMutation = useMutation({
    mutationFn: verifyById,
    onSuccess: (data) => {
      setVerificationResult(data);
    },
    onError: () => toast.error('Unable to verify credential'),
  });

  const stats = [
    {
      label: 'Checks logged',
      value: activity.length,
      accent: 'primary',
    },
    {
      label: 'Flagged today',
      value: activity.filter((entry) => entry.verdict !== 'VALID').length,
      accent: 'warning',
    },
    {
      label: 'Cleared',
      value: activity.filter((entry) => entry.verdict === 'VALID').length,
      accent: 'success',
    },
  ];

  const handleVerify = () => {
    if (!credentialId.trim()) return;
    verifyMutation.mutate(credentialId.trim());
  };

  const handleScan = (value) => {
    const parsed = extractCredentialId(value);
    setCredentialId(parsed);
    verifyMutation.mutate(parsed);
    setScannerEnabled(false);
  };

  return (
    <PageContainer
      title="Customs checkpoint"
      description="Verify Digital Product Passports (DPP) before clearing cargo. Paste a VC ID or scan the QR to see authenticity."
      actions={
        <Button onClick={() => setScannerEnabled((prev) => !prev)}>
          {scannerEnabled ? 'Close scanner' : 'Scan QR'}
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Verify credential
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the credential short ID or scan the QR code printed on the
            shipment documents.
          </p>
          <label className="mt-4 block text-sm font-medium text-slate-600">
            Credential ID
            <input
              value={credentialId}
              onChange={(event) => setCredentialId(event.target.value)}
              placeholder="e.g., dpp-93af"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </label>
          <Button
            className="mt-4 w-full justify-center"
            disabled={!credentialId.trim() || verifyMutation.isPending}
            onClick={handleVerify}
          >
            {verifyMutation.isPending ? 'Checking…' : 'Check credential'}
          </Button>
          {scannerEnabled && (
            <div className="mt-4 overflow-hidden rounded-xl border border-dashed border-slate-200">
              <Scanner
                constraints={{ facingMode: 'environment' }}
                onDecode={handleScan}
                onError={(error) => console.error(error)}
                scanDelay={600}
              />
            </div>
          )}
          <VerificationResult result={verificationResult} />
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Inspection tips
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Cross-check HS code and container seal number.</li>
            <li>
              Ensure credential expiry date covers the planned arrival date.
            </li>
            <li>
              Call the QA desk if you see a REVOKED or NOT FOUND status before
              holding cargo.
            </li>
          </ul>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent verification activity
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Credential
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Route
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Checked at
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activity.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No verifications yet. Run your first scan to see it here.
                  </td>
                </tr>
              ) : (
                activity.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {entry.credentialId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {entry.product || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {entry.route || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          entry.verdict === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {entry.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(entry.checkedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}


