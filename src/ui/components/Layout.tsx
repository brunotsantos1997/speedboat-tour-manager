// src/ui/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, PlusCircle, Settings, Users, LayoutDashboard, Palette, UserCog, TrendingUp, LogOut } from 'lucide-react';
import { useCompanyDataViewModel } from '../../viewmodels/CompanyDataViewModel';
import { useAuth } from '../../contexts/AuthContext';


const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; appName: string }> = ({ isOpen, onClose, appName }) => {
  const { currentUser, getAllUsers, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER') {
      const fetchPendingUsers = async () => {
        try {
          const users = await getAllUsers();
          const pendingCount = users.filter(u => u.status === 'PENDING').length;
          setPendingUsersCount(pendingCount);
        } catch (error) {
          console.error("Failed to fetch pending users:", error);
        }
      };
      fetchPendingUsers();
    }
  }, [currentUser, getAllUsers]);

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
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform z-40 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:w-64 md:flex-shrink-0`}
      >
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-center truncate">{appName}</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavLink to="/" className={navLinkClass} onClick={onClose} end>
            <LayoutDashboard className="mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/create-event" className={navLinkClass} onClick={onClose}>
            <PlusCircle className="mr-3" />
            <span>Criar Passeio</span>
          </NavLink>

          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') && (
            <NavLink to="/admin/users" className={navLinkClass + ' justify-between'} onClick={onClose}>
              <div className="flex items-center">
                <UserCog className="mr-3" />
                <span>Gerenciar Usuários</span>
              </div>
              {pendingUsersCount > 0 && (
                <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                  {pendingUsersCount}
                </span>
              )}
            </NavLink>
          )}

          {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN') && (
            <NavLink to="/commission-report" className={navLinkClass} onClick={onClose}>
              <TrendingUp className="mr-3" />
              <span>Relatório de Comissão</span>
            </NavLink>
          )}

          {/* Settings Dropdown */}
          {(currentUser?.role !== 'SELLER') && (
            <div>
              <button
                className="flex items-center w-full px-4 py-3 text-lg font-semibold text-left text-gray-700 rounded-lg hover:bg-gray-200"
                onClick={(e) => {
                  const submenu = e.currentTarget.nextElementSibling;
                  submenu?.classList.toggle('hidden');
                }}
              >
                <Settings className="mr-3" />
                Configurações
              </button>
            <div className="pl-10 space-y-2 hidden">
              <NavLink to="/products" className={navLinkClass} onClick={onClose}>
                Produtos
              </NavLink>
              <NavLink to="/boats" className={navLinkClass} onClick={onClose}>
                Lanchas
              </NavLink>
              <NavLink to="/boarding-locations" className={navLinkClass} onClick={onClose}>
                Locais de Embarque
              </NavLink>
              {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN') && (
                <>
                  <NavLink to="/voucher-terms" className={navLinkClass} onClick={onClose}>
                    Termos do Voucher
                  </NavLink>
                </>
              )}
            </div>
          </div>
          )}
          {/* Personalization Dropdown */}
          {(currentUser?.role === 'OWNER' || currentUser?.role === 'SUPER_ADMIN') && (
            <div>
              <button
                className="flex items-center w-full px-4 py-3 text-lg font-semibold text-left text-gray-700 rounded-lg hover:bg-gray-200"
                onClick={(e) => {
                  const submenu = e.currentTarget.nextElementSibling;
                  submenu?.classList.toggle('hidden');
                }}
              >
                <Palette className="mr-3" />
                Personalização
              </button>
              <div className="pl-10 space-y-2 hidden">
                <NavLink to="/company-data" className={navLinkClass} onClick={onClose}>
                  Dados da Empresa
                </NavLink>
                <NavLink to="/voucher-appearance" className={navLinkClass} onClick={onClose}>
                  Aparência do Voucher
                </NavLink>
              </div>
            </div>
          )}
          {(currentUser?.role !== 'SELLER') && (
            <NavLink to="/clients" className={navLinkClass} onClick={onClose}>
              <Users className="mr-3" />
              Clientes
            </NavLink>
          )}
          <NavLink to="/profile" className={navLinkClass} onClick={onClose}>
            <UserCog className="mr-3" />
            Meu Perfil
          </NavLink>
        </nav>
        <div className="p-4 border-t flex-shrink-0">
            <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-lg font-semibold text-left text-red-600 rounded-lg hover:bg-red-100"
            >
                <LogOut className="mr-3" />
                Sair
            </button>
        </div>
      </aside>
    </>
  );
};

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { companyData } = useCompanyDataViewModel();
  const [appName, setAppName] = useState('BoatManager');

  useEffect(() => {
    if (companyData) {
      setAppName(companyData.appName);
    }
  }, [companyData]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} appName={appName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md md:hidden">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-xl font-bold">{appName}</h1>
            <button onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
