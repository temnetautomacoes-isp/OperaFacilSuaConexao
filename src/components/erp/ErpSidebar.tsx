import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  Settings, 
  Sparkles, 
  AlertTriangle,
  Users,
  Network,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Clock
} from 'lucide-react';
import { CompanyInfoModal } from '../common/CompanyInfoModal';
import logoImg from '../../assets/operafacil_logo.png';

export const ErpSidebar: React.FC = () => {
  const { 
    erpModule, 
    setErpModule, 
    products, 
    users, 
    settings, 
    currentUser, 
    logout,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileSidebarOpen,
    setMobileSidebarOpen
  } = useApp();

  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const weekdayStr = currentDateTime.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const dateStr = currentDateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const timeStr = currentDateTime.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" />, allowed: true },
    { 
      id: 'estoque' as const, 
      label: 'Estoque / Produtos', 
      icon: <Package className="w-5 h-5 shrink-0" />, 
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessEstoque !== false,
    },
    { 
      id: 'rh' as const, 
      label: 'Recursos Humanos (RH)', 
      icon: <Users className="w-5 h-5 shrink-0" />, 
      badge: users.length > 0 ? users.length : undefined,
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessRh !== false,
    },
    { 
      id: 'rede' as const, 
      label: 'Rede', 
      icon: <Network className="w-5 h-5 shrink-0" />, 
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessRede !== false,
    },
    { 
      id: 'arquivo' as const, 
      label: 'Arquivo', 
      icon: <FolderOpen className="w-5 h-5 shrink-0" />, 
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessArquivo !== false,
    },
    { 
      id: 'configuracoes' as const, 
      label: 'Configurações', 
      icon: <Settings className="w-5 h-5 shrink-0" />,
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessConfiguracoes !== false,
    },
  ].filter((item) => item.allowed);

  const handleSelectModule = (mod: typeof erpModule) => {
    setErpModule(mod);
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container (Responsive: Drawer on Mobile, Expandable/Collapsible on Desktop) */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-[60] lg:z-auto
          bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-2xl lg:shadow-xs shrink-0
          transition-all duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Top Sidebar Header with Company Logo, Live Clock & Collapse Button */}
        <div className="flex-1 overflow-y-auto">
          {/* Header Bar */}
          <div className="p-3 border-b border-slate-100 flex flex-col gap-2.5 bg-slate-50/50">
            <div className="flex items-center justify-between">
              {/* Company Logo & Brand Name */}
              <button
                type="button"
                id="btn-sidebar-company-logo"
                onClick={() => setShowCompanyInfo(true)}
                title={`Clique para ver informações da empresa (${settings.name || 'Empresa'})`}
                className={`flex items-center gap-2.5 group cursor-pointer text-left overflow-hidden ${isSidebarCollapsed ? 'lg:justify-center w-full' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-slate-200 shadow-2xs group-hover:border-orange-400 group-hover:shadow-xs transition-all shrink-0 p-1">
                  <img
                    src={settings.logoUrl || logoImg}
                    alt={settings.name || 'OperaFácil'}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).src = logoImg;
                    }}
                  />
                </div>

                <div className={`overflow-hidden ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                  <h3 className="font-black text-xs text-slate-900 leading-tight group-hover:text-orange-600 transition-colors truncate">
                    {settings.name || 'OperaFácil'}
                  </h3>
                  <span className="text-[10px] text-orange-600 font-bold tracking-tight block truncate">
                    Gestão & Operação
                  </span>
                </div>
              </button>

              {/* Mobile Close Button (X) */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Fechar Menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Desktop Collapse Button */}
              <button
                type="button"
                id="btn-toggle-sidebar"
                onClick={toggleSidebar}
                className={`hidden lg:flex p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer ml-auto ${isSidebarCollapsed ? 'hidden' : ''}`}
                title="Minimizar barra lateral"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* If Collapsed on Desktop, show Expand Button */}
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden lg:flex items-center justify-center p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer mx-auto w-full"
                title="Expandir barra lateral"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Live Clock & Date Widget */}
            <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-orange-50/80 border border-orange-200/70 text-xs shadow-2xs ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              <div className="flex items-center gap-1.5 text-orange-700 font-bold text-[10px] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="capitalize">{weekdayStr}, {dateStr}</span>
              </div>
              <div className="flex items-center gap-1 font-mono font-black text-[11px] text-slate-800">
                <Clock className="w-3 h-3 text-orange-500 shrink-0" />
                <span>{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Quick Action: Financeiro */}
          {(currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessFinanceiro !== false) && (
            <div className="p-3 border-b border-slate-100">
              <button
                type="button"
                id="btn-sidebar-financeiro-main"
                onClick={() => handleSelectModule('financeiro')}
                title="Acessar Módulo Financeiro"
                className={`w-full py-3 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer ${
                  erpModule === 'financeiro'
                    ? 'bg-slate-900 text-white ring-2 ring-orange-500 shadow-md scale-[1.02]'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                } ${isSidebarCollapsed ? 'lg:px-2' : 'px-3'}`}
              >
                <Wallet className="w-5 h-5 text-orange-400 shrink-0" />
                <span className={`text-xs font-extrabold uppercase tracking-wide truncate ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                  Financeiro
                </span>
              </button>
            </div>
          )}

          {/* Navigation List */}
          <nav className="p-2.5 space-y-1">
            <span className={`text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider block mb-1.5 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              Navegação
            </span>
            {navItems.map((item) => {
              const isActive = erpModule === item.id;
              return (
                <button
                  key={item.id}
                  id={`erp-tab-${item.id}`}
                  onClick={() => handleSelectModule(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'justify-between'} p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-700'}>
                      {item.icon}
                    </span>
                    <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area: Deslogar button at the very bottom */}
        <div className={`p-3 border-t border-slate-100 bg-slate-50/80 text-xs ${isSidebarCollapsed ? 'lg:p-2' : ''}`}>
          {/* Deslogar button at the very bottom */}
          <button
            type="button"
            id="btn-sidebar-logout"
            onClick={() => {
              logout();
            }}
            title="Deslogar do Sistema"
            className={`w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer shadow-2xs group ${isSidebarCollapsed ? 'lg:px-2' : ''}`}
          >
            <LogOut className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className={`tracking-wide uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              Deslogar
            </span>
          </button>
        </div>
      </aside>

      {/* Company Info Modal */}
      <CompanyInfoModal
        isOpen={showCompanyInfo}
        onClose={() => setShowCompanyInfo(false)}
      />
    </>
  );
};
