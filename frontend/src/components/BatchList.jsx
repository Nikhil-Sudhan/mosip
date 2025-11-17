function statusColor(status) {
  const map = {
    SUBMITTED: 'bg-primary-50 text-primary-700',
    UNDER_REVIEW: 'bg-amber-50 text-amber-700',
    INSPECTED: 'bg-blue-50 text-blue-700',
    CERTIFIED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-rose-50 text-rose-600',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
}

export default function BatchList({
  batches = [],
  onViewCredential,
  onIssueCredential,
  onRecordInspection,
  onViewHistory,
  canIssue,
  issuingBatchId,
}) {
  if (!batches.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No batches yet. Use the “Submit batch” button to add your first
        shipment.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Product
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Quantity
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Destination
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Submitted
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">
                  {batch.productType}
                </p>
                <p className="text-xs text-slate-500">{batch.variety}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {batch.quantity} {batch.unit}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {batch.destinationCountry}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                    batch.status
                  )}`}
                >
                  {batch.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(batch.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2 text-sm font-semibold">
                  {onViewHistory && (
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-700"
                      onClick={() => onViewHistory?.(batch)}
                    >
                      Track
                    </button>
                  )}
                  {batch.status === 'CERTIFIED' ? (
                    <button
                      type="button"
                      className="text-primary-600 hover:text-primary-700"
                      onClick={() => onViewCredential?.(batch)}
                    >
                      View VC
                    </button>
                  ) : canIssue ? (
                    <>
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-700"
                        onClick={() => onRecordInspection?.(batch)}
                      >
                        Record QA
                      </button>
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-700 disabled:text-slate-400"
                        disabled={issuingBatchId === batch.id}
                        onClick={() => onIssueCredential?.(batch)}
                      >
                        {issuingBatchId === batch.id
                          ? 'Issuing…'
                          : 'Generate VC'}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Pending QA</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

