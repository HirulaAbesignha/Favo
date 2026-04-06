'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const highlights = [
  {
    title: 'Curated wardrobe drops',
    text: 'Sharper silhouettes, elevated essentials, and premium statement pieces presented with a more polished edge.',
  },
  {
    title: 'Confident product discovery',
    text: 'Browse by category, review stock by size, and move through the store with a cleaner buying flow.',
  },
  {
    title: 'Refined dark presentation',
    text: 'A black editorial palette gives every page a cleaner, more professional luxury feel.',
  },
];

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (response.ok && data.ok) {
          router.push(data.data.user.role === 'admin' ? '/admin' : '/products');
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] px-10 py-8 text-center">
          <p className="eyebrow mx-auto mb-4">FAVO</p>
          <h1 className="section-title text-3xl font-semibold">Preparing your storefront</h1>
          <p className="mt-3 text-[color:var(--primary)]">Checking your session and loading the experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="glass-panel overflow-hidden rounded-[2rem] p-8 sm:p-12">
            <div className="eyebrow mb-6">Black Signature Theme</div>
            <h1 className="section-title max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
              FAVO makes modern fashion feel sharper, cleaner, and more premium.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              Discover a darker luxury storefront, controlled contrast, and a shopping flow designed to feel composed from
              the first click to the final product view.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/login" className="primary-btn px-8 py-4 text-base font-semibold">
                Sign In
              </Link>
              <Link href="/auth/register" className="secondary-btn px-8 py-4 text-base font-semibold">
                Create Account
              </Link>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="card-panel rounded-[1.5rem] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Feature</p>
                  <h2 className="section-title mt-3 text-2xl font-semibold">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--primary)]">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="card-panel rounded-[2rem] p-8">
              <p className="eyebrow mb-4">Storefront Vision</p>
              <h2 className="section-title text-3xl font-semibold">Professional by default</h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
                The updated interface leans into black, graphite, soft ivory, and restrained gold accents to create a
                stronger luxury feel without losing clarity.
              </p>
            </div>

            <div className="subtle-grid card-panel rounded-[2rem] p-8">
              <div className="space-y-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">Palette</p>
                  <p className="mt-2 text-xl font-semibold text-[color:var(--primary-strong)]">Black, graphite, ivory, gold</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">Typography</p>
                  <p className="mt-2 text-xl font-semibold text-[color:var(--primary-strong)]">Classic display with crisp body copy</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">Mood</p>
                  <p className="mt-2 text-xl font-semibold text-[color:var(--primary-strong)]">Dark, composed, and intentionally premium</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
