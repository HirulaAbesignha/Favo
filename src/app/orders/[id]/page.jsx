"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

export default function OrderDetailsPage({ params }) {
    // Extract id from params (Next.js 15+ recommendation)
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`http://localhost:5000/orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data.order);
                setItems(data.items || []);
            } else {
                const data = await res.json();
                setError(data.error || "Order not found");
            }
        } catch (err) {
            setError("Network error fetching order details.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-xl text-gray-500 font-medium animate-pulse">Loading order details...</div>;

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-12 text-center">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                <p className="text-red-500 text-xl font-bold mb-6">{error}</p>
                <Link href="/orders" className="bg-black text-white px-8 py-3 rounded-full font-bold shadow hover:bg-gray-800 transition">Back to Orders</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <Link href="/orders" className="text-gray-500 hover:text-black font-bold mb-8 inline-block tracking-wide transition-colors">
                    &larr; Back to Order List
                </Link>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 md:p-10 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Order #{order.id}</h1>
                            <p className="text-gray-500 mt-2 font-medium">Placed on {new Date(order.created_at).toLocaleString()}</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <span className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Status</span>
                                <span className="font-bold text-indigo-600">{order.status}</span>
                            </div>
                            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <span className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Total Amount</span>
                                <span className="font-black text-xl text-gray-900">${Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="p-8 md:p-10">
                        <h2 className="text-xl font-bold mb-6 text-gray-800 uppercase tracking-wider text-sm">Packed Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Product</th>
                                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-center">Quantity</th>
                                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-right">Unit Price</th>
                                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {items.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="py-6">
                                                <span className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">Product #{item.product_id}</span>
                                            </td>
                                            <td className="py-6 text-center font-bold text-gray-600">x{item.qty}</td>
                                            <td className="py-6 text-right font-medium text-gray-500">${Number(item.unit_price).toFixed(2)}</td>
                                            <td className="py-6 text-right font-black text-gray-900 text-lg">${(item.unit_price * item.qty).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
