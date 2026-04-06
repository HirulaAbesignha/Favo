"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const router = useRouter();

    const cartId = 1;

    const fetchCart = async () => {
        try {
            const res = await fetch(`http://localhost:5000/cart/${cartId}`);
            if (res.ok) {
                const data = await res.json();
                setCartItems(data.items || []);
            } else {
                setCartItems([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCart();

        // Custom event to stay synced with other components
        const handleCartUpdate = () => fetchCart();
        window.addEventListener('cart_updated', handleCartUpdate);
        return () => window.removeEventListener('cart_updated', handleCartUpdate);
    }, []);

    const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-6 right-6 z-[90] flex items-center justify-center p-3.5 bg-black text-white hover:bg-gray-800 transition-all shadow-lg rounded-full hover:shadow-xl hover:-translate-y-0.5 border border-gray-700"
            >
                <div className="relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    {totalItems > 0 && (
                        <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                            {totalItems}
                        </span>
                    )}
                </div>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Cart</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-colors bg-white rounded-full shadow-sm border border-gray-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {cartItems.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <p className="font-medium text-gray-600">Your cart is empty.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-5">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">Product #{item.product_id}</h3>
                                        <p className="text-xs text-gray-500 font-medium">Qty: {item.qty} &times; ${Number(item.price).toFixed(2)}</p>
                                    </div>
                                    <div className="font-bold text-gray-900 text-right">
                                        ${(Number(item.price) * item.qty).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-medium text-gray-500 uppercase tracking-wide text-sm">Subtotal</span>
                        <span className="text-2xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            router.push("/cart");
                        }}
                        className="w-full bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-800 transition py-4 rounded-xl font-bold tracking-wide shadow-lg shadow-gray-200"
                    >
                        Review & Checkout
                    </button>
                </div>
            </div>
        </>
    );
}
