export default function InputField({
  label,
  name,
  type = 'text',
  register,
  errors,
  ...props
}) {
  const error = errors?.[name]?.message;
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-danger' : 'border-slate-200'
        }`}
        {...(register ? register(name) : {})}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

