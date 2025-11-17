import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';
import PageContainer from '../../components/PageContainer';
import Button from '../../components/Button';
import VerificationResult from '../../components/VerificationResult';
import { verifyById, verifyByUpload } from '../../api/verification';

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

export default function VerifyPortal() {
  const [searchParams] = useSearchParams();
  const initialCredential = searchParams.get('credential') || '';
  const [credentialId, setCredentialId] = useState(initialCredential);
  const [result, setResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (initialCredential) {
      handleVerify(initialCredential);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCredential]);

  const handleVerify = async (id = credentialId) => {
    if (!id) return;
    setIsVerifying(true);
    try {
      const data = await verifyById(id.trim());
      setResult(data);
    } catch {
      toast.error('Verification failed. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const data = await verifyByUpload(json);
      setResult(data);
      toast.success('Credential parsed successfully');
    } catch {
      toast.error('Invalid credential file');
    } finally {
      event.target.value = '';
    }
  };

  const handleScan = async (payload) => {
    const id = extractCredentialId(payload);
    setCredentialId(id);
    setScannerOpen(false);
    await handleVerify(id);
  };

  return (
    <PageContainer
      title="Inji Verify demo"
      description="Scan the QR code or upload the Digital Product Passport JSON to validate authenticity."
      actions={
        <Button onClick={() => setScannerOpen((prev) => !prev)}>
          {scannerOpen ? 'Hide scanner' : 'Open scanner'}
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Verify via credential ID
          </h2>
          <p className="text-sm text-slate-500">
            Paste the ID from the QR code or shipment documents.
          </p>
          <label className="mt-4 flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">Credential ID / URL</span>
            <input
              value={credentialId}
              onChange={(event) =>
                setCredentialId(extractCredentialId(event.target.value))
              }
              placeholder="https://api.agriqcert.test/verify/dpp-123"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <Button
            className="mt-4 w-full justify-center"
            disabled={!credentialId || isVerifying}
            onClick={() => handleVerify()}
          >
            {isVerifying ? 'Verifying…' : 'Verify credential'}
          </Button>
          {scannerOpen && (
            <div className="mt-4 overflow-hidden rounded-xl border border-dashed border-slate-200">
              <Scanner
                onDecode={handleScan}
                onError={(error) => console.error(error)}
                constraints={{ facingMode: 'environment' }}
                scanDelay={600}
              />
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Upload credential file
          </h2>
          <p className="text-sm text-slate-500">
            Works offline – simply drop the JSON exported from Inji Wallet.
          </p>
          <label className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            <input
              type="file"
              accept="application/json"
              onChange={handleUpload}
              className="hidden"
              id="credential-upload"
            />
            <span>Drag & drop JSON or click to browse</span>
            <Button
              variant="ghost"
              onClick={() => document.getElementById('credential-upload')?.click()}
            >
              Choose file
            </Button>
          </label>
        </div>
      </div>
      <VerificationResult result={result} />
    </PageContainer>
  );
}

