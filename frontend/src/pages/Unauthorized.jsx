import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          Access restricted
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          You don’t have permission
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please switch to an account that has access to this area or return to
          the main dashboard.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


