import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './ui/components/Layout';
import PublicLayout from './ui/layouts/PublicLayout';
import { DashboardScreen } from './ui/screens/DashboardScreen';
import { CreateEventScreen } from './ui/screens/CreateEventScreen';
import { ProductsScreen } from './ui/screens/ProductsScreen';
import { BoatsScreen } from './ui/screens/BoatsScreen';
import { RentalPricesScreen } from './ui/screens/RentalPricesScreen';
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
import { CommissionReportScreen } from './ui/screens/CommissionReportScreen';
import { ProfileScreen } from './ui/screens/ProfileScreen';
import { ForgotPasswordScreen } from './ui/screens/ForgotPasswordScreen';
import { ResetPasswordSecretScreen } from './ui/screens/ResetPasswordSecretScreen';
import { SetNewPasswordScreen } from './ui/screens/SetNewPasswordScreen';
import { ProtectedRoute } from './ui/components/ProtectedRoute';
import { initializeMockRepositories } from './core/repositories';

// Initialize mock data on app startup to prevent race conditions in development
initializeMockRepositories();

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes that don't use any layout */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/pending-approval" element={<PendingApprovalScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password-secret" element={<ResetPasswordSecretScreen />} />
        <Route path="/set-new-password" element={<SetNewPasswordScreen />} />

        {/* Public voucher route with a specific public layout */}
        <Route path="/voucher/:eventId" element={<PublicLayout><VoucherScreen /></PublicLayout>} />

        {/* Protected Admin Routes with the main Layout */}
        <Route path="/" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'OWNER']} />}>
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
            <Route path="profile" element={<ProfileScreen />} />

            {/* Routes for SUPER_ADMIN and OWNER only */}
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']}><UserManagementScreen /></ProtectedRoute>} />
            <Route path="commission-report" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}><CommissionReportScreen /></ProtectedRoute>} />
          </Route>
        </Route>

        {/* Fallback for any other route could be a 404 page, but for now, we redirect to login or dashboard */}
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
