import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Receipt, User } from 'lucide-react';
import { useCartStore } from '../../store';

const MobileNav = () => {
  const location = useLocation();
  const { items } = useCartStore();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Only show on customer pages
  const customerPages = ['/menu', '/cart', '/order-status'];
  const showNav = customerPages.some(page => location.pathname.startsWith(page)) || location.pathname === '/';

  if (!showNav) return null;

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
      isActive ? 'text-customer-accent scale-110' : 'text-customer-text/40 hover:text-customer-text'
    }`;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pt-2 pointer-events-none" 
         style={{ paddingBottom: 'calc(var(--safe-bottom) + 1.5rem)' }}>
      <nav className="glass-panel rounded-[2.2rem] h-20 w-full flex items-center justify-around px-4 pointer-events-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-white/40 bg-white/90 backdrop-blur-xl">

        <Link to="/" className={getLinkClass('/')}>
          <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
        </Link>
        
        <Link to="/menu?restaurant=spice-lounge&table=1" className={getLinkClass('/menu')}>
          <div className="relative">
            <User size={22} strokeWidth={isActive('/menu') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
        </Link>

        <Link to="/cart" className={getLinkClass('/cart')}>
          <div className="relative">
            <ShoppingBag size={22} strokeWidth={isActive('/cart') ? 2.5 : 2} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-customer-accent text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in zoom-in-0 duration-300">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Cart</span>
        </Link>

        <Link to="/login" className={getLinkClass('/login')}>
          <Receipt size={22} strokeWidth={isActive('/login') ? 2.5 : 2} />
          <span className="text-[10px] font-black uppercase tracking-widest">Account</span>
        </Link>
      </nav>
    </div>
  );
};

// Helper inside component to avoid closure issues if used outside
function isActive(path, locationPath) {
  return locationPath === path;
}

// Redefining helper for exportable logic if needed
const NavItem = ({ to, icon: Icon, label, isActive, totalItems }) => (
  <Link to={to} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
    isActive ? 'text-customer-accent scale-110' : 'text-customer-text/40 hover:text-customer-text'
  }`}>
    <div className="relative">
      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      {label === 'Cart' && totalItems > 0 && (
        <span className="absolute -top-1.5 -right-2.5 bg-customer-accent text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
          {totalItems}
        </span>
      )}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </Link>
);

export default MobileNav;
