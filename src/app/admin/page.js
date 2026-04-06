'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { convertLkrToUsd, currencyMeta, formatLkrFromUsd } from '@/lib/currency';

const initialForm = {
  name: '',
  description: '',
  categoryId: '',
  price: '',
  imageUrl: '',
  sizes: [
    { size: 'S', quantity: '0' },
    { size: 'M', quantity: '0' },
    { size: 'L', quantity: '0' },
  ],
};

function createProductDrafts(items) {
  return items.reduce((acc, product) => {
    acc[product.id] = {
      name: product.name,
      description: product.description || '',
      categoryId: String(product.category_id),
      price: (Number(product.price || 0) * currencyMeta.rate).toFixed(2),
    };
    return acc;
  }, {});
}

function createCategoryDrafts(items) {
  return items.reduce((acc, category) => {
    acc[category.id] = category.name;
    return acc;
  }, {});
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stockSavingId, setStockSavingId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [productDrafts, setProductDrafts] = useState({});
  const [categoryDrafts, setCategoryDrafts] = useState({});
  const [savingProductId, setSavingProductId] = useState(null);
  const [savingCategoryId, setSavingCategoryId] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadAdminData = useCallback(async () => {
    const authRes = await fetch('/api/auth/me');
    const authData = await authRes.json();

    if (!authRes.ok) {
      router.push('/auth/login');
      return false;
    }

    if (authData.data.user.role !== 'admin') {
      router.push('/products');
      return false;
    }

    setUser(authData.data.user);

    const [categoriesRes, productsRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/admin/products'),
    ]);

    const categoriesData = await categoriesRes.json();
    const productsData = await productsRes.json();

    if (!productsRes.ok || !productsData.ok) {
      throw new Error(productsData.error || 'Failed to load admin products');
    }

    const nextCategories = categoriesData.ok ? categoriesData.data : [];
    const nextProducts = productsData.data;

    setCategories(nextCategories);
    setProducts(nextProducts);
    setCategoryDrafts(createCategoryDrafts(nextCategories));
    setProductDrafts(createProductDrafts(nextProducts));
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || String(nextCategories[0]?.id || ''),
    }));

    return true;
  }, [router]);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadAdminData();
      } catch (loadError) {
        console.error('Error loading admin panel:', loadError);
        setError(loadError.message || 'Unable to load the admin panel');
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [loadAdminData]);

  const totalUnits = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.total_stock || 0), 0),
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.total_stock || 0) > 0 && Number(product.total_stock || 0) <= 10).length,
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter((product) => Number(product.total_stock || 0) === 0).length,
    [products]
  );

  const firstLowStockProduct = useMemo(
    () =>
      products.find(
        (product) => Number(product.total_stock || 0) > 0 && Number(product.total_stock || 0) <= 10
      ) || null,
    [products]
  );

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const updateSizeEntry = (index, field, value) => {
    setForm((current) => ({
      ...current,
      sizes: current.sizes.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const addSizeRow = () => {
    setForm((current) => ({
      ...current,
      sizes: [...current.sizes, { size: '', quantity: '0' }],
    }));
  };

  const uploadImageFile = async (file) => {
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setError('');
    setMessage('');

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: uploadData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setUploadedImageUrl(data.data.imageUrl);
      setSelectedFileName(file.name);
      setForm((current) => ({ ...current, imageUrl: data.data.imageUrl }));
      setMessage('Image uploaded successfully.');
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      setError(uploadError.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    await uploadImageFile(file);
    event.target.value = '';
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    await uploadImageFile(file);
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          categoryId: Number(form.categoryId),
          price: convertLkrToUsd(form.price),
          sizes: form.sizes.map((size) => ({
            size: size.size,
            quantity: Number.parseInt(size.quantity, 10) || 0,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setMessage(`Created ${data.data.name} successfully.`);
      setForm({
        ...initialForm,
        categoryId: form.categoryId || String(categories[0]?.id || ''),
      });
      setUploadedImageUrl('');
      setSelectedFileName('');
      await loadAdminData();
    } catch (saveError) {
      console.error('Error creating product:', saveError);
      setError(saveError.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const handleProductFieldChange = (productId, field, value) => {
    setProductDrafts((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }));
  };

  const handleSaveProduct = async (productId) => {
    const draft = productDrafts[productId];

    if (!draft) {
      return;
    }

    setSavingProductId(productId);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
          categoryId: Number(draft.categoryId),
          price: convertLkrToUsd(draft.price),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setMessage(`Updated ${draft.name} successfully.`);
      await loadAdminData();
    } catch (saveError) {
      console.error('Error updating product:', saveError);
      setError(saveError.message || 'Failed to update product');
    } finally {
      setSavingProductId(null);
    }
  };

  const handleStockUpdate = async (stockId, quantity) => {
    setStockSavingId(stockId);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockId, quantity }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update stock');
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) => {
          const sizes = product.sizes.map((size) =>
            size.id === stockId ? { ...size, quantity } : size
          );

          return {
            ...product,
            sizes,
            total_stock: sizes.reduce((sum, size) => sum + Number(size.quantity || 0), 0),
          };
        })
      );

      setMessage('Stock updated successfully.');
    } catch (stockError) {
      console.error('Error updating stock:', stockError);
      setError(stockError.message || 'Failed to update stock');
    } finally {
      setStockSavingId(null);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    const confirmed = window.confirm(`Delete "${productName}" from the store? This will remove its stock and cart references too.`);

    if (!confirmed) {
      return;
    }

    setDeletingProductId(productId);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
      setMessage(`Deleted ${productName} successfully.`);
    } catch (deleteError) {
      console.error('Error deleting product:', deleteError);
      setError(deleteError.message || 'Failed to delete product');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleCategoryFieldChange = (categoryId, value) => {
    setCategoryDrafts((current) => ({
      ...current,
      [categoryId]: value,
    }));
  };

  const handleSaveCategory = async (categoryId) => {
    const name = categoryDrafts[categoryId]?.trim();

    if (!name) {
      setError('Category name cannot be empty.');
      return;
    }

    setSavingCategoryId(categoryId);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoryId, name }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update category');
      }

      setMessage(`Updated category to ${name}.`);
      await loadAdminData();
    } catch (saveError) {
      console.error('Error updating category:', saveError);
      setError(saveError.message || 'Failed to update category');
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();

    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      setError('Enter a category name first.');
      return;
    }

    setCreatingCategory(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      setNewCategoryName('');
      setMessage(`Created category ${categoryName}.`);
      await loadAdminData();
    } catch (createError) {
      console.error('Error creating category:', createError);
      setError(createError.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[2rem] px-10 py-8 text-center">
          <p className="eyebrow mb-4">Admin</p>
          <h1 className="section-title text-3xl font-semibold">Loading dashboard</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <nav className="sticky top-0 z-50 border-b border-[color:rgba(255,255,255,0.08)] bg-[color:rgba(6,6,6,0.84)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-[color:var(--accent)]">FAVO Admin</p>
              <h1 className="section-title text-2xl font-semibold">Control room</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/products" className="secondary-btn px-5 py-2.5 text-sm font-semibold">
                View store
              </Link>
              <span className="hidden rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-[color:var(--primary-strong)] sm:inline-flex">
                Admin: {user?.name}
              </span>
              <button onClick={handleLogout} className="secondary-btn px-5 py-2.5 text-sm font-semibold">
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <section className="admin-hero-glow glass-panel reveal-rise rounded-[2rem] p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <h2 className="section-title max-w-3xl text-4xl font-semibold sm:text-5xl">
                  Edit products, shape categories, and keep stock availability under full control.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  This upgraded admin panel is built for fast catalog work: update names and prices, move products between
                  categories, adjust stock by size, and keep the storefront presentation sharp.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card-panel panel-hover rounded-[1.5rem] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--accent)]">Products</p>
                  <p className="mt-2 text-3xl font-semibold text-[color:var(--primary-strong)]">{products.length}</p>
                </div>
                <div className="card-panel panel-hover rounded-[1.5rem] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--accent)]">Units in stock</p>
                  <p className="mt-2 text-3xl font-semibold text-[color:var(--primary-strong)]">{totalUnits}</p>
                </div>
                {firstLowStockProduct ? (
                  <a
                    href={`#admin-product-${firstLowStockProduct.id}`}
                    className="card-panel panel-hover rounded-[1.5rem] p-5"
                  >
                    <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--accent)]">Low stock</p>
                    <p className="mt-2 text-3xl font-semibold text-[color:var(--primary-strong)]">{lowStockProducts}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/50">
                      Jump to {firstLowStockProduct.name}
                    </p>
                  </a>
                ) : (
                  <div className="card-panel rounded-[1.5rem] p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--accent)]">Low stock</p>
                    <p className="mt-2 text-3xl font-semibold text-[color:var(--primary-strong)]">{lowStockProducts}</p>
                  </div>
                )}
                <div className="card-panel panel-hover rounded-[1.5rem] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--accent)]">Out of stock</p>
                  <p className="mt-2 text-3xl font-semibold text-[color:var(--primary-strong)]">{outOfStockProducts}</p>
                </div>
              </div>
            </div>

            {(message || error) && (
              <div
                className={`mt-6 rounded-[1.5rem] px-4 py-3 text-sm ${
                  error
                    ? 'border border-[color:rgba(255,143,143,0.25)] bg-[color:rgba(255,143,143,0.08)] text-[color:var(--danger)]'
                    : 'border border-[color:rgba(121,210,154,0.24)] bg-[color:rgba(121,210,154,0.08)] text-[color:var(--success)]'
                }`}
              >
                {error || message}
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="glass-panel reveal-rise-delay rounded-[2rem] p-8">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">Category studio</p>
                <h2 className="section-title mt-3 text-3xl font-semibold">Manage categories</h2>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Rename existing categories or create a new one for incoming products.
                </p>
              </div>

              <form onSubmit={handleCreateCategory} className="card-panel rounded-[1.5rem] p-5">
                <label className="field-label">Create category</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    className="field-input px-4 py-3.5"
                    placeholder="Evening Essentials"
                  />
                  <button
                    type="submit"
                    disabled={creatingCategory}
                    className="primary-btn px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {creatingCategory ? 'Creating...' : 'Add category'}
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="card-panel panel-hover rounded-[1.5rem] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        value={categoryDrafts[category.id] || ''}
                        onChange={(event) => handleCategoryFieldChange(category.id, event.target.value)}
                        className="field-input px-4 py-3"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCategory(category.id)}
                        disabled={savingCategoryId === category.id}
                        className="secondary-btn px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {savingCategoryId === category.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">
                      {category.product_count} active products
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="glass-panel reveal-rise-delay-2 rounded-[2rem] p-8">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent)]">New item</p>
                <h2 className="section-title mt-3 text-3xl font-semibold">Add a product</h2>
              </div>
              <div className="grid gap-5">
                <div>
                  <label className="field-label">Product name</label>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="field-input px-4 py-3.5"
                    placeholder="Tailored Noir Jacket"
                    required
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="field-label">Category</label>
                    <select
                      value={form.categoryId}
                      onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                      className="field-input px-4 py-3.5"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.product_count})
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/50">
                      {categories.length} categories available
                    </p>
                  </div>

                  <div>
                    <label className="field-label">Price ({currencyMeta.code})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                      className="field-input px-4 py-3.5"
                      placeholder="24500.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Product image</label>
                  <label
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.03] px-6 py-8 text-center transition hover:border-[color:var(--accent)]"
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                      {uploadingImage ? 'Uploading image...' : 'Drop image here or click to browse'}
                    </span>
                    <span className="mt-3 text-sm leading-7 text-white/70">
                      Choose a JPG, PNG, or WEBP image directly from your desktop.
                    </span>
                    {selectedFileName && (
                      <span className="mt-4 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-[color:var(--primary-strong)]">
                        {selectedFileName}
                      </span>
                    )}
                  </label>

                  {uploadedImageUrl && (
                    <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10">
                      <div className="relative h-56 bg-[linear-gradient(135deg,#121212,#242424)]">
                        <Image src={uploadedImageUrl} alt="Uploaded preview" fill className="object-cover" />
                      </div>
                    </div>
                  )}

                  <p className="mt-3 text-xs leading-6 text-white/60">
                    Uploaded image path: {form.imageUrl || 'No image selected yet'}
                  </p>
                </div>

                <div>
                  <label className="field-label">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="field-input min-h-28 px-4 py-3.5"
                    placeholder="Describe the fabric, fit, finish, and styling."
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="field-label">Sizes and stock</label>
                    <button
                      type="button"
                      onClick={addSizeRow}
                      className="text-sm font-semibold text-[color:var(--accent)] underline underline-offset-4"
                    >
                      Add size row
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.sizes.map((entry, index) => (
                      <div key={`${index}-${entry.size}`} className="grid gap-3 sm:grid-cols-[1fr_140px]">
                        <input
                          value={entry.size}
                          onChange={(event) => updateSizeEntry(index, 'size', event.target.value)}
                          className="field-input px-4 py-3.5"
                          placeholder="Size"
                        />
                        <input
                          type="number"
                          min="0"
                          value={entry.quantity}
                          onChange={(event) => updateSizeEntry(index, 'quantity', event.target.value)}
                          className="field-input px-4 py-3.5"
                          placeholder="Stock"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="primary-btn mt-2 w-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Creating product...' : 'Create product'}
                </button>

                <div className="admin-pulse-line mt-4 rounded-[1.4rem] px-5 py-4">
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="admin-pulse-dot" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--accent)]">Catalog flow</p>
                        <p className="mt-1 text-sm text-white/70">Ready for your next product drop</p>
                      </div>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-white/45">Live admin motion</span>
                  </div>
                </div>
              </div>
            </form>
          </section>

          <section className="mt-10">
            <div className="mb-5">
              <p className="eyebrow mb-3">Inventory</p>
              <h2 className="section-title text-3xl font-semibold">Edit live catalog items</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                Update the product name, price, category, and description directly from each card. Stock values save when you
                leave the field.
              </p>
            </div>

            <div className="space-y-5">
              {products.map((product, index) => {
                const draft = productDrafts[product.id] || {
                  name: product.name,
                  description: product.description || '',
                  categoryId: String(product.category_id),
                  price: (Number(product.price || 0) * currencyMeta.rate).toFixed(2),
                };

                return (
                  <article
                    key={product.id}
                    id={`admin-product-${product.id}`}
                    className="admin-product-target glass-panel panel-hover reveal-rise rounded-[2rem] p-6"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                  >
                    <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
                      <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[linear-gradient(135deg,#101010,#212121)]">
                        <div className="relative h-full min-h-56">
                          {product.images && product.images.length > 0 ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-center text-white/60">
                              No image
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <span className={`status-chip ${product.total_stock > 0 ? 'success' : 'warn'}`}>
                            {product.total_stock > 0 ? `${product.total_stock} available` : 'Out of stock'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/70">
                            Live price: {formatLkrFromUsd(product.price)}
                          </span>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <label className="field-label">Product name</label>
                            <input
                              value={draft.name}
                              onChange={(event) => handleProductFieldChange(product.id, 'name', event.target.value)}
                              className="field-input px-4 py-3.5"
                            />
                          </div>

                          <div>
                            <label className="field-label">Category</label>
                            <select
                              value={draft.categoryId}
                              onChange={(event) => handleProductFieldChange(product.id, 'categoryId', event.target.value)}
                              className="field-input px-4 py-3.5"
                            >
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name} ({category.product_count})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
                          <div>
                            <label className="field-label">Price ({currencyMeta.code})</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.price}
                              onChange={(event) => handleProductFieldChange(product.id, 'price', event.target.value)}
                              className="field-input px-4 py-3.5"
                            />
                          </div>

                          <div>
                            <label className="field-label">Description</label>
                            <textarea
                              value={draft.description}
                              onChange={(event) => handleProductFieldChange(product.id, 'description', event.target.value)}
                              className="field-input min-h-24 px-4 py-3.5"
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveProduct(product.id)}
                            disabled={savingProductId === product.id}
                            className="primary-btn px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {savingProductId === product.id ? 'Saving changes...' : 'Save product changes'}
                          </button>
                          <Link href={`/products/${product.id}`} className="secondary-btn px-5 py-3 text-sm font-semibold">
                            Preview product
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            disabled={deletingProductId === product.id}
                            className="rounded-full border border-[color:rgba(255,143,143,0.22)] bg-[color:rgba(255,143,143,0.08)] px-5 py-3 text-sm font-semibold text-[color:var(--danger)] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingProductId === product.id ? 'Deleting...' : 'Delete product'}
                          </button>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          {product.sizes.map((size) => (
                            <div key={size.id} className="card-panel rounded-[1.5rem] p-4">
                              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                                Size {size.size}
                              </p>
                              <label className="mt-3 block text-xs uppercase tracking-[0.16em] text-white/55">
                                Available units
                              </label>
                              <input
                                type="number"
                                min="0"
                                defaultValue={size.quantity}
                                onBlur={(event) => {
                                  const nextValue = Number.parseInt(event.target.value, 10) || 0;
                                  if (nextValue !== Number(size.quantity)) {
                                    handleStockUpdate(size.id, nextValue);
                                  }
                                }}
                                className="field-input mt-2 px-4 py-3"
                              />
                              {stockSavingId === size.id && (
                                <p className="mt-2 text-xs text-white/60">Saving stock...</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
