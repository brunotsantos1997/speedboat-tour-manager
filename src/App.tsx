import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './ui/components/Layout';
import PublicLayout from './ui/layouts/PublicLayout';
import { DashboardScreen } from './ui/screens/DashboardScreen';
import { CreateEventScreen } from './ui/screens/CreateEventScreen';
import { ProductsScreen } from './ui/screens/ProductsScreen';
import { BoatsScreen } from './ui/screens/BoatsScreen';
import { ClientHistoryScreen } from './ui/screens/ClientHistoryScreen';
import { VoucherScreen } from './ui/screens/VoucherScreen';
import { BoardingLocationsScreen } from './ui/screens/BoardingLocationsScreen';
import { VoucherTermsScreen } from './ui/screens/VoucherTermsScreen';
import { CompanyDataScreen } from './ui/screens/CompanyDataScreen';
import { VoucherAppearanceScreen } from './ui/screens/VoucherAppearanceScreen';
import { LoginScreen } from './ui/screens/LoginScreen';
import { SignupScreen } from './ui/screens/SignupScreen';
import { PendingApprovalScreen } from './ui/screens/PendingApprovalScreen';
import { UserManagementScreen } from './ui/screens/UserManagementScreen';
import { ProtectedRoute } from './ui/components/ProtectedRoute';
import { initializeMockRepositories } from './core/repositories';

// Initialize mock data on app startup to prevent race conditions in development
initializeMockRepositories();

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/pending-approval" element={<PendingApprovalScreen />} />
        <Route path="/voucher/:eventId" element={<PublicLayout><VoucherScreen /></PublicLayout>} />

        {/* Protected Admin Routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<DashboardScreen />} />
            <Route path="create-event" element={<CreateEventScreen />} />
            <Route path="products" element={<ProductsScreen />} />
            <Route path="boats" element={<BoatsScreen />} />
            <Route path="boarding-locations" element={<BoardingLocationsScreen />} />
            <Route path="voucher-terms" element={<VoucherTermsScreen />} />
            <Route path="clients" element={<ClientHistoryScreen />} />
            <Route path="company-data" element={<CompanyDataScreen />} />
            <Route path="voucher-appearance" element={<VoucherAppearanceScreen />} />
          </Route>
        </Route>

        {/* SUPER_ADMIN and OWNER Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']} />}>
            <Route element={<Layout />}>
                <Route path="users" element={<UserManagementScreen />} />
            </Route>
        </Route>

        {/* Rota Pública para o Voucher (não usa o Layout principal) */}
        <Route path="/voucher/:eventId" element={<PublicLayout><VoucherScreen /></PublicLayout>} />

        {/* Rotas Administrativas com Layout Principal */}
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardScreen />} />
          <Route path="create-event" element={<CreateEventScreen />} />
          <Route path="products" element={<ProductsScreen />} />
          <Route path="boats" element={<BoatsScreen />} />
          <Route path="boarding-locations" element={<BoardingLocationsScreen />} />
          <Route path="voucher-terms" element={<VoucherTermsScreen />} />
          <Route path="clients" element={<ClientHistoryScreen />} />
          <Route path="company-data" element={<CompanyDataScreen />} />
          <Route path="voucher-appearance" element={<VoucherAppearanceScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
