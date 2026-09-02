import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, FinancialEntry } from '../../types';
import { 
  Building2, 
  X, 
  Receipt, 
  Plus, 
  Calendar, 
  DollarSign, 
  Phone, 
  MessageCircle, 
  Copy, 
  Check, 
  Edit3, 
  CreditCard, 
  MapPin, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Layers,
  ChevronRight
} from 'lucide-react';
import { safeConfirm } from '../../utils/safeConfirm';

interface SupplierDetailModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  supplier,
  onClose,
  onEdit,
}) => {
  const { 
    financialEntries, 
    addFinancialEntry, 
    toggleFinancialEntryStatus, 
    deleteFinancialEntry, 
    showNotification 
  } = useApp();

  // Internal Tab State: 'historico' | 'cadastro'
  const [activeTab, setActiveTab] = useState<'historico' | 'cadastro'>('historico');
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State for "Lançar Entrada de Nota"
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDesc, setInvoiceDesc] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Boleto Bancário');
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente'>('pendente');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().slice(0, 10);
  });
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Get all financial entries / bills for this supplier
  const supplierBills = useMemo(() => {
    if (!supplier) return [];
    const supName = (supplier.tradeName || supplier.name).toLowerCase();
    const supLegalName = supplier.name.toLowerCase();

    return financialEntries.filter((e) => {
      if (e.supplierId === supplier.id) return true;
      if (e.category === 'Fornecedores') {
        const desc = e.description.toLowerCase();
        return desc.includes(supName) || desc.includes(supLegalName);
      }
      return false;
    });
  }, [supplier, financialEntries]);

  // Financial Stats for this supplier
  const totalInvoiced = useMemo(() => {
    return supplierBills.reduce((acc, b) => acc + b.amount, 0);
  }, [supplierBills]);

  const totalPaid = useMemo(() => {
    return supplierBills.filter((b) => b.status === 'pago').reduce((acc, b) => acc + b.amount, 0);
  }, [supplierBills]);

  const totalPending = useMemo(() => {
    return supplierBills.filter((b) => b.status === 'pendente').reduce((acc, b) => acc + b.amount, 0);
  }, [supplierBills]);

  const pendingCount = useMemo(() => {
    return supplierBills.filter((b) => b.status === 'pendente').length;
  }, [supplierBills]);

  if (!isOpen || !supplier) return null;

  const cleanPhone = supplier.phone ? supplier.phone.replace(/\D/g, '') : '';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(invoiceAmount);
    if (!val || val <= 0) {
      showNotification('Informe um valor válido para a nota.');
      return;
    }

    const title = invoiceNumber.trim() 
      ? `NF ${invoiceNumber.trim()} - ${invoiceDesc.trim() || 'Entrada de Mercadorias'}`
      : `${invoiceDesc.trim() || 'Fatura de Fornecedor'}`;

    const fullDesc = `${supplier.tradeName || supplier.name} - ${title}`;

    addFinancialEntry({
      type: 'despesa',
      category: 'Fornecedores',
      description: fullDesc,
      amount: val,
      date: invoiceDate || new Date().toISOString().slice(0, 10),
      status: paymentStatus,
      paymentMethod: paymentMethod,
      supplierId: supplier.id,
      invoiceNumber: invoiceNumber.trim() || undefined,
      dueDate: paymentStatus === 'pendente' ? dueDate : undefined,
      notes: invoiceNotes.trim() || undefined,
    });

    showNotification(`Entrada de R$ ${val.toFixed(2)} lançada com sucesso no Financeiro!`);
    
    // Reset form
    setInvoiceNumber('');
    setInvoiceDesc('');
    setInvoiceAmount('');
    setInvoiceNotes('');
    setPaymentStatus('pendente');
    setIsAddingBill(false);
  };

  return (
    <div
      id="supplier-detail-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full text-slate-800 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-orange-400 shadow-inner shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white">
                    {supplier.tradeName || supplier.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                    {supplier.category}
                  </span>
                </div>
                {supplier.tradeName && supplier.name !== supplier.tradeName && (
                  <p className="text-xs text-slate-300 mt-0.5">
                    Razão Social: {supplier.name}
                  </p>
                )}
                {supplier.cnpj && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    CNPJ: {supplier.cnpj}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(supplier);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Editar dados cadastrais deste fornecedor"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <div className="bg-black/20 backdrop-blur-xs p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-slate-300 uppercase block">Total Faturado</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-white block mt-0.5">
                R$ {totalInvoiced.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400">{supplierBills.length} nota(s) total</span>
            </div>

            <div className="bg-black/20 backdrop-blur-xs p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-orange-300 uppercase block">Total Pago</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-orange-400 block mt-0.5">
                R$ {totalPaid.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400">Quitado</span>
            </div>

            <div className={`p-3 rounded-xl border transition-all ${
              totalPending > 0 
                ? 'bg-rose-950/40 border-rose-400/40 text-rose-200' 
                : 'bg-black/20 border-white/10 text-slate-300'
            }`}>
              <span className="text-[10px] font-bold uppercase block">Pendente a Pagar</span>
              <span className={`text-sm sm:text-base font-extrabold font-mono block mt-0.5 ${
                totalPending > 0 ? 'text-rose-300' : 'text-white'
              }`}>
                R$ {totalPending.toFixed(2)}
              </span>
              <span className="text-[10px] opacity-80">{pendingCount} boleto(s) em aberto</span>
            </div>

            <div className="bg-black/20 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase block">Condição de Pagto</span>
              <span className="text-xs font-bold text-white truncate mt-0.5">
                {supplier.paymentTerms || 'Não informado'}
              </span>
              <span className="text-[10px] text-slate-400">{supplier.contactPerson || 'Geral'}</span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs & Action Button */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'historico'
                  ? 'bg-white text-orange-600 shadow-xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Notas & Entradas ({supplierBills.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cadastro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cadastro'
                  ? 'bg-white text-orange-600 shadow-xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dados Cadastrais & Contato</span>
            </button>
          </div>

          {/* Primary Action Button: Lançar Entrada */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('historico');
              setIsAddingBill(!isAddingBill);
            }}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              isAddingBill
                ? 'bg-slate-700 hover:bg-slate-800 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isAddingBill ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Fechar Formulário</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-white" />
                <span>Lançar Entrada</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">

          {/* 1. Form: Lançar Entrada de Nota Fiscal (Inline Card) */}
          {isAddingBill && (
            <div className="p-4 bg-slate-50 border-2 border-orange-500/50 rounded-2xl shadow-sm space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-900 text-orange-400 shadow-2xs">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Lançar Nova Entrada de Nota / Fatura
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      As informações lançadas serão adicionadas automaticamente ao relatório financeiro.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingBill(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* NF Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nº da Nota Fiscal / Pedido:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF-e 45890"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Valor Total */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Valor Total da Nota (R$): *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-orange-500 rounded-lg text-xs font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  {/* Data da Entrada */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Data da Emissão / Entrada:
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Forma de Pagamento:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-orange-500"
                    >
                      <option value="Boleto Bancário">Boleto Bancário</option>
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Transferência Bancária">Transferência Bancária</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cheque / A Prazo">Cheque / A Prazo</option>
                    </select>
                  </div>

                  {/* Situação do Pagamento */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Situação do Pagamento:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('pendente')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-colors cursor-pointer ${
                          paymentStatus === 'pendente'
                            ? 'bg-amber-100 text-amber-900 border-amber-400 ring-1 ring-amber-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Pendente (A Pagar)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('pago')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-colors cursor-pointer ${
                          paymentStatus === 'pago'
                            ? 'bg-orange-100 text-orange-900 border-orange-400 ring-1 ring-orange-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Já Quitado
                      </button>
                    </div>
                  </div>

                  {/* Data de Vencimento (se pendente) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Data de Vencimento:
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={paymentStatus === 'pago'}
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:outline-none ${
                        paymentStatus === 'pago'
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white border-slate-300 focus:border-orange-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Descrição / Resumo dos Itens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Descrição Resumida:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carga de 40 caixas de refrigerantes e águas"
                      value={invoiceDesc}
                      onChange={(e) => setInvoiceDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Observações Adicionais:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Vendedor Roberto / Prazo acordado de 28 dias"
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingBill(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Entrada da Nota</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: HISTÓRICO DE NOTAS FISCAIS */}
          {activeTab === 'historico' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-orange-500" />
                  Histórico de Notas & Faturas Registradas ({supplierBills.length})
                </span>
                {supplierBills.length > 0 && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Ordenado da mais recente para a mais antiga
                  </span>
                )}
              </div>

              {supplierBills.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2.5">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">
                    Nenhuma nota ou entrada registrada para este fornecedor.
                  </h4>
                  <p className="text-slate-400 max-w-sm mx-auto text-xs">
                    Clique no botão <strong>"Lançar Entrada"</strong> acima para registrar a primeira nota fiscal e integrá-la automaticamente ao relatório financeiro.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingBill(true)}
                    className="mt-2 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lançar Primeira Nota</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {supplierBills.map((bill) => {
                    const isPaid = bill.status === 'pago';

                    return (
                      <div
                        key={bill.id}
                        className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                            isPaid 
                              ? 'bg-slate-100 text-slate-700 border-slate-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            <Receipt className="w-4 h-4" />
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                                {bill.description}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                isPaid
                                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                                  : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                              }`}>
                                {isPaid ? 'Pago' : 'Pendente'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Emissão: {bill.date}
                              </span>
                              {bill.paymentMethod && (
                                <span>• Pagto: <strong>{bill.paymentMethod}</strong></span>
                              )}
                              {bill.dueDate && !isPaid && (
                                <span className="text-amber-800 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Vence em: {bill.dueDate}
                                </span>
                              )}
                              {bill.notes && (
                                <span className="italic text-slate-400 truncate max-w-[200px]">
                                  "{bill.notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-mono font-black text-slate-900 block">
                              R$ {bill.amount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              Despesa Fornecedor
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleFinancialEntryStatus(bill.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                isPaid
                                  ? 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border-slate-200'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-xs'
                              }`}
                              title={isPaid ? 'Reabrir fatura (marcar como pendente)' : 'Confirmar liquidação do boleto'}
                            >
                              {isPaid ? 'Reabrir' : 'Dar Baixa (Pagar)'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (safeConfirm('Deseja excluir este registro de nota fiscal do histórico e do financeiro?')) {
                                  deleteFinancialEntry(bill.id);
                                  showNotification('Registro de nota excluído.');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DADOS CADASTRAIS COMPLETOS DO FORNECEDOR */}
          {activeTab === 'cadastro' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Informações Principais */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Identificação & Contatos Comerciais
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Razão Social:</span>
                    <span className="font-semibold text-slate-800">{supplier.name}</span>
                  </div>

                  {supplier.tradeName && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nome Fantasia:</span>
                      <span className="font-semibold text-slate-800">{supplier.tradeName}</span>
                    </div>
                  )}

                  {supplier.cnpj && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">CNPJ / CPF:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-slate-700">{supplier.cnpj}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(supplier.cnpj!, 'cnpj')}
                          className="text-slate-400 hover:text-orange-600 p-0.5"
                          title="Copiar CNPJ"
                        >
                          {copiedField === 'cnpj' ? <Check className="w-3 h-3 text-orange-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Categoria de Produtos:</span>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 font-bold rounded-md mt-0.5">
                      {supplier.category}
                    </span>
                  </div>

                  {supplier.contactPerson && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Contato / Vendedor Responsável:</span>
                      <span className="font-semibold text-slate-800">{supplier.contactPerson}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Telefone / Celular:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-700">{supplier.phone}</span>
                      {cleanPhone.length >= 10 && (
                        <a
                          href={`https://wa.me/55${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-orange-400" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {supplier.email && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">E-mail Comercial:</span>
                      <a href={`mailto:${supplier.email}`} className="text-orange-600 hover:underline font-semibold">
                        {supplier.email}
                      </a>
                    </div>
                  )}

                  {supplier.paymentTerms && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Condição de Pagamento Habitual:</span>
                      <span className="font-semibold text-slate-800">{supplier.paymentTerms}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PIX Key Banner */}
              {supplier.pixKey && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 text-orange-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-slate-700 block">Chave PIX do Fornecedor:</span>
                      <span className="font-mono font-extrabold text-slate-900 text-xs sm:text-sm">{supplier.pixKey}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(supplier.pixKey!, 'pix')}
                    className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedField === 'pix' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-orange-600" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar Chave</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Endereço & Observações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {supplier.address && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Endereço / Logística:
                    </span>
                    <p className="text-slate-700 font-medium">{supplier.address}</p>
                  </div>
                )}

                {supplier.notes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      Observações / Horários de Entrega:
                    </span>
                    <p className="text-slate-700 italic">"{supplier.notes}"</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Gestão Integrada de Fornecedores</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
