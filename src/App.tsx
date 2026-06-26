import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { DoctorLogin } from './pages/DoctorLogin';
import { DoctorSignup } from './pages/DoctorSignup';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Suppliers } from './pages/Suppliers';
import { DoctorOrders } from './pages/DoctorOrders';
import { Warnings } from './pages/Warnings';
import { Settings } from './pages/Settings';
import { Predictions } from './pages/Predictions';
import { Sales } from './pages/Sales';
import { CashierMonitor } from './pages/CashierMonitor';
import { ShiftsHistory } from './pages/ShiftsHistory';

// Role-Based Router Protection Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: Array<'Pharmacist' | 'Assistant Pharmacist' | 'Cashier' | 'Doctor'> 
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      {isAuthenticated && <Sidebar />}
      <main className="main-content" style={{ marginLeft: isAuthenticated ? '280px' : '0' }}>
        <TopHeader />
        <div className="page-wrapper animated-fade">
          {children}
        </div>
      </main>
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/doctorLogin" element={<DoctorLogin />} />
          <Route path="/doctorSignup" element={<DoctorSignup />} />

          {/* Protected Pages */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/inventory" element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          } />
          
          <Route path="/pos" element={
            <ProtectedRoute>
              <POS />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor-orders" element={
            <ProtectedRoute>
              <DoctorOrders />
            </ProtectedRoute>
          } />
          
          <Route path="/warnings" element={
            <ProtectedRoute>
              <Warnings />
            </ProtectedRoute>
          } />

          {/* Role Restricted Pages */}
          <Route path="/suppliers" element={
            <ProtectedRoute allowedRoles={['Pharmacist', 'Assistant Pharmacist']}>
              <Suppliers />
            </ProtectedRoute>
          } />
          
          <Route path="/predictions" element={
            <ProtectedRoute allowedRoles={['Pharmacist']}>
              <Predictions />
            </ProtectedRoute>
          } />
          
          <Route path="/sales" element={
            <ProtectedRoute allowedRoles={['Pharmacist', 'Assistant Pharmacist']}>
              <Sales />
            </ProtectedRoute>
          } />
          
          <Route path="/cashier-monitor" element={
            <ProtectedRoute allowedRoles={['Pharmacist', 'Assistant Pharmacist', 'Cashier']}>
              <CashierMonitor />
            </ProtectedRoute>
          } />
          
          <Route path="/shifts-history" element={
            <ProtectedRoute allowedRoles={['Pharmacist', 'Assistant Pharmacist', 'Cashier']}>
              <ShiftsHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['Pharmacist']}>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
