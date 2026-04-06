"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrderDetailsPage({ params }) {
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);

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
            console.error(err);
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const res = await fetch(`http://localhost:5000/orders/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchOrder();
            } else {
                alert("Failed to update status");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl text-gray-600">Loading order details...</div>;

    if (error) return (
        <div className="max-w-4xl mx-auto p-8 text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
            <Link href="/my-orders" className="text-blue-600 underline">Back to My Orders</Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans">
            <div className="mb-6">
                <Link href="/my-orders" className="text-gray-500 hover:text-black transition">
                    &larr; Back to My Orders
                </Link>
            </div>

            <div className="bg-white shadow-xl shadow-gray-100/50 rounded-2xl p-8 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.id}</h1>
                        <p className="text-gray-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <span className="block text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</span>
                        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold tracking-wide
              ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'}`
                        }>
                            {order.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Delivery Information</h2>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-gray-600 mb-1"><span className="font-semibold text-gray-800">Method:</span> {order.delivery_method}</p>
                            <p className="text-gray-600"><span className="font-semibold text-gray-800">User ID:</span> {order.user_id || 'Guest'}</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Order Total</h2>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-center h-[88px]">
                            <span className="text-3xl font-bold text-gray-900">${Number(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Order Items</h2>
                <div className="mb-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-sm text-gray-500 border-b border-gray-100">
                                <th className="pb-3 font-semibold uppercase tracking-wider">Product</th>
                                <th className="pb-3 font-semibold uppercase tracking-wider text-center">Qty</th>
                                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Price</th>
                                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="border-b border-gray-50">
                                    <td className="py-4 font-medium text-gray-800">Product #{item.product_id}</td>
                                    <td className="py-4 text-center text-gray-600">{item.qty}</td>
                                    <td className="py-4 text-right text-gray-600">${Number(item.unit_price).toFixed(2)}</td>
                                    <td className="py-4 text-right font-medium text-gray-900">${(item.unit_price * item.qty).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Demo Admin Actions to change status */}
                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm uppercase tracking-wider font-bold text-gray-400 mb-3">Admin Actions (Demo)</h3>
                    <div className="flex flex-wrap gap-3">
                        {['PENDING_PAYMENT', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                            <button
                                key={s}
                                disabled={updating || order.status === s}
                                onClick={() => updateStatus(s)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${order.status === s
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-black text-white hover:bg-gray-800 shadow shadow-gray-300"
                                    }`}
                            >
                                Set {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
