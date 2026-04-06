"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [deliveryMethod, setDeliveryMethod] = useState("DELIVERY");
    const router = useRouter();

    const CART_ID = 1;
    const USER_ID = 1;

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await fetch(`http://localhost:5000/cart/${CART_ID}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
                if (!data.items || data.items.length === 0) {
                    setError("Your cart is empty.");
                }
            } else {
                setError("Failed to load cart for checkout.");
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Make sure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (items.length === 0) {
            setError("Cannot place order with an empty cart");
            return;
        }

        setProcessing(true);
        setError("");

        try {
            const res = await fetch("http://localhost:5000/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: USER_ID,
                    cart_id: CART_ID,
                    delivery_method: deliveryMethod,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // Redirect to confirmation page
                router.push(`/order-summary/${data.orderId}`);
            } else {
                setError(data.error || "Order creation failed.");
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            setError("Network or server error during checkout.");
            setProcessing(false);
        }
    };

    const cartTotal = items.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);

    if (loading) return <div className="p-8 text-center text-xl text-gray-600">Loading checkout...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/cart" className="text-gray-500 hover:text-black transition">
                    &larr; Back to Cart
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white shadow-lg shadow-gray-100/50 p-8 rounded-2xl border border-gray-100">
                    <h2 className="text-xl font-semibold mb-6 border-b pb-4 text-gray-800">Order Summary</h2>
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center mb-4 text-gray-700">
                            <span>Product #{item.product_id} x {item.qty}</span>
                            <span className="font-medium">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="mt-6 pt-4 border-t flex justify-between items-center">
                        <span className="text-lg font-bold">Total Amount</span>
                        <span className="text-2xl font-bold text-black">${cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-white shadow-lg shadow-gray-100/50 p-8 rounded-2xl border border-gray-100">
                    <h2 className="text-xl font-semibold mb-6 border-b pb-4 text-gray-800">Delivery Details</h2>
                    <form onSubmit={handleCheckout}>
                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-2">Delivery Method</label>
                            <select
                                value={deliveryMethod}
                                onChange={(e) => setDeliveryMethod(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                                required
                            >
                                <option value="DELIVERY">Standard Delivery</option>
                                <option value="EXPRESS">Express Delivery</option>
                                <option value="PICKUP">In-store Pickup</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || items.length === 0}
                            className={`w-full py-4 rounded-lg shadow-md font-bold text-lg transition ${processing || items.length === 0
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-black text-white hover:bg-gray-800 hover:shadow-lg"
                                }`}
                        >
                            {processing ? "Processing Order..." : "Confirm & Place Order"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
