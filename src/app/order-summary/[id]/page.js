"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function OrderSummaryPage({ params }) {
    // Simple unwrap for React 19+ params in Next.js app router
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
            console.error(err);
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xl text-gray-600">Loading order summary...</div>;

    if (error) return (
        <div className="max-w-3xl mx-auto p-8 text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 shadow">{error}</div>
            <Link href="/my-orders" className="text-blue-600 underline">View My Orders</Link>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-8 font-sans">
            <div className="bg-white shadow-xl shadow-gray-100/50 rounded-2xl p-8 border border-gray-100 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                <p className="text-gray-500 mb-8">Thank you for your purchase. Your order #{order.id} has been placed.</p>

                <div className="text-left bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
                    <h2 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2">Order Details</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-gray-600">
                        <div>
                            <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">Date</p>
                            <p className="font-medium text-gray-800">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">Status</p>
                            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold tracking-wide">
                                {order.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">Delivery Method</p>
                            <p className="font-medium text-gray-800">{order.delivery_method}</p>
                        </div>
                        <div>
                            <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">Total Amount</p>
                            <p className="font-bold text-gray-900">${Number(order.total_amount).toFixed(2)}</p>
                        </div>
                    </div>

                    <h3 className="font-bold text-lg text-gray-800 mb-4 tracking-wide">Items</h3>
                    <ul className="space-y-3">
                        {items.map(item => (
                            <li key={item.id} className="flex justify-between items-center text-gray-700 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span>Product #{item.product_id} <span className="text-gray-400 ml-2">x{item.qty}</span></span>
                                <span className="font-medium">${Number(item.unit_price * item.qty).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link href="/my-orders" className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-200 transition font-medium">
                        View All Orders
                    </Link>
                    <Link href="/cart" className="bg-black text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-800 transition font-medium">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
