"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyOrdersPage() {
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
            console.error(err);
            setError("Network network error.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl text-gray-600">Loading orders...</div>;

    return (
        <div className="max-w-5xl mx-auto p-8 font-sans">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                <Link href="/cart" className="bg-black text-white px-6 py-2 rounded-lg shadow-md hover:bg-gray-800 transition font-medium">
                    View Cart
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 shadow-sm border border-red-200">
                    {error}
                </div>
            )}

            {orders.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xl text-gray-500 mb-6">You have no past orders.</p>
                    <Link href="/cart" className="text-blue-600 font-medium hover:underline">Start Shopping</Link>
                </div>
            ) : (
                <div className="bg-white shadow-xl shadow-gray-100/50 rounded-2xl overflow-hidden border border-gray-100">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-5 font-semibold text-gray-600 uppercase tracking-wider text-sm">Order ID</th>
                                <th className="p-5 font-semibold text-gray-600 uppercase tracking-wider text-sm">Date</th>
                                <th className="p-5 font-semibold text-gray-600 uppercase tracking-wider text-sm">Status</th>
                                <th className="p-5 font-semibold text-gray-600 uppercase tracking-wider text-sm">Amount</th>
                                <th className="p-5 font-semibold text-gray-600 uppercase tracking-wider text-sm text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50/70 transition">
                                    <td className="p-5 text-gray-800 font-medium">#{order.id}</td>
                                    <td className="p-5 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td className="p-5">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide
                      ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'}`
                                        }>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-5 font-semibold text-gray-900">${Number(order.total_amount).toFixed(2)}</td>
                                    <td className="p-5 text-right">
                                        <Link
                                            href={`/my-orders/${order.id}`}
                                            className="inline-block px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
