'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const experienceNotes = [
    'Personalized welcome with smoother account routing',
    'Premium product browsing with live stock visibility',
    'Admin accounts move straight into catalog control',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.ok) {
        setError('');
        router.push(data.data?.role === 'admin' ? '/admin' : '/products');
      } else {
        setError(data.error || 'Failed to login');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 py-14">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card-panel relative overflow-hidden rounded-[2rem] p-8 sm:p-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-8%] top-[-6%] h-48 w-48 rounded-full bg-[color:rgba(199,154,115,0.18)] blur-3xl" />
            <div className="absolute bottom-10 right-[-6%] h-56 w-56 rounded-full bg-[color:rgba(111,69,40,0.12)] blur-3xl" />
            <div className="absolute inset-x-10 top-24 h-px bg-[linear-gradient(90deg,transparent,rgba(184,146,115,0.45),transparent)]" />
          </div>

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">Welcome Back</p>
              <span className="rounded-full border border-[color:rgba(184,146,115,0.35)] bg-[color:rgba(255,250,245,0.7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
                Signature Access
              </span>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <h1 className="section-title max-w-xl text-4xl font-semibold leading-[0.94] sm:text-5xl xl:text-6xl">
                  Sign in to your FAVO account
                </h1>
                <p className="mt-5 max-w-lg text-base leading-8 text-white/76 sm:text-lg">
                  Step back into a polished storefront experience with sharper contrast, cleaner product discovery,
                  and a dashboard flow designed to feel calm and premium.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="glass-panel rounded-[1.25rem] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--accent)]">Store mood</p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--primary-strong)]">Warm editorial retail</p>
                  </div>
                  <div className="glass-panel rounded-[1.25rem] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--accent)]">Experience</p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--primary-strong)]">Smooth login to catalog</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.24)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--accent)]">FAVO Atmosphere</p>
                    <p className="mt-2 text-2xl font-semibold text-[color:var(--primary-strong)]">Designed to feel composed</p>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-white/12 bg-[color:rgba(255,255,255,0.08)]" />
                </div>

                <div className="mt-6 space-y-3">
                  {experienceNotes.map((note, index) => (
                    <div key={note} className="flex items-start gap-3 rounded-[1.25rem] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-sm font-semibold text-[color:var(--accent)]">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-white/78">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="glass-panel rounded-[1.5rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Refined</p>
                <p className="mt-3 text-[color:var(--primary-strong)]">Layered surfaces, elegant spacing, and a calmer first impression.</p>
              </div>
              <div className="glass-panel rounded-[1.5rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Reliable</p>
                <p className="mt-3 text-[color:var(--primary-strong)]">A clear path from login to products, cart, and account actions.</p>
              </div>
              <div className="glass-panel rounded-[1.5rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Admin Ready</p>
                <p className="mt-3 text-[color:var(--primary-strong)]">Admin sessions shift directly into catalog management when needed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">Account Access</p>
            <h2 className="section-title mt-3 text-3xl font-semibold">Enter your details</h2>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-[color:rgba(162,77,66,0.25)] bg-[color:rgba(162,77,66,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="field-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="field-input px-4 py-3.5"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="field-input px-4 py-3.5"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[color:var(--primary)]">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-[color:var(--primary-strong)] underline decoration-[color:var(--accent)] underline-offset-4">
              Create one here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
