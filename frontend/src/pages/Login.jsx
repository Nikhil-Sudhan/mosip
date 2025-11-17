import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login as loginRequest } from '../api/auth';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { getRoleLanding } from '../utils/roleRoutes';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'admin@agriqcert.test',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (values) => {
    try {
      setError('');
      const user = await loginRequest(values);
      navigate(getRoleLanding(user.role), { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Unable to login. Try again.';
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900">
          AgriQCert Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in using the credentials shared with you. Default admin:
          admin@agriqcert.test / Admin@123
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}

