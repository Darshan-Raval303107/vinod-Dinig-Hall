import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MobileNav from './components/customer/MobileNav';

import Landing from './pages/Landing';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import OrderStatus from './pages/customer/OrderStatus';
import Payment from './pages/customer/Payment';
import Bill from './pages/customer/Bill';
import QRPreview from './pages/customer/QRPreview';

import Login from './pages/auth/Login';
import Unauthorized from './pages/auth/Unauthorized';
import ChefDashboard from './pages/chef/Dashboard';
import OwnerDashboard from './pages/owner/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-status/:orderId" element={<OrderStatus />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/bill/:orderId" element={<Bill />} />
            <Route path="/qr-preview" element={<QRPreview />} />

            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Chef Routes */}
            <Route element={<ProtectedRoute allowedRoles={['chef', 'admin']} />}>
              <Route path="/chef/dashboard" element={<ChefDashboard />} />
            </Route>

            {/* Owner Routes */}
            <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
              <Route path="/owner/dashboard/*" element={<OwnerDashboard />} />
            </Route>
          </Routes>
        </div>
        <MobileNav />
      </div>
    </BrowserRouter>
  );
}

export default App;


