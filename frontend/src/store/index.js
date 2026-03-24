import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create((set) => {
  // Helper to safely get from localStorage
  const getSafe = (key) => {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return null;
    try {
      return key === 'user' ? JSON.parse(val) : val;
    } catch (e) {
      console.error(`AuthStore: Error parsing ${key}`, e);
      return null;
    }
  };

  return {
    user: getSafe('user'),
    token: getSafe('token'),
    setAuth: (user, token) => {
      if (!token || !user) return;
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token })
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ user: null, token: null })
      // Optional: Clear any other persistent state if needed
    }
  };
})

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      restaurantId: null,
      tableNumber: null,
      setContext: (restaurantId, tableNumber) => set({ restaurantId, tableNumber }),
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.id === item.id)
        if (existing) {
          return { items: state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }
        }
        return { items: [...state.items, { ...item, quantity: 1 }] }
      }),
      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(i => i.id !== itemId)
      })),
      updateQuantity: (itemId, quantity) => set((state) => {
        if (quantity <= 0) return { items: state.items.filter(i => i.id !== itemId) }
        return { items: state.items.map(i => i.id === itemId ? { ...i, quantity } : i) }
      }),
      clearCart: () => set({ items: [], restaurantId: null, tableNumber: null })
    }),
    {
      name: 'dineflow-cart',
    }
  )
)
