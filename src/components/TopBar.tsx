import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Menu } from 'lucide-react';
import { OperatorProfileModal } from './common/OperatorProfileModal';

export const TopBar: React.FC = () => {
  const { 
    currentUser,
    environment, 
    activeNotification,
    setMobileSidebarOpen
  } = useApp();

  const [showOperatorProfile, setShowOperatorProfile] = useState(false);

  return (
    <>
      {/* 1. Mobile Menu Trigger for ERP */}
      {environment === 'erp' && (
        <div className="fixed top-3.5 left-3.5 z-40 lg:hidden select-none">
          <button
            type="button"
            id="btn-topbar-mobile-menu"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-slate-700 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md active:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center justify-center hover:scale-105"
            title="Abrir Menu de Navegação"
          >
            <Menu className="w-5 h-5 text-orange-500" />
          </button>
        </div>
      )}

      {/* 2. Floating User Profile Avatar (Top-Right) - Apenas a bolinha com foto */}
      {currentUser && (
        <div className="fixed top-3.5 right-4 z-40 select-none">
          <button
            id="btn-operator-profile-topbar"
            type="button"
            onClick={() => setShowOperatorProfile(true)}
            title={`Perfil: ${currentUser.name} (${currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role === 'admin' ? 'Gerente' : currentUser.position || 'Colaborador'})`}
            className="w-10 h-10 rounded-full overflow-hidden p-0.5 bg-white/95 backdrop-blur-md border-2 border-orange-500 shadow-md ring-2 ring-orange-500/20 hover:ring-orange-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center group relative"
          >
            {currentUser.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-bold text-slate-700">{currentUser.avatar || '👤'}</span>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Online" />
          </button>
        </div>
      )}

      {/* Operator Profile Modal (opened by clicking avatar) */}
      <OperatorProfileModal
        isOpen={showOperatorProfile}
        onClose={() => setShowOperatorProfile(false)}
      />

      {/* Floating Notification Toast */}
      {activeNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          <span>{activeNotification}</span>
        </div>
      )}
    </>
  );
};
