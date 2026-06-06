'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Address } from '@/types';
import { CheckCircle2, ChevronRight, CreditCard, UploadCloud, AlertCircle, ShoppingBag, Lock } from 'lucide-react';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, token, setIsAuthModalOpen } = useAuth();
  const [step, setStep] = useState(1); // Steps: 1 = Shipping, 2 = Prescription (optional), 3 = Payment, 4 = Success
  const [shipping, setShipping] = useState<Address>({
    fullName: '',
    addressLine: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  // Autofill name from logged in user
  useEffect(() => {
    if (user && !shipping.fullName) {
      setShipping(s => ({ ...s, fullName: user.name }));
    }
  }, [user]);

  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [payment, setPayment] = useState({
    method: 'cod', // cod or card
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any>(null);

  const hasPrescriptionItem = cartItems.some(item => item.medicine.prescriptionRequired);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    // Full Name: letters and spaces only, 3-50 chars
    const nameRegex = /^[A-Za-z\s]{3,50}$/;
    if (!nameRegex.test(shipping.fullName.trim())) {
      setOrderError('Full Name must be at least 3 characters and contain only letters.');
      return;
    }

    // Delivery Address: minimum 8 chars
    if (shipping.addressLine.trim().length < 8) {
      setOrderError('Delivery Address must be at least 8 characters long.');
      return;
    }

    // City: letters and spaces only, 2-50 chars
    const cityRegex = /^[A-Za-z\s]{2,50}$/;
    if (!cityRegex.test(shipping.city.trim())) {
      setOrderError('City must contain only letters.');
      return;
    }

    // Pincode validation: exactly 6 digits
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(shipping.postalCode.trim())) {
      setOrderError('Postal Code must be exactly 6 digits (e.g. 110001).');
      return;
    }

    // Phone validation: Indian standard 10-digit phone number (optional +91/0 prefix)
    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(shipping.phone.replace(/[\s-]/g, ''))) {
      setOrderError('Phone Number must be a valid 10-digit number (e.g. 9876543210).');
      return;
    }

    setStep(2); // Go to Prescription Step (Mandatory or Optional)
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setPrescriptionFile(file.name);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPrescriptionItem && !prescriptionFile) {
      setOrderError('Please upload a valid doctor prescription.');
      return;
    }
    setOrderError('');
    setStep(3);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacingOrder(true);
    setOrderError('');

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems,
          shippingAddress: shipping,
          paymentMethod: payment.method === 'cod' ? 'Cash on Delivery (COD)' : 'Credit Card',
          prescriptionUploaded: prescriptionFile,
          total: cartTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setPlacedOrderDetails(data.order);
      clearCart();
      setStep(4); // Success step
    } catch (err: any) {
      setOrderError(err.message || 'An error occurred during placing order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fadeIn">
        <div className="max-w-md mx-auto glass border border-[var(--card-border)] p-8 rounded-3xl space-y-5 bg-white/50 dark:bg-slate-900/50 shadow-lg">
          <Lock className="w-12 h-12 text-teal-600 dark:text-teal-400 mx-auto" />
          <h2 className="text-xl font-bold">Please Sign In to Checkout</h2>
          <p className="text-sm text-[var(--text-secondary)]">To review your cart and securely place orders, please log in or create an Elite Meds account.</p>
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

  if (cartItems.length === 0 && step !== 4) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto glass border border-[var(--card-border)] p-8 rounded-3xl space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold">Your Cart is Empty</h2>
          <p className="text-sm text-[var(--text-secondary)]">You cannot checkout without items in your cart.</p>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-all">
            Browse Medicines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Checkout Steps Header Indicator */}
      {step < 4 && (
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-10 text-xs sm:text-sm font-bold text-slate-400">
          <span className={`${step === 1 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
            1. Shipping
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          
          <span className={`${step === 2 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
            2. Prescription {!hasPrescriptionItem && <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(Optional)</span>}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />

          <span className={`${step === 3 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
            3. Payment
          </span>
        </div>
      )}

      {orderError && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{orderError}</span>
        </div>
      )}

      {/* Main Grid */}
      {step < 4 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Step Forms */}
          <div className="lg:col-span-7 glass rounded-3xl p-6 sm:p-8 border border-[var(--card-border)] shadow-md">
            
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <h2 className="text-xl font-extrabold">Shipping Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={shipping.fullName} 
                      onChange={e => setShipping({...shipping, fullName: e.target.value})} 
                      placeholder="e.g. Alisha Jahan"
                      className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Delivery Address</label>
                    <input 
                      type="text" 
                      required 
                      value={shipping.addressLine} 
                      onChange={e => setShipping({...shipping, addressLine: e.target.value})} 
                      placeholder="e.g. Block C, Gulshan-e-Iqbal"
                      className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">City</label>
                      <input 
                        type="text" 
                        required 
                        value={shipping.city} 
                        onChange={e => setShipping({...shipping, city: e.target.value})} 
                        placeholder="e.g. Karachi"
                        className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Postal Code</label>
                      <input 
                        type="text" 
                        required 
                        value={shipping.postalCode} 
                        onChange={e => setShipping({...shipping, postalCode: e.target.value})} 
                        placeholder="75300"
                        className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      required 
                      value={shipping.phone} 
                      onChange={e => setShipping({...shipping, phone: e.target.value})} 
                      placeholder="+92 300 1234567"
                      className="w-full h-11 px-4 rounded-xl border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2: Prescription Upload */}
            {step === 2 && (
              <form onSubmit={handlePrescriptionSubmit} className="space-y-6 animate-fadeIn">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold flex items-center space-x-2">
                    {hasPrescriptionItem ? (
                      <>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500 text-white uppercase font-bold animate-pulse-slow">Rx Required</span>
                        <span>Upload Prescription</span>
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-teal-600 text-white uppercase font-bold">Rx Optional</span>
                        <span>Upload Prescription (Optional)</span>
                      </>
                    )}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {hasPrescriptionItem 
                      ? 'One or more items in your shopping cart requires a doctor prescription.' 
                      : 'All items in your cart are standard medicines. You can optionally upload a prescription if you wish.'}
                  </p>
                </div>

                {/* List of critical medicines requiring prescription */}
                {hasPrescriptionItem && (
                  <div className="space-y-2 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 text-xs">
                    <span className="font-bold text-rose-700 dark:text-rose-400 block">The following critical medication(s) require a prescription:</span>
                    <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] mt-1.5">
                      {cartItems
                        .filter(item => item.medicine.prescriptionRequired)
                        .map(item => (
                          <li key={item.medicine.id}>
                            <span className="font-bold text-[var(--text-primary)]">{item.medicine.name}</span> (Qty: {item.quantity})
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="border-2 border-dashed border-[var(--card-border)] rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors relative">
                  <input 
                    type="file" 
                    id="rx-upload"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--text-primary)]">Click to Upload Prescription</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">PDF, JPG, PNG formats up to 5MB</p>
                    </div>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Uploading document...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {prescriptionFile && !isUploading && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="font-semibold line-clamp-1">{prescriptionFile}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setPrescriptionFile(null)} 
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="flex-1 h-12 rounded-xl border border-[var(--card-border)] text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Go Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUploading || (hasPrescriptionItem && !prescriptionFile)}
                    className="flex-1 h-12 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 animate-fadeIn"
                  >
                    <span>{prescriptionFile ? 'Continue to Payment' : (hasPrescriptionItem ? 'Continue to Payment' : 'Skip & Continue to Payment')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <h2 className="text-xl font-extrabold">Select Payment Method</h2>
                
                <div className="space-y-3">
                  <label className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    payment.method === 'cod' 
                      ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/10' 
                      : 'border-[var(--card-border)]'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment-method"
                      checked={payment.method === 'cod'}
                      onChange={() => setPayment({...payment, method: 'cod'})}
                      className="mt-1 h-4 w-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <div>
                      <span className="block font-bold text-sm">Cash on Delivery (COD)</span>
                      <span className="block text-xs text-[var(--text-secondary)] mt-0.5">Pay with cash when the medicine package is delivered at your door.</span>
                    </div>
                  </label>

                  <label className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    payment.method === 'card' 
                      ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/10' 
                      : 'border-[var(--card-border)]'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment-method"
                      checked={payment.method === 'card'}
                      onChange={() => setPayment({...payment, method: 'card'})}
                      className="mt-1 h-4 w-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <div className="flex-grow">
                      <span className="block font-bold text-sm flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Credit / Debit Card</span>
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)] mt-0.5">Pay online using encrypted, secure card gateways.</span>
                    </div>
                  </label>
                </div>

                {payment.method === 'card' && (
                  <div className="space-y-4 p-4 border border-[var(--card-border)] rounded-xl bg-slate-50/50 dark:bg-slate-900/10 animate-fadeIn">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Card Number</label>
                      <input 
                        type="text" 
                        required 
                        value={payment.cardNumber} 
                        onChange={e => setPayment({...payment, cardNumber: e.target.value})} 
                        placeholder="4242 4242 4242 4242"
                        className="w-full h-10 px-3 rounded-lg border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Expiry Date</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="MM/YY"
                          value={payment.expiry}
                          onChange={e => setPayment({...payment, expiry: e.target.value})}
                          className="w-full h-10 px-3 rounded-lg border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">CVV</label>
                        <input 
                          type="password" 
                          required 
                          placeholder="123"
                          value={payment.cvv}
                          onChange={e => setPayment({...payment, cvv: e.target.value})}
                          maxLength={3}
                          className="w-full h-10 px-3 rounded-lg border border-[var(--card-border)] bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="flex-1 h-12 rounded-xl border border-[var(--card-border)] text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Go Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={placingOrder}
                    className="flex-1 h-12 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    {placingOrder ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Place Order (₹{cartTotal})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Right Side: Order Summary Panel */}
          <div className="lg:col-span-5 glass rounded-3xl p-6 border border-[var(--card-border)] shadow-md space-y-4">
            <h3 className="font-extrabold text-base border-b border-[var(--card-border)] pb-2">Order Summary</h3>
            
            <div className="divide-y divide-[var(--card-border)]">
              {cartItems.map((item) => (
                <div key={item.medicine.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">{item.medicine.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] block">Qty: {item.quantity} × ₹{item.medicine.price}</span>
                  </div>
                  <span className="font-extrabold text-teal-700 dark:text-teal-400">₹{item.medicine.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--card-border)] pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span>₹{cartTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Shipping</span>
                <span className="text-emerald-500 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between font-black text-sm border-t border-[var(--card-border)] pt-2 text-teal-800 dark:text-teal-400">
                <span>Total Amount</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Step 4: Success Screen */
        <div className="max-w-xl mx-auto glass rounded-3xl p-8 sm:p-12 border border-[var(--card-border)] shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Order Placed Successfully!</h2>
            <p className="text-sm text-[var(--text-secondary)]">Thank you for your purchase. Your medicine package is now processing.</p>
          </div>

          {placedOrderDetails && (
            <div className="p-4 rounded-2xl border border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/20 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)] font-semibold">Order ID</span>
                <span className="font-bold">{placedOrderDetails.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)] font-semibold">Deliver To</span>
                <span className="font-bold">{placedOrderDetails.shippingAddress.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)] font-semibold">Delivery Address</span>
                <span className="font-bold text-right">{placedOrderDetails.shippingAddress.addressLine}, {placedOrderDetails.shippingAddress.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)] font-semibold">Payment Status</span>
                <span className="font-bold text-emerald-500">{placedOrderDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)] font-semibold">Total Amount</span>
                <span className="font-extrabold text-teal-700 dark:text-teal-400">₹{placedOrderDetails.total}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link 
              href="/"
              className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition-all text-center"
            >
              Continue Shopping
            </Link>
            <Link 
              href="/orders"
              className="flex-1 py-3 rounded-xl border border-[var(--card-border)] hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold text-sm transition-all text-center"
            >
              View Order History
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
