export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95';
  const variants = {
    primary:
      'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 focus-visible:ring-violet-400 shadow-violet-500/50',
    ghost: 'bg-white/90 backdrop-blur-sm text-violet-600 border-2 border-violet-400 hover:bg-violet-50 hover:border-violet-500 focus-visible:ring-violet-400 shadow-md',
    danger: 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white hover:from-red-600 hover:via-rose-600 hover:to-pink-600 focus-visible:ring-red-400 shadow-red-500/50',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}




