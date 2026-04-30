import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  slug: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (product) => {
        set((state) => {
          const existingItem = state.cart.find((item) => item.id === product.id);
          if (existingItem) {
            // Item already in cart, don't add again or change quantity
            return { cart: state.cart };
          } else {
            return {
              cart: [...state.cart, { ...product, quantity: 1 }],
            };
          }
        });
      },
      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        // Since each item can only be added once, we keep quantity at 1.
        
        return;
      },
      clearCart: () => {
        set({ cart: [] });
      },
      getCartCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },
      getCartTotal: () => {
        return get().cart.reduce((total, item) => {
          const priceString = item.price.replace(/[^0-9.]/g, '');
          const price = parseFloat(priceString);
          return total + (isNaN(price) ? 0 : price * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'cart-storage', // name of the item in the storage (must be unique)
    }
  )
);
