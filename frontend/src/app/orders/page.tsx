'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Order, Consultation } from '@/types';
import { Calendar, Clock, ShoppingBag, Stethoscope, ChevronRight, CheckCircle2, Package, Lock } from 'lucide-react';

export default function HistoryPage() {
  const { user, token, setIsAuthModalOpen } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'consultations'>('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Handle setting active tab from query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'consultations' || tab === 'orders') {
        setActiveTab(tab as any);
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [ordersRes, consultationsRes] = await Promise.all([
          fetch('http://localhost:5000/api/orders', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('http://localhost:5000/api/consultations', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        } else {
          console.warn('Orders fetch failed');
        }

        if (consultationsRes.ok) {
          const consultationsData = await consultationsRes.json();
          setConsultations(consultationsData);
        } else {
          console.warn('Consultations fetch failed');
        }

      } catch (err) {
        console.error('Fetch error on history page:', err);
        setError('Could not connect to the backend server. Make sure it is active.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fadeIn">
        <div className="max-w-md mx-auto glass border border-[var(--card-border)] p-8 rounded-3xl space-y-5 bg-white/50 dark:bg-slate-900/50 shadow-lg">
          <Lock className="w-12 h-12 text-teal-600 dark:text-teal-400 mx-auto" />
          <h2 className="text-xl font-bold">Please Sign In to View History</h2>
          <p className="text-sm text-[var(--text-secondary)]">To view your medical consultation bookings and order history, please log in or register.</p>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-block w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Portal History</h1>
        <p className="text-sm text-[var(--text-secondary)]">Track your medicine packages and medical consultation schedules.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/20 rounded-xl overflow-hidden p-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-teal-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('consultations')}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'consultations'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-teal-600'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor Consultations ({consultations.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-secondary)] font-medium">Fetching your logs...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center glass rounded-2xl border border-[var(--card-border)] max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold">Connection Error</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            orders.length === 0 ? (
              <div className="text-center py-16 glass rounded-3xl border border-[var(--card-border)] max-w-md mx-auto space-y-4">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="font-bold text-base">No Orders Placed Yet</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Explore our store to purchase medicines.</p>
                </div>
                <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-xs">
                  Go Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="glass rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-xs hover:border-teal-500/30 transition-all bg-white dark:bg-slate-900">
                    
                    {/* Order Header */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-b border-[var(--card-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                      <div>
                        <span className="font-semibold text-[var(--text-secondary)]">Order </span>
                        <span className="font-bold text-[var(--text-primary)]">#{order.id}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-[var(--text-secondary)]">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900/40">
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="p-4 space-y-4">
                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[var(--text-primary)]">{item.medicine.name} <span className="font-normal text-[var(--text-secondary)]">× {item.quantity}</span></span>
                            <span className="font-extrabold">₹{item.medicine.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary info */}
                      <div className="border-t border-[var(--card-border)] pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="block font-semibold text-[var(--text-secondary)]">Shipping to:</span>
                          <span className="block font-medium text-[var(--text-primary)]">{order.shippingAddress.fullName} — {order.shippingAddress.addressLine}, {order.shippingAddress.city}</span>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[var(--text-secondary)] block">Payment status</span>
                          <span className="font-extrabold text-sm text-teal-700 dark:text-teal-400">₹{order.total} ({order.paymentMethod})</span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )
          )}

          {/* CONSULTATIONS TAB */}
          {activeTab === 'consultations' && (
            consultations.length === 0 ? (
              <div className="text-center py-16 glass rounded-3xl border border-[var(--card-border)] max-w-md mx-auto space-y-4">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="font-bold text-base">No Scheduled consultations</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Need custom advice? Consult Alisha Jahan today.</p>
                </div>
                <Link href="/consult" className="inline-block px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-xs">
                  Book A Session
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consult) => (
                  <div key={consult.id} className="glass rounded-2xl border border-[var(--card-border)] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal-500/30 transition-all bg-white dark:bg-slate-900">
                    
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--card-border)]">
                        <Image src={consult.doctor.image} alt={consult.doctor.name} fill className="object-cover" sizes="48px" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <h4 className="font-extrabold text-sm">{consult.doctor.name}</h4>
                        <p className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">{consult.doctor.specialty}</p>
                        
                        <div className="flex space-x-4 pt-1 font-semibold text-[var(--text-secondary)]">
                          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {consult.date}</span>
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {consult.timeSlot}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{consult.status}</span>
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}
