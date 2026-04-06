"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch("http://localhost:5000/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else {
                setError("Failed to fetch orders.");
            }
        } catch (err) {
            setError("Network error connecting to backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <h1 className="text-3xl font-black tracking-tight">Order Management</h1>
                    <Link href="/cart" className="text-indigo-600 hover:text-indigo-800 font-bold tracking-wide transition">
                        &larr; Back to Cart
                    </Link>
                </div>

                {error && <div className="bg-red-500 text-white font-bold p-4 rounded-xl mb-6 shadow-md">{error}</div>}

                {loading ? (
                    <div className="text-center text-gray-500 text-lg py-12 animate-pulse">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <p className="text-gray-600 text-xl font-bold">No orders found</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-lg transition-all duration-300 group">
                                <div>
                                    <h2 className="text-2xl font-black mb-1 text-gray-900 group-hover:text-indigo-600 transition-colors">Order #{order.id}</h2>
                                    <p className="text-gray-500 text-sm font-medium">Placed on: {new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-6 md:gap-10 w-full md:w-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status</span>
                                        <span className="font-bold text-indigo-700 bg-indigo-50 px-4 py-1.5 rounded-full text-sm border border-indigo-100">{order.status}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total</span>
                                        <span className="font-black text-2xl text-gray-900">${Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                    <Link
                                        href={`/orders/${order.id}`}
                                        className="ml-auto md:ml-4 bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 hover:shadow-gray-500/30 hover:-translate-y-0.5 transition-all w-full md:w-auto text-center"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
