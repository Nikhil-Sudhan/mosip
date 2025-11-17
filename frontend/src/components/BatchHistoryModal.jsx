import Button from './Button';

export default function BatchHistoryModal({ open, batch, onClose }) {
  if (!open || !batch) return null;

  const history = Array.isArray(batch.history) ? batch.history : [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Progress tracker
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {batch.productType}
            </h3>
            <p className="text-xs text-slate-500">
              Destination: {batch.destinationCountry}
            </p>
          </div>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="mt-6 max-h-80 space-y-4 overflow-y-auto pr-2">
          {history.length === 0 && (
            <p className="text-sm text-slate-500">
              No lifecycle history available yet.
            </p>
          )}
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.status}
                </p>
                <p className="text-sm text-slate-600">{item.message}</p>
                <p className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

