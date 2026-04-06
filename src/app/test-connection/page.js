'use client';

import { useState, useEffect } from 'react';

export default function TestConnection() {
  const [results, setResults] = useState({
    db: 'Testing...',
    auth: 'Testing...',
    env: 'Testing...',
  });

  useEffect(() => {
    async function testConnections() {
      try {
        const hasDbUrl = process.env.DATABASE_URL ? true : false;
        const hasJwtSecret = process.env.JWT_SECRET ? true : false;
        setResults((prev) => ({
          ...prev,
          env: hasDbUrl && hasJwtSecret ? 'Ready' : 'Missing environment variables',
        }));
      } catch (error) {
        setResults((prev) => ({ ...prev, env: 'Environment check failed' }));
      }

      try {
        const dbRes = await fetch('/api/test-db');
        const dbData = await dbRes.json();
        setResults((prev) => ({
          ...prev,
          db: dbData.ok ? 'Database connected' : dbData.error,
        }));
      } catch (error) {
        setResults((prev) => ({ ...prev, db: error.message }));
      }

      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        setResults((prev) => ({
          ...prev,
          auth: authData.ok ? `Authenticated as ${authData.data.user?.email}` : 'Auth API reachable',
        }));
      } catch (error) {
        setResults((prev) => ({ ...prev, auth: error.message }));
      }
    }

    testConnections();
  }, []);

  const rows = [
    { label: 'Environment variables', value: results.env },
    { label: 'Database connection', value: results.db },
    { label: 'Authentication API', value: results.auth },
  ];

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 py-14">
      <div className="glass-panel w-full max-w-3xl rounded-[2rem] p-8 sm:p-10">
        <div className="mb-8">
          <p className="eyebrow mb-4">System Status</p>
          <h1 className="section-title text-4xl font-semibold">Health check dashboard</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--primary)]">
            Use this screen to validate the core environment, API, and database pieces behind the storefront.
          </p>
        </div>

        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="card-panel flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-[color:var(--primary-strong)]">{row.label}</span>
              <span className="text-sm text-[color:var(--primary)]">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[color:rgba(184,146,115,0.3)] bg-[color:rgba(255,250,245,0.72)] p-5">
          <h2 className="section-title text-2xl font-semibold">Recommended next steps</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-[color:var(--primary)]">
            <li>Confirm all three checks are returning stable values.</li>
            <li>If the database fails, recheck `.env.local` and MySQL availability.</li>
            <li>If auth is failing, restart the dev server and test sign-in again.</li>
          </ol>
        </div>

        <a href="/auth/login" className="primary-btn mt-8 w-full px-6 py-4 text-base font-semibold sm:w-auto">
          Go to Login
        </a>
      </div>
    </div>
  );
}
