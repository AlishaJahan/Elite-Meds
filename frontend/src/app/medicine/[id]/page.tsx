'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Medicine } from '@/types';
import { ArrowLeft, Star, Heart, AlertCircle, ShoppingCart, Plus, Minus } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MedicineDetails({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'sides' | 'safety'>('overview');
  const cartItem = cartItems?.find(item => item.medicine.id === id);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/medicines/${id}`);
        if (!res.ok) {
          throw new Error('Not found on server');
        }
        const data = await res.json();
        setMedicine(data);
      } catch (err) {
        console.warn('Server fetch error, using local fallback', err);
        // Fallback
        try {
          const fallbackRes = await fetch('/fallback-medicines.json');
          if (fallbackRes.ok) {
            const data: Medicine[] = await fallbackRes.json();
            const found = data.find(m => m.id === id);
            if (found) {
              setMedicine(found);
            } else {
              setError('Medicine not found.');
            }
          }
        } catch (fbErr) {
          setError('Could not retrieve product.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
          <span className="text-sm text-[var(--text-secondary)] font-medium">Loading details...</span>
        </div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto glass border border-[var(--card-border)] p-8 rounded-3xl space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Product Not Found</h2>
          <p className="text-sm text-[var(--text-secondary)]">We couldn&apos;t find the medication you were looking for.</p>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center space-x-2 text-sm text-[var(--text-secondary)] hover:text-teal-600 dark:hover:text-teal-400 font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      {/* Main product card layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Product Image Card */}
        <div className="md:col-span-5 glass rounded-3xl overflow-hidden border border-[var(--card-border)] p-4 shadow-lg">
          <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-[var(--card-border)]">
            <Image
              src={medicine.image}
              alt={medicine.name}
              fill
              className="object-cover"
              sizes="(max-w-768px) 100vw, 400px"
              priority
            />
          </div>
        </div>

        {/* Right Side: Product Details & Actions */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900/30 uppercase tracking-wide">
                {medicine.category.replace('-', ' ')}
              </span>
              {medicine.prescriptionRequired && (
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 uppercase tracking-wide flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Prescription Required</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              {medicine.name}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              Manufactured by <span className="text-teal-700 dark:text-teal-400 font-bold">{medicine.brand}</span>
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(medicine.rating) ? 'fill-current' : 'text-slate-300'}`} 
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)]">({medicine.rating})</span>
              <span className="text-xs text-[var(--text-secondary)]">| {medicine.reviewsCount} verified reviews</span>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {medicine.description}
          </p>

          <div className="h-px bg-[var(--card-border)]" />

          {/* Pricing and cart action */}
          <div className="space-y-4">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-teal-800 dark:text-teal-400">
                ₹{medicine.price * quantity}
              </span>
              {quantity > 1 && (
                <span className="text-xs text-[var(--text-secondary)]">
                  (₹{medicine.price} each)
                </span>
              )}
            </div>

            {medicine.inStock ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                
                {/* Quantity input */}
                <div className="flex items-center border border-[var(--card-border)] rounded-xl overflow-hidden h-12 bg-white dark:bg-slate-800 w-32 justify-between shrink-0">
                  <button 
                    onClick={handleDecrement}
                    className="px-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[var(--text-secondary)] h-full transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 font-bold select-none text-sm">
                    {quantity}
                  </span>
                  <button 
                    onClick={handleIncrement}
                    className="px-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[var(--text-secondary)] h-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart button */}
                {user?.role === 'admin' ? (
                  <button
                    disabled
                    className="flex-1 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm cursor-not-allowed border border-[var(--card-border)] flex items-center justify-center space-x-2"
                  >
                    <span>Admin View Only</span>
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => addToCart(medicine, quantity)}
                      className="flex-1 h-12 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-md hover:scale-[1.01] active:scale-98 flex items-center justify-center space-x-2 transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add {quantity} to Cart</span>
                    </button>
                    {cartItem && (
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-3 py-2 border border-teal-200/60 dark:border-teal-900/30 rounded-xl whitespace-nowrap text-center">
                        In Cart: <strong className="font-extrabold">{cartItem.quantity}</strong>
                      </span>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 font-bold text-sm text-center">
                This item is currently Out of Stock
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tabs description section */}
      <div className="glass rounded-3xl border border-[var(--card-border)] overflow-hidden shadow-md">
        
        {/* Tabs selector */}
        <div className="flex border-b border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/20 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', name: 'Product Overview' },
            { id: 'usage', name: 'Usage & Dosage' },
            { id: 'sides', name: 'Side Effects' },
            { id: 'safety', name: 'Safety Instructions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-teal-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/20'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab content area */}
        <div className="p-6 sm:p-8 min-h-[160px] leading-relaxed text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base">Description</h3>
              <p className="text-[var(--text-secondary)]">{medicine.description}</p>
              <div className="grid grid-cols-2 gap-4 pt-2 max-w-md">
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-secondary)]">Brand</span>
                  <span className="font-bold">{medicine.brand}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-secondary)]">Rating</span>
                  <span className="font-bold text-amber-500">{medicine.rating} / 5.0</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-base">Usage Directions</h3>
              <p className="text-[var(--text-secondary)]">{medicine.dosage}</p>
              <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 rounded-xl text-xs text-teal-800 dark:text-teal-300">
                <span className="font-bold">Usage Tip:</span> Please adhere strictly to the daily doses and timing instructions to maintain therapeutic levels in your body.
              </div>
            </div>
          )}

          {activeTab === 'sides' && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-base">Common Side Effects</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-2">Although rare, some patients may experience one or more of the following:</p>
              <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                {medicine.sideEffects.map((side, i) => (
                  <li key={i}>{side}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-base">Safety Advice & Contraindications</h3>
              <p className="text-[var(--text-secondary)]">{medicine.safetyAdvice}</p>
              {medicine.prescriptionRequired && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                  <span className="font-bold">Caution:</span> As this is a prescription drug, check with your physician immediately if you experience breathing difficulties or sudden muscle pains.
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
