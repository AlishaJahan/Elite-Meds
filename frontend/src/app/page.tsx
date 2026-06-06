'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Medicine } from '@/types';
import InteractionChecker from '@/components/InteractionChecker';
import { Search, Star, Award, ShieldCheck, Truck, Stethoscope, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'prescription', name: 'Prescription Drugs' },
  { id: 'otc', name: 'Over the Counter (OTC)' },
  { id: 'wellness', name: 'Vitamins & Wellness' },
  { id: 'personal-care', name: 'Personal Care' },
];

export default function Home() {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        // Call backend API
        const url = `http://localhost:5000/api/medicines?category=${activeCategory}&search=${searchQuery}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Failed to fetch from backend');
        }
        const data = await res.json();
        setMedicines(data);
        setError('');
      } catch (err) {
        console.warn('Backend fetch failed, falling back to client-side filter', err);
        setError('Using offline mock fallback (backend server unavailable).');
        // Offline backup
        try {
          const fallbackRes = await fetch('/fallback-medicines.json');
          if (fallbackRes.ok) {
            let data: Medicine[] = await fallbackRes.json();
            if (activeCategory !== 'all') {
              data = data.filter(med => med.category === activeCategory);
            }
            if (searchQuery) {
              data = data.filter(med => 
                med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                med.brand.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            setMedicines(data);
          }
        } catch (fbErr) {
          console.error('Fallback read failed', fbErr);
        }
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchMedicines();
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeCategory]);

  return (
    <div className="space-y-16 pb-12">
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/10 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl animate-pulse-slow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900/30">
              🛡️ 100% Certified & Authenticated Pharmacy
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
              Your Health, <br />
              <span className="gradient-text">Our Priority, Delivered.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto lg:mx-0">
              Get genuine healthcare products, emergency medications, and premium vitamins delivered safely to your home. Consult verified pharmacists online.
            </p>

            {/* Premium Floating Search Input */}
            <div className="relative max-w-xl mx-auto lg:mx-0 glass rounded-2xl p-2 shadow-lg flex items-center border border-[var(--card-border)]">
              <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search medicines, brands, active ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 px-3 bg-transparent text-sm focus:outline-none placeholder-slate-400 text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-float">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-[var(--card-border)]">
              <Image
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
                alt="Doctor Consultation"
                fill
                priority
                className="object-cover"
                sizes="(max-w-768px) 320px, 400px"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Trust Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Truck, title: 'Super Fast Delivery', desc: 'Same day dispatch' },
          { icon: ShieldCheck, title: 'FDA Approved Drugs', desc: '100% verified source' },
          { icon: Award, title: 'Best Price Guarantee', desc: 'Genuine discounts' },
          { icon: Stethoscope, title: 'Professional Advice', desc: 'Online pharmacologists' }
        ].map((item, i) => (
          <div key={i} className="glass rounded-2xl p-4 sm:p-5 flex items-center space-x-3 border border-[var(--card-border)] shadow-xs">
            <div className="p-3 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 shrink-0">
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">{item.title}</h4>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Product Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Browse Medicine Shop</h2>
          <p className="text-sm text-[var(--text-secondary)]">Search and filter catalog medicines to quickly order them.</p>
        </div>

        {/* Category Chips Scrollable */}
        <div className="flex overflow-x-auto pb-3 gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold shrink-0 transition-all border duration-200 ${
                activeCategory === cat.id
                  ? 'bg-teal-700 border-teal-700 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 border-[var(--card-border)] text-[var(--text-secondary)] hover:border-teal-500 hover:text-teal-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Medicine Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="glass border border-[var(--card-border)] h-80 rounded-2xl animate-pulse flex flex-col justify-between p-4">
                <div className="w-full h-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-1/2" />
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-16 glass rounded-3xl border border-[var(--card-border)] max-w-xl mx-auto">
            <p className="font-semibold text-lg">No medicines matched your query</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Try checking spelling or changing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {medicines.map((med) => {
              const cartItem = cartItems.find((item) => item.medicine.id === med.id);
              return (
              <div 
                key={med.id} 
                className="interactive-card glass rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-xs flex flex-col justify-between h-[380px]"
              >
                
                {/* Image and Badges */}
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-900 border-b border-[var(--card-border)]">
                  <Image
                    src={med.image}
                    alt={med.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-w-768px) 100vw, 250px"
                  />
                  {med.prescriptionRequired && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm flex items-center space-x-1 animate-pulse-slow">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      <span>Rx</span>
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-teal-500/90 text-white shadow-sm">
                    {med.category.replace('-', ' ')}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wide uppercase">
                        {med.brand}
                      </span>
                      <div className="flex items-center space-x-0.5 text-amber-500 text-xs">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold text-[10px]">{med.rating}</span>
                      </div>
                    </div>
                    
                    <Link href={`/medicine/${med.id}`} className="block">
                      <h3 className="font-bold text-sm hover:text-teal-600 dark:hover:text-teal-400 transition-colors line-clamp-1">
                        {med.name}
                      </h3>
                    </Link>
                    
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {med.description}
                    </p>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)] mt-2">
                    <span className="text-lg font-black text-teal-800 dark:text-teal-400">
                      ₹{med.price}
                    </span>

                    {user?.role === 'admin' ? (
                      <button
                        disabled
                        className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs cursor-not-allowed border border-[var(--card-border)]"
                      >
                        Admin View Only
                      </button>
                    ) : cartItem ? (
                      <div className="flex items-center bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(med.id, cartItem.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-teal-800 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 font-black transition-colors text-sm"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-teal-950 dark:text-teal-200 min-w-5 text-center px-1">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(med.id, cartItem.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-teal-800 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 font-black transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                    ) : med.inStock ? (
                      <button
                        onClick={() => addToCart(med)}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-xs hover:scale-102 active:scale-98 transition-all duration-200"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500 border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

              </div>
            )})}
          </div>
        )}
      </section>

      {/* Interaction Checker Widget Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InteractionChecker />
      </section>

    </div>
  );
}
