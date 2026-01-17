// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './ui/components/Layout';
import PublicLayout from './ui/layouts/PublicLayout'; // Importa o novo layout
import { DashboardScreen } from './ui/screens/DashboardScreen';
import { CreateEventScreen } from './ui/screens/CreateEventScreen';
import { ProductsScreen } from './ui/screens/ProductsScreen';
import { BoatsScreen } from './ui/screens/BoatsScreen';
import { ClientHistoryScreen } from './ui/screens/ClientHistoryScreen';
import { VoucherScreen } from './ui/screens/VoucherScreen'; // Importa a nova tela
import { BoardingLocationsScreen } from './ui/screens/BoardingLocationsScreen';
import { VoucherTermsScreen } from './ui/screens/VoucherTermsScreen';
import { CompanyDataScreen } from './ui/screens/CompanyDataScreen';
import { VoucherAppearanceScreen } from './ui/screens/VoucherAppearanceScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
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

        {/* Rota Pública para o Voucher */}
        <Route path="/voucher/:eventId" element={<PublicLayout><VoucherScreen /></PublicLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
