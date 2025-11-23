import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerUser } from '../api/auth';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { getRoleLanding } from '../utils/roleRoutes';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['IMPORTER', 'EXPORTER']),
  organization: z.string().min(1, 'Organization name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'EXPORTER',
      organization: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      setError('');
      const { confirmPassword, ...registerData } = values;
      const user = await registerUser(registerData);
      navigate(getRoleLanding(user.role), { replace: true });
    } catch (err) {
      let message = 'Unable to create account. Try again.';
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_BLOCKED_BY_CLIENT') || err.code === 'ERR_BLOCKED_BY_CLIENT') {
        message = 'Request was blocked by browser extension. Please disable ad blockers or try in incognito/private window.';
      } else if (err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">
          Create Account
        </h1>
        <p className="mt-1 text-sm text-slate-500 mb-6">
          Register as an Importer or Exporter
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <InputField
            label="Email"
            name="email"
            type="email"
            register={register}
            errors={errors}
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            register={register}
            errors={errors}
          />
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            register={register}
            errors={errors}
          />
          <InputField
            label="Organization Name"
            name="organization"
            type="text"
            register={register}
            errors={errors}
          />
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">Account Type</span>
            <select
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('role')}
            >
              <option value="EXPORTER">Exporter</option>
              <option value="IMPORTER">Importer</option>
            </select>
            {errors.role && (
              <span className="text-xs text-danger">{errors.role.message}</span>
            )}
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Button>
          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

