import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './ui/components/Layout';
import PublicLayout from './ui/layouts/PublicLayout';
import { ProtectedRoute } from './ui/components/ProtectedRoute';

// Lazy loading screens for better performance on mobile/iPhone
const DashboardScreen = lazy(() => import('./ui/screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const CreateEventScreen = lazy(() => import('./ui/screens/CreateEventScreen').then(m => ({ default: m.CreateEventScreen })));
const ProductsScreen = lazy(() => import('./ui/screens/ProductsScreen').then(m => ({ default: m.ProductsScreen })));
const BoatsScreen = lazy(() => import('./ui/screens/BoatsScreen').then(m => ({ default: m.BoatsScreen })));
const ClientHistoryScreen = lazy(() => import('./ui/screens/ClientHistoryScreen').then(m => ({ default: m.ClientHistoryScreen })));
const VoucherScreen = lazy(() => import('./ui/screens/VoucherScreen').then(m => ({ default: m.VoucherScreen })));
const BoardingLocationsScreen = lazy(() => import('./ui/screens/BoardingLocationsScreen').then(m => ({ default: m.BoardingLocationsScreen })));
const TourTypesScreen = lazy(() => import('./ui/screens/TourTypesScreen').then(m => ({ default: m.TourTypesScreen })));
const VoucherTermsScreen = lazy(() => import('./ui/screens/VoucherTermsScreen').then(m => ({ default: m.VoucherTermsScreen })));
const CompanyDataScreen = lazy(() => import('./ui/screens/CompanyDataScreen').then(m => ({ default: m.CompanyDataScreen })));
const VoucherAppearanceScreen = lazy(() => import('./ui/screens/VoucherAppearanceScreen').then(m => ({ default: m.VoucherAppearanceScreen })));
const LoginScreen = lazy(() => import('./ui/screens/LoginScreen').then(m => ({ default: m.LoginScreen })));
const SignupScreen = lazy(() => import('./ui/screens/SignupScreen').then(m => ({ default: m.SignupScreen })));
const PendingApprovalScreen = lazy(() => import('./ui/screens/PendingApprovalScreen').then(m => ({ default: m.PendingApprovalScreen })));
const UserManagementScreen = lazy(() => import('./ui/screens/UserManagementScreen').then(m => ({ default: m.UserManagementScreen })));
const UserCommissionsScreen = lazy(() => import('./ui/screens/UserCommissionsScreen').then(m => ({ default: m.UserCommissionsScreen })));
const CommissionReportScreen = lazy(() => import('./ui/screens/CommissionReportScreen').then(m => ({ default: m.CommissionReportScreen })));
const FinanceScreen = lazy(() => import('./ui/screens/FinanceScreen').then(m => ({ default: m.FinanceScreen })));
const CashBookScreen = lazy(() => import('./ui/screens/CashBookScreen').then(m => ({ default: m.CashBookScreen })));
const ExpensesScreen = lazy(() => import('./ui/screens/ExpensesScreen').then(m => ({ default: m.ExpensesScreen })));
const ExpenseCategoriesScreen = lazy(() => import('./ui/screens/ExpenseCategoriesScreen').then(m => ({ default: m.ExpenseCategoriesScreen })));
const ProfileScreen = lazy(() => import('./ui/screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const ForgotPasswordScreen = lazy(() => import('./ui/screens/ForgotPasswordScreen').then(m => ({ default: m.ForgotPasswordScreen })));
const ResetPasswordSecretScreen = lazy(() => import('./ui/screens/ResetPasswordSecretScreen').then(m => ({ default: m.ResetPasswordSecretScreen })));
const SetNewPasswordScreen = lazy(() => import('./ui/screens/SetNewPasswordScreen').then(m => ({ default: m.SetNewPasswordScreen })));
const GoogleSyncScreen = lazy(() => import('./ui/screens/GoogleSyncScreen').then(m => ({ default: m.GoogleSyncScreen })));
const PrivacyPolicyScreen = lazy(() => import('./ui/screens/PrivacyPolicyScreen').then(m => ({ default: m.PrivacyPolicyScreen })));
const TermsOfServiceScreen = lazy(() => import('./ui/screens/TermsOfServiceScreen').then(m => ({ default: m.TermsOfServiceScreen })));
const LandingScreen = lazy(() => import('./ui/screens/LandingScreen').then(m => ({ default: m.LandingScreen })));

// Simple loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes that don't use any layout */}
          <Route path="/" element={<LandingScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/pending-approval" element={<PendingApprovalScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password-secret" element={<ResetPasswordSecretScreen />} />
          <Route path="/set-new-password" element={<SetNewPasswordScreen />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
          <Route path="/terms-of-service" element={<TermsOfServiceScreen />} />

          {/* Public voucher route with a specific public layout */}
          <Route path="/voucher/:eventId" element={<PublicLayout><VoucherScreen /></PublicLayout>} />

          {/* Protected Admin Routes with the main Layout */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SELLER']} />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardScreen />} />
              <Route path="create-event" element={<CreateEventScreen />} />
              <Route path="products" element={<ProductsScreen />} />
              <Route path="boats" element={<BoatsScreen />} />
              <Route path="boarding-locations" element={<BoardingLocationsScreen />} />
              <Route path="tour-types" element={<TourTypesScreen />} />
              <Route path="clients" element={<ClientHistoryScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
              <Route path="google-sync" element={<GoogleSyncScreen />} />

              {/* Routes for SUPER_ADMIN and OWNER only (Sensitive Settings) */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'OWNER']} />}>
                <Route path="voucher-terms" element={<VoucherTermsScreen />} />
                <Route path="company-data" element={<CompanyDataScreen />} />
                <Route path="voucher-appearance" element={<VoucherAppearanceScreen />} />
                <Route path="commission-report" element={<CommissionReportScreen />} />
                <Route path="finance" element={<FinanceScreen />} />
                <Route path="cash-book" element={<CashBookScreen />} />
                <Route path="expenses" element={<ExpensesScreen />} />
                <Route path="expense-categories" element={<ExpenseCategoriesScreen />} />
              </Route>

              {/* Routes for ADMIN, SUPER_ADMIN and OWNER (User management) */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'OWNER']} />}>
                <Route path="admin/users" element={<UserManagementScreen />} />
                <Route path="admin/commissions" element={<UserCommissionsScreen />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback for any other route could be a 404 page, but for now, we redirect to login or dashboard */}
          <Route path="*" element={<LoginScreen />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
