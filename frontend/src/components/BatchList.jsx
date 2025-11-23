function statusColor(status) {
  const map = {
    SUBMITTED: 'bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold shadow-md shadow-violet-500/50',
    UNDER_REVIEW: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-md shadow-amber-500/50',
    INSPECTED: 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold shadow-md shadow-blue-500/50',
    CERTIFIED: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white font-bold shadow-md shadow-emerald-500/50',
    REJECTED: 'bg-gradient-to-r from-red-400 to-pink-500 text-white font-bold shadow-md shadow-red-500/50',
  };
  return map[status] || 'bg-gradient-to-r from-slate-400 to-slate-500 text-white font-bold shadow-md';
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
      <div className="rounded-2xl border-2 border-dashed border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 p-8 text-center text-sm text-violet-700 font-medium">
        No batches yet. Use the "Submit batch" button to add your first
        shipment.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-white/50 bg-white/90 backdrop-blur-lg shadow-2xl">
      <table className="min-w-full divide-y divide-violet-100 text-sm">
        <thead className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500">
          <tr>
            <th className="px-4 py-4 text-left font-bold text-white">
              Product
            </th>
            <th className="px-4 py-4 text-left font-bold text-white">
              Quantity
            </th>
            <th className="px-4 py-4 text-left font-bold text-white">
              Destination
            </th>
            <th className="px-4 py-4 text-left font-bold text-white">
              Status
            </th>
            <th className="px-4 py-4 text-left font-bold text-white">
              Submitted
            </th>
            <th className="px-4 py-4 text-right font-bold text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-violet-100 bg-white/50">
          {batches.map((batch) => (
            <tr key={batch.id} className="hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-colors">
              <td className="px-4 py-4">
                <p className="font-bold text-slate-900">
                  {batch.productType}
                </p>
                <p className="text-xs text-violet-600 font-medium">{batch.variety}</p>
              </td>
              <td className="px-4 py-4 text-slate-700 font-semibold">
                {batch.quantity} {batch.unit}
              </td>
              <td className="px-4 py-4 text-slate-700 font-semibold">
                {batch.destinationCountry}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold ${statusColor(
                    batch.status
                  )}`}
                >
                  {batch.status}
                </span>
              </td>
              <td className="px-4 py-4 text-slate-600 font-medium">
                {new Date(batch.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap justify-end gap-2 text-sm font-bold">
                  {onViewHistory && (
                    <button
                      type="button"
                      className="text-violet-600 hover:text-violet-800 hover:underline transition-all"
                      onClick={() => onViewHistory?.(batch)}
                    >
                      Track
                    </button>
                  )}
                  {batch.status === 'CERTIFIED' ? (
                    <button
                      type="button"
                      className="bg-gradient-to-r from-emerald-400 to-green-500 text-white px-4 py-1.5 rounded-lg hover:from-emerald-500 hover:to-green-600 shadow-md hover:shadow-lg transition-all"
                      onClick={() => onViewCredential?.(batch)}
                    >
                      View VC
                    </button>
                  ) : batch.status === 'REJECTED' ? (
                    <span className="text-xs text-red-600 font-semibold">Rejected</span>
                  ) : canIssue ? (
                    <>
                      {batch.status === 'SUBMITTED' && (
                        <button
                          type="button"
                          className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1.5 rounded-lg hover:from-amber-500 hover:to-orange-600 shadow-md hover:shadow-lg transition-all"
                          onClick={() => onRecordInspection?.(batch)}
                        >
                          Record QA
                        </button>
                      )}
                      {batch.status === 'INSPECTED' && batch.inspection?.result === 'PASS' && (
                        <button
                          type="button"
                          className="bg-gradient-to-r from-violet-400 to-purple-500 text-white px-4 py-1.5 rounded-lg hover:from-violet-500 hover:to-purple-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={issuingBatchId === batch.id}
                          onClick={() => onIssueCredential?.(batch)}
                        >
                          {issuingBatchId === batch.id
                            ? 'Issuing…'
                            : 'Generate VC'}
                        </button>
                      )}
                      {batch.status === 'SUBMITTED' && (
                        <span className="text-xs text-amber-600 font-semibold">Awaiting Inspection</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-violet-500 font-semibold">Pending QA</span>
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

