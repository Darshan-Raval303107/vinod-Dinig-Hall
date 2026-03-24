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

const SESSION_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const useCartStore = create(
  persist(
    (set, get) => ({
      // Cart items
      items: [],
      
      // Session context
      restaurantId: null,
      restaurantSlug: null,
      tableNumber: null,
      activeOrders: [],
      sessionCreatedAt: null,

      // Check if current session is still valid (within 6h TTL)
      isSessionValid: () => {
        const { sessionCreatedAt, restaurantId } = get();
        if (!sessionCreatedAt || !restaurantId) return false;
        return (Date.now() - sessionCreatedAt) < SESSION_TTL_MS;
      },

      // Start or refresh session on QR scan / menu visit
      startSession: (restaurantId, tableNumber, restaurantSlug) => {
        const state = get();
        // If existing valid session for same table, keep it (don't reset order)
        if (
          state.isSessionValid() &&
          state.restaurantId === restaurantId &&
          String(state.tableNumber) === String(tableNumber)
        ) {
          return; // Session already active for this context
        }
        // New session — clear old data
        set({
          restaurantId,
          tableNumber,
          restaurantSlug: restaurantSlug || state.restaurantSlug,
          activeOrders: [],
          sessionCreatedAt: Date.now(),
          items: [],
        });
      },

      // Legacy alias — used by Menu.jsx
      setContext: (restaurantId, tableNumber) => {
        const state = get();
        if (!state.isSessionValid() || state.restaurantId !== restaurantId || String(state.tableNumber) !== String(tableNumber)) {
          set({
            restaurantId,
            tableNumber,
            sessionCreatedAt: state.sessionCreatedAt || Date.now(),
          });
        }
      },

      // Link session to an active order after placing
      addActiveOrder: (orderId) => set(state => ({ activeOrders: [...(state.activeOrders || []), orderId] })),

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

      // Clear cart only (keep session)
      clearCart: () => set({ items: [] }),

      // Full session destroy (after 6h or manual reset)
      destroySession: () => set({
        items: [],
        restaurantId: null,
        restaurantSlug: null,
        tableNumber: null,
        activeOrders: [],
        sessionCreatedAt: null,
      }),
    }),
    {
      name: 'dineflow-cart',
    }
  )
)
