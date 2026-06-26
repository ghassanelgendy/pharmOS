import React, { createContext, useContext, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  lineId: string; // Generated unique ID for each line item
  id: string; // Drug ID
  name: string;
  price: number;
  availableQuantity: number;
  quantity: number; // Quantity in cart
  email: string; // Supplier email (required for notification)
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity' | 'lineId'>) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  taxAmount: number;
  useTaxes: boolean;
  setUseTaxes: (use: boolean) => void;
  checkout: (paidAmount: number, receivedNotes: Record<string, number>) => Promise<{ success: boolean; message: string; balance: number; changeNotes?: Record<string, number> }>;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const [useTaxes, setUseTaxesState] = useState<boolean>(() => {
    return localStorage.getItem('use_taxes') !== 'false';
  });

  const setUseTaxes = (use: boolean) => {
    localStorage.setItem('use_taxes', use ? 'true' : 'false');
    setUseTaxesState(use);
  };

  const addToCart = (item: Omit<CartItem, 'quantity' | 'lineId'>) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, i.availableQuantity) } : i
        );
      }
      const lineId = 'line_' + Math.random().toString(36).substring(2, 11);
      return [...prev, { ...item, quantity: 1, lineId }];
    });
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.lineId === lineId ? { ...i, quantity: Math.min(Math.max(quantity, 1), i.availableQuantity) } : i))
    );
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((i) => i.lineId !== lineId));
  };

  const clearCart = () => setCart([]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return useTaxes ? totalAmount * 0.05 : 0;
  }, [totalAmount, useTaxes]);

  const checkout = async (paidAmount: number, receivedNotes: Record<string, number>) => {
    if (cart.length === 0) return { success: false, message: 'Cart is empty', balance: 0 };
    if (paidAmount < totalAmount + taxAmount) {
      return { success: false, message: 'Insufficient paid amount', balance: 0 };
    }

    const total = totalAmount + taxAmount;
    const balance = paidAmount - total;

    try {
      // 1. Record the sales in the database and process drawer cashflow
      const salesData = {
        drugName: cart.map(i => `${i.name} (${i.quantity} x EGP ${i.price.toFixed(2)})`).join(', '),
        totalPrice: total.toFixed(2),
        tax: taxAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        balance: balance.toFixed(2),
        receivedNotes
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify(salesData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Failed to record sale', balance: 0 };
      }

      const responseData = await response.json();

      // 2. Update quantities for each drug in the inventory
      for (const item of cart) {
        const remainingQuantity = item.availableQuantity - item.quantity;
        const qtyResponse = await fetch(`/api/inventory/updateQuantity/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': user ? `Bearer ${user.token}` : ''
          },
          body: JSON.stringify({
            id: item.id,
            quantity: remainingQuantity.toString()
          })
        });

        if (!qtyResponse.ok) {
          console.error(`Failed to update quantity for drug: ${item.name}`);
        }
      }

      clearCart();
      return { 
        success: true, 
        message: 'Checkout successful', 
        balance, 
        changeNotes: responseData.changeNotes 
      };
    } catch (error) {
      console.error('Checkout error:', error);
      return { success: false, message: 'Checkout failed due to connection error', balance: 0 };
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalAmount,
      taxAmount,
      useTaxes,
      setUseTaxes,
      checkout
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
