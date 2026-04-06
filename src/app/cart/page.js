'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatLkrFromUsd } from '@/lib/currency';

export default function CartPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState(null);

  const loadCart = useCallback(async () => {
    const [authRes, cartRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/cart'),
    ]);

    const authData = await authRes.json();
    if (!authRes.ok) {
      router.push('/auth/login');
      return;
    }

    const cartData = await cartRes.json();
    setUser(authData.data.user);

    if (cartData.ok) {
      setCart(cartData.data);
    }
  }, [router]);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadCart();
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [loadCart]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const updateQty = async (itemId, nextQty) => {
    setBusyItemId(itemId);
    try {
      await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: nextQty }),
      });
      await loadCart();
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId) => {
    setBusyItemId(itemId);
    try {
      await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      await loadCart();
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] px-10 py-8 text-center">
          <p className="eyebrow mx-auto mb-4">Cart</p>
          <h1 className="section-title text-3xl font-semibold">Loading your cart</h1>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const summary = cart?.summary || { itemCount: 0, totalQuantity: 0, subtotal: 0 };

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <nav className="sticky top-0 z-50 border-b border-[color:rgba(184,146,115,0.28)] bg-[color:rgba(255,250,245,0.84)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
            <Link href="/products" className="text-sm font-semibold text-[color:var(--primary-strong)] underline underline-offset-4">
              Continue shopping
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-[color:rgba(255,250,245,0.75)] px-4 py-2 text-sm text-[color:var(--primary-strong)] sm:inline-flex">
                Hi, {user?.name}
              </span>
              <button onClick={handleLogout} className="secondary-btn px-5 py-2.5 text-sm font-semibold">
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <div className="mb-8">
            <p className="eyebrow mb-4">Your Cart</p>
            <h1 className="section-title text-4xl font-semibold">Review your selected items</h1>
            <p className="mt-4 text-sm leading-7 text-[color:var(--primary)]">
              Product details, selected size, quantity controls, and live totals are all shown here.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="glass-panel rounded-[2rem] px-8 py-14 text-center">
              <h2 className="section-title text-3xl font-semibold">Your cart is empty</h2>
              <p className="mt-3 text-[color:var(--primary)]">Add a product from the catalog to see it here.</p>
              <Link href="/products" className="primary-btn mt-6 inline-flex px-6 py-3 text-sm font-semibold">
                Browse products
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
              <section className="space-y-5">
                {items.map((item) => (
                  <article key={item.id} className="glass-panel rounded-[2rem] p-5 sm:p-6">
                    <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                      <div className="relative h-52 overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,#f4e6d8,#e2c8b0)]">
                        {item.product.image ? (
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[color:var(--primary)]">No image</div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h2 className="section-title text-3xl font-semibold">{item.product.name}</h2>
                            <p className="mt-2 text-sm leading-7 text-[color:var(--primary)]">{item.product.description}</p>
                          </div>
                          <p className="text-2xl font-semibold text-[color:var(--primary-strong)]">
                            {formatLkrFromUsd(item.product.price)}
                          </p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="card-panel rounded-[1.25rem] p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">Size</p>
                            <p className="mt-2 font-semibold text-[color:var(--primary-strong)]">{item.variant?.size || 'Default'}</p>
                          </div>
                          <div className="card-panel rounded-[1.25rem] p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">In stock</p>
                            <p className="mt-2 font-semibold text-[color:var(--primary-strong)]">{item.variant?.stock_qty ?? 'N/A'}</p>
                          </div>
                          <div className="card-panel rounded-[1.25rem] p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">Subtotal</p>
                            <p className="mt-2 font-semibold text-[color:var(--primary-strong)]">{formatLkrFromUsd(item.subtotal)}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            disabled={busyItemId === item.id}
                            className="secondary-btn h-11 w-11 text-lg font-semibold"
                          >
                            -
                          </button>
                          <span className="min-w-12 text-center text-lg font-semibold text-[color:var(--primary-strong)]">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            disabled={busyItemId === item.id || (item.variant && item.qty >= item.variant.stock_qty)}
                            className="secondary-btn h-11 w-11 text-lg font-semibold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={busyItemId === item.id}
                            className="ml-auto text-sm font-semibold text-[color:#9e594b] underline underline-offset-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <aside className="glass-panel h-fit rounded-[2rem] p-6">
                <h2 className="section-title text-3xl font-semibold">Order summary</h2>
                <div className="mt-6 space-y-4 text-sm text-[color:var(--primary)]">
                  <div className="flex items-center justify-between">
                    <span>Distinct items</span>
                    <span className="font-semibold text-[color:var(--primary-strong)]">{summary.itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total quantity</span>
                    <span className="font-semibold text-[color:var(--primary-strong)]">{summary.totalQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[color:rgba(184,146,115,0.28)] pt-4">
                    <span className="text-base">Subtotal</span>
                    <span className="text-2xl font-semibold text-[color:var(--primary-strong)]">{formatLkrFromUsd(summary.subtotal || 0)}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-[color:rgba(184,146,115,0.28)] bg-[color:rgba(255,250,245,0.72)] p-4 text-sm leading-7 text-[color:var(--primary)]">
                  Each cart item keeps the product image, name, description, chosen size, available stock, quantity, and subtotal visible.
                </div>

                <button className="primary-btn mt-6 w-full px-6 py-4 text-base font-semibold" disabled>
                  Checkout coming next
                </button>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
