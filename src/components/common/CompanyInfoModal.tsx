import React from 'react';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-800">
        
        {/* Header with decorative background */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo container */}
          <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-xl border-2 border-orange-500/50 flex items-center justify-center mb-3">
            <img
              src={settings.logoUrl || logoImg}
              alt={settings.name || 'OperaFácil'}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).src = logoImg;
              }}
            />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span>{settings.name || 'OperaFácil Telecom'}</span>
          </h3>

          <p className="text-xs text-orange-400 font-medium italic mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 inline text-orange-400" />
            "{settings.slogan || 'Sua Conexão Completa'}"
          </p>
        </div>

        {/* Company Details Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Identificação da Empresa:</span>
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
                  E-mail de Contato:
                </span>
                <span className="font-bold text-slate-800">{settings.email}</span>
              </div>
            )}

            {settings.address && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Endereço da Sede / NOC:
                </span>
                <p className="text-slate-700 font-semibold pl-5">{settings.address}</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-tight">
              Instância ativa e sincronizada com a nuvem do Provedor de Internet.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {canAccessSettings && (
            <button
              type="button"
              onClick={handleGoToSettings}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Acessar Configurações</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
