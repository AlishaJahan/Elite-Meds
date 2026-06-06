'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { 
  Lock, Pill, ShoppingBag, Calendar, Trash2, Plus, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronRight,
  TrendingUp, Activity, Users, Info, Edit
} from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string;
  prescriptionRequired: boolean;
  inStock: boolean;
  description: string;
  dosage: string;
  sideEffects: string[];
  safetyAdvice: string;
  rating?: number;
  reviewsCount?: number;
}

interface Order {
  id: string;
  user_email: string;
  items: Array<{
    medicine: Medicine;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    addressLine: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
  prescriptionUploaded: string | null;
  total: number;
  status: string;
  createdAt: string;
}

interface Consultation {
  id: string;
  user_email: string;
  fullName: string;
  email: string;
  date: string;
  timeSlot: string;
  symptoms: string;
  doctor: {
    name: string;
    specialty: string;
    image: string;
  };
  status: string;
  createdAt: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
  bio: string;
  rating: string;
  patients: string;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'medicines' | 'orders' | 'consultations' | 'doctors'>('medicines');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add Medicine Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    brand: '',
    category: 'prescription', // prescription, otc, wellness, personal-care
    price: '',
    image: '',
    prescriptionRequired: false,
    inStock: true,
    description: '',
    dosage: '',
    sideEffects: '',
    safetyAdvice: ''
  });

  // Doctor Form / Modal State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: '',
    image: '',
    bio: '',
    rating: '4.9',
    patients: '100+'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Price Modal State
  const [editingPriceMed, setEditingPriceMed] = useState<Medicine | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<string>('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Custom Delete Confirm Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'medicine' | 'doctor';
    id: string;
    name: string;
  } | null>(null);

  // Helper to fetch just doctors
  const fetchDoctorsData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch admin stats and data
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Medicines
      const medRes = await fetch('http://localhost:5000/api/medicines');
      if (!medRes.ok) throw new Error('Failed to fetch medicines');
      const medData = await medRes.json();
      setMedicines(medData);

      // 2. Fetch Orders
      const orderRes = await fetch('http://localhost:5000/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!orderRes.ok) throw new Error('Failed to fetch orders');
      const orderData = await orderRes.json();
      setOrders(orderData);

      // 3. Fetch Consultations
      const consultRes = await fetch('http://localhost:5000/api/admin/consultations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!consultRes.ok) throw new Error('Failed to fetch consultations');
      const consultData = await consultRes.json();
      setConsultations(consultData);

      // 4. Fetch Doctors
      const docRes = await fetch('http://localhost:5000/api/doctors');
      if (!docRes.ok) throw new Error('Failed to fetch doctors');
      const docData = await docRes.json();
      setDoctors(docData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred fetching dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin' && token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  // Handle Add Medicine Submit
  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newMed,
          price: Number(newMed.price),
          sideEffects: newMed.sideEffects.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add medicine');
      }

      setMedicines(prev => [data, ...prev]);
      setIsAddModalOpen(false);
      // Reset form
      setNewMed({
        name: '',
        brand: '',
        category: 'prescription',
        price: '',
        image: '',
        prescriptionRequired: false,
        inStock: true,
        description: '',
        dosage: '',
        sideEffects: '',
        safetyAdvice: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Medicine (Triggers custom confirm modal)
  const handleDeleteMedicine = (med: Medicine) => {
    setDeleteConfirmTarget({
      type: 'medicine',
      id: med.id,
      name: med.name
    });
  };

  // Actual Delete Medicine execution
  const executeDeleteMedicine = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/medicines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete medicine');
      }

      setMedicines(prev => prev.filter(med => med.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting medicine');
    }
  };

  // Handle Update Price
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPriceMed) return;
    setIsUpdatingPrice(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/medicines/${editingPriceMed.id}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ price: Number(newPriceValue) })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update price');
      }

      setMedicines(prev => prev.map(m => m.id === editingPriceMed.id ? { ...m, price: Number(newPriceValue) } : m));
      setEditingPriceMed(null);
      setNewPriceValue('');
    } catch (err: any) {
      setError(err.message || 'Failed to update price');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Handle Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    }
  };

  // Handle Update Consultation Status
  const handleUpdateConsultationStatus = async (consultId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/consultations/${consultId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update consultation status');
      
      setConsultations(prev => prev.map(c => c.id === consultId ? { ...c, status: newStatus } : c));
    } catch (err: any) {
      alert(err.message || 'Error updating consultation status');
    }
  };

  // Handle Add Doctor
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDoctor)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add doctor');
      
      await fetchDoctorsData();
      setIsDoctorModalOpen(false);
      setNewDoctor({
        name: '',
        specialty: '',
        image: '',
        bio: '',
        rating: '4.9',
        patients: '100+'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Doctor
  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingDoctor) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingDoctor)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update doctor');
      
      await fetchDoctorsData();
      setEditingDoctor(null);
      setIsDoctorModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Doctor (Triggers custom confirm modal)
  const handleDeleteDoctor = (doc: Doctor) => {
    setDeleteConfirmTarget({
      type: 'doctor',
      id: doc.id,
      name: doc.name
    });
  };

  // Actual Delete Doctor execution
  const executeDeleteDoctor = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/doctors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete doctor');
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete doctor');
    }
  };

  // Access check
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fadeIn">
        <div className="max-w-md mx-auto glass border border-[var(--card-border)] p-8 rounded-3xl space-y-5 bg-white/50 dark:bg-slate-900/50 shadow-lg">
          <Lock className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
          <p className="text-sm text-[var(--text-secondary)]">Admin permissions are required to view this panel. Please log in with an administrator account.</p>
          <Link 
            href="/"
            className="inline-block w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-[var(--card-border)] gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-teal-700 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Admin Management Console
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Hello, {user.name}. Manage medicines list, orders, and consultations bookings.</p>
        </div>
        
        <button 
          onClick={fetchData}
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-[var(--card-border)] rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-3xl p-6 border border-[var(--card-border)] shadow-md flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Total Medicines</span>
            <p className="text-3xl font-black">{medicines.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="glass rounded-3xl p-6 border border-[var(--card-border)] shadow-md flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Total Orders</span>
            <p className="text-3xl font-black">{orders.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="glass rounded-3xl p-6 border border-[var(--card-border)] shadow-md flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Doctor Sessions</span>
            <p className="text-3xl font-black">{consultations.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="glass rounded-3xl p-6 border border-[var(--card-border)] shadow-md flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Total Doctors</span>
            <p className="text-3xl font-black">{doctors.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Admin Panel Tabs Selection */}
      <div className="flex border-b border-[var(--card-border)] mb-8 space-x-6 text-sm font-bold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('medicines')}
          className={`pb-3 flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'medicines' 
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400 font-extrabold' 
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Manage Medicines</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders' 
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400 font-extrabold' 
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Customer Orders ({orders.filter(o => o.status === 'Processing').length} pending)</span>
        </button>
        <button
          onClick={() => setActiveTab('consultations')}
          className={`pb-3 flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'consultations' 
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400 font-extrabold' 
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultation Bookings</span>
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'doctors' 
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400 font-extrabold' 
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manage Doctors</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--text-secondary)]">Fetching dashboard logs...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MEDICINES */}
          {activeTab === 'medicines' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Medicines Catalog ({medicines.length})</h3>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-1.5 px-4 h-10 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Medicine</span>
                </button>
              </div>

              {/* Medicines Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicines.map((med) => (
                  <div key={med.id} className="glass rounded-3xl p-5 border border-[var(--card-border)] bg-white/45 dark:bg-slate-900/45 hover:shadow-lg transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="relative w-16 h-16 rounded-2xl border border-[var(--card-border)] overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          <Image 
                            src={med.image || '/medicines/paracetamol.png'} 
                            alt={med.name} 
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="px-2 py-0.5 rounded text-[8px] bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] font-bold uppercase">
                            {med.category}
                          </span>
                          {med.prescriptionRequired ? (
                            <span className="px-2 py-0.5 rounded text-[8px] bg-rose-500/10 text-rose-500 font-bold uppercase border border-rose-500/20">
                              Rx Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[8px] bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold uppercase border border-teal-500/20">
                              Over-the-Counter
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            med.inStock 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {med.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h4 className="font-extrabold text-sm text-[var(--text-primary)] line-clamp-1">{med.name}</h4>
                        <p className="text-[10px] text-[var(--text-secondary)] font-semibold">{med.brand}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-1.5">{med.description}</p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-sm text-teal-700 dark:text-teal-400">₹{med.price}</span>
                        <button
                          onClick={() => {
                            setEditingPriceMed(med);
                            setNewPriceValue(String(med.price));
                          }}
                          className="p-1 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:scale-105 transition-all cursor-pointer"
                          title="Edit Price"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteMedicine(med)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:scale-105 transition-all cursor-pointer"
                        title="Delete Medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Placed Orders logs ({orders.length})</h3>

              {orders.length === 0 ? (
                <div className="p-12 text-center glass rounded-3xl border border-[var(--card-border)]">
                  <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">No customer orders found in the database.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="glass rounded-3xl border border-[var(--card-border)] p-6 bg-white/45 dark:bg-slate-900/45 shadow-sm space-y-4">
                      
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--card-border)] gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-[var(--text-primary)]">{order.id}</span>
                            <span className="text-[10px] text-[var(--text-secondary)]">| {new Date(order.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">Buyer: <span className="font-semibold text-[var(--text-primary)]">{order.user_email}</span></p>
                        </div>

                        {/* Status Updater */}
                        <div className="flex items-center space-x-2">
                          <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Status:</label>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="h-8 px-2 rounded-lg border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Items and Address Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                        
                        {/* Items Column */}
                        <div className="md:col-span-7 space-y-2">
                          <span className="font-bold text-[var(--text-secondary)] block uppercase tracking-wider text-[10px]">Ordered Items</span>
                          <div className="divide-y divide-[var(--card-border)] max-h-48 overflow-y-auto pr-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="py-2 flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-[var(--text-primary)]">{item.medicine?.name || 'Unknown Medicine'}</p>
                                  <p className="text-[10px] text-[var(--text-secondary)]">Qty: {item.quantity} × ₹{item.medicine?.price || 0}</p>
                                </div>
                                <span className="font-bold">₹{(item.medicine?.price || 0) * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Address Column */}
                        <div className="md:col-span-5 space-y-2 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)]">
                          <span className="font-bold text-[var(--text-secondary)] block uppercase tracking-wider text-[10px]">Delivery Info</span>
                          <div className="space-y-1">
                            <p className="font-bold">{order.shippingAddress.fullName}</p>
                            <p className="text-[11px] leading-tight text-[var(--text-secondary)]">{order.shippingAddress.addressLine}, {order.shippingAddress.city} - {order.shippingAddress.postalCode}</p>
                            <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">Phone: {order.shippingAddress.phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer Totals */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-[var(--card-border)] gap-3 text-xs">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <span className="text-[var(--text-secondary)]">Payment:</span>
                            <span className="font-bold text-[var(--text-primary)]">{order.paymentMethod}</span>
                          </div>
                          
                          {/* Prescription File View Link */}
                          {order.prescriptionUploaded ? (
                            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Prescription: {order.prescriptionUploaded}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-[var(--text-secondary)] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-[var(--card-border)]">
                              <Info className="w-3.5 h-3.5 text-slate-400" />
                              <span>No prescription uploaded</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-[var(--text-secondary)] font-semibold">Total:</span>
                          <span className="font-black text-teal-700 dark:text-teal-400">₹{order.total}</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONSULTATIONS */}
          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">Doctor Booking Slots ({consultations.length})</h3>

              {consultations.length === 0 ? (
                <div className="p-12 text-center glass rounded-3xl border border-[var(--card-border)]">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">No doctor appointments scheduled yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map((consult) => (
                    <div key={consult.id} className="glass rounded-3xl border border-[var(--card-border)] p-6 bg-white/45 dark:bg-slate-900/45 shadow-sm space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--card-border)] gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-[var(--text-primary)]">{consult.id}</span>
                            <span className="text-[10px] text-[var(--text-secondary)]">| Booked: {new Date(consult.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">Account: <span className="font-semibold text-[var(--text-primary)]">{consult.user_email}</span></p>
                        </div>

                        {/* Status Updater */}
                        <div className="flex items-center space-x-2">
                          <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Status:</label>
                          <select
                            value={consult.status}
                            onChange={(e) => handleUpdateConsultationStatus(consult.id, e.target.value)}
                            className="h-8 px-2 rounded-lg border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                        
                        {/* Doctor & Timing Info */}
                        <div className="md:col-span-6 flex items-start space-x-4">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-teal-500/20 shrink-0">
                            <img 
                              src={consult.doctor.image} 
                              alt={consult.doctor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm text-[var(--text-primary)]">{consult.doctor.name}</h4>
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">{consult.doctor.specialty}</p>
                            
                            <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-secondary)] pt-1">
                              <span className="font-bold text-[var(--text-primary)]">{consult.date}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">{consult.timeSlot}</span>
                            </div>
                          </div>
                        </div>

                        {/* Patient & Symptoms Info */}
                        <div className="md:col-span-6 space-y-2 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)]">
                          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-1.5 mb-1.5">
                            <span className="font-bold text-[10px] uppercase text-[var(--text-secondary)]">Patient Details</span>
                            <span className="font-bold text-teal-700 dark:text-teal-400">{consult.fullName}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] text-[var(--text-secondary)]"><span className="font-bold text-[var(--text-primary)]">Contact:</span> {consult.email}</p>
                            <p className="text-[11px] text-[var(--text-secondary)]"><span className="font-bold text-[var(--text-primary)]">Symptoms:</span> {consult.symptoms || 'No symptoms reported'}</p>
                          </div>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCTORS */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Manage Doctors ({doctors.length})</h3>
                <button
                  onClick={() => {
                    setEditingDoctor(null);
                    setNewDoctor({
                      name: '',
                      specialty: '',
                      image: '',
                      bio: '',
                      rating: '4.9',
                      patients: '100+'
                    });
                    setIsDoctorModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-4 h-10 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Doctor</span>
                </button>
              </div>

              {doctors.length === 0 ? (
                <div className="p-12 text-center glass rounded-3xl border border-[var(--card-border)]">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">No consultant doctors found in the database.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map((doc) => (
                    <div key={doc.id} className="glass rounded-3xl p-5 border border-[var(--card-border)] bg-white/45 dark:bg-slate-900/45 hover:shadow-lg transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="relative w-16 h-16 rounded-full border border-[var(--card-border)] overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                            <img 
                              src={doc.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'} 
                              alt={doc.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="px-2 py-0.5 rounded text-[8px] bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold uppercase border border-teal-500/20">
                              ⭐ {doc.rating}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase border border-indigo-500/20">
                              {doc.patients} Patients
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1">
                          <h4 className="font-extrabold text-sm text-[var(--text-primary)]">{doc.name}</h4>
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">{doc.specialty}</p>
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-3 mt-1.5 leading-relaxed">{doc.bio}</p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[var(--card-border)] flex items-center justify-end space-x-3">
                        <button
                          onClick={() => {
                            setEditingDoctor(doc);
                            setIsDoctorModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:scale-105 transition-all cursor-pointer flex items-center space-x-1"
                          title="Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:scale-105 transition-all cursor-pointer flex items-center space-x-1"
                          title="Delete Doctor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ADD MEDICINE FORM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-2xl glass rounded-3xl border border-[var(--card-border)] bg-white/95 dark:bg-slate-900/95 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="text-xl font-black flex items-center space-x-2 text-teal-800 dark:text-teal-400">
                <Plus className="w-5 h-5 text-teal-500" />
                <span>Add Product to Catalog</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    placeholder="e.g. Zolpidem 10mg"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={newMed.brand}
                    onChange={(e) => setNewMed({ ...newMed, brand: e.target.value })}
                    placeholder="e.g. Sanofi"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Category *</label>
                  <select
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="prescription">Prescription Required</option>
                    <option value="otc">Over-the-Counter (OTC)</option>
                    <option value="wellness">Wellness & Supplement</option>
                    <option value="personal-care">Personal Care</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={newMed.price}
                    onChange={(e) => setNewMed({ ...newMed, price: e.target.value })}
                    placeholder="350"
                    min="1"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Image URL</label>
                  <input
                    type="text"
                    value={newMed.image}
                    onChange={(e) => setNewMed({ ...newMed, image: e.target.value })}
                    placeholder="/medicines/zolpidem.png"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex items-center space-x-2 h-14 pl-2">
                  <input
                    type="checkbox"
                    id="add-rx-req"
                    checked={newMed.prescriptionRequired}
                    onChange={(e) => setNewMed({ ...newMed, prescriptionRequired: e.target.checked })}
                    className="h-4 w-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="add-rx-req" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">Requires Prescription</label>
                </div>
                <div className="flex items-center space-x-2 h-14 pl-2">
                  <input
                    type="checkbox"
                    id="add-in-stock"
                    checked={newMed.inStock}
                    onChange={(e) => setNewMed({ ...newMed, inStock: e.target.checked })}
                    className="h-4 w-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="add-in-stock" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">In Stock</label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Description</label>
                <textarea
                  value={newMed.description}
                  onChange={(e) => setNewMed({ ...newMed, description: e.target.value })}
                  placeholder="Describe the drug usage, benefits, and components..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Standard Dosage</label>
                  <input
                    type="text"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    placeholder="e.g. 1 tablet at bedtime"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Side Effects (comma separated)</label>
                  <input
                    type="text"
                    value={newMed.sideEffects}
                    onChange={(e) => setNewMed({ ...newMed, sideEffects: e.target.value })}
                    placeholder="Drowsiness, Dizziness, Headache"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Safety Advice</label>
                <textarea
                  value={newMed.safetyAdvice}
                  onChange={(e) => setNewMed({ ...newMed, safetyAdvice: e.target.value })}
                  placeholder="Safety warnings (e.g. Do not drive or consume alcohol)..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-12 border border-[var(--card-border)] text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Insert Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRICE FORM MODAL */}
      {editingPriceMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md glass rounded-3xl border border-[var(--card-border)] bg-white/95 dark:bg-slate-900/95 shadow-2xl p-6 space-y-5">
            
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="text-lg font-black flex items-center space-x-2 text-teal-800 dark:text-teal-400">
                <Edit className="w-5 h-5 text-teal-500" />
                <span>Adjust Price</span>
              </h3>
              <button
                onClick={() => setEditingPriceMed(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Medicine: <span className="font-bold text-[var(--text-primary)]">{editingPriceMed.name}</span></p>
                <p className="text-[10px] text-[var(--text-secondary)]">Current Price: ₹{editingPriceMed.price}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">New Price (INR) *</label>
                <input
                  type="number"
                  required
                  value={newPriceValue}
                  onChange={(e) => setNewPriceValue(e.target.value)}
                  placeholder="e.g. 290"
                  min="1"
                  className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setEditingPriceMed(null)}
                  className="flex-1 h-10 border border-[var(--card-border)] text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPrice}
                  className="flex-1 h-10 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isUpdatingPrice ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Price</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT DOCTOR FORM MODAL */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg glass rounded-3xl border border-[var(--card-border)] bg-white/95 dark:bg-slate-900/95 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="text-xl font-black flex items-center space-x-2 text-teal-800 dark:text-teal-400">
                {editingDoctor ? (
                  <>
                    <Edit className="w-5 h-5 text-teal-500" />
                    <span>Edit Doctor Profile</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-teal-500" />
                    <span>Add Consultant Doctor</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsDoctorModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                if (editingDoctor) {
                  handleUpdateDoctor(e);
                } else {
                  handleAddDoctor(e);
                }
              }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={editingDoctor ? editingDoctor.name : newDoctor.name}
                  onChange={(e) => {
                    if (editingDoctor) {
                      setEditingDoctor({ ...editingDoctor, name: e.target.value });
                    } else {
                      setNewDoctor({ ...newDoctor, name: e.target.value });
                    }
                  }}
                  placeholder="e.g. Dr. John Doe"
                  className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Specialty *</label>
                <input
                  type="text"
                  required
                  value={editingDoctor ? editingDoctor.specialty : newDoctor.specialty}
                  onChange={(e) => {
                    if (editingDoctor) {
                      setEditingDoctor({ ...editingDoctor, specialty: e.target.value });
                    } else {
                      setNewDoctor({ ...newDoctor, specialty: e.target.value });
                    }
                  }}
                  placeholder="e.g. General Physician & Pharmacologist"
                  className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Image URL *</label>
                <input
                  type="text"
                  required
                  value={editingDoctor ? editingDoctor.image : newDoctor.image}
                  onChange={(e) => {
                    if (editingDoctor) {
                      setEditingDoctor({ ...editingDoctor, image: e.target.value });
                    } else {
                      setNewDoctor({ ...newDoctor, image: e.target.value });
                    }
                  }}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Rating</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor ? editingDoctor.rating : newDoctor.rating}
                    onChange={(e) => {
                      if (editingDoctor) {
                        setEditingDoctor({ ...editingDoctor, rating: e.target.value });
                      } else {
                        setNewDoctor({ ...newDoctor, rating: e.target.value });
                      }
                    }}
                    placeholder="4.9"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Patients Count</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor ? editingDoctor.patients : newDoctor.patients}
                    onChange={(e) => {
                      if (editingDoctor) {
                        setEditingDoctor({ ...editingDoctor, patients: e.target.value });
                      } else {
                        setNewDoctor({ ...newDoctor, patients: e.target.value });
                      }
                    }}
                    placeholder="4,500+"
                    className="w-full h-10 px-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Biography *</label>
                <textarea
                  required
                  value={editingDoctor ? editingDoctor.bio : newDoctor.bio}
                  onChange={(e) => {
                    if (editingDoctor) {
                      setEditingDoctor({ ...editingDoctor, bio: e.target.value });
                    } else {
                      setNewDoctor({ ...newDoctor, bio: e.target.value });
                    }
                  }}
                  placeholder="Describe the doctor's experience, background, and clinical specialties..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="flex-1 h-12 border border-[var(--card-border)] text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingDoctor ? 'Save Changes' : 'Add Doctor'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md glass rounded-3xl border border-[var(--card-border)] bg-white/95 dark:bg-slate-900/95 shadow-2xl p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[var(--text-primary)]">Confirm Deletion</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Are you sure you want to delete <strong>{deleteConfirmTarget.name}</strong>? This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 h-11 border border-[var(--card-border)] text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const target = deleteConfirmTarget;
                  setDeleteConfirmTarget(null);
                  if (target.type === 'medicine') {
                    await executeDeleteMedicine(target.id);
                  } else if (target.type === 'doctor') {
                    await executeDeleteDoctor(target.id);
                  }
                }}
                className="flex-1 h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
