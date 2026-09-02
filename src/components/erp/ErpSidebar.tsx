import React, { useState } from 'react';
import { useApp, ErpModule } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Wallet, 
  BarChart3, 
  Settings, 
  ShoppingCart, 
  Sparkles, 
  AlertTriangle,
  LogOut,
  UserCheck,
  Users,
  ShieldAlert
} from 'lucide-react';
import { OperatorProfileModal } from '../common/OperatorProfileModal';

export const ErpSidebar: React.FC = () => {
  const { erpModule, setErpModule, setEnvironment, products, users, settings, currentUser, logout } = useApp();
  const [showOperatorProfile, setShowOperatorProfile] = useState(false);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, allowed: true },
    { 
      id: 'estoque' as const, 
      label: 'Estoque / Produtos', 
      icon: <Package className="w-4 h-4" />, 
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessEstoque !== false,
    },
    { 
      id: 'rh' as const, 
      label: 'Recursos Humanos (RH)', 
      icon: <Users className="w-4 h-4" />, 
      badge: users.length > 0 ? users.length : undefined,
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessRh !== false,
    },
    { 
      id: 'configuracoes' as const, 
      label: 'Configurações', 
      icon: <Settings className="w-4 h-4" />,
      allowed: currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessConfiguracoes !== false,
    },
  ].filter((item) => item.allowed);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-xs shrink-0">
      {/* Top Sidebar section */}
      <div>
        {/* Quick Action: Financeiro */}
        {(currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessFinanceiro !== false) && (
          <div className="p-3 border-b border-slate-100">
            <button
              type="button"
              id="btn-sidebar-financeiro-main"
              onClick={() => setErpModule('financeiro')}
              className={`w-full py-3 px-3 rounded-lg text-sm font-black tracking-wide flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer ${
                erpModule === 'financeiro'
                  ? 'bg-slate-900 text-white ring-2 ring-orange-500 shadow-md scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Wallet className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-extrabold uppercase tracking-wide">Financeiro</span>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider block mb-1">
            Gestão & Controle
          </span>
          {navItems.map((item) => {
            const isActive = erpModule === item.id;
            return (
              <button
                key={item.id}
                id={`erp-tab-${item.id}`}
                onClick={() => setErpModule(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-orange-500' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Store Slogan, User Profile & mini status */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2.5 text-xs">
        {currentUser && (
          <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs gap-2">
            <button
              type="button"
              onClick={() => setShowOperatorProfile(true)}
              title="Clique para ver o perfil do operador"
              className="flex items-center gap-2 overflow-hidden text-left hover:bg-slate-50 p-1 rounded transition-colors flex-1 cursor-pointer group"
            >
              <div className="relative shrink-0">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-orange-500 ring-1 ring-orange-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-base">{currentUser.avatar || '👤'}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 border border-white"></span>
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="font-bold text-slate-800 text-xs truncate group-hover:text-orange-600">
                  {currentUser.name}
                </span>
                <span className="text-[10px] uppercase font-semibold text-orange-600">
                  {currentUser.role === 'superadmin' ? '👑 Super Administrador' : currentUser.role === 'admin' ? 'Administrador' : `Op. #${currentUser.operatorNumber || '02'}`}
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                logout();
              }}
              title="Sair do Sistema"
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase leading-none">SAIR</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-slate-700 font-semibold px-1">
          <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="truncate">{settings.name}</span>
        </div>
        <p className="text-[11px] text-slate-500 italic leading-snug px-1">
          "{settings.slogan}"
        </p>

        {lowStockCount > 0 && (
          <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-orange-800 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>{lowStockCount} produto(s) abaixo do estoque mínimo.</span>
          </div>
        )}
      </div>

      {/* Operator Profile Modal in ERP Sidebar */}
      <OperatorProfileModal
        isOpen={showOperatorProfile}
        onClose={() => setShowOperatorProfile(false)}
      />
    </aside>
  );
};

