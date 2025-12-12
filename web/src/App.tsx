import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const LoginScreen = lazy(() => import('./pages/LoginScreen').then(module => ({ default: module.LoginScreen })));
const AdminHome = lazy(() => import('./pages/AdminHome').then(module => ({ default: module.AdminHome })));
const InventoryManager = lazy(() => import('./pages/InventoryManager').then(module => ({ default: module.InventoryManager })));
const ClientManager = lazy(() => import('./pages/ClientManager').then(module => ({ default: module.ClientManager })));
const POS = lazy(() => import('./pages/POS').then(module => ({ default: module.POS })));
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const Staff = lazy(() => import('./pages/Staff').then(module => ({ default: module.Staff })));
const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const RentalsManager = lazy(() => import('./pages/RentalsManager').then(module => ({ default: module.RentalsManager })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <Loader2 className="animate-spin text-gold" size={48} />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminHome />} />
              <Route path="catalog" element={<InventoryManager />} />
              <Route path="clients" element={<ClientManager />} />
              <Route path="pos" element={<POS />} />
              <Route path="reports" element={<Reports />} />
              <Route path="staff" element={<Staff />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="rentals" element={<RentalsManager />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
