'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatLkrFromUsd } from '@/lib/currency';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (!authRes.ok) {
          router.push('/auth/login');
          return;
        }

        setUser(authData.data.user);

        const [productRes, cartRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch('/api/cart'),
        ]);
        const productData = await productRes.json();
        const cartData = await cartRes.json();

        if (productData.ok) {
          setProduct(productData.data);
        }

        if (cartData.ok) {
          setCartCount(cartData.data.summary.totalQuantity);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const isSizeAvailable = (size) => {
    const stockItem = product.sizes.find((s) => s.size === size);
    return stockItem && stockItem.quantity > 0;
  };

  const selectedVariant = product?.sizes.find((s) => s.size === selectedSize);

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      return;
    }

    setAddingToCart(true);
    setCartMessage('');

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant.id,
          qty: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setCartMessage(data.error || 'Unable to add this product to cart.');
        return;
      }

      setCartMessage(data.message || 'Added to cart');
      setCartCount((count) => count + 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartMessage('Unable to add this product to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] px-10 py-8 text-center">
          <p className="eyebrow mx-auto mb-4">Product View</p>
          <h1 className="section-title text-3xl font-semibold">Loading product details</h1>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] px-10 py-8 text-center">
          <h1 className="section-title text-3xl font-semibold">Product not found</h1>
          <Link href="/products" className="mt-4 inline-flex text-sm font-semibold text-[color:var(--primary-strong)] underline underline-offset-4">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <nav className="product-topbar sticky top-0 z-50 border-b">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-10">
            <Link href="/products" className="product-topbar-link text-sm font-semibold underline underline-offset-4">
              Back to products
            </Link>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <Link href="/cart" className="product-topbar-pill secondary-btn px-5 py-2.5 text-sm font-semibold">
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
              {user?.role === 'admin' && (
                <Link href="/admin" className="product-topbar-pill secondary-btn px-5 py-2.5 text-sm font-semibold">
                  Admin
                </Link>
              )}
              <span className="product-topbar-user hidden rounded-full px-4 py-2 text-sm sm:inline-flex">
                Hi, {user?.name}
              </span>
              <button onClick={handleLogout} className="product-topbar-pill secondary-btn px-5 py-2.5 text-sm font-semibold">
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="card-panel overflow-hidden rounded-[2rem] p-5 sm:p-6">
              <div className="relative h-[420px] overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,#111111,#252525)]">
                {product.images && product.images.length > 0 ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/60">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-[color:rgba(255,250,245,0.7)]" />
                      <span>No image available</span>
                    </div>
                  </div>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {product.images.map((img, index) => (
                    <div key={index} className="relative h-24 overflow-hidden rounded-2xl border border-[color:rgba(184,146,115,0.35)]">
                      <Image src={img} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-panel rounded-[2rem] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">{product.category_name}</p>
              <h1 className="section-title mt-3 text-4xl font-semibold">{product.name}</h1>
              <p className="mt-4 text-sm leading-7 text-[color:var(--primary)]">{product.description}</p>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--accent)]">Price</p>
                  <p className="mt-1 text-4xl font-semibold text-[color:var(--primary-strong)]">
                    {formatLkrFromUsd(product.price)}
                  </p>
                </div>
                <span className="status-chip success">Ready to ship</span>
              </div>

              <div className="mt-8">
                <h2 className="section-title text-2xl font-semibold">Choose your size</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.sizes.map((sizeOption) => {
                    const size = sizeOption.size;
                    const stockItem = product.sizes.find((s) => s.size === size);
                    const available = isSizeAvailable(size);

                    return (
                      <button
                        key={size}
                        onClick={() => available && setSelectedSize(size)}
                        disabled={!available}
                        className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
                          selectedSize === size
                            ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_10px_24px_rgba(0,0,0,0.24)]'
                            : available
                            ? 'border-white/12 bg-white/4'
                            : 'border-white/8 bg-white/[0.02] text-white/35'
                        }`}
                      >
                        <div className="font-semibold text-[color:var(--primary-strong)]">{size}</div>
                        <div className="mt-1 text-xs text-[color:var(--primary)]">
                          {stockItem ? (stockItem.quantity > 0 ? `${stockItem.quantity} left` : 'Out of stock') : 'Unavailable'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || addingToCart}
                className="primary-btn mt-8 w-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {addingToCart ? 'Adding to cart...' : selectedSize ? `Add to Cart - Size ${selectedSize}` : 'Select a Size'}
              </button>

              {cartMessage && (
                <p className="mt-4 text-sm font-semibold text-[color:var(--primary-strong)]">{cartMessage}</p>
              )}

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Product details</p>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--primary-strong)]">
                  <p>Category: {product.category_name}</p>
                  <p>Selected size: {selectedSize || 'Not selected yet'}</p>
                  <p>Available stock: {selectedVariant ? selectedVariant.quantity : 'Choose a size to view stock'}</p>
                </div>
              </div>
            </section>
          </div>

          {product.related_products && product.related_products.length > 0 && (
            <section className="mt-10">
              <div className="mb-5">
                <p className="eyebrow mb-3">Related Picks</p>
                <h2 className="section-title text-3xl font-semibold">You may also like</h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {product.related_products.map((relatedProduct) => (
                  <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`} className="group">
                    <article className="card-panel rounded-[1.5rem] p-5 transition group-hover:-translate-y-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">Related item</p>
                      <h3 className="section-title mt-3 text-2xl font-semibold">{relatedProduct.name}</h3>
                      <p className="mt-4 text-lg font-semibold text-[color:var(--primary-strong)]">
                        {formatLkrFromUsd(relatedProduct.price)}
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
