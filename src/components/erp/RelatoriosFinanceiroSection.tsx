import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Sale, FinancialEntry, CustomerDebt, ProductLossEntry } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Printer, 
  Package, 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Users, 
  Truck, 
  Sparkles,
  Info,
  Award,
  Layers,
  ShieldAlert,
  Trash2,
  Building2,
  Percent,
  Zap,
  CalendarX,
  CalendarClock,
  Tag,
  Boxes,
  FileText
} from 'lucide-react';

export const RelatoriosFinanceiroSection: React.FC = () => {
  const { products, sales, financialEntries, customers, suppliers, productLosses } = useApp();

  // Internal tab: 'graficos' | 'lucratividade' | 'fornecedores'
  const [activeReportSubTab, setActiveReportSubTab] = useState<
    'graficos' | 'lucratividade' | 'fornecedores'
  >('graficos');

  // Drilldown Modal States for Clickable Charts
  const [selectedStockCategory, setSelectedStockCategory] = useState<string | null>(null);
  const [selectedFinancialGroup, setSelectedFinancialGroup] = useState<'receitas' | 'fornecedores' | 'pendentes' | 'fiado' | 'lucro' | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // =========================================================================
  // 1. ESTOQUE STATS & CATEGORY BREAKDOWN
  // =========================================================================
  const totalStockItemsCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalStockCostValue = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
  const totalStockSaleValue = products.reduce((acc, p) => acc + (p.salePrice * p.stock), 0);
  const projectedStockProfit = totalStockSaleValue - totalStockCostValue;

  const stockByCategory: Record<string, { count: number; totalCost: number; totalSale: number; items: Product[] }> = {};
  products.forEach((p) => {
    const cat = p.category || 'Geral';
    if (!stockByCategory[cat]) {
      stockByCategory[cat] = { count: 0, totalCost: 0, totalSale: 0, items: [] };
    }
    stockByCategory[cat].count += p.stock;
    stockByCategory[cat].totalCost += p.costPrice * p.stock;
    stockByCategory[cat].totalSale += p.salePrice * p.stock;
    stockByCategory[cat].items.push(p);
  });

  const stockCategoryList = Object.entries(stockByCategory)
    .map(([category, data]) => ({
      category,
      count: data.count,
      totalCost: data.totalCost,
      totalSale: data.totalSale,
      items: data.items,
      percent: totalStockCostValue > 0 ? (data.totalCost / totalStockCostValue) * 100 : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  // =========================================================================
  // 2. FINANCEIRO STATS & COMPARATIVE DRILLDOWN
  // =========================================================================
  const paidSalesRevenue = financialEntries
    .filter((e) => e.type === 'receita' && e.status === 'pago')
    .reduce((acc, e) => acc + e.amount, 0);

  const paidSupplierExpenses = financialEntries
    .filter((e) => e.category === 'Fornecedores' && e.status === 'pago')
    .reduce((acc, e) => acc + e.amount, 0);

  const pendingSupplierExpenses = financialEntries
    .filter((e) => e.category === 'Fornecedores' && e.status === 'pendente')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalFiadoReceivable = customers.reduce((acc, c) => acc + c.balance, 0);
  const netOperatingProfit = paidSalesRevenue - paidSupplierExpenses;

  // Max for relative bar sizing
  const maxFinVal = Math.max(paidSalesRevenue, paidSupplierExpenses, pendingSupplierExpenses, totalFiadoReceivable, Math.abs(netOperatingProfit), 1);

  // =========================================================================
  // 3. VENDAS STATS & PAYMENT METHODS BREAKDOWN
  // =========================================================================
  const completedSales = sales.filter((s) => s.status === 'concluida');
  const totalSalesRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
  const averageTicket = completedSales.length > 0 ? totalSalesRevenue / completedSales.length : 0;

  const salesByPaymentMethod: Record<string, { count: number; total: number; sales: Sale[] }> = {};
  completedSales.forEach((s) => {
    const method = s.paymentMethod || 'dinheiro';
    if (!salesByPaymentMethod[method]) {
      salesByPaymentMethod[method] = { count: 0, total: 0, sales: [] };
    }
    salesByPaymentMethod[method].count += 1;
    salesByPaymentMethod[method].total += s.total;
    salesByPaymentMethod[method].sales.push(s);
  });

  const paymentMethodLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    dinheiro: { label: 'Dinheiro à Vista', icon: '💵', color: 'text-emerald-700', bg: 'bg-emerald-500' },
    pix: { label: 'PIX Instantâneo', icon: '⚡', color: 'text-teal-700', bg: 'bg-teal-500' },
    cartao_credito: { label: 'Cartão de Crédito', icon: '💳', color: 'text-blue-700', bg: 'bg-blue-500' },
    cartao_debito: { label: 'Cartão de Débito', icon: '💳', color: 'text-indigo-700', bg: 'bg-indigo-500' },
    fiado: { label: 'Caderninho (Fiado)', icon: '📒', color: 'text-amber-700', bg: 'bg-amber-500' },
  };

  const paymentMethodList = Object.entries(salesByPaymentMethod)
    .map(([method, data]) => ({
      method,
      label: paymentMethodLabels[method]?.label || method,
      icon: paymentMethodLabels[method]?.icon || '💰',
      color: paymentMethodLabels[method]?.color || 'text-slate-700',
      bg: paymentMethodLabels[method]?.bg || 'bg-slate-500',
      count: data.count,
      total: data.total,
      sales: data.sales,
      percent: totalSalesRevenue > 0 ? (data.total / totalSalesRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // =========================================================================
  // 4. PREVENÇÃO DE PERDAS & ANÁLISE DE DESCARTES
  // =========================================================================
  const totalLossAmount = productLosses.reduce((acc, l) => acc + l.totalLoss, 0);
  const totalLossQty = productLosses.reduce((acc, l) => acc + l.quantity, 0);

  const lossReasonMap: Record<string, { label: string; total: number; qty: number; icon: string; color: string }> = {
    vencimento: { label: 'Produto Vencido', total: 0, qty: 0, icon: '📅', color: 'bg-rose-500' },
    avaria_quebra: { label: 'Avaria / Quebra', total: 0, qty: 0, icon: '💥', color: 'bg-amber-500' },
    devolucao_fornecedor: { label: 'Devolução Fornecedor', total: 0, qty: 0, icon: '🚚', color: 'bg-blue-500' },
    extravio: { label: 'Extravio / Furto', total: 0, qty: 0, icon: '❓', color: 'bg-purple-500' },
    consumo_interno: { label: 'Consumo Interno', total: 0, qty: 0, icon: '☕', color: 'bg-slate-500' },
  };

  productLosses.forEach((l) => {
    const r = l.reason || 'vencimento';
    if (lossReasonMap[r]) {
      lossReasonMap[r].total += l.totalLoss;
      lossReasonMap[r].qty += l.quantity;
    }
  });

  const lossReasonsList = Object.entries(lossReasonMap)
    .filter(([_, data]) => data.total > 0 || data.qty > 0)
    .map(([key, data]) => ({
      key,
      ...data,
      percent: totalLossAmount > 0 ? (data.total / totalLossAmount) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Losses by product ranking
  const productLossRankingMap: Record<string, { name: string; category: string; unit: string; totalLoss: number; qty: number }> = {};
  productLosses.forEach((l) => {
    if (!productLossRankingMap[l.productId]) {
      productLossRankingMap[l.productId] = {
        name: l.productName,
        category: l.category,
        unit: l.unit,
        totalLoss: 0,
        qty: 0,
      };
    }
    productLossRankingMap[l.productId].totalLoss += l.totalLoss;
    productLossRankingMap[l.productId].qty += l.quantity;
  });

  const rankedLossProducts = Object.values(productLossRankingMap).sort((a, b) => b.totalLoss - a.totalLoss);

  // Products expiring in <= 30 days (Risk)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30DaysStr = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);

  const productsInRisk = products.filter((p) => {
    return p.expirationDate && p.expirationDate <= in30DaysStr && p.stock > 0;
  });
  const totalCostInRisk = productsInRisk.reduce((acc, p) => acc + p.stock * p.costPrice, 0);

  // =========================================================================
  // 5. FORNECEDORES & COMPRAS STATS
  // =========================================================================
  const supplierAnalytics = suppliers.map((sup) => {
    const matchingEntries = financialEntries.filter((e) => {
      if (e.supplierId === sup.id) return true;
      if (e.category === 'Fornecedores') {
        const desc = e.description.toLowerCase();
        return desc.includes((sup.tradeName || sup.name).toLowerCase()) || desc.includes(sup.name.toLowerCase());
      }
      return false;
    });

    const paidTotal = matchingEntries.filter((e) => e.status === 'pago').reduce((acc, e) => acc + e.amount, 0);
    const pendingTotal = matchingEntries.filter((e) => e.status === 'pendente').reduce((acc, e) => acc + e.amount, 0);
    const totalVolume = paidTotal + pendingTotal;
    const linkedProducts = products.filter((p) => p.supplierId === sup.id || p.supplierName === sup.name);

    return {
      supplier: sup,
      paidTotal,
      pendingTotal,
      totalVolume,
      linkedProductsCount: linkedProducts.length,
      entriesCount: matchingEntries.length,
    };
  }).sort((a, b) => b.totalVolume - a.totalVolume);

  const totalSupplierVolume = supplierAnalytics.reduce((acc, s) => acc + s.totalVolume, 0);

  // =========================================================================
  // 6. CENTROS DE CUSTO & DESPESAS OPERACIONAIS
  // =========================================================================
  const allExpenses = financialEntries.filter((e) => e.type === 'despesa');
  const totalExpensesAmount = allExpenses.reduce((acc, e) => acc + e.amount, 0);

  const expensesByCatMap: Record<string, { total: number; paid: number; pending: number; count: number }> = {};
  allExpenses.forEach((e) => {
    const cat = e.category || 'Outros';
    if (!expensesByCatMap[cat]) {
      expensesByCatMap[cat] = { total: 0, paid: 0, pending: 0, count: 0 };
    }
    expensesByCatMap[cat].total += e.amount;
    if (e.status === 'pago') expensesByCatMap[cat].paid += e.amount;
    else expensesByCatMap[cat].pending += e.amount;
    expensesByCatMap[cat].count += 1;
  });

  const expensesByCatList = Object.entries(expensesByCatMap)
    .map(([category, data]) => ({
      category,
      total: data.total,
      paid: data.paid,
      pending: data.pending,
      count: data.count,
      percent: totalExpensesAmount > 0 ? (data.total / totalExpensesAmount) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // =========================================================================
  // 7. LUCRATIVIDADE POR CATEGORIA (ALIMENTADA DINAMICAMENTE PELO ESTOQUE)
  // =========================================================================
  const categoryStockStatsMap: Record<
    string,
    {
      category: string;
      skusCount: number;
      totalStock: number;
      totalCost: number;
      totalSale: number;
      lucro: number;
      margem: number;
    }
  > = {};

  products.forEach((p) => {
    const cat = p.category || 'Geral';
    if (!categoryStockStatsMap[cat]) {
      categoryStockStatsMap[cat] = {
        category: cat,
        skusCount: 0,
        totalStock: 0,
        totalCost: 0,
        totalSale: 0,
        lucro: 0,
        margem: 0,
      };
    }
    const cost = (p.costPrice || 0) * (p.stock || 0);
    const sale = (p.salePrice || 0) * (p.stock || 0);
    categoryStockStatsMap[cat].skusCount += 1;
    categoryStockStatsMap[cat].totalStock += (p.stock || 0);
    categoryStockStatsMap[cat].totalCost += cost;
    categoryStockStatsMap[cat].totalSale += sale;
    categoryStockStatsMap[cat].lucro += (sale - cost);
  });

  const categoryProfitList = Object.values(categoryStockStatsMap).map((cat) => {
    const margem = cat.totalSale > 0 ? (cat.lucro / cat.totalSale) * 100 : 0;
    return {
      ...cat,
      margem,
    };
  }).sort((a, b) => b.lucro - a.lucro);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveReportSubTab('graficos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeReportSubTab === 'graficos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span>Painel de Gráficos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportSubTab('fornecedores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeReportSubTab === 'fornecedores'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-orange-400" />
            <span>Fornecedores & Compras ({suppliers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportSubTab('lucratividade')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeReportSubTab === 'lucratividade'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span>Lucro por Categoria</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors self-start lg:self-auto cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SEÇÃO DE GRÁFICOS INTERATIVOS CONSOLIDADOS (ZERADO) */}
      {/* ========================================================================= */}
      {activeReportSubTab === 'graficos' && (
        <div className="min-h-[50vh] rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-12 flex flex-col items-center justify-center text-center shadow-xs animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 mb-4 shadow-sm">
            <BarChart3 className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 mb-1">
            Painel de Gráficos Zerado
          </h3>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            Esta área foi temporariamente zerada e está pronta para receber os novos gráficos e indicadores customizados conforme a necessidade.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-ABA: FORNECEDORES & COMPRAS */}
      {/* ========================================================================= */}
      {activeReportSubTab === 'fornecedores' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  Relatório de Desempenho de Fornecedores & Compras
                </h3>
                <p className="text-xs text-slate-500">
                  Volume de mercadorias adquiridas, faturas pagas e compromissos a liquidar por parceiro
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-full font-mono font-bold text-xs">
                Total Comprado: R$ {totalSupplierVolume.toFixed(2)}
              </span>
            </div>

            {supplierAnalytics.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                Nenhum fornecedor cadastrado ou movimentação vinculada.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Fornecedor</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 text-center">Itens Fornecidos</th>
                      <th className="p-3 text-right">Total Quitado</th>
                      <th className="p-3 text-right">Boletos a Pagar</th>
                      <th className="p-3 text-right">Volume Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierAnalytics.map((item) => (
                      <tr key={item.supplier.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <strong className="text-slate-900 block">{item.supplier.tradeName || item.supplier.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{item.supplier.cnpj || item.supplier.phone}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{item.supplier.category}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {item.linkedProductsCount} SKUs
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          R$ {item.paidTotal.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">
                          R$ {item.pendingTotal.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-orange-600">
                          R$ {item.totalVolume.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-ABA: LUCRATIVIDADE POR CATEGORIA */}
      {/* ========================================================================= */}
      {activeReportSubTab === 'lucratividade' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Desempenho & Lucratividade por Categoria
                </h3>
                <p className="text-xs text-slate-500">
                  Margens calculadas em tempo real a partir dos produtos e itens cadastrados no Estoque.
                </p>
              </div>
            </div>

            {categoryProfitList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs border border-dashed border-slate-200">
                Nenhum produto cadastrado no estoque até o momento. Conforme você cadastrar novos itens na aba de Estoque, este relatório será alimentado automaticamente com os custos, projeções de vendas e margens de lucro de cada categoria.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 text-center">SKUs Cadastrados</th>
                      <th className="p-3 text-center">Estoque Total</th>
                      <th className="p-3 text-right">Custo Total</th>
                      <th className="p-3 text-right">Valor Total de Venda</th>
                      <th className="p-3 text-right">Lucro Projetado</th>
                      <th className="p-3 text-right">Margem de Lucro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {categoryProfitList.map((c) => (
                      <tr key={c.category} className="hover:bg-slate-50">
                        <td className="p-3 font-sans font-bold text-slate-900">{c.category}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{c.skusCount} itens</td>
                        <td className="p-3 text-center font-bold text-slate-800">{c.totalStock} un</td>
                        <td className="p-3 text-right text-slate-500">R$ {c.totalCost.toFixed(2)}</td>
                        <td className="p-3 text-right text-slate-800">R$ {c.totalSale.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-orange-600">R$ {c.lucro.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            c.margem >= 30 ? 'bg-orange-100 text-orange-900' : 'bg-amber-100 text-amber-800'
                          }`}>
                            +{c.margem.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRILLDOWN MODAL: GRÁFICO 1 - DETALHES DA CATEGORIA DE ESTOQUE */}
      {/* ========================================================================= */}
      {selectedStockCategory && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedStockCategory(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-base">
                    Estoque da Categoria: {selectedStockCategory}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {stockByCategory[selectedStockCategory]?.items.length || 0} produto(s) cadastrado(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStockCategory(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {(stockByCategory[selectedStockCategory]?.items || []).map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon || '📦'}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>Cód: {p.barcode}</span>
                        <span>&bull;</span>
                        <span>Estoque: <strong className="text-slate-800">{p.stock} {p.unit}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black font-mono text-orange-600 block">
                      R$ {p.salePrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Custo: R$ {p.costPrice.toFixed(2)} | Lucro: R$ {(p.salePrice - p.costPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStockCategory(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRILLDOWN MODAL: GRÁFICO 2 - DETALHES FINANCEIROS */}
      {/* ========================================================================= */}
      {selectedFinancialGroup && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedFinancialGroup(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-base">
                    Auditoria do Grupo: {
                      selectedFinancialGroup === 'receitas' ? 'Receitas / Vendas Quitadas' :
                      selectedFinancialGroup === 'fornecedores' ? 'Fornecedores Quitados' :
                      selectedFinancialGroup === 'pendentes' ? 'Boletos Fornecedor a Pagar' : 'Fiado a Receber'
                    }
                  </h3>
                  <p className="text-xs text-slate-400">Detalhamento dos lançamentos e faturas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFinancialGroup(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {selectedFinancialGroup === 'receitas' && (
                financialEntries.filter((e) => e.type === 'receita' && e.status === 'pago').map((e) => (
                  <div key={e.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{e.description}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{e.date} &bull; {e.paymentMethod}</span>
                    </div>
                    <span className="font-black font-mono text-orange-600 text-sm">
                      +R$ {e.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}

              {selectedFinancialGroup === 'fornecedores' && (
                financialEntries.filter((e) => e.category === 'Fornecedores' && e.status === 'pago').map((e) => (
                  <div key={e.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{e.description}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{e.date} &bull; {e.paymentMethod}</span>
                    </div>
                    <span className="font-black font-mono text-slate-700 text-sm">
                      -R$ {e.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}

              {selectedFinancialGroup === 'pendentes' && (
                financialEntries.filter((e) => e.category === 'Fornecedores' && e.status === 'pendente').map((e) => (
                  <div key={e.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{e.description}</h4>
                      <span className="text-[10px] text-amber-800 font-bold">Vencimento: {e.dueDate || e.date}</span>
                    </div>
                    <span className="font-black font-mono text-rose-600 text-sm">
                      R$ {e.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}

              {selectedFinancialGroup === 'fiado' && (
                customers.filter((c) => c.balance > 0).map((c) => (
                  <div key={c.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{c.name}</h4>
                      <span className="text-[10px] text-slate-500">Tel: {c.phone} &bull; Limite: R$ {c.creditLimit.toFixed(2)}</span>
                    </div>
                    <span className="font-black font-mono text-amber-900 text-sm">
                      Devendo: R$ {c.balance.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedFinancialGroup(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRILLDOWN MODAL: GRÁFICO 3 - DETALHES DE VENDAS POR MÉTODO */}
      {/* ========================================================================= */}
      {selectedPaymentMethod && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPaymentMethod(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-base">
                    Vendas com Pagamento em: {paymentMethodLabels[selectedPaymentMethod]?.label || selectedPaymentMethod}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {salesByPaymentMethod[selectedPaymentMethod]?.count || 0} venda(s) registrada(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {(salesByPaymentMethod[selectedPaymentMethod]?.sales || []).map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{s.code}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(s.date).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Operador: <strong className="text-slate-700">{s.cashierName}</strong> &bull; Cliente: <strong className="text-slate-700">{s.customerName || 'Consumidor Final'}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {s.items.length} item(ns): {s.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black font-mono text-orange-600 text-sm block">
                      R$ {s.total.toFixed(2)}
                    </span>
                    {s.discount > 0 && (
                      <span className="text-[10px] text-rose-600 font-mono block">
                        Desc: R$ {s.discount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
