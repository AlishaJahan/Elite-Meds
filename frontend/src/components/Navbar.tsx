'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Moon, Sun, Menu, X, Pill, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout, setIsAuthModalOpen } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // On mount, check stored theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Consult Doctor', href: '/consult' },
    { name: 'Order History', href: '/orders' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass transition-all border-b border-[var(--card-border)] duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Pill className="w-5 h-5 text-white animate-float" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-700 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Elite Meds
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-all duration-200 hover:text-teal-600 dark:hover:text-teal-400 ${
                    isActive 
                      ? 'text-teal-700 dark:text-teal-400 font-semibold border-b-2 border-teal-600 dark:border-teal-400 pb-1' 
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Actions: Theme Toggle, Cart, User profile, Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 text-[var(--text-secondary)]"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 text-[var(--text-secondary)] hover:scale-105"
              aria-label="Open Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse-slow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Auth Control */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">{user.name}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] leading-none truncate max-w-[120px]">{user.email}</span>
                </div>
                <div className="relative group">
                  <button className="w-9 h-9 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-black text-sm flex items-center justify-center border border-teal-500/20 shadow-xs transition-all duration-200 cursor-pointer">
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl glass border border-[var(--card-border)] bg-white/95 dark:bg-slate-900/95 py-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-2 border-b border-[var(--card-border)] sm:hidden">
                      <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{user.name}</p>
                      <p className="text-[9px] text-[var(--text-secondary)] truncate">{user.email}</p>
                    </div>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block text-left px-4 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-colors cursor-pointer border-b border-[var(--card-border)]"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-xs transition-all duration-200 cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-[var(--text-secondary)]"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass border-t border-[var(--card-border)] py-3 px-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                  isActive 
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold' 
                    : 'text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};
export default Navbar;
