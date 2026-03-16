import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart'; 236
import OrderStatus from './pages/customer/OrderStatus';
import Payment from './pages/customer/Payment';

import Login from './pages/auth/Login';
import ChefDashboard from './pages/chef/Dashboard';
import OwnerDashboard from './pages/owner/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 theme-customer font-jakarta text-center flex-col">
            <h1 className="font-fraunces text-4xl font-bold mb-4">DineFlow</h1>
            <p className="text-gray-500 max-w-sm mb-8">
              Welcome! Please scan the QR code on your table to view the menu and place an order.
            </p>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 w-48 h-48 flex items-center justify-center">
              <span className="text-gray-400">QR Here</span>
            </div>
            <a href="/login" className="text-sm font-medium text-gray-500 hover:text-black">
              Staff Portal Login &rarr;
            </a>
          </div>
        } />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-status/:orderId" element={<OrderStatus />} />
        <Route path="/payment/:orderId" element={<Payment />} />

        <Route path="/login" element={<Login />} />

        {/* Chef Routes */}
        <Route element={<ProtectedRoute allowedRoles={['chef', 'admin']} />}>
          <Route path="/chef/dashboard" element={<ChefDashboard />} />
        </Route>

        {/* Owner Routes */}
        <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
          <Route path="/owner/dashboard/*" element={<OwnerDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
