'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, error, clearError, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors when opening modal or switching views
  useEffect(() => {
    clearError();
    setValidationError(null);
    setSuccessMessage(null);
    setShowPassword(false);
  }, [isLoginView, isAuthModalOpen, clearError]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!email || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!isLoginView) {
      if (!name) {
        setValidationError('Name is required for registration.');
        return;
      }

      const nameRegex = /^[A-Za-z\s]{3,50}$/;
      if (!nameRegex.test(name.trim())) {
        setValidationError('Name must be at least 3 characters and contain only letters.');
        return;
      }
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (isLoginView) {
      const success = await login(email, password);
      if (success) {
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1000);
      }
    } else {
      const success = await register(name, email, password);
      if (success) {
        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          setIsAuthModalOpen(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-md overflow-hidden glass rounded-3xl border border-[var(--card-border)] shadow-2xl p-6 sm:p-8 space-y-6 bg-white/80 dark:bg-slate-900/80">
        
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[var(--text-secondary)]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black bg-gradient-to-r from-teal-700 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {isLoginView 
              ? 'Sign in to access your orders and health consultations' 
              : 'Register to start ordering medicines and consulting doctors'}
          </p>
        </div>

        {/* Error / Success Messages */}
        {(validationError || error) && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError || error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-teal-600 dark:text-teal-400 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field (Register view only) */}
          {!isLoginView && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative flex items-center border border-[var(--card-border)] rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm focus-within:border-teal-500 transition-colors">
                <User className="absolute left-3.5 w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-transparent text-sm focus:outline-none placeholder-slate-400 text-[var(--text-primary)]"
                  required={!isLoginView}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative flex items-center border border-[var(--card-border)] rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm focus-within:border-teal-500 transition-colors">
              <Mail className="absolute left-3.5 w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3 bg-transparent text-sm focus:outline-none placeholder-slate-400 text-[var(--text-primary)]"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
              Password
            </label>
            <div className="relative flex items-center border border-[var(--card-border)] rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm focus-within:border-teal-500 transition-colors">
              <Lock className="absolute left-3.5 w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-transparent text-sm focus:outline-none placeholder-slate-400 text-[var(--text-primary)]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:scale-[1.01] active:scale-98 flex items-center justify-center transition-all cursor-pointer mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>{isLoginView ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* View Toggle Footer */}
        <div className="text-center text-xs text-[var(--text-secondary)] pt-4 border-t border-[var(--card-border)]">
          {isLoginView ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setIsLoginView(false)}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsLoginView(true)}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
export default AuthModal;
