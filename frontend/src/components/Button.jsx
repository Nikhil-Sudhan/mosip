export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50';
  const variants = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600',
    ghost: 'bg-white text-primary-600 hover:bg-primary-50',
    danger: 'bg-danger text-white hover:bg-[#c0392b]',
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

