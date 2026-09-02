import React from 'react';
import { LayoutDashboard, Sparkles } from 'lucide-react';

export const DashboardModule: React.FC = () => {
  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-58px)] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
              <LayoutDashboard className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Dashboard Principal
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Painel gerencial e indicadores estratégicos do sistema.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Empty Slate / Workspace Container */}
      <div className="min-h-[60vh] rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-12 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 mb-4 shadow-sm">
          <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 mb-1">
          Área do Dashboard Zerada
        </h3>
        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
          Esta área foi temporariamente zerada e está pronta para receber os novos módulos, gráficos e indicadores personalizados conforme as necessidades da sua operação.
        </p>
      </div>
    </div>
  );
};
