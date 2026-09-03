import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Settings, 
  X, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import logoImg from '../../assets/operafacil_logo.png';

interface CompanyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings
}) => {
  const { settings, currentUser, environment, setErpModule } = useApp();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
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

  if (!isOpen) return null;

  const canAccessSettings = currentUser?.role === 'superadmin' || currentUser?.permissions?.canAccessConfiguracoes !== false;

  const handleGoToSettings = () => {
    onClose();
    if (onOpenSettings) {
      onOpenSettings();
    } else if (environment === 'erp') {
      setErpModule('configuracoes');
    }
  };

  return (
    <>
      {/* Invisible/Soft Backdrop for click-outside dismissal */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-150"
      />

      {/* Pop-up Container anchored at Top-Left near the company logo */}
      <div className="fixed top-14 left-3 sm:left-4 z-50 pointer-events-auto">
        <div 
          ref={popoverRef}
          className="w-[320px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800 origin-top-left animate-in fade-in-0 zoom-in-90 slide-in-from-top-2 duration-200 ease-out"
        >
          {/* Header with Company Logo */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-5 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />
            
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-xl border-2 border-orange-500/50 flex items-center justify-center mb-2.5 transform transition-transform duration-200 hover:scale-105">
              <img
                src={settings.logoUrl || logoImg}
                alt={settings.name || 'OperaFácil'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).src = logoImg;
                }}
              />
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
              {settings.name || 'OperaFácil Telecom'}
            </h3>

            <p className="text-[11px] text-orange-400 font-medium italic mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 inline text-orange-400" />
              "{settings.slogan || 'Sua Conexão Completa'}"
            </p>
          </div>

          {/* Company Details Body */}
          <div className="p-4 space-y-3 text-xs">
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Empresa:</span>
                <span className="font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 text-[10px]">
                  Provedor de Internet (ISP)
                </span>
              </div>

              {settings.cnpj && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    CNPJ:
                  </span>
                  <span className="font-mono font-bold text-slate-800">{settings.cnpj}</span>
                </div>
              )}

              {settings.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Telefone / Suporte:
                  </span>
                  <span className="font-bold text-slate-800">{settings.phone}</span>
                </div>
              )}

              {settings.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    E-mail:
                  </span>
                  <span className="font-bold text-slate-800 truncate max-w-[170px]">{settings.email}</span>
                </div>
              )}

              {settings.address && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Endereço da Sede:
                  </span>
                  <p className="text-slate-700 font-semibold pl-5 leading-tight">{settings.address}</p>
                </div>
              )}
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-800 text-[10px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instância ativa e sincronizada com a nuvem do Provedor.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {canAccessSettings && (
              <button
                type="button"
                onClick={handleGoToSettings}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurações</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
};
