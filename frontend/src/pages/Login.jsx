import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login as loginRequest } from '../api/auth';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { getRoleLanding } from '../utils/roleRoutes';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(5),
});

export default function Login() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (userType === 'agency') {
      reset({
        email: 'admin@gmail.com',
        password: 'admin',
      });
    } else if (userType === 'importer_exporter') {
      reset({
        email: '',
        password: '',
      });
    }
  }, [userType, reset]);

  const onSubmit = async (values) => {
    try {
      setError('');
      const user = await loginRequest(values);
      
      if (userType === 'agency') {
        if (user.role !== 'ADMIN' && user.role !== 'QA' && user.role !== 'CUSTOMS') {
          setError('This account is not authorized for agency login');
          return;
        }
      } else if (userType === 'importer_exporter') {
        if (user.role !== 'IMPORTER' && user.role !== 'EXPORTER') {
          setError('This account is not authorized for importer/exporter login');
          return;
        }
      }
      
      navigate(getRoleLanding(user.role), { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Unable to login. Try again.';
      setError(message);
    }
  };

  if (!userType) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-white/50 bg-white/90 backdrop-blur-xl p-10 shadow-2xl">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            AgriQCert Portal
          </h1>
          <p className="mt-1 text-base text-violet-700 font-medium mb-8">
            Choose your login type
          </p>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => setUserType('agency')}
              className="w-full text-lg py-4"
            >
              Agency Login
            </Button>
            <Button
              onClick={() => setUserType('importer_exporter')}
              variant="ghost"
              className="w-full text-lg py-4"
            >
              Importers & Exporters Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-white/50 bg-white/90 backdrop-blur-xl p-10 shadow-2xl">
        <div className="mb-4">
          <button
            onClick={() => {
              setUserType(null);
              setError('');
            }}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800 hover:underline transition-all"
          >
            ← Back to selection
          </button>
        </div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
          {userType === 'agency' ? 'Agency Login' : 'Importers & Exporters Login'}
        </h1>
        <p className="mt-1 text-base text-violet-700 font-medium mb-6">
          {userType === 'agency'
            ? 'Sign in to access the agency portal'
            : 'Sign in to your account'}
        </p>
        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
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
          {error && <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg border-2 border-red-200">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full text-lg py-4">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
          {userType === 'importer_exporter' && (
            <p className="text-center text-sm text-violet-700 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-violet-600 hover:text-violet-800 font-bold hover:underline">
                Create one here
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

