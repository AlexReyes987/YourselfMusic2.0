import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { PaymentPage } from './pages/PaymentPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AuthProvider } from './context/AuthContext';

// Layout para las rutas públicas del cliente con Navbar y Footer
const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-brand-dark">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas exclusivas del Panel Administrativo (sin Navbar ni Footer del cliente) */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* Rutas públicas y de clientes */}
        <Route
          path="/*"
          element={
            <ClientLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/confirmation" element={<ConfirmationPage />} />
                <Route path="/my-reservations" element={<MyReservationsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Routes>
            </ClientLayout>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
