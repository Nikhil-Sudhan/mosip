import Button from './Button';

export default function CredentialModal({
  open,
  credential,
  isLoading,
  onClose,
}) {
  if (!open) return null;

  const downloadJson = () => {
    if (!credential?.credentialJson) return;
    const content = JSON.stringify(credential.credentialJson, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${credential.batchId}-credential.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadQr = () => {
    if (!credential?.qrImage) return;
    const link = document.createElement('a');
    link.href = credential.qrImage;
    link.download = `${credential.batchId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Digital Product Passport
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Batch credential
            </h3>
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

        {isLoading && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Fetching credential…
          </div>
        )}

        {!isLoading && credential && (
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Issuer:</span>{' '}
              {credential.issuer}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Issued on:</span>{' '}
              {new Date(credential.issuedAt).toLocaleString()}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Expires:</span>{' '}
              {new Date(credential.expiresAt).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Verify via:</span>{' '}
              <a
                href={credential.qrPortalUrl || credential.qrUrl}
                className="text-primary-600 underline"
                target="_blank"
                rel="noreferrer"
              >
                {credential.qrPortalUrl || credential.qrUrl}
              </a>
            </p>
            {credential.qrImage && (
              <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-4">
                <img
                  src={credential.qrImage}
                  alt="Verification QR"
                  className="h-40 w-40"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Scan to open verification portal
                </p>
              </div>
            )}
            <div className="rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-700">
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(credential.credentialJson, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {!isLoading && !credential && (
          <div className="mt-6 rounded-xl border border-dashed border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
            Credential not issued yet.
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!isLoading && credential && (
            <>
              <Button variant="ghost" onClick={downloadQr}>
                QR image
              </Button>
              <Button onClick={downloadJson}>Download JSON</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


