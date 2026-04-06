'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatLkrFromUsd } from '@/lib/currency';

export default function ProductsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (!authRes.ok) {
          router.push('/auth/login');
          return;
        }

        setUser(authData.data.user);

        const [categoriesRes, cartRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/cart'),
        ]);
        const categoriesData = await categoriesRes.json();
        if (categoriesData.ok) {
          setCategories(categoriesData.data);
        }

        const cartData = await cartRes.json();
        if (cartData.ok) {
          setCartCount(cartData.data.summary.totalQuantity);
        }

        const url = selectedCategory ? `/api/products?categoryId=${selectedCategory}` : '/api/products';
        const productsRes = await fetch(url);
        const productsData = await productsRes.json();
        if (productsData.ok) {
          setProducts(productsData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedCategory, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] px-10 py-8 text-center">
          <p className="eyebrow mx-auto mb-4">Catalog</p>
          <h1 className="section-title text-3xl font-semibold">Loading products</h1>
          <p className="mt-3 text-[color:var(--primary)]">Preparing categories, stock, and product cards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <nav className="sticky top-0 z-50 border-b border-white/8 bg-[color:rgba(8,8,8,0.92)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">FAVO Store</p>
              <h1 className="section-title text-2xl font-semibold">Collection overview</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/cart" className="secondary-btn px-5 py-2.5 text-sm font-semibold">
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
              {user?.role === 'admin' && (
                <Link href="/admin" className="secondary-btn px-5 py-2.5 text-sm font-semibold">
                  Admin
                </Link>
              )}
              <span className="hidden rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-[color:var(--primary-strong)] sm:inline-flex">
                Hi, {user?.name}
              </span>
              <button onClick={handleLogout} className="secondary-btn px-5 py-2.5 text-sm font-semibold">
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <section className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow mb-4">Professional Storefront</p>
                <h2 className="section-title text-4xl font-semibold">Browse the full collection</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                  Filter by category, scan stock instantly, and move through a darker, more editorial product experience.
                </p>
              </div>
              <div className="card-panel rounded-[1.5rem] px-5 py-4">
                <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--accent)]">Items available</p>
                <p className="mt-1 text-3xl font-semibold text-[color:var(--primary-strong)]">{products.length}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  selectedCategory === null
                    ? 'bg-[color:var(--primary-strong)] text-black shadow-[0_10px_24px_rgba(0,0,0,0.32)]'
                    : 'bg-white/4 text-[color:var(--primary-strong)] border border-white/10'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    selectedCategory === category.id
                      ? 'bg-[color:var(--primary-strong)] text-black shadow-[0_10px_24px_rgba(0,0,0,0.32)]'
                      : 'bg-white/4 text-[color:var(--primary-strong)] border border-white/10'
                  }`}
                >
                  {category.name} ({category.product_count})
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-6 flex flex-col gap-2">
              <h3 className="section-title text-3xl font-semibold">
                {selectedCategory === null ? 'All Products' : categories.find((c) => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-sm text-[color:var(--primary)]">{products.length} pieces currently visible</p>
            </div>

            {products.length === 0 ? (
              <div className="glass-panel rounded-[2rem] px-8 py-14 text-center">
                <p className="section-title text-2xl font-semibold">No products found</p>
                <p className="mt-3 text-[color:var(--primary)]">Try a different category to explore the collection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="group">
                    <article className="card-panel overflow-hidden rounded-[1.75rem] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_44px_rgba(0,0,0,0.32)]">
                      <div className="relative h-72 overflow-hidden bg-[linear-gradient(135deg,#111111,#252525)]">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={400}
                            height={500}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-center text-white/60">
                            <div>
                              <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-[color:rgba(255,250,245,0.6)]" />
                              <span className="text-sm font-medium">No Image Available</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                              {product.category_name || 'Collection'}
                            </p>
                            <h4 className="section-title mt-2 text-2xl font-semibold">{product.name}</h4>
                          </div>
                          <span className={`status-chip ${product.total_stock > 0 ? 'success' : 'warn'}`}>
                            {product.total_stock > 0 ? `${product.total_stock} in stock` : 'Out of stock'}
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-[color:var(--primary)]">{product.description}</p>

                        <div className="mt-6 flex items-center justify-between border-t border-[color:rgba(184,146,115,0.3)] pt-5">
                          <span className="text-2xl font-semibold text-[color:var(--primary-strong)]">
                            {formatLkrFromUsd(product.price)}
                          </span>
                          <span className="text-sm font-semibold text-[color:var(--primary)]">View details</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
