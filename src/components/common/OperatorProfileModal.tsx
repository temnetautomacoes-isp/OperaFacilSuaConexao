import React, { useEffect, useRef } from 'react';
import { X, User, CheckCircle2, XCircle, ShoppingBag, ShieldCheck, Phone, Hash } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorProfileModal: React.FC<OperatorProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, sales, cashRegister } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle clicking outside modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen || !currentUser) return null;

  // Calculate today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter sales for the current operator today
  const operatorSalesToday = sales.filter((sale) => {
    const isToday = sale.date.startsWith(todayStr);
    if (!isToday) return false;
    
    // Match operator by name, username or cashierName
    const cashier = (sale.cashierName || '').toLowerCase();
    const currentName = currentUser.name.toLowerCase();
    const firstName = currentName.split(' ')[0];
    const username = currentUser.username.toLowerCase();

    return (
      cashier.includes(firstName) ||
      currentName.includes(cashier) ||
      cashier.includes(username) ||
      (cashRegister.operator && cashRegister.operator.toLowerCase().includes(cashier))
    );
  });

  // Finished and canceled quantities (strictly count, no monetary values)
  const completedSalesCount = operatorSalesToday.filter((s) => s.status === 'concluida').length;
  const canceledSalesCount = operatorSalesToday.filter((s) => s.status === 'cancelada').length;
  const totalOperationsCount = completedSalesCount + canceledSalesCount;

  const operatorNum = currentUser.operatorNumber || (currentUser.role === 'admin' ? '01' : '02');

  return (
    <div
      id="operator-profile-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        id="operator-profile-card"
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              Perfil do Operador
            </span>
            <button
              id="btn-close-operator-modal"
              type="button"
              onClick={onClose}
              title="Fechar perfil (ESC)"
              className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="px-6 pt-4 pb-5 text-center -mt-10">
          {/* Circular profile image with online badge */}
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 rounded-full p-1 bg-white shadow-lg ring-4 ring-orange-500/30 overflow-hidden mx-auto">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl">
                  {currentUser.avatar || <User className="w-10 h-10 text-slate-700" />}
                </div>
              )}
            </div>
            {/* Online status dot */}
            <span
              title="Operador Ativo"
              className="absolute bottom-1 right-2 w-5 h-5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-75"></span>
            </span>
          </div>

          {/* Operator Name & Identification */}
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            {currentUser.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            @{currentUser.username} • {currentUser.role === 'superadmin' ? '👑 Super Administrador (Acesso Total)' : currentUser.role === 'admin' ? 'Gerência / Administrador' : 'Operador(a) de Caixa'}
          </p>

          {/* Operator Number Chip */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-800">
            <Hash className="w-3.5 h-3.5 text-orange-500" />
            <span>Nº do Operador:</span>
            <span className="font-extrabold text-slate-900">#{operatorNum}</span>
          </div>

          {currentUser.phone && (
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <Phone className="w-3 h-3" />
              <span>{currentUser.phone}</span>
            </div>
          )}

          {/* Divider */}
          <div className="my-4 border-t border-slate-100"></div>

          {/* Today's Sales Count Metric Cards */}
          <div className="text-left mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                Desempenho de Hoje
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {totalOperationsCount} {totalOperationsCount === 1 ? 'operação' : 'operações'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Finished Sales Card */}
              <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
                <div className="flex items-center gap-1 text-orange-700 text-xs font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Finalizadas</span>
                </div>
                <div className="text-2xl font-black text-orange-900 leading-none">
                  {completedSalesCount}
                </div>
                <span className="text-[10px] text-orange-700 font-medium mt-1">
                  {completedSalesCount === 1 ? 'venda concluída' : 'vendas concluídas'}
                </span>
              </div>

              {/* Canceled Sales Card */}
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
                <div className="flex items-center gap-1 text-rose-700 text-xs font-semibold mb-1">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Canceladas</span>
                </div>
                <div className="text-2xl font-black text-rose-900 leading-none">
                  {canceledSalesCount}
                </div>
                <span className="text-[10px] text-rose-700 font-medium mt-1">
                  {canceledSalesCount === 1 ? 'venda cancelada' : 'vendas canceladas'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick status bar */}
          <div className="mt-4 p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-center">
            <span className="text-[11px] text-slate-600">
              Sessão iniciada no PDV • Caixa em operação
            </span>
          </div>

          {/* Close Action Button */}
          <button
            id="btn-dismiss-operator-modal"
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
