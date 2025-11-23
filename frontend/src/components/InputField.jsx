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
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-bold text-violet-700">{label}</span>
      <input
        type={type}
        className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-violet-300 focus:border-violet-500 ${
          error 
            ? 'border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-500' 
            : 'border-violet-200 bg-white hover:border-violet-300'
        }`}
        {...(register ? register(name) : {})}
        {...props}
      />
      {error && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">{error}</span>}
    </label>
  );
}




