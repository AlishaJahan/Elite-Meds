'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    cartTotal 
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const requiresPrescription = cartItems.some(item => item.medicine.prescriptionRequired);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer content */}
      <div 
        ref={drawerRef}
        className="relative w-full max-w-md h-full glass border-l border-[var(--card-border)] shadow-2xl flex flex-col justify-between z-10 animate-[slideIn_0.3s_ease-out]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="font-bold text-lg">Your Shopping Cart</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-lg">Your cart is empty</p>
                <p className="text-sm text-[var(--text-secondary)]">Add medicines to start shopping.</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-medium shadow-md transition-all duration-200"
              >
                Browse Shop
              </button>
            </div>
          ) : (
            <>
              {requiresPrescription && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start space-x-2 text-amber-800 dark:text-amber-300 text-xs leading-relaxed animate-pulse-slow">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold">Prescription Required!</span> One or more items in your cart need a valid prescription. You can upload it during checkout.
                  </div>
                </div>
              )}

              <div className="divide-y divide-[var(--card-border)]">
                {cartItems.map((item) => (
                  <div key={item.medicine.id} className="py-4 flex space-x-3 first:pt-0">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-[var(--card-border)]">
                      <Image 
                        src={item.medicine.image} 
                        alt={item.medicine.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm line-clamp-1 text-[var(--text-primary)]">
                            {item.medicine.name}
                          </h4>
                          <button 
                            onClick={() => removeFromCart(item.medicine.id)}
                            className="text-rose-500 hover:text-rose-600 p-0.5 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-medium -mt-0.5">
                          by {item.medicine.brand}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-[var(--card-border)] rounded-lg overflow-hidden h-7 bg-white dark:bg-slate-800">
                          <button 
                            onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                            className="px-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[var(--text-secondary)] h-full transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold select-none">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                            className="px-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[var(--text-secondary)] h-full transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-xs text-[var(--text-secondary)] block">
                            ₹{item.medicine.price} each
                          </span>
                          <span className="font-bold text-sm text-teal-700 dark:text-teal-400">
                            ₹{item.medicine.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Subtotal</span>
              <span className="text-xl font-extrabold text-teal-800 dark:text-teal-300">
                ₹{cartTotal}
              </span>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => setIsCartOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <Link 
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-center text-sm font-semibold shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CartDrawer;
