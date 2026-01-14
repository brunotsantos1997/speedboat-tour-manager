// src/ui/components/Layout.tsx
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, PlusCircle, Settings, Anchor, Users, LayoutDashboard } from 'lucide-react';

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-lg font-semibold rounded-lg transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:w-64 md:flex-shrink-0`}
      >
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-center">BoatManager</h2>
        </div>
        <nav className="p-4 space-y-2">
          <NavLink to="/" className={navLinkClass} onClick={onClose} end>
            <LayoutDashboard className="mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/create-event" className={navLinkClass} onClick={onClose}>
            <PlusCircle className="mr-3" />
            Criar Passeio
          </NavLink>
          <NavLink to="/products" className={navLinkClass} onClick={onClose}>
            <Settings className="mr-3" />
            Configurar Produtos
          </NavLink>
          <NavLink to="/boats" className={navLinkClass} onClick={onClose}>
            <Anchor className="mr-3" />
            Configurar Lanchas
          </NavLink>
          <NavLink to="/clients" className={navLinkClass} onClick={onClose}>
            <Users className="mr-3" />
            Clientes
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export const Layout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md md:hidden">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-xl font-bold">BoatManager</h1>
            <button onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
