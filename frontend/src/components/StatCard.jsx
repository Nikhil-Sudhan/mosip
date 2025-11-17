export default function StatCard({ label, value, accent = 'primary' }) {
  const colors = {
    primary: 'from-primary-500/10 to-primary-500/5 text-primary-700',
    success: 'from-success/10 to-success/5 text-success',
    warning: 'from-warning/10 to-warning/5 text-warning',
  };
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold ${colors[accent] ?? colors.primary}`}
      >
        {value}
      </p>
    </div>
  );
}

