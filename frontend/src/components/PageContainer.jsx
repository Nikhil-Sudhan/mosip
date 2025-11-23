import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function PageContainer({ title, description, actions, children }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      setShowMenu(false);
      await logoutApi();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      {showMenu && (
        <div
          className="fixed inset-0 z-[50]"
          onClick={() => setShowMenu(false)}
        />
      )}
      <div className="min-h-screen">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-white/50 relative z-[60]">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent tracking-tight">{title}</h1>
              {description && (
                <p className="text-base text-slate-700 max-w-2xl font-medium">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {actions && <div className="flex items-center gap-3">{actions}</div>}
              {user && (
                <div className="relative z-[70]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-slate-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                      {user.email}
                    </span>
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-[100]">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{user.email}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role?.toLowerCase()}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </>
  );
}




