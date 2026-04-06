import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const cards = [
  'Secure Authentication',
  'Multi-Factor Authentication',
  'Audit Logging',
  'Rate Limiting',
  'Token Refresh Flow',
  'Protected Routes',
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Welcome back</p>
            <h1 className="text-3xl font-bold">
              {user?.name || 'User'}
            </h1>
            <p className="mt-2 text-slate-400">
              {user?.email}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/mfa-setup')}
              className="rounded-xl border border-teal-500 px-4 py-2 text-teal-400 hover:bg-teal-500/10"
            >
              Set Up MFA
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-teal-500 px-4 py-2 font-semibold text-slate-950 hover:bg-teal-400"
            >
              Sign Out
            </button>
            <button
  onClick={() => navigate('/journal')}
  className="rounded-xl border border-teal-500 px-4 py-2 text-teal-400 hover:bg-teal-500/10"
>
  Open Journal
</button>   
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 className="text-lg font-semibold">{card}</h2>
              <p className="mt-2 text-sm text-slate-400">
                This feature is part of your PLOS security-first
                application setup.
              </p>
            </div>
            
          ))}
        </div>
      </div>
    </div>
  );
}