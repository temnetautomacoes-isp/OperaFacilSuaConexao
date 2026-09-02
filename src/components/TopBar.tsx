import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  LayoutDashboard, 
  ShoppingCart, 
  Clock, 
  Lock, 
  Unlock, 
  Sparkles, 
  HelpCircle,
  LogOut,
  UserCheck,
  ShieldAlert,
  Menu
} from 'lucide-react';
import { OperatorProfileModal } from './common/OperatorProfileModal';
import logoImg from '../assets/operafacil_logo.png';

export const TopBar: React.FC = () => {
  const { 
    currentUser,
    logout,
    environment, 
    setEnvironment, 
    settings, 
    cashRegister, 
    openCashRegister, 
    closeCashRegister, 
    activeNotification,
    showNotification,
    products,
    setMobileSidebarOpen
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showCashRegisterPrompt, setShowCashRegisterPrompt] = useState(false);
  const [showOperatorProfile, setShowOperatorProfile] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState('100.00');
  const [operatorInput, setOperatorInput] = useState(currentUser?.name || 'Cláudia Souza (Caixa 01)');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  useEffect(() => {
    if (currentUser?.name) {
      setOperatorInput(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowShortcutsHelp(false);
        setShowCashRegisterPrompt(false);
      }
    };
    if (showShortcutsHelp || showCashRegisterPrompt) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsHelp, showCashRegisterPrompt]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit' 
        }) + ' ' + now.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchToErp = () => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      showNotification('Aviso: O perfil atual é de Operador. Apenas Administradores e Super Admins têm acesso ao ERP.');
      return;
    }
    setEnvironment('erp');
  };

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-slate-800">
      {/* Brand, Hamburger & Slogan */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Button (ERP) */}
        {environment === 'erp' && (
          <button
            type="button"
            id="btn-topbar-mobile-menu"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Abrir Menu de Navegação"
          >
            <Menu className="w-5 h-5 text-orange-400" />
          </button>
        )}

        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0 border border-orange-400/40">
          <img
            src={settings.logoUrl || logoImg}
            alt="OperaFácil"
            className="w-full h-full object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              {settings.name}
            </h1>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-orange-500 text-white shadow-xs">
              Telecom
            </span>
          </div>
          <p className="hidden sm:flex text-xs text-orange-200/90 font-medium italic items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400 inline" />
            "{settings.slogan}"
          </p>
        </div>
      </div>

      {/* Environment Title / Status & Switcher for Admins */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 shadow-inner">
          {environment === 'colaborador' || environment === 'pdv' ? (
            <>
              <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>Área do Colaborador</span>
            </>
          ) : (
            <>
              <LayoutDashboard className="w-4 h-4 text-orange-400" />
              <span>Painel da Gerência (ERP)</span>
            </>
          )}
        </div>

        {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
          <button
            type="button"
            onClick={() => setEnvironment(environment === 'erp' ? 'colaborador' : 'erp')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-300 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <span>Ir para {environment === 'erp' ? 'Área do Colaborador' : 'Painel ERP'}</span>
          </button>
        )}
      </div>

      {/* Right Details: User info, Clock, Shortcuts, Notifications & Logout */}
      <div className="flex items-center gap-2.5">
        {/* Logged in User Pill / Profile Trigger */}
        {currentUser && (
          <button
            id="btn-operator-profile-topbar"
            type="button"
            onClick={() => setShowOperatorProfile(true)}
            title="Clique para ver o perfil do colaborador"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 hover:border-orange-400 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer shadow-xs group"
          >
            <div className="relative shrink-0">
              {currentUser.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-6 h-6 rounded-full object-cover border border-orange-400"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm">{currentUser.avatar || '👤'}</span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 border border-slate-900"></span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-[11px] leading-tight truncate max-w-[120px] group-hover:text-orange-200">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-orange-400 font-semibold leading-tight flex items-center gap-1">
                {currentUser.role === 'superadmin' ? '👑 Super Admin' : currentUser.role === 'admin' ? 'Gerente' : currentUser.position ? currentUser.position.slice(0, 14) : 'Colaborador'}
              </span>
            </div>
          </button>
        )}

        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span>{currentTime || 'Carregando...'}</span>
        </div>

        {/* Shortcuts help button */}
        <button
          id="btn-shortcuts-help"
          onClick={() => setShowShortcutsHelp(true)}
          title="Ver atalhos do teclado"
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Logout Button */}
        <button
          id="btn-topbar-logout"
          onClick={() => {
            logout();
          }}
          title="Sair da Sessão"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md border border-rose-400/40 transition-all cursor-pointer text-left group"
        >
          <LogOut className="w-4 h-4 text-rose-100 group-hover:scale-110 transition-transform shrink-0" />
          <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase text-white drop-shadow-xs">
            SAIR
          </span>
        </button>
      </div>

      {/* Floating Notification Toast */}
      {activeNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2.5 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Cash Register Opening Modal */}
      {showCashRegisterPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-slate-800 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Unlock className="w-5 h-5 text-orange-500" />
              Abertura de Caixa
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe o valor em dinheiro do fundo de troco e o nome do operador responsável.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operador do Caixa:
                </label>
                <input
                  type="text"
                  value={operatorInput}
                  onChange={(e) => setOperatorInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fundo de Troco Inicial (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCashRegisterPrompt(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(initialCashInput) || 0;
                  openCashRegister(val, operatorInput.trim() || 'Operador');
                  setShowCashRegisterPrompt(false);
                }}
                className="px-4 py-2 rounded-lg text-sm bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-sm transition-colors"
              >
                Confirmar Abertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcutsHelp && (
        <div 
          id="shortcuts-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShortcutsHelp(false);
            }
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-lg p-5 max-w-md w-full text-slate-800 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                Atalhos Rápidos de Teclado (PDV)
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-medium">Buscar produto / Foco no código:</span>
                <kbd className="px-2 py-1 bg-orange-100 text-orange-900 border border-orange-300 rounded font-mono text-xs font-bold">F2</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-medium">Finalizar Venda / Pagamento:</span>
                <kbd className="px-2 py-1 bg-orange-500 text-white border border-orange-600 rounded font-mono text-xs font-bold shadow-xs">F4</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-medium">Controle de Caixa (Sangria/Suprimento):</span>
                <kbd className="px-2 py-1 bg-slate-200 text-slate-800 border border-slate-300 rounded font-mono text-xs font-bold">F10</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-medium">Cancelar / Fechar modais / Limpar:</span>
                <kbd className="px-2 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded font-mono text-xs font-bold">ESC</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-medium">Quantidade rápida no código:</span>
                <span className="text-xs text-slate-600 font-mono font-semibold">Ex: digite "3*" e bipe</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operator Profile Modal */}
      <OperatorProfileModal
        isOpen={showOperatorProfile}
        onClose={() => setShowOperatorProfile(false)}
      />
    </header>
  );
};

