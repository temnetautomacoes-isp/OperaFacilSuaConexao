import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductLossEntry, ProductLossReason } from '../../types';
import { safeConfirm } from '../../utils/safeConfirm';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CalendarX, 
  CalendarClock, 
  CalendarCheck, 
  DollarSign, 
  Trash2, 
  Sparkles, 
  Tag, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  X, 
  ArrowDownLeft, 
  Building2, 
  Layers, 
  Barcode, 
  Percent, 
  AlertOctagon,
  Clock,
  Check
} from 'lucide-react';
import { ProductDetailModal } from '../common/ProductDetailModal';

export const PrevencaoPerdasModule: React.FC = () => {
  const { 
    products, 
    updateProduct, 
    adjustStock,
    productLosses, 
    addProductLoss, 
    deleteProductLoss, 
    currentUser,
    settings,
    showNotification 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'monitoramento' | 'historico_perdas'>('monitoramento');
  const [searchTerm, setSearchTerm] = useState('');
  const [validityFilter, setValidityFilter] = useState<'todos' | 'vencidos' | '7dias' | '15dias' | '30dias' | 'saudavel' | 'sem_validade'>('todos');

  // Modal States
  const [selectedProductForPromotion, setSelectedProductForPromotion] = useState<Product | null>(null);
  const [promoSalePrice, setPromoSalePrice] = useState('');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState('20');

  const [selectedProductForLoss, setSelectedProductForLoss] = useState<Product | null>(null);
  const [isNewLossModalOpen, setIsNewLossModalOpen] = useState(false);
  const [lossProductId, setLossProductId] = useState('');
  const [lossBatchId, setLossBatchId] = useState('');
  const [lossQuantity, setLossQuantity] = useState('1');
  const [lossReason, setLossReason] = useState<ProductLossReason>('vencimento');
  const [lossNotes, setLossNotes] = useState('');

  const [selectedProductForValidity, setSelectedProductForValidity] = useState<Product | null>(null);
  const [newManufacturingDate, setNewManufacturingDate] = useState('');
  const [newValidityDate, setNewValidityDate] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');

  // Audit Sheet Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditScope, setAuditScope] = useState<'criticos' | '7dias' | '30dias' | 'todos'>('criticos');

  // Yellow Clearance Label Generator State
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<Product | null>(null);
  const [labelPromoPrice, setLabelPromoPrice] = useState('');
  const [labelQuantity, setLabelQuantity] = useState('4');
  const [labelBatchText, setLabelBatchText] = useState('');

  // Product Inspection Detail Modal State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  // Current Date Helper
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Helper to calculate days remaining until expiration
  const getExpirationInfo = (expirationDate?: string) => {
    if (!expirationDate) {
      return { status: 'sem_validade', daysRemaining: null, label: 'Sem data' };
    }

    // Format YYYY-MM-DD
    const exp = new Date(expirationDate + 'T00:00:00');
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'vencido', 
        daysRemaining: diffDays, 
        label: `Vencido há ${Math.abs(diffDays)} dia(s)` 
      };
    } else if (diffDays === 0) {
      return { 
        status: 'hoje', 
        daysRemaining: 0, 
        label: 'Vence Hoje!' 
      };
    } else if (diffDays <= 7) {
      return { 
        status: 'critico_7d', 
        daysRemaining: diffDays, 
        label: `Vence em ${diffDays} dia(s)` 
      };
    } else if (diffDays <= 30) {
      return { 
        status: 'atencao_30d', 
        daysRemaining: diffDays, 
        label: `Vence em ${diffDays} dia(s)` 
      };
    } else {
      return { 
        status: 'saudavel', 
        daysRemaining: diffDays, 
        label: `Vence em ${diffDays} dias` 
      };
    }
  };

  // Products with Expiration Metadata
  const productsWithValidity = useMemo(() => {
    return products.map((p) => {
      const expInfo = getExpirationInfo(p.expirationDate);
      const totalCostInRisk = p.stock * p.costPrice;
      const totalSaleInRisk = p.stock * p.salePrice;

      return {
        ...p,
        expInfo,
        totalCostInRisk,
        totalSaleInRisk,
      };
    });
  }, [products, today]);

  // Key KPI Metrics
  const expiredProducts = productsWithValidity.filter(
    (p) => (p.expInfo.status === 'vencido' || p.expInfo.status === 'hoje') && p.stock > 0
  );
  const expiring7DaysProducts = productsWithValidity.filter(
    (p) => p.expInfo.status === 'critico_7d' && p.stock > 0
  );
  const expiring30DaysProducts = productsWithValidity.filter(
    (p) => p.expInfo.status === 'atencao_30d' && p.stock > 0
  );

  const totalCostAtRisk = [...expiredProducts, ...expiring7DaysProducts, ...expiring30DaysProducts]
    .reduce((acc, p) => acc + p.totalCostInRisk, 0);

  const totalLossRegisteredMonth = productLosses.reduce((acc, l) => acc + l.totalLoss, 0);

  // Filtered Products for Monitor Table
  const filteredProducts = useMemo(() => {
    return productsWithValidity.filter((p) => {
      // Search text filter
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Validity filter
      let matchesValidity = true;
      if (validityFilter === 'vencidos') {
        matchesValidity = (p.expInfo.status === 'vencido' || p.expInfo.status === 'hoje') && p.stock > 0;
      } else if (validityFilter === '7dias') {
        matchesValidity = (p.expInfo.status === 'critico_7d' || p.expInfo.status === 'hoje') && p.stock > 0;
      } else if (validityFilter === '15dias') {
        matchesValidity = p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining >= 0 && p.expInfo.daysRemaining <= 15 && p.stock > 0;
      } else if (validityFilter === '30dias') {
        matchesValidity = p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining >= 0 && p.expInfo.daysRemaining <= 30 && p.stock > 0;
      } else if (validityFilter === 'saudavel') {
        matchesValidity = p.expInfo.status === 'saudavel';
      } else if (validityFilter === 'sem_validade') {
        matchesValidity = p.expInfo.status === 'sem_validade';
      }

      return matchesSearch && matchesValidity;
    }).sort((a, b) => {
      // Prioritize expired and nearest expiring products first
      if (a.expInfo.daysRemaining === null && b.expInfo.daysRemaining === null) return 0;
      if (a.expInfo.daysRemaining === null) return 1;
      if (b.expInfo.daysRemaining === null) return -1;
      return a.expInfo.daysRemaining - b.expInfo.daysRemaining;
    });
  }, [productsWithValidity, searchTerm, validityFilter]);

  // Handler: Apply Lightning Promo Price
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForPromotion) return;

    const newPrice = parseFloat(promoSalePrice);
    if (!newPrice || newPrice <= 0) return;

    updateProduct(selectedProductForPromotion.id, {
      salePrice: newPrice,
    });

    showNotification(`⚡ Promoção Relâmpago aplicada! "${selectedProductForPromotion.name}" agora custa R$ ${newPrice.toFixed(2)}.`);
    setSelectedProductForPromotion(null);
  };

  // Handler: Register Loss
  const handleSaveLoss = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === lossProductId);
    if (!prod) return;

    const qty = parseFloat(lossQuantity);
    if (!qty || qty <= 0) return;

    const totalLossVal = qty * prod.costPrice;

    addProductLoss({
      productId: prod.id,
      productName: prod.name,
      barcode: prod.barcode,
      category: prod.category,
      quantity: qty,
      unit: prod.unit,
      costPrice: prod.costPrice,
      totalLoss: totalLossVal,
      reason: lossReason,
      date: new Date().toISOString().slice(0, 10),
      operatorName: currentUser?.name || 'Gestor',
      notes: lossNotes.trim() || undefined,
      batchNumber: prod.batchNumber,
      batchId: lossBatchId || undefined,
    });

    setIsNewLossModalOpen(false);
    setSelectedProductForLoss(null);
    setLossProductId('');
    setLossBatchId('');
    setLossQuantity('1');
    setLossNotes('');
  };

  // Handler: Update Validity Date, Manufacturing Date & Batch
  const handleSaveValidity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForValidity) return;

    updateProduct(selectedProductForValidity.id, {
      manufacturingDate: newManufacturingDate || undefined,
      expirationDate: newValidityDate || undefined,
      batchNumber: newBatchNumber.trim() || undefined,
    });

    showNotification(`Datas e lote do produto "${selectedProductForValidity.name}" atualizados com sucesso!`);
    setSelectedProductForValidity(null);
  };

  const reasonLabels: Record<ProductLossReason, { label: string; icon: string; color: string }> = {
    vencimento: { label: 'Vencido (Data expirada)', icon: '📅', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    avaria_quebra: { label: 'Avaria / Quebra', icon: '💥', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    devolucao_fornecedor: { label: 'Devolvido ao Fornecedor', icon: '🚚', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    extravio: { label: 'Extravio / Furto', icon: '❓', color: 'text-slate-700 bg-slate-100 border-slate-200' },
    consumo_interno: { label: 'Consumo Interno / Amostra', icon: '☕', color: 'text-teal-700 bg-teal-50 border-teal-200' },
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-58px)]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            </div>
            <span>Prevenção de Perdas & Gestão de Validades</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Painel inteligente para monitoramento de vencimentos, queima de estoque e registro de descartes/avarias.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedProductForLoss(null);
              setLossProductId(products[0]?.id || '');
              setIsNewLossModalOpen(true);
            }}
            className="py-2 px-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>+ Lançar Baixa por Perda</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Risk Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Vencidos */}
        <div 
          onClick={() => {
            setActiveSubTab('monitoramento');
            setValidityFilter('vencidos');
          }}
          className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
            validityFilter === 'vencidos'
              ? 'bg-rose-100/90 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-rose-50/80 border-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold text-rose-900">
              Produtos Vencidos
            </span>
            <span className="p-1.5 rounded-lg bg-rose-200 text-rose-900">
              <CalendarX className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-rose-700 block">
              {expiredProducts.length} item(ns)
            </span>
            <span className="text-[10px] font-bold text-rose-800 block mt-0.5 group-hover:underline">
              Descarte ou troca imediata →
            </span>
          </div>
        </div>

        {/* Card 2: Vence em até 7 dias */}
        <div 
          onClick={() => {
            setActiveSubTab('monitoramento');
            setValidityFilter('7dias');
          }}
          className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
            validityFilter === '7dias'
              ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-amber-50/80 border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold text-amber-900">
              Vence em até 7 Dias
            </span>
            <span className="p-1.5 rounded-lg bg-amber-200 text-amber-900">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-amber-900 block">
              {expiring7DaysProducts.length} item(ns)
            </span>
            <span className="text-[10px] font-bold text-amber-800 block mt-0.5 group-hover:underline">
              Aplicar queima de estoque →
            </span>
          </div>
        </div>

        {/* Card 3: Vence em até 30 dias */}
        <div 
          onClick={() => {
            setActiveSubTab('monitoramento');
            setValidityFilter('30dias');
          }}
          className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
            validityFilter === '30dias'
              ? 'bg-orange-100/90 border-orange-500 ring-2 ring-orange-500/30'
              : 'bg-orange-50/80 border-orange-200 hover:border-orange-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold text-orange-900">
              Vence em 30 Dias
            </span>
            <span className="p-1.5 rounded-lg bg-orange-200 text-orange-900">
              <CalendarClock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-orange-950 block">
              {expiring30DaysProducts.length} item(ns)
            </span>
            <span className="text-[10px] font-bold text-orange-800 block mt-0.5 group-hover:underline">
              Radar de vendas & reposição →
            </span>
          </div>
        </div>

        {/* Card 4: Prejuízo em Risco */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold text-slate-500">
              Prejuízo em Risco (Custo)
            </span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-slate-900 block">
              R$ {totalCostAtRisk.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Valor investido a proteger
            </span>
          </div>
        </div>

        {/* Card 5: Total Descartado */}
        <div 
          onClick={() => setActiveSubTab('historico_perdas')}
          className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
            activeSubTab === 'historico_perdas'
              ? 'bg-slate-900 border-rose-500 text-white'
              : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold text-rose-300">
              Perdas Registradas
            </span>
            <span className="p-1.5 rounded-lg bg-slate-800 text-rose-400">
              <Trash2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-rose-400 block">
              R$ {totalLossRegisteredMonth.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 group-hover:text-rose-300">
              {productLosses.length} baixa(s) auditada(s) →
            </span>
          </div>
        </div>

      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('monitoramento')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'monitoramento'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarClock className="w-4 h-4 text-orange-400" />
          <span>Monitoramento de Validades ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('historico_perdas')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'historico_perdas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Histórico de Descartes & Avarias ({productLosses.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ABA: MONITORAMENTO DE VALIDADES */}
      {/* ========================================================================= */}
      {activeSubTab === 'monitoramento' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por produto, código de barras, lote ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filtrar:
                </span>
                {[
                  { id: 'todos', label: `Todos (${products.length})` },
                  { id: 'vencidos', label: `Vencidos (${expiredProducts.length})` },
                  { id: '7dias', label: `Vence em 7d (${expiring7DaysProducts.length})` },
                  { id: '15dias', label: 'Vence em 15d' },
                  { id: '30dias', label: `Vence em 30d (${expiring30DaysProducts.length})` },
                  { id: 'saudavel', label: 'Saudável' },
                  { id: 'sem_validade', label: 'Sem Validade' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setValidityFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      validityFilter === f.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Botão de Impressão da Lista de Auditoria */}
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Imprimir Lista de Auditoria</span>
              </button>
            </div>
          </div>

          {/* Validity Monitor Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Produto</th>
                    <th className="p-3.5">Código / Lote</th>
                    <th className="p-3.5">Fornecedor</th>
                    <th className="p-3.5 text-center">Estoque Atual</th>
                    <th className="p-3.5 text-right">Custo / Venda</th>
                    <th className="p-3.5 text-center">Fabricação & Validade</th>
                    <th className="p-3.5 text-center">Situação / Alerta</th>
                    <th className="p-3.5 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        Nenhum produto encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isExpired = p.expInfo.status === 'vencido' || p.expInfo.status === 'hoje';
                      const is7d = p.expInfo.status === 'critico_7d';
                      const is30d = p.expInfo.status === 'atencao_30d';

                      return (
                        <tr 
                          key={p.id} 
                          onClick={() => setSelectedDetailProduct(p)}
                          className="hover:bg-slate-50 transition-colors group cursor-pointer"
                          title="Clique em qualquer lugar da linha para visualizar a ficha detalhada do produto"
                        >
                          
                          {/* Product Name & Icon */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg">{p.icon || '📦'}</span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight group-hover:text-orange-600 transition-colors">
                                  {p.name}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                  {p.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Barcode & Batch */}
                          <td className="p-3.5 font-mono text-[11px] text-slate-600">
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <Barcode className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.barcode}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {p.batchNumber ? (
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  Lote: <strong>{p.batchNumber}</strong>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  Sem lote
                                </span>
                              )}
                              {p.batches && p.batches.filter(b => b.quantity > 0).length > 1 && (
                                <span className="text-[9px] font-black bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                                  {p.batches.filter(b => b.quantity > 0).length} Remessas
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Supplier */}
                          <td className="p-3.5 text-slate-600">
                            {p.supplierName ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                <Building2 className="w-3 h-3 text-slate-600" />
                                {p.supplierName}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Avulso / Geral</span>
                            )}
                          </td>

                          {/* Stock */}
                          <td className="p-3.5 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-xs ${
                              p.stock <= 0 ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {p.stock} {p.unit}
                            </span>
                          </td>

                          {/* Cost & Sale */}
                          <td className="p-3.5 text-right font-mono">
                            <span className="text-xs font-bold text-orange-600 block">
                              R$ {p.salePrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Custo: R$ {p.costPrice.toFixed(2)}
                            </span>
                          </td>

                          {/* Manufacturing & Expiration Date */}
                          <td className="p-3.5 text-center font-mono">
                            {p.manufacturingDate && (
                              <span className="text-[10px] text-slate-500 block font-semibold">
                                Fab: {p.manufacturingDate.split('-').reverse().join('/')}
                              </span>
                            )}
                            {p.expirationDate ? (
                              <span className="text-slate-900 text-xs font-bold block">
                                Val: {p.expirationDate.split('-').reverse().join('/')}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProductForValidity(p);
                                  setNewManufacturingDate(p.manufacturingDate || '');
                                  setNewValidityDate('');
                                  setNewBatchNumber(p.batchNumber || '');
                                }}
                                className="text-[10px] text-orange-600 hover:text-orange-800 font-bold underline cursor-pointer"
                              >
                                + Adicionar Validade
                              </button>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              isExpired
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : is7d
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : is30d
                                ? 'bg-orange-100 text-orange-900 border border-orange-200'
                                : p.expInfo.status === 'saudavel'
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {p.expInfo.label}
                            </span>
                          </td>
                            
                          {/* Quick Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {/* Gerar Etiqueta de Queima */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProductForLabel(p);
                                  setLabelPromoPrice((p.salePrice * 0.8).toFixed(2));
                                  setLabelBatchText(p.batchNumber || '');
                                }}
                                title="Imprimir Etiqueta de Queima de Validade"
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors cursor-pointer"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </button>

                              {/* Promoção Relâmpago */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProductForPromotion(p);
                                  setPromoDiscountPercent('20');
                                  setPromoSalePrice((p.salePrice * 0.8).toFixed(2));
                                }}
                                title="Criar Promoção Relâmpago"
                                className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300 transition-colors cursor-pointer"
                              >
                                <Percent className="w-3.5 h-3.5" />
                              </button>

                              {/* Lançar Descarte */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProductForLoss(p);
                                  setLossProductId(p.id);
                                  setLossQuantity('1');
                                  setIsNewLossModalOpen(true);
                                }}
                                title="Lançar Baixa por Perda / Descarte"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Editar Validade */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProductForValidity(p);
                                  setNewManufacturingDate(p.manufacturingDate || '');
                                  setNewValidityDate(p.expirationDate || '');
                                  setNewBatchNumber(p.batchNumber || '');
                                }}
                                title="Atualizar Validade e Lote"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ABA: HISTÓRICO DE AUDITORIA DE PERDAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'historico_perdas' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-sm text-slate-800">
                  Histórico de Baixas & Descarte de Mercadorias
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Total acumulado: <strong className="text-rose-700 font-bold">R$ {totalLossRegisteredMonth.toFixed(2)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Data</th>
                    <th className="p-3.5">Produto Baixado</th>
                    <th className="p-3.5">Motivo da Baixa</th>
                    <th className="p-3.5 text-center">Quantidade</th>
                    <th className="p-3.5 text-right">Custo Unitário</th>
                    <th className="p-3.5 text-right">Prejuízo Total</th>
                    <th className="p-3.5">Responsável / Obs</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productLosses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        Nenhum descarte ou perda registrada até o momento. Excelente gestão!
                      </td>
                    </tr>
                  ) : (
                    productLosses.map((l) => {
                      const reasonInfo = reasonLabels[l.reason] || { label: l.reason, icon: '📦', color: 'bg-slate-100 text-slate-700' };

                      return (
                        <tr 
                          key={l.id} 
                          onClick={() => {
                            const prod = products.find((p) => p.id === l.productId);
                            if (prod) {
                              setSelectedDetailProduct(prod);
                            }
                          }}
                          className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                          title="Clique para ver a ficha completa do produto"
                        >
                          <td className="p-3.5 font-mono text-slate-600 font-semibold">
                            {l.date.split('-').reverse().join('/')}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{l.productName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Cód: {l.barcode}</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${reasonInfo.color}`}>
                              <span>{reasonInfo.icon}</span>
                              {reasonInfo.label}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                            {l.quantity} {l.unit}
                          </td>
                          <td className="p-3.5 text-right font-mono text-slate-600">
                            R$ {l.costPrice.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-rose-600 text-xs sm:text-sm">
                            - R$ {l.totalLoss.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            <span className="font-bold text-slate-800 block text-[11px]">{l.operatorName}</span>
                            {l.notes && <span className="text-[10px] text-slate-500 italic block">{l.notes}</span>}
                          </td>
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (safeConfirm(`Deseja remover este registro de perda de "${l.productName}" do histórico?`)) {
                                  deleteProductLoss(l.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Remover do histórico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROMOÇÃO RELÂMPAGO / QUEIMA DE ESTOQUE */}
      {/* ========================================================================= */}
      {selectedProductForPromotion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="font-bold text-base">Criar Promoção Relâmpago</h3>
                  <p className="text-xs text-amber-100">Acelere a venda antes do vencimento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForPromotion(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyPromo} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-bold text-slate-900 text-sm">{selectedProductForPromotion.name}</h4>
                <div className="flex items-center justify-between text-slate-600 mt-1 font-mono text-[11px]">
                  <span>Preço Atual: <strong>R$ {selectedProductForPromotion.salePrice.toFixed(2)}</strong></span>
                  <span>Custo: <strong>R$ {selectedProductForPromotion.costPrice.toFixed(2)}</strong></span>
                  <span>Estoque: <strong>{selectedProductForPromotion.stock} {selectedProductForPromotion.unit}</strong></span>
                </div>
              </div>

              {/* Discount Calculator Shortcut */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Desconto Rápido Sugerido:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['10', '20', '30', '50'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setPromoDiscountPercent(pct);
                        const factor = 1 - parseFloat(pct) / 100;
                        const calcPrice = Math.max(selectedProductForPromotion.costPrice, selectedProductForPromotion.salePrice * factor).toFixed(2);
                        setPromoSalePrice(calcPrice);
                      }}
                      className={`py-1.5 rounded-lg font-extrabold border transition-all cursor-pointer ${
                        promoDiscountPercent === pct
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Novo Preço de Venda Promocional (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={promoSalePrice}
                  onChange={(e) => {
                    setPromoSalePrice(e.target.value);
                    setPromoDiscountPercent('');
                  }}
                  className="w-full px-3 py-2 text-base font-bold font-mono border-2 border-amber-500 rounded-xl focus:outline-none"
                  required
                />
              </div>

              {/* Profit check preview */}
              {(() => {
                const p = parseFloat(promoSalePrice) || 0;
                const cost = selectedProductForPromotion.costPrice;
                const margin = cost > 0 ? (((p - cost) / cost) * 100).toFixed(0) : '0';
                const isBelowCost = p < cost;

                return (
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    isBelowCost ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <span>Margem Projetada na Promoção:</span>
                    <span className="font-mono font-black">
                      {isBelowCost ? `Abaixo do Custo (-R$ ${(cost - p).toFixed(2)})` : `+${margin}% (Lucro R$ ${(p - cost).toFixed(2)})`}
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedProductForPromotion(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Promoção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LANÇAR BAIXA / DESCARTE POR PERDA */}
      {/* ========================================================================= */}
      {isNewLossModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-200" />
                <div>
                  <h3 className="font-bold text-base">Lançar Baixa por Perda / Descarte</h3>
                  <p className="text-xs text-rose-100">Dá baixa no estoque e registra o prejuízo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLossModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoss} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Selecione o Produto:
                </label>
                <select
                  value={lossProductId}
                  onChange={(e) => {
                    setLossProductId(e.target.value);
                    setLossBatchId('');
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-rose-700"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Estoque Total: {p.stock} {p.unit} (Custo: R$ {p.costPrice.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-batch selection if product has multiple batches */}
              {(() => {
                const targetP = products.find((p) => p.id === lossProductId);
                if (!targetP || !targetP.batches || targetP.batches.length <= 1) return null;
                const activeBatches = targetP.batches.filter((b) => b.quantity > 0);
                if (activeBatches.length <= 1) return null;

                return (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1">
                    <label className="block font-bold text-amber-950 text-[11px]">
                      De qual Lote / Remessa deseja baixar?
                    </label>
                    <select
                      value={lossBatchId}
                      onChange={(e) => setLossBatchId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                    >
                      <option value="">Baixa Automática (FEFO - Lote com validade mais antiga)</option>
                      {activeBatches.map((b, idx) => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber ? `Lote ${b.batchNumber}` : `Remessa #${idx + 1}`} - {b.quantity} {targetP.unit} (Val: {b.expirationDate ? b.expirationDate.split('-').reverse().join('/') : 'Sem data'})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quantidade a Descartar:
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={lossQuantity}
                    onChange={(e) => setLossQuantity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold focus:outline-none focus:border-rose-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Motivo da Perda:
                  </label>
                  <select
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value as ProductLossReason)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-rose-700 font-bold text-slate-800"
                  >
                    <option value="vencimento">📅 Produto Vencido</option>
                    <option value="avaria_quebra">💥 Avaria / Quebra de Embalagem</option>
                    <option value="devolucao_fornecedor">🚚 Devolução ao Fornecedor</option>
                    <option value="extravio">❓ Extravio / Furto</option>
                    <option value="consumo_interno">☕ Consumo Interno / Amostra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações / Detalhes (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  placeholder="Ex: Garrafa trincou durante descarregamento / Pacote com selo violado..."
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-rose-700"
                />
              </div>

              {/* Loss calculation summary */}
              {(() => {
                const targetProd = products.find((p) => p.id === lossProductId);
                const q = parseFloat(lossQuantity) || 0;
                const total = targetProd ? q * targetProd.costPrice : 0;

                return (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-rose-900">
                    <span className="font-bold">Prejuízo Calculado (Preço de Custo):</span>
                    <span className="font-mono font-black text-sm text-rose-700">
                      R$ {total.toFixed(2)}
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewLossModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Baixa de Perda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDITAR VALIDADE E LOTE RÁPIDO */}
      {/* ========================================================================= */}
      {selectedProductForValidity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-base">Atualizar Validade & Lote</h3>
                  <p className="text-xs text-slate-400">{selectedProductForValidity.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForValidity(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveValidity} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data de Fabricação (Opcional):
                  </label>
                  <input
                    type="date"
                    value={newManufacturingDate}
                    onChange={(e) => setNewManufacturingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data de Validade:
                  </label>
                  <input
                    type="date"
                    value={newValidityDate}
                    onChange={(e) => setNewValidityDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Número do Lote (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: LOTE-2026-08A"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProductForValidity(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Salvar Validade & Fabricação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FOLHA DE AUDITORIA & CHECAGEM DE GÔNDOLA (PRONTA PARA IMPRESSÃO) */}
      {/* ========================================================================= */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-orange-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Folha de Auditoria & Checagem de Gôndola</h3>
                  <p className="text-xs text-slate-400">Gere a lista para o repositor conferir as datas de validade na prateleira</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Filter Buttons */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Escopo da Auditoria:</span>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1">
                  {[
                    { id: 'criticos', label: '⚠️ Itens Críticos (≤ 30d)' },
                    { id: '7dias', label: '🔥 Urgentes (≤ 7d)' },
                    { id: '30dias', label: '📅 Próximos 30 Dias' },
                    { id: 'todos', label: '📦 Todos os Produtos' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAuditScope(s.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        auditScope === s.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Folha de Conferência</span>
              </button>
            </div>

            {/* Printable Area */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">MERCADINHO FAMILIAR - AUDITORIA DE GÔNDOLA</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} | Responsável: {currentUser?.name || 'Gestor'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total de Itens na Lista</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    {(() => {
                      const list = productsWithValidity.filter((p) => {
                        if (auditScope === 'criticos') return p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining <= 30 && p.stock > 0;
                        if (auditScope === '7dias') return p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining <= 7 && p.stock > 0;
                        if (auditScope === '30dias') return p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining <= 30 && p.stock > 0;
                        return p.stock > 0;
                      });
                      return list.length;
                    })()} itens
                  </span>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-left">Produto & Categoria</th>
                    <th className="border border-slate-300 p-2 text-left font-mono">Código EAN</th>
                    <th className="border border-slate-300 p-2 text-center font-mono">Lote</th>
                    <th className="border border-slate-300 p-2 text-center">Validade Sistema</th>
                    <th className="border border-slate-300 p-2 text-center">Qtd Sistema</th>
                    <th className="border border-slate-300 p-2 text-center w-28">[ ✓ ] Qtd Física</th>
                    <th className="border border-slate-300 p-2 text-left w-36">Visto / Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {productsWithValidity
                    .filter((p) => {
                      if (auditScope === 'criticos') return p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining <= 30 && p.stock > 0;
                      if (auditScope === '7dias') return p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining <= 7 && p.stock > 0;
                      if (auditScope === '30dias') return p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining <= 30 && p.stock > 0;
                      return p.stock > 0;
                    })
                    .sort((a, b) => (a.expInfo.daysRemaining ?? 999) - (b.expInfo.daysRemaining ?? 999))
                    .map((p) => (
                      <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="border border-slate-300 p-2">
                          <strong className="text-slate-900 block">{p.name}</strong>
                          <span className="text-[10px] text-slate-500 font-semibold">{p.category}</span>
                        </td>
                        <td className="border border-slate-300 p-2 font-mono text-[11px] text-slate-700">
                          {p.barcode}
                        </td>
                        <td className="border border-slate-300 p-2 font-mono text-center text-[11px]">
                          {p.batchNumber || '-'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                          {p.expirationDate ? p.expirationDate.split('-').reverse().join('/') : 'Sem data'}
                          {p.expInfo.daysRemaining !== null && p.expInfo.daysRemaining <= 7 && (
                            <span className="text-rose-600 block text-[10px]">({p.expInfo.label})</span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                          {p.stock} {p.unit}
                        </td>
                        <td className="border border-slate-300 p-2 text-center bg-slate-50/50">
                          <div className="h-6 border-b border-dotted border-slate-400"></div>
                        </td>
                        <td className="border border-slate-300 p-2">
                          <div className="h-6 border-b border-dotted border-slate-400"></div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="pt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
                <div>
                  <span>Conferido por (Assinatura do Repositor): _______________________________</span>
                </div>
                <div>
                  <span>Data da Conferência: ____ / ____ / ________</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: GERADOR DE ETIQUETAS DE QUEIMA DE VALIDADE / PROMOÇÃO */}
      {/* ========================================================================= */}
      {selectedProductForLabel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-amber-100" />
                <div>
                  <h3 className="font-bold text-base">Etiqueta Amarela de Queima de Validade</h3>
                  <p className="text-xs text-amber-100">Etiqueta de gôndola para liquidação rápida de lote próximo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForLabel(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Live Tag Preview (Yellow Supermarket Tag) */}
              <div className="p-4 bg-amber-300 rounded-2xl border-2 border-amber-500 shadow-md text-slate-900 flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 bg-red-600 text-white px-8 py-1 rotate-12 text-[10px] font-black uppercase tracking-wider shadow-xs">
                  OFERTA
                </div>

                <div className="border-b-2 border-dashed border-amber-600/40 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-800 block">
                    🔥 PROMOÇÃO RELÂMPAGO • VALIDADE PRÓXIMA
                  </span>
                  <h4 className="font-black text-sm text-slate-950 uppercase tracking-tight line-clamp-1">
                    {selectedProductForLabel.name}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-700">
                    {selectedProductForLabel.category} | Lote: {labelBatchText || selectedProductForLabel.batchNumber || 'Geral'}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold block line-through">
                      De: R$ {selectedProductForLabel.salePrice.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-black uppercase text-red-900 block">
                      POR APENAS:
                    </span>
                    <span className="text-3xl font-black font-mono text-red-700 block leading-none">
                      R$ {parseFloat(labelPromoPrice || '0').toFixed(2)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase text-slate-700 block">Consumir até:</span>
                    <span className="text-xs font-black font-mono bg-white px-2 py-0.5 rounded border border-amber-600 block text-slate-950">
                      {selectedProductForLabel.expirationDate ? selectedProductForLabel.expirationDate.split('-').reverse().join('/') : 'Ver Embalagem'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/40 flex items-center justify-between text-[10px] font-mono text-slate-700">
                  <div className="flex items-center gap-1">
                    <Barcode className="w-4 h-4 text-slate-800" />
                    <span>{selectedProductForLabel.barcode}</span>
                  </div>
                  <span className="font-bold">{settings.name || 'MercadoFácil'}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preço Promocional (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={labelPromoPrice}
                    onChange={(e) => setLabelPromoPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Qtd. de Etiquetas a Imprimir:
                  </label>
                  <select
                    value={labelQuantity}
                    onChange={(e) => setLabelQuantity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:border-amber-600"
                  >
                    <option value="1">1 Etiqueta</option>
                    <option value="4">4 Etiquetas (Gôndola)</option>
                    <option value="8">8 Etiquetas (Grade)</option>
                    <option value="16">16 Etiquetas (Lote Inteiro)</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedProductForLabel(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showNotification(`${labelQuantity} etiqueta(s) amarela(s) enviadas para a impressora!`);
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Etiquetas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ProductDetailModal
        isOpen={!!selectedDetailProduct}
        product={
          selectedDetailProduct
            ? products.find((p) => p.id === selectedDetailProduct.id) || selectedDetailProduct
            : null
        }
        onClose={() => setSelectedDetailProduct(null)}
        onAdjustStock={(productId, delta) => {
          adjustStock(productId, delta);
        }}
      />

    </div>
  );
};
