import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Gallery } from './pages/Gallery';
import { DressDetails } from './pages/DressDetails';
import { Scanner } from './pages/Scanner';
import { Profile } from './pages/Profile';
import { ShiftProvider } from './context/ShiftContext';

function App() {
  return (
    <AuthProvider>
      <ShiftProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="dress/:id" element={<DressDetails />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ShiftProvider>
    </AuthProvider>
  );
}

export default App;
