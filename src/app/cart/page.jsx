"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });

    const [addQtys, setAddQtys] = useState({});

    const cartId = 1;
    const userId = 1;

    const products = [
        { id: 1, name: "Classic Beige Trench Coat", price: 250.00, desc: "Timeless outerwear crafted from premium cotton.", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60" },
        { id: 2, name: "Silk Evening Gown", price: 300.00, desc: "Elegant floor-length silk dress perfect for special occasions.", image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500&auto=format&fit=crop&q=60" },
        { id: 3, name: "Vintage Wash Denim", price: 150.00, desc: "Relaxed fit jeans with a comfortable, worn-in feel.", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60" },
        { id: 4, name: "Leather Tote Bag", price: 180.00, desc: "Spacious luxury handbag made from genuine Italian leather.", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop&q=60" },
    ];

    useEffect(() => {
        fetchCart(); window.dispatchEvent(new Event("cart_updated"));
    }, []);

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const fetchCart = async () => {
        try {
            const res = await fetch(`http://localhost:5000/cart/${cartId}`);
            if (res.ok) {
                const data = await res.json();
                setCartItems(data.items || []);
            } else {
                setCartItems([]);
            }
        } catch (err) {
            showMessage("Error loading cart.", "error");
        } finally {
            setLoading(false);
        }
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
                fetchCart(); window.dispatchEvent(new Event("cart_updated"));
            } else {
                const data = await res.json();
                showMessage(`Error: ${data.error}`, "error");
            }
        } catch (err) {
            showMessage("Network error while adding to cart", "error");
        }
    };

    const handleUpdateItem = async (item, delta) => {
        const newQty = item.qty + delta;
        if (newQty <= 0) {
            return handleRemove(item.id);
        }

        try {
            const res = await fetch(`http://localhost:5000/cart/update/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qty: newQty })
            });
            if (res.ok) {
                fetchCart();
                window.dispatchEvent(new Event("cart_updated"));
            } else {
                const data = await res.json();
                showMessage(`Error: ${data.error}`, "error");
            }
        } catch (err) {
            showMessage("Network error while updating cart", "error");
        }
    };

    const handleRemove = async (itemId) => {
        try {
            const res = await fetch(`http://localhost:5000/cart/delete/${itemId}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("Item removed", "success");
                fetchCart(); window.dispatchEvent(new Event("cart_updated"));
            } else {
                const data = await res.json();
                showMessage(`Error: ${data.error}`, "error");
            }
        } catch (err) {
            showMessage("Network error while removing item", "error");
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) return showMessage("Cart is empty", "error");
        try {
            const res = await fetch("http://localhost:5000/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, cart_id: cartId, delivery_method: "DELIVERY" })
            });
            if (res.ok) {
                const data = await res.json();
                showMessage(`Order placed successfully! ID: ${data.orderId}`);
                fetchCart(); window.dispatchEvent(new Event("cart_updated"));
            } else {
                const data = await res.json();
                showMessage(`Error: ${data.error}`, "error");
            }
        } catch (err) {
            showMessage("Network error during checkout", "error");
        }
    };

    const cartTotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
            {/* Toast Notification */}
            {message.text && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg font-medium tracking-wide flex items-center gap-2 transition-all duration-300 transform translate-y-0 opacity-100 ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
                    {message.text}
                </div>
            )}

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">FAVO <span className="font-light text-gray-400">Store</span></h1>
                    <div className="flex items-center gap-6">
                        <Link href="/orders" className="text-indigo-600 hover:text-indigo-800 font-bold tracking-wide transition-colors">
                            Manage Orders
                        </Link>
                        <div className="flex items-center gap-2 border border-gray-100 bg-gray-50 rounded-lg px-4 py-2 shadow-sm">
                            <span className="text-sm font-medium text-gray-500">Cart Total:</span>
                            <span className="text-lg font-bold">${cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Products Grid */}
                    <div className="lg:col-span-8">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Featured Products</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col group">
                                    <div className="h-48 bg-gray-100 w-full relative overflow-hidden">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight">{product.name}</h3>
                                            <span className="font-semibold text-lg text-indigo-600">${product.price.toFixed(2)}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6 flex-grow">{product.desc}</p>

                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                            <div className="flex bg-gray-100 rounded-lg p-1 items-center border border-gray-200/50">
                                                <button
                                                    onClick={() => setAddQtys({ ...addQtys, [product.id]: Math.max(1, (addQtys[product.id] !== undefined ? Number(addQtys[product.id]) : 1) - 1) })}
                                                    className="w-8 h-8 flex items-center justify-center rounded bg-white shadow-sm text-gray-600 hover:text-black hover:bg-gray-50 transition"
                                                >-</button>
                                                <input
                                                    type="text"
                                                    value={addQtys[product.id] !== undefined ? addQtys[product.id] : 1}
                                                    onChange={(e) => setAddQtys({ ...addQtys, [product.id]: e.target.value })}
                                                    className="w-10 text-center font-medium text-sm bg-transparent outline-none"
                                                />
                                                <button
                                                    onClick={() => setAddQtys({ ...addQtys, [product.id]: (addQtys[product.id] !== undefined ? Number(addQtys[product.id]) : 1) + 1 })}
                                                    className="w-8 h-8 flex items-center justify-center rounded bg-white shadow-sm text-gray-600 hover:text-black hover:bg-gray-50 transition"
                                                >+</button>
                                            </div>
                                            <button
                                                onClick={() => handleAdd(product)}
                                                className="flex-grow bg-black text-white hover:bg-gray-800 tracking-wide font-medium text-sm py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 flex flex-col max-h-[calc(100vh-140px)]">
                            <h2 className="text-xl font-bold mb-6 text-gray-900 flex justify-between items-center">
                                <span>My Cart</span>
                                <span className="bg-indigo-100 text-indigo-700 text-xs py-1 px-3 rounded-full font-bold">{cartItems.length} items</span>
                            </h2>

                            {loading ? (
                                <div className="flex flex-col gap-4 animate-pulse">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
                                    ))}
                                </div>
                            ) : cartItems.length === 0 ? (
                                <div className="py-12 px-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 my-auto">
                                    <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">Your cart is empty.</p>
                                    <p className="text-sm text-gray-400 mt-1">Add items to get started.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4 scrollbar-thin">
                                        {cartItems.map((item) => {
                                            const product = products.find(p => p.id === item.product_id);
                                            return (
                                                <div key={item.id} className="group flex flex-col bg-gray-50 p-4 rounded-xl border border-gray-100/80 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all duration-200">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="pr-4">
                                                            <h4 className="text-sm font-bold text-gray-900 leading-tight">{product?.name || `Product #${item.product_id}`}</h4>
                                                            <p className="text-xs text-gray-500 font-medium mt-1">${Number(item.price).toFixed(2)} each</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemove(item.id)}
                                                            className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                                            title="Remove item"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>

                                                    <div className="flex justify-between items-center mt-auto">
                                                        <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm p-0.5">
                                                            <button onClick={() => handleUpdateItem(item, -1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 rounded transition-colors">-</button>
                                                            <span className="text-xs font-bold w-8 text-center">{item.qty}</span>
                                                            <button onClick={() => handleUpdateItem(item, 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 rounded transition-colors">+</button>
                                                        </div>
                                                        <span className="font-bold text-gray-900">${(item.price * item.qty).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="mt-4 pt-6 border-t border-gray-100 bg-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-gray-500 font-medium">Subtotal</span>
                                            <span className="text-2xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={handleCheckout}
                                            className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-300"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Checkout
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
