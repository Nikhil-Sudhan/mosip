import Button from './Button';

const verdictColors = {
  VALID: 'bg-emerald-50 text-emerald-700',
  VALID_OFFLINE: 'bg-emerald-50 text-emerald-700',
  EXPIRED: 'bg-amber-50 text-amber-700',
  REVOKED: 'bg-rose-50 text-rose-600',
  TAMPERED: 'bg-rose-50 text-rose-600',
  INVALID_SIGNATURE: 'bg-rose-50 text-rose-600',
  INVALID_SCHEMA: 'bg-rose-50 text-rose-600',
  NOT_FOUND: 'bg-slate-100 text-slate-600',
};

export default function VerificationResult({ result }) {
  if (!result) return null;

  const { summary, checks, credential } = result;

  const downloadJson = () => {
    if (!credential) return;
    const blob = new Blob([JSON.stringify(credential, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${summary?.credentialId || 'credential'}-dpp.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const checkList = [
    { label: 'Signature', passed: checks?.signature },
    { label: 'Expiry', passed: checks?.expiry },
    { label: 'Revocation', passed: checks?.revocation },
  ];

  return (
    <div className="mt-6 space-y-4">
      <div
        className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm`}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verification result
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {summary?.productName || 'Unknown product'}
            </p>
            <p className="text-sm text-slate-500">
              Credential ID: {summary?.credentialId || 'N/A'}
            </p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${verdictColors[result.verdict] || 'bg-slate-100 text-slate-700'}`}
          >
            {result.verdict}
          </span>
        </div>
        {summary && (
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-900">Issuer</dt>
              <dd>{summary.issuer || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Route</dt>
              <dd>{summary.route || 'N/A'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Issued on</dt>
              <dd>
                {summary.issuedAt
                  ? new Date(summary.issuedAt).toLocaleString()
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Expires</dt>
              <dd>
                {summary.expiresAt
                  ? new Date(summary.expiresAt).toLocaleDateString()
                  : '-'}
              </dd>
            </div>
          </dl>
        )}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-6">
            {checkList.map((item) => (
              <div key={item.label}>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p
                  className={`text-sm font-semibold ${item.passed ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {item.passed ? 'PASS' : 'FAIL'}
                </p>
              </div>
            ))}
          </div>
          {credential && (
            <Button className="w-full md:w-auto" onClick={downloadJson}>
              Download credential
            </Button>
          )}
        </div>
      </div>
      {summary?.inspection && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Inspection highlights
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <p>
              Moisture:{' '}
              <span className="font-semibold text-slate-900">
                {summary.inspection.moisturePercent ?? '-'}%
              </span>
            </p>
            <p>
              Pesticide PPM:{' '}
              <span className="font-semibold text-slate-900">
                {summary.inspection.pesticidePPM ?? '-'}
              </span>
            </p>
            <p>
              Organic:{' '}
              <span className="font-semibold text-slate-900">
                {summary.inspection.organicStatus || '-'}
              </span>
            </p>
            <p>
              ISO:{' '}
              <span className="font-semibold text-slate-900">
                {summary.inspection.isoCode || '-'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

