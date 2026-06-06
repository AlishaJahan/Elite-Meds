'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, Stethoscope, CheckCircle2, User, Mail, Activity, AlertCircle, Lock } from 'lucide-react';

export default function ConsultDoctor() {
  const { user, token, setIsAuthModalOpen } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    date: '',
    timeSlot: '',
    symptoms: '',
  });

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Fetch doctors list from DB on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await fetch('http://localhost:5000/api/doctors');
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
          if (data.length > 0) {
            setSelectedDoctorId(data[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch doctors, using offline fallback', err);
        const fallbackDoctor = {
          id: 'doc-1',
          name: 'Dr. Alisha Jahan',
          specialty: 'General Physician & Pharmacologist',
          image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
          bio: 'Over 12 years of clinical pharmacology experience. Specializes in drug-to-drug safety, lifestyle medicine, and general health diagnostics.',
          rating: '4.9',
          patients: '4,500+'
        };
        setDoctors([fallbackDoctor]);
        setSelectedDoctorId(fallbackDoctor.id);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Autofill user details
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email
      }));
    }
  }, [user]);

  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [successDetails, setSuccessDetails] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    setError('');

    // Full Name validation
    const nameRegex = /^[A-Za-z\s]{3,50}$/;
    if (!nameRegex.test(formData.fullName.trim())) {
      setError('Full Name must be at least 3 characters and contain only letters.');
      setBooking(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      setBooking(false);
      return;
    }

    // Date validation: can't be in the past
    if (!formData.date) {
      setError('Please select a date.');
      setBooking(false);
      return;
    }
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Selected date cannot be in the past.');
      setBooking(false);
      return;
    }

    // Time validation
    if (!formData.timeSlot) {
      setError('Please select a time slot.');
      setBooking(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          doctorId: selectedDoctorId
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book consultation');
      }

      setSuccessDetails(data.consultation);
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking. Please make sure the backend is active.');
    } finally {
      setBooking(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0] || {
    id: 'doc-1',
    name: 'Dr. Alisha Jahan',
    specialty: 'General Physician & Pharmacologist',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    bio: 'Over 12 years of clinical pharmacology experience. Specializes in drug-to-drug safety, lifestyle medicine, and general health diagnostics.',
    rating: '4.9',
    patients: '4,500+'
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fadeIn">
        <div className="max-w-md mx-auto glass border border-[var(--card-border)] p-8 rounded-3xl space-y-5 bg-white/50 dark:bg-slate-900/50 shadow-lg">
          <Lock className="w-12 h-12 text-teal-600 dark:text-teal-400 mx-auto" />
          <h2 className="text-xl font-bold">Please Sign In to Consult</h2>
          <p className="text-sm text-[var(--text-secondary)]">To book virtual consultations and receive prescriptions from certified specialists, please log in or register.</p>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Page Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Virtual Medical Consultation</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto">Get expert medical diagnostic advice and prescription recommendation from certified pharmacologists.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {!successDetails ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Doctor Info Card */}
          <div className="lg:col-span-5 glass rounded-3xl p-6 border border-[var(--card-border)] shadow-md space-y-6">
            {doctors.length > 1 && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Choose Specialist
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden mx-auto bg-slate-100 border border-[var(--card-border)] shadow-sm">
              <Image 
                src={selectedDoctor.image} 
                alt={selectedDoctor.name} 
                fill
                className="object-cover"
                sizes="150px"
              />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg">{selectedDoctor.name}</h3>
              <p className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">{selectedDoctor.specialty}</p>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed text-center min-h-[60px]">
              {selectedDoctor.bio}
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-[var(--card-border)] pt-4 text-center">
              <div>
                <span className="block text-[10px] text-[var(--text-secondary)] font-semibold uppercase">Rating</span>
                <span className="font-bold text-sm text-amber-500">⭐ {selectedDoctor.rating}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--text-secondary)] font-semibold uppercase">Consultations</span>
                <span className="font-bold text-sm text-[var(--text-primary)]">{selectedDoctor.patients}</span>
              </div>
            </div>
          </div>

          {/* Booking Form Card */}
          <div className="lg:col-span-7 glass rounded-3xl p-6 sm:p-8 border border-[var(--card-border)] shadow-md">
            <h3 className="font-extrabold text-lg mb-6 flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" />
              <span>Schedule Your Session</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Full Name</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  placeholder="e.g. Alisha Jahan"
                  className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="name@example.com"
                  className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Select Date</span>
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Time Slot</span>
                  </label>
                  <select 
                    required
                    value={formData.timeSlot}
                    onChange={e => setFormData({...formData, timeSlot: e.target.value})}
                    className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">Select slot...</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                    <option value="04:30 PM - 05:00 PM">04:30 PM - 05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Brief Symptoms (Optional)</span>
                </label>
                <textarea 
                  value={formData.symptoms}
                  onChange={e => setFormData({...formData, symptoms: e.target.value})}
                  placeholder="e.g. Mild fever, dry cough and throat irritation since last 2 days..."
                  rows={3}
                  className="w-full p-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={booking}
                className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {booking ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <span>Book Consultation Session</span>
                )}
              </button>

            </form>
          </div>

        </div>
      ) : (
        /* Success Screen */
        <div className="max-w-xl mx-auto glass rounded-3xl p-8 sm:p-12 border border-[var(--card-border)] shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Booking Confirmed!</h2>
            <p className="text-sm text-[var(--text-secondary)]">Your virtual consultation has been scheduled successfully. An email link was sent to you.</p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/20 flex items-center space-x-4 text-left">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[var(--card-border)]">
              <Image src={successDetails.doctor.image} alt={successDetails.doctor.name} fill className="object-cover" sizes="64px" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-extrabold text-sm">{successDetails.doctor.name}</h4>
              <p className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">{successDetails.doctor.specialty}</p>
              
              <div className="flex space-x-4 pt-1 font-semibold text-[var(--text-secondary)]">
                <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {successDetails.date}</span>
                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {successDetails.timeSlot}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link 
              href="/"
              className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition-all text-center"
            >
              Back to Home
            </Link>
            <Link 
              href="/orders?tab=consultations"
              className="flex-1 py-3 rounded-xl border border-[var(--card-border)] hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold text-sm transition-all text-center"
            >
              View Scheduled Sessions
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
