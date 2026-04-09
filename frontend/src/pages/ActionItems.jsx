import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ActionItems() {
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadActions() {
    try {
      setError('');
      const res = await api.get('/journal/actions/pending');
      setActions(res.data.actions || []);
    } catch (err) {
      console.error('Failed to load actions:', err);
      setError(
        err.response?.data?.error || 'Failed to load action items.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/journal/actions/${id}`, { status });
      setActions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to update action:', err);
      alert(
        err.response?.data?.error || 'Failed to update action item.'
      );
    }
  }

  useEffect(() => {
    loadActions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-teal-400">
            Action Items
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            Loading action items...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && actions.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mb-3 text-4xl">✅</div>
            <p className="text-slate-300">No pending action items.</p>
            <p className="mt-2 text-sm text-slate-500">
              Journal insights will appear here when tasks, meetings, or goals are detected.
            </p>
          </div>
        )}

        {!loading && !error && actions.length > 0 && (
          <div className="space-y-4">
            {actions.map((action) => (
              <div
                key={action.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl">
                    {action.action_type === 'task'
                      ? '✓'
                      : action.action_type === 'meeting'
                      ? '📅'
                      : action.action_type === 'goal'
                      ? '🎯'
                      : '•'}
                  </span>
                  <h2 className="text-lg font-semibold text-white">
                    {action.title}
                  </h2>
                </div>

                <p className="mb-2 text-sm capitalize text-teal-400">
                  {action.action_type}
                </p>

                {action.description && (
                  <p className="mb-3 text-sm text-slate-300">
                    {action.description}
                  </p>
                )}

                {action.journal_date && (
                  <p className="mb-4 text-xs text-slate-500">
                    From journal on{' '}
                    {new Date(action.journal_date).toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(action.id, 'completed')}
                    className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400"
                  >
                    Complete
                  </button>

                  <button
                    onClick={() => updateStatus(action.id, 'dismissed')}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}