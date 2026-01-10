// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './ui/components/Layout';
import { CreateEventScreen } from './ui/screens/CreateEventScreen';
import { ProductsScreen } from './ui/screens/ProductsScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CreateEventScreen />} />
          <Route path="products" element={<ProductsScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
