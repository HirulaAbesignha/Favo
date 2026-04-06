'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const loginData = await loginResponse.json();

        if (loginData.ok) {
          router.push('/products');
        } else {
          router.push('/auth/login');
        }
      } else {
        setError(data.error || 'Failed to register');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 py-14">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
        <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
          <p className="eyebrow mb-5">Join FAVO</p>
          <h1 className="section-title text-4xl font-semibold sm:text-5xl">Create your account with confidence</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--primary)]">
            Start with a clean, warm storefront experience and get immediate access to categories, product detail pages,
            and real-time size availability.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="card-panel rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Fast onboarding</p>
              <p className="mt-2 text-[color:var(--primary-strong)]">Register, authenticate, and continue directly into the product catalog.</p>
            </div>
            <div className="card-panel rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Elegant interface</p>
              <p className="mt-2 text-[color:var(--primary-strong)]">Light-brown surfaces and soft contrast keep the store professional and calm.</p>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">New Account</p>
            <h2 className="section-title mt-3 text-3xl font-semibold">Set up your profile</h2>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-[color:rgba(162,77,66,0.25)] bg-[color:rgba(162,77,66,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="field-label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="field-input px-4 py-3.5"
                placeholder="Your full name"
              />
            </div>

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
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="field-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="field-input px-4 py-3.5"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[color:var(--primary)]">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-[color:var(--primary-strong)] underline decoration-[color:var(--accent)] underline-offset-4">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
