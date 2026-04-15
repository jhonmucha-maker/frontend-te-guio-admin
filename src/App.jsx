import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import { STORAGE_KEYS } from './utils/constants';
import { Spinner } from './components/ui';

// Lazy load de páginas
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
import MainLayout from './components/layout/MainLayout';
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const BuyersPage = lazy(() => import('./pages/admin/BuyersPage'));
const SellersPage = lazy(() => import('./pages/admin/SellersPage'));
const RegistrationRequestsPage = lazy(() => import('./pages/admin/RegistrationRequestsPage'));
const ProductRequestsPage = lazy(() => import('./pages/admin/ProductRequestsPage'));
const StoreRequestsPage = lazy(() => import('./pages/admin/StoreRequestsPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminStoresPage = lazy(() => import('./pages/admin/AdminStoresPage'));
const PremiumSubscriptionsPage = lazy(() => import('./pages/admin/PremiumSubscriptionsPage'));
const PaymentMethodsPage = lazy(() => import('./pages/admin/PaymentMethodsPage'));
const FinancesPage = lazy(() => import('./pages/admin/FinancesPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const ComplaintsPage = lazy(() => import('./pages/admin/ComplaintsPage'));
const ConfigPage = lazy(() => import('./pages/admin/ConfigPage'));
const PushNotificationsPage = lazy(() => import('./pages/admin/PushNotificationsPage'));
const AdminsManagementPage = lazy(() => import('./pages/admin/AdminsManagementPage'));

// Componente de carga
const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen w-screen bg-neutral-100">
    <Spinner size="lg" />
  </div>
);

// Ruta protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol admin
  if (user?.rol !== 'ADMINISTRADOR') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  // Escuchar evento auth:logout disparado por el interceptor de API
  // cuando el token expira y el refresh falla
  useEffect(() => {
    let isLoggingOut = false;
    const handleForceLogout = () => {
      if (isLoggingOut) return;
      isLoggingOut = true;
      // Limpiar tokens directamente para evitar que logout() dispare
      // otra petición HTTP que re-entre en el ciclo 401 → auth:logout
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rutas protegidas - Admin */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="buyers" element={<BuyersPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="registration-requests" element={<RegistrationRequestsPage />} />
          <Route path="product-requests" element={<ProductRequestsPage />} />
          <Route path="store-requests" element={<StoreRequestsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="stores" element={<AdminStoresPage />} />
          <Route path="subscriptions" element={<PremiumSubscriptionsPage />} />
          <Route path="payment-methods" element={<PaymentMethodsPage />} />
          <Route path="finances" element={<FinancesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="admins" element={<AdminsManagementPage />} />
          <Route path="push-notifications" element={<PushNotificationsPage />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
