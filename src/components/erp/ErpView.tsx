import React from 'react';
import { useApp } from '../../context/AppContext';
import { ErpSidebar } from './ErpSidebar';
import { DashboardModule } from './DashboardModule';
import { EstoqueModule } from './EstoqueModule';
import { VendasModule } from './VendasModule';
import { FinanceiroModule } from './FinanceiroModule';
import { RelatoriosModule } from './RelatoriosModule';
import { ConfiguracoesModule } from './ConfiguracoesModule';
import { RecursosHumanosModule } from './RecursosHumanosModule';

export const ErpView: React.FC = () => {
  const { erpModule } = useApp();

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8F9FF] h-[calc(100vh-58px)]">
      {/* Fixed Left Navigation Sidebar */}
      <ErpSidebar />

      {/* Dynamic Module Content Area */}
      <main className="flex-1 overflow-y-auto">
        {erpModule === 'dashboard' && <DashboardModule />}
        {erpModule === 'estoque' && <EstoqueModule />}
        {erpModule === 'rh' && <RecursosHumanosModule />}
        {erpModule === 'vendas' && <VendasModule />}
        {erpModule === 'financeiro' && <FinanceiroModule />}
        {erpModule === 'relatorios' && <FinanceiroModule />}
        {erpModule === 'configuracoes' && <ConfiguracoesModule />}
      </main>
    </div>
  );
};
