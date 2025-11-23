export default function StatCard({ label, value, accent = 'primary' }) {
  const colors = {
    primary: 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 text-white border-2 border-violet-300 shadow-lg shadow-violet-500/50',
    success: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 text-white border-2 border-emerald-300 shadow-lg shadow-emerald-500/50',
    warning: 'bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 text-white border-2 border-amber-300 shadow-lg shadow-amber-500/50',
    danger: 'bg-gradient-to-br from-red-400 via-pink-500 to-rose-500 text-white border-2 border-red-300 shadow-lg shadow-red-500/50',
  };
  return (
    <div className={`rounded-2xl border-2 bg-white p-6 shadow-xl transition-all hover:shadow-2xl hover:scale-105 transform duration-300 ${colors[accent] ?? colors.primary}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-white/90 mb-3">
        {label}
      </p>
      <p className="text-5xl font-extrabold drop-shadow-lg">
        {value}
      </p>
    </div>
  );
}




