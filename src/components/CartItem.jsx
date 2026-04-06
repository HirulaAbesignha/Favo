'use client';

import { useState } from 'react';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleQuantityChange = async (newQty) => {
        if (newQty < 1) return;
        setIsUpdating(true);
        await onUpdateQuantity(item.product_id, newQty, item.variant_id);
        setIsUpdating(false);
    };

    return (
        <div className="flex items-center justify-between p-6 mb-4 bg-white/80 backdrop-blur-md border border-neutral-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="flex items-center gap-6">
                <div className="relative h-28 w-28 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img
                        src={item.image || `https://picsum.photos/seed/${item.product_id}/200/200`}
                        alt={item.name}
                        className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/5" />
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-light tracking-wide text-neutral-900">{item.name}</h3>
                    <p className="text-sm text-neutral-400 font-medium">{item.description}</p>
                    <p className="text-lg font-medium text-neutral-900 mt-2">${Number(item.price).toFixed(2)}</p>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex items-center bg-neutral-50 rounded-full border border-neutral-200/60 p-1">
                    <button
                        onClick={() => handleQuantityChange(item.qty - 1)}
                        disabled={isUpdating || item.qty <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-white transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        <svg width="14" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <span className="w-10 text-center font-medium text-neutral-900">
                        {isUpdating ? (
                            <span className="animate-pulse">...</span>
                        ) : item.qty}
                    </span>

                    <button
                        onClick={() => handleQuantityChange(item.qty + 1)}
                        disabled={isUpdating}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-white transition-all disabled:opacity-50"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className="w-24 text-right flex flex-col items-end gap-2">
                    <span className="text-xl font-medium text-neutral-900">
                        ${(item.price * item.qty).toFixed(2)}
                    </span>
                    <button
                        onClick={() => onRemove(item.product_id, item.variant_id)}
                        className="text-xs tracking-wider uppercase text-red-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-1"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}
