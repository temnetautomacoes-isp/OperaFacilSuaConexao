import React from 'react';
import { useApp } from '../../context/AppContext';
import { ErpSidebar } from './ErpSidebar';
import { DashboardModule } from './DashboardModule';
import { EstoqueModule } from './EstoqueModule';
import { VendasModule } from './VendasModule';
import { FinanceiroModule } from './FinanceiroModule';
import { ConfiguracoesModule } from './ConfiguracoesModule';
import { RecursosHumanosModule } from './RecursosHumanosModule';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  Users, 
  Menu 
} from 'lucide-react';

export const ErpView: React.FC = () => {
  const { erpModule, setErpModule, setMobileSidebarOpen } = useApp();

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#F8F9FF] h-[calc(100vh-58px)] relative">
      {/* Fixed/Responsive Left Navigation Sidebar */}
      <ErpSidebar />

      {/* Dynamic Module Content Area */}
      <main className="flex-1 overflow-y-auto w-full pb-20 lg:pb-4 p-2 sm:p-4 lg:p-6 transition-all">
        {erpModule === 'dashboard' && <DashboardModule />}
        {erpModule === 'estoque' && <EstoqueModule />}
        {erpModule === 'rh' && <RecursosHumanosModule />}
        {erpModule === 'vendas' && <VendasModule />}
        {erpModule === 'financeiro' && <FinanceiroModule />}
        {erpModule === 'relatorios' && <FinanceiroModule />}
        {erpModule === 'configuracoes' && <ConfiguracoesModule />}
      </main>

      {/* Modern Mobile Bottom Navigation Bar (iOS / Smartphone layout) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-2 px-2 shadow-2xl safe-area-bottom">
        <button
          type="button"
          onClick={() => setErpModule('dashboard')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            erpModule === 'dashboard' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        <button
          type="button"
          onClick={() => setErpModule('estoque')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            erpModule === 'estoque' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Estoque</span>
        </button>

        {/* Central Highlighted Financeiro Button */}
        <button
          type="button"
          onClick={() => setErpModule('financeiro')}
          className="flex flex-col items-center -mt-5"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            erpModule === 'financeiro'
              ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white ring-4 ring-slate-900 shadow-orange-500/30'
              : 'bg-slate-800 text-orange-400 border border-slate-700'
          }`}>
            <Wallet className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-bold mt-1 ${
            erpModule === 'financeiro' ? 'text-orange-400' : 'text-slate-400'
          }`}>
            Financeiro
          </span>
        </button>

        <button
          type="button"
          onClick={() => setErpModule('rh')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            erpModule === 'rh' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">RH</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Mais</span>
        </button>
      </nav>
    </div>
  );
};
