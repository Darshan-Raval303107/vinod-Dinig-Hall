import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import OrderCard from '../../components/chef/OrderCard';
import { LogOut } from 'lucide-react';

const ChefDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = () => {
    api.get('/chef/orders')
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch orders');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();

    socket.connect();
    
    // Listen for new orders
    socket.on('order:new', (data) => {
      // Play a notification sound
      try {
        const audio = new Audio('/notification.mp3'); // Assumes generic mp3 in public folder
        audio.play().catch(e => console.log('Audio autoplay blocked', e));
      } catch (e) {}
      
      fetchOrders(); // Refresh list to get full items
    });
    
    // Listen for cross-chef updates
    socket.on('order:status_update_chef', (data) => {
      setOrders(prev => prev.map(o => o.order_id === data.orderId ? { ...o, status: data.status } : o));
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status_update_chef');
      socket.disconnect();
    };
  }, []);

  const handleUpdateStatus = (orderId, newStatus) => {
    api.put(`/chef/orders/${orderId}/status`, { status: newStatus })
      .then(res => {
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
      })
      .catch(err => console.error("Failed to update status", err));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="p-8 theme-chef min-h-screen text-white">Loading kitchen ops...</div>;

  // Filter out served/cancelled orders from the board
  const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled' && o.status !== 'paid');
  
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');
  const cookingOrders = activeOrders.filter(o => o.status === 'accepted' || o.status === 'cooking');
  const readyOrders = activeOrders.filter(o => o.status === 'ready');

  return (
    <div className="theme-chef min-h-screen font-geist flex flex-col h-screen overflow-hidden text-gray-200">
      <header className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-white">DINEFLOW KITCHEN</h1>
          <div className="px-3 py-1 bg-chef-surface text-xs font-mono rounded border border-gray-800">
            CHEF: {user?.name.toUpperCase() || 'UNKNOWN'}
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-chef-surface rounded transition-colors text-gray-400 hover:text-white"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </header>

      {error && <div className="bg-red-900/50 text-red-200 p-3 text-sm border-b border-red-800 text-center">{error}</div>}

      <div className="flex-1 overflow-x-auto p-6 bg-[#0c0c0c] flex gap-6 hide-scrollbar">
        {/* NEW Column */}
        <div className="w-[340px] flex-shrink-0 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-400 tracking-wider">NEW / PENDING</h2>
            <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold">{pendingOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {pendingOrders.map(order => (
              <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        </div>

        {/* COOKING Column */}
        <div className="w-[340px] flex-shrink-0 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold tracking-wider text-chef-cooking">COOKING</h2>
            <span className="w-6 h-6 rounded-full bg-chef-cooking/20 text-chef-cooking flex items-center justify-center text-xs font-bold">{cookingOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {cookingOrders.map(order => (
              <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        </div>

        {/* READY Column */}
        <div className="w-[340px] flex-shrink-0 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold tracking-wider text-chef-ready">READY TO SERVE</h2>
            <span className="w-6 h-6 rounded-full bg-chef-ready/20 text-chef-ready flex items-center justify-center text-xs font-bold">{readyOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {readyOrders.map(order => (
              <OrderCard key={order.order_id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefDashboard;
