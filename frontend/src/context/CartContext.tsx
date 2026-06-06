'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, CartItem } from '@/types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (medicine: Medicine, quantity?: number) => void;
  removeFromCart: (medicineId: string) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, token, loading, setIsAuthModalOpen } = useAuth();

  // Load cart from database when token changes (login) or clear cart on logout
  useEffect(() => {
    if (loading) return; // Wait until auth state is loaded

    const loadCart = async () => {
      if (token) {
        try {
          const res = await fetch('http://localhost:5000/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCartItems(data);
          }
        } catch (e) {
          console.error('Error fetching cart from backend', e);
        }
      } else {
        // Clear cart from local state and localStorage on logout/no auth token
        localStorage.removeItem('med_cart');
        setCartItems([]);
      }
      setIsLoaded(true);
    };

    loadCart();
  }, [token, loading]);

  // Save cart to localStorage and database
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('med_cart', JSON.stringify(cartItems));
      
      // If logged in, also sync to MySQL database
      if (token) {
        const syncCart = async () => {
          try {
            await fetch('http://localhost:5000/api/cart', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ items: cartItems })
            });
          } catch (e) {
            console.error('Error syncing cart to backend', e);
          }
        };
        syncCart();
      }
    }
  }, [cartItems, isLoaded, token]);

  const addToCart = (medicine: Medicine, quantity = 1) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (user.role === 'admin') {
      return;
    }
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.medicine.id === medicine.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { medicine, quantity }];
    });
    setIsCartOpen(true); // Open the cart side drawer immediately for interactive feedback!
  };

  const removeFromCart = (medicineId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.medicine.id !== medicineId));
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.medicine.id === medicineId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.medicine.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
