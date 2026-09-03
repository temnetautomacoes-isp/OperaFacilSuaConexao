import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Calendar,
  Sparkles, 
  HelpCircle,
  Menu,
  Activity
} from 'lucide-react';
import { OperatorProfileModal } from './common/OperatorProfileModal';
import { CompanyInfoModal } from './common/CompanyInfoModal';
import logoImg from '../assets/operafacil_logo.png';

export const TopBar: React.FC = () => {
  const { 
    currentUser,
    environment, 
    settings, 
    activeNotification,
    setMobileSidebarOpen
  } = useApp();

  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [showOperatorProfile, setShowOperatorProfile] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Date and Time strings
  const weekdayStr = currentDateTime.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const dateStr = currentDateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const timeStr = currentDateTime.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-800 shadow-xs sticky top-0 z-[100] px-4 py-2.5 flex items-center justify-between border-b border-slate-200/90 transition-all select-none">
      
      {/* ======================================================================= */}
      {/* 1. CANTO SUPERIOR ESQUERDO: SOMENTE A LOGO DA EMPRESA (INTERATIVA) */}
      {/* ======================================================================= */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Button (ERP) */}
        {environment === 'erp' && (
          <button
            type="button"
            id="btn-topbar-mobile-menu"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Abrir Menu de Navegação"
          >
            <Menu className="w-5 h-5 text-orange-500" />
          </button>
        )}

        {/* Company Logo Only Button */}
        <button
          type="button"
          id="btn-company-logo-topbar"
          onClick={() => setShowCompanyInfo(true)}
          title={`Clique para ver informações da empresa (${settings.name || 'Empresa'})`}
          className="p-1 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-orange-400 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-orange-500/20"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white">
            <img
              src={settings.logoUrl || logoImg}
              alt={settings.name || 'OperaFácil'}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).src = logoImg;
              }}
            />
          </div>
        </button>
      </div>

      {/* ======================================================================= */}
      {/* 2. CANTO SUPERIOR DIREITO: DATA/HORA LÚDICA & NOME + FOTO DO USUÁRIO */}
      {/* ======================================================================= */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        
        {/* DATA E HORA LÚDICA & MODERNA (À ESQUERDA DO USUÁRIO) */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 border border-orange-200/80 shadow-xs hover:shadow-sm transition-all text-xs"
          title="Horário Oficial de Brasília sincronizado"
        >
          {/* Animated activity pulse */}
          <div className="flex items-center gap-1.5 text-orange-600 font-bold uppercase text-[10px] tracking-wider pr-1.5 border-r border-orange-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline capitalize">{weekdayStr}, {dateStr}</span>
            <span className="sm:hidden">{dateStr}</span>
          </div>

          {/* Digital Clock */}
          <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm text-slate-800 tracking-tight">
            <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>{timeStr}</span>
          </div>
        </div>

        {/* NOME DO COLABORADOR À ESQUERDA + FOTO DO USUÁRIO À DIREITA */}
        {currentUser && (
          <button
            id="btn-operator-profile-topbar"
            type="button"
            onClick={() => setShowOperatorProfile(true)}
            title="Clique para ver perfil, informações e alterar foto"
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-orange-50/60 active:bg-slate-100 border border-slate-200 hover:border-orange-400 rounded-2xl px-3 py-1.5 text-xs transition-all cursor-pointer shadow-xs hover:shadow-md group"
          >
            {/* 1. Nome Social / Nome do Colaborador (À ESQUERDA DA FOTO) */}
            <div className="flex flex-col text-right">
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate max-w-[130px] sm:max-w-[170px] group-hover:text-orange-600 transition-colors">
                {currentUser.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-orange-600 font-bold leading-tight">
                {currentUser.role === 'superadmin' ? '👑 Super Admin' : currentUser.role === 'admin' ? 'Gerente' : currentUser.position ? currentUser.position.slice(0, 16) : 'Colaborador'}
              </span>
            </div>

            {/* 2. Foto do Usuário Operador (À DIREITA) */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden p-0.5 bg-white border-2 border-orange-500 shadow-xs ring-2 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all flex items-center justify-center">
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
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Online" />
            </div>
          </button>
        )}

      </div>

      {/* ======================================================================= */}
      {/* 3. MODAIS ASSOCIADOS */}
      {/* ======================================================================= */}
      
      {/* Company Info Modal (opened by clicking Top-Left Logo) */}
      <CompanyInfoModal
        isOpen={showCompanyInfo}
        onClose={() => setShowCompanyInfo(false)}
      />

      {/* Operator Profile Modal (opened by clicking Top-Right User Pill) */}
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

    </header>
  );
};
