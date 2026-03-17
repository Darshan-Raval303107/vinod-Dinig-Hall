import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  }
}))

export const useCartStore = create((set) => ({
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
  clearCart: () => set({ items: [] })
}))
