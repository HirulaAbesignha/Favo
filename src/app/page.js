"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [message, setMessage] = useState({ text: "", type: "" });
  const [addQtys, setAddQtys] = useState({});

  const userId = 1;

  const products = [
    { id: 1, name: "Classic Beige Trench Coat", price: 250.00, desc: "Timeless outerwear crafted from premium cotton.", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60" },
    { id: 2, name: "Silk Evening Gown", price: 300.00, desc: "Elegant floor-length silk dress perfect for special occasions.", image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500&auto=format&fit=crop&q=60" },
    { id: 3, name: "Vintage Wash Denim", price: 150.00, desc: "Relaxed fit jeans with a comfortable, worn-in feel.", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60" },
    { id: 4, name: "Leather Tote Bag", price: 180.00, desc: "Spacious luxury handbag made from genuine Italian leather.", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop&q=60" },
  ];

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleAdd = async (product) => {
    const rawQty = addQtys[product.id] !== undefined ? addQtys[product.id] : 1;
    const qty = Number(rawQty);
    if (!qty || isNaN(qty) || qty <= 0) return showMessage("Quantity must be a valid number greater than 0", "error");

    try {
      const res = await fetch("http://localhost:5000/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, product_id: product.id, qty, price: product.price })
      });

      if (res.ok) {
        showMessage(`${product.name} added to cart`);
        window.dispatchEvent(new Event("cart_updated"));
      } else {
        const data = await res.json();
        showMessage(`Error: ${data.error}`, "error");
      }
    } catch (err) {
      showMessage("Network error while adding to cart", "error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 font-sans pb-24">
      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-lg font-medium tracking-wide flex items-center gap-2 transition-all duration-300 transform translate-y-0 opacity-100 ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">FAVO <span className="font-light text-gray-400">Store</span></h1>
          <div className="flex items-center gap-8">
            <Link href="/cart" className="text-gray-600 hover:text-black font-medium tracking-wide transition-colors">
              My Cart
            </Link>
            <Link href="/orders" className="text-indigo-600 hover:text-indigo-800 font-bold tracking-wide transition-colors">
              Manage Orders
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="w-full bg-black text-white py-20 px-6 mt-10 max-w-7xl mx-auto rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80"
            alt="Storefront"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl font-black mb-4 tracking-tight">The New Luxury standard.</h2>
          <p className="text-lg text-gray-300 mb-8 font-light">Discover our latest collection of premium fashion pieces, designed for elegance and crafted with perfection.</p>
        </div>
      </div>

      {/* Main Products Setup */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black mb-10 text-gray-900 border-b border-gray-200 pb-4">Our Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
              <div className="h-64 bg-gray-100 w-full relative overflow-hidden group">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-6 flex-grow leading-relaxed">{product.desc}</p>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-black text-2xl text-gray-900">${product.price.toFixed(2)}</span>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                  <div className="flex bg-gray-50 rounded-xl p-1 items-center border border-gray-200/60 justify-between">
                    <button
                      onClick={() => setAddQtys({ ...addQtys, [product.id]: Math.max(1, (addQtys[product.id] !== undefined ? Number(addQtys[product.id]) : 1) - 1) })}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                    </button>
                    <input
                      type="text"
                      value={addQtys[product.id] !== undefined ? addQtys[product.id] : 1}
                      onChange={(e) => setAddQtys({ ...addQtys, [product.id]: e.target.value })}
                      className="w-12 text-center font-bold text-base bg-transparent outline-none"
                    />
                    <button
                      onClick={() => setAddQtys({ ...addQtys, [product.id]: (addQtys[product.id] !== undefined ? Number(addQtys[product.id]) : 1) + 1 })}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handleAdd(product)}
                    className="w-full bg-black text-white hover:bg-gray-800 tracking-wide font-bold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-black/20 hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
