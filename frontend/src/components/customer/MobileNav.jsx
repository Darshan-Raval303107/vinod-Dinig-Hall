import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '../../store';

const MobileNav = () => {
  const location = useLocation();
  const { items, tableNumber } = useCartStore();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const isWindowUser = !tableNumber || tableNumber === '0' || tableNumber === 0;
  const menuLink = '/menu';
  const homeLink = isWindowUser ? '/window' : `/table/${tableNumber}`;

  // Only show on customer pages
  const customerPages = ['/menu', '/cart', '/order-status', '/window', '/table'];
  const showNav = customerPages.some(page => location.pathname.startsWith(page));

  if (!showNav) return null;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-3 pointer-events-none" 
         style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}>
      <nav className="rounded-2xl h-16 w-full flex items-center justify-around pointer-events-auto shadow-[0_-4px_30px_rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-xl border border-zinc-100/50">

        <Link to={homeLink} className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${
          isActive(homeLink) ? 'text-customer-accent' : 'text-zinc-400'
        }`}>
          <Home size={20} strokeWidth={isActive(homeLink) ? 2.5 : 1.8} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
        </Link>
        
        <Link to={menuLink} className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${
          isActive('/menu') ? 'text-customer-accent' : 'text-zinc-400'
        }`}>
          <UtensilsCrossed size={20} strokeWidth={isActive('/menu') ? 2.5 : 1.8} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Menu</span>
        </Link>

        <Link to="/cart" className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${
          isActive('/cart') ? 'text-customer-accent' : 'text-zinc-400'
        }`}>
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={isActive('/cart') ? 2.5 : 1.8} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-customer-accent text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">Cart</span>
        </Link>

        <Link to="/login" className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${
          isActive('/login') ? 'text-customer-accent' : 'text-zinc-400'
        }`}>
          <User size={20} strokeWidth={isActive('/login') ? 2.5 : 1.8} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Account</span>
        </Link>
      </nav>
    </div>
  );
};

export default MobileNav;
