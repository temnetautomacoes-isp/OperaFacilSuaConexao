import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerDebt, FinancialEntry, Supplier } from '../../types';
import { safeConfirm } from '../../utils/safeConfirm';
import { 
  Wallet, 
  Users, 
  Truck, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Phone, 
  Search, 
  X, 
  CheckCircle,
  CheckCircle2,
  Building2, 
  CreditCard, 
  Copy, 
  Check, 
  Trash2, 
  UserCheck, 
  UserPlus, 
  Filter, 
  Receipt,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Camera,
  Upload,
  Image as ImageIcon,
  User,
  Edit3,
  AlertTriangle,
  BarChart3,
  Calendar,
  Tag,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { SupplierDetailModal } from '../common/SupplierDetailModal';
import { PendingSupplierBillsModal } from '../common/PendingSupplierBillsModal';
import { PaidSupplierBillsModal } from '../common/PaidSupplierBillsModal';
import { FinancialEntryDetailModal } from '../common/FinancialEntryDetailModal';
import { RelatoriosFinanceiroSection } from './RelatoriosFinanceiroSection';

export const FinanceiroModule: React.FC = () => {
  const { 
    financialEntries, 
    addFinancialEntry, 
    toggleFinancialEntryStatus,
    deleteFinancialEntry,
    customers, 
    addCustomer, 
    updateCustomer,
    deleteCustomer,
    payCustomerDebt,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    cashRegister,
    addCashMovement,
    sales,
    showNotification
  } = useApp();

  // Primary subcategories (including Relatórios & Gráficos)
  const [activeCategory, setActiveCategory] = useState<'clientes' | 'fornecedores' | 'fluxo' | 'relatorios'>('clientes');

  // Search & Filters
  const [searchCustomer, setSearchCustomer] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'todos' | 'devendo' | 'em_dia'>('todos');

  const [searchSupplier, setSearchSupplier] = useState('');
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState('todas');

  const [financialTypeFilter, setFinancialTypeFilter] = useState<'todos' | 'receita' | 'despesa' | 'pendente'>('todos');
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  // Modals state: Clientes
  const [payingCustomer, setPayingCustomer] = useState<CustomerDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('Abatimento de dívida em dinheiro');
  
  // Customer View/Edit/Add Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<CustomerDebt | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custLimit, setCustLimit] = useState('300.00');
  const [custAddress, setCustAddress] = useState('');
  const [custImageUrl, setCustImageUrl] = useState<string>('');
  const [custImageError, setCustImageError] = useState<string | null>(null);
  const custFileInputRef = useRef<HTMLInputElement>(null);

  // Modals state: Fornecedores & Financeiro
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<Supplier | null>(null);
  const [isPendingBillsModalOpen, setIsPendingBillsModalOpen] = useState(false);
  const [isPaidBillsModalOpen, setIsPaidBillsModalOpen] = useState(false);
  const [selectedEntryDetail, setSelectedEntryDetail] = useState<FinancialEntry | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supTradeName, setSupTradeName] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supCategory, setSupCategory] = useState('Mercearia');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supContactPerson, setSupContactPerson] = useState('');
  const [supPixKey, setSupPixKey] = useState('');
  const [supPaymentTerms, setSupPaymentTerms] = useState('Boleto 28 dias');
  const [supAddress, setSupAddress] = useState('');
  const [supNotes, setSupNotes] = useState('');

  // Modals state: Lançamento de despesa de Fornecedor
  const [isSupBillModalOpen, setIsSupBillModalOpen] = useState(false);
  const [selectedSupplierForBill, setSelectedSupplierForBill] = useState<string>('');
  const [supBillDesc, setSupBillDesc] = useState('');
  const [supBillAmount, setSupBillAmount] = useState('');
  const [supBillPaymentMethod, setSupBillPaymentMethod] = useState('Boleto');
  const [supBillStatus, setSupBillStatus] = useState<'pago' | 'pendente'>('pendente');

  // Modals state: Fluxo de Caixa (Nova Entrada/Despesa Avulsa)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'receita' | 'despesa'>('despesa');
  const [entryCategory, setEntryCategory] = useState('Infraestrutura');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryMethod, setEntryMethod] = useState('PIX');
  const [entryStatus, setEntryStatus] = useState<'pago' | 'pendente'>('pago');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryDueDate, setEntryDueDate] = useState('');
  const [entrySupplierId, setEntrySupplierId] = useState('');
  const [entryInvoiceNumber, setEntryInvoiceNumber] = useState('');
  const [entryNotes, setEntryNotes] = useState('');

  // Modals state: Sangria / Suprimento
  const [isCashOpModalOpen, setIsCashOpModalOpen] = useState(false);
  const [cashOpType, setCashOpType] = useState<'sangria' | 'suprimento'>('sangria');
  const [cashOpAmount, setCashOpAmount] = useState('');
  const [cashOpReason, setCashOpReason] = useState('');

  // ----------------------------------------------------
  // Calculations
  // ----------------------------------------------------
  // Clientes
  const totalFiadoDebt = customers.reduce((acc, c) => acc + c.balance, 0);
  const totalCustomerLimit = customers.reduce((acc, c) => acc + c.creditLimit, 0);
  const customersInDebtCount = customers.filter((c) => c.balance > 0).length;

  // Fornecedores
  const supplierPendingBills = financialEntries
    .filter((e) => e.category === 'Fornecedores' && e.status === 'pendente')
    .reduce((acc, e) => acc + e.amount, 0);
  
  const supplierPaidBills = financialEntries
    .filter((e) => e.category === 'Fornecedores' && e.status === 'pago')
    .reduce((acc, e) => acc + e.amount, 0);

  // Fluxo de Caixa
  const totalReceitas = financialEntries
    .filter((e) => e.type === 'receita' && e.status === 'pago')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalDespesas = financialEntries
    .filter((e) => e.type === 'despesa' && e.status === 'pago')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalVendasConcluidas = sales
    .filter((s) => s.status === 'concluida')
    .reduce((acc, s) => acc + s.total, 0);

  // Cash Register balance calculation
  const cashRegisterCurrentBalance = cashRegister.isOpen
    ? cashRegister.initialAmount +
      cashRegister.movements.reduce((acc, m) => (m.type === 'suprimento' ? acc + m.amount : acc - m.amount), 0)
    : 0;

  // ----------------------------------------------------
  // Handlers: Clientes
  // ----------------------------------------------------
  const handleOpenCustomerModal = (cust?: CustomerDebt) => {
    if (cust) {
      setSelectedCustomerForEdit(cust);
      setCustName(cust.name);
      setCustPhone(cust.phone || '');
      setCustAddress(cust.address || '');
      setCustLimit(cust.creditLimit ? cust.creditLimit.toString() : '300.00');
      setCustImageUrl(cust.imageUrl || '');
      setCustImageError(null);
    } else {
      setSelectedCustomerForEdit(null);
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      setCustLimit('300.00');
      setCustImageUrl('');
      setCustImageError(null);
    }
    setIsCustomerModalOpen(true);
  };

  const handleCustImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB max limit validation (5 * 1024 * 1024 bytes) - same rules as stock
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setCustImageError(
        `Arquivo muito grande (${fileSizeMB} MB). O limite máximo permitido para fotos é de 5 MB.`
      );
      if (custFileInputRef.current) {
        custFileInputRef.current.value = '';
      }
      return;
    }

    setCustImageError(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setCustImageUrl(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePayDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    const val = parseFloat(paymentAmount);
    if (!val || val <= 0) return;

    payCustomerDebt(payingCustomer.id, val, paymentNote);
    setPayingCustomer(null);
    setPaymentAmount('');
  };

  const handleSaveCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const limitVal = parseFloat(custLimit) || 0;

    if (selectedCustomerForEdit) {
      updateCustomer(selectedCustomerForEdit.id, {
        name: custName.trim(),
        phone: custPhone.trim(),
        address: custAddress.trim() || undefined,
        creditLimit: limitVal,
        imageUrl: custImageUrl.trim() || undefined,
      });
    } else {
      addCustomer(
        custName.trim(),
        custPhone.trim(),
        limitVal || 300,
        custAddress.trim() || undefined,
        custImageUrl.trim() || undefined
      );
    }

    setIsCustomerModalOpen(false);
    setSelectedCustomerForEdit(null);
  };

  const handleDeleteCustomer = (id: string) => {
    if (safeConfirm('Tem certeza que deseja excluir o cadastro deste cliente?')) {
      deleteCustomer(id);
      setIsCustomerModalOpen(false);
      setSelectedCustomerForEdit(null);
    }
  };

  // ----------------------------------------------------
  // Handlers: Fornecedores
  // ----------------------------------------------------
  const handleOpenSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupName(sup.name);
      setSupTradeName(sup.tradeName || '');
      setSupCnpj(sup.cnpj || '');
      setSupCategory(sup.category || 'Mercearia');
      setSupPhone(sup.phone || '');
      setSupEmail(sup.email || '');
      setSupContactPerson(sup.contactPerson || '');
      setSupPixKey(sup.pixKey || '');
      setSupPaymentTerms(sup.paymentTerms || 'Boleto 28 dias');
      setSupAddress(sup.address || '');
      setSupNotes(sup.notes || '');
    } else {
      setEditingSupplier(null);
      setSupName('');
      setSupTradeName('');
      setSupCnpj('');
      setSupCategory('Mercearia');
      setSupPhone('');
      setSupEmail('');
      setSupContactPerson('');
      setSupPixKey('');
      setSupPaymentTerms('Boleto 28 dias');
      setSupAddress('');
      setSupNotes('');
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const supplierData = {
      name: supName.trim(),
      tradeName: supTradeName.trim() || undefined,
      cnpj: supCnpj.trim() || undefined,
      category: supCategory,
      phone: supPhone.trim(),
      email: supEmail.trim() || undefined,
      contactPerson: supContactPerson.trim() || undefined,
      pixKey: supPixKey.trim() || undefined,
      paymentTerms: supPaymentTerms.trim() || undefined,
      address: supAddress.trim() || undefined,
      notes: supNotes.trim() || undefined,
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierData);
    } else {
      addSupplier(supplierData);
    }

    setIsSupplierModalOpen(false);
  };

  const handleCopyPix = (pix: string, supId: string) => {
    navigator.clipboard.writeText(pix);
    setCopiedPixId(supId);
    showNotification(`Chave PIX "${pix}" copiada para a área de transferência!`);
    setTimeout(() => setCopiedPixId(null), 2500);
  };

  const handleAddSupplierBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(supBillAmount);
    if (!val || val <= 0 || !supBillDesc.trim()) return;

    const sup = suppliers.find((s) => s.id === selectedSupplierForBill);
    const finalDesc = sup ? `${sup.tradeName || sup.name} - ${supBillDesc.trim()}` : supBillDesc.trim();

    addFinancialEntry({
      type: 'despesa',
      category: 'Fornecedores',
      description: finalDesc,
      amount: val,
      date: new Date().toISOString().slice(0, 10),
      status: supBillStatus,
      paymentMethod: supBillPaymentMethod,
    });

    setIsSupBillModalOpen(false);
    setSupBillDesc('');
    setSupBillAmount('');
  };

  // ----------------------------------------------------
  // Handlers: Fluxo de Caixa
  // ----------------------------------------------------
  const handleAddEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(entryAmount);
    if (!val || val <= 0 || !entryDesc.trim()) return;

    let finalDesc = entryDesc.trim();
    if (entrySupplierId) {
      const sup = suppliers.find((s) => s.id === entrySupplierId);
      if (sup && !finalDesc.toLowerCase().includes((sup.tradeName || sup.name).toLowerCase())) {
        finalDesc = `${finalDesc} - ${sup.tradeName || sup.name}`;
      }
    }

    addFinancialEntry({
      type: entryType,
      category: entryCategory,
      description: finalDesc,
      amount: val,
      date: entryDate || new Date().toISOString().slice(0, 10),
      dueDate: entryStatus === 'pendente' ? (entryDueDate || undefined) : undefined,
      status: entryStatus,
      paymentMethod: entryMethod,
      supplierId: entrySupplierId || undefined,
      invoiceNumber: entryInvoiceNumber.trim() || undefined,
      notes: entryNotes.trim() || undefined,
    });

    setIsEntryModalOpen(false);
    setEntryDesc('');
    setEntryAmount('');
    setEntrySupplierId('');
    setEntryInvoiceNumber('');
    setEntryNotes('');
    setEntryDueDate('');
  };

  const handleCashOpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(cashOpAmount);
    if (!val || val <= 0 || !cashOpReason.trim()) return;

    addCashMovement(cashOpType, val, cashOpReason.trim());
    setIsCashOpModalOpen(false);
    setCashOpAmount('');
    setCashOpReason('');
  };

  // ----------------------------------------------------
  // Filtered Lists
  // ----------------------------------------------------
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch = 
      cust.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      cust.phone.includes(searchCustomer);
    if (!matchesSearch) return false;

    if (customerFilter === 'devendo') return cust.balance > 0;
    if (customerFilter === 'em_dia') return cust.balance === 0;
    return true;
  });

  const filteredSuppliers = suppliers.filter((sup) => {
    const matchesSearch =
      sup.name.toLowerCase().includes(searchSupplier.toLowerCase()) ||
      (sup.tradeName && sup.tradeName.toLowerCase().includes(searchSupplier.toLowerCase())) ||
      (sup.cnpj && sup.cnpj.includes(searchSupplier)) ||
      sup.phone.includes(searchSupplier);
    if (!matchesSearch) return false;

    if (supplierCategoryFilter !== 'todas') {
      return sup.category.toLowerCase().includes(supplierCategoryFilter.toLowerCase());
    }
    return true;
  });

  const filteredEntries = financialEntries.filter((entry) => {
    if (financialTypeFilter === 'receita') return entry.type === 'receita';
    if (financialTypeFilter === 'despesa') return entry.type === 'despesa';
    if (financialTypeFilter === 'pendente') return entry.status === 'pendente';
    return true;
  });

  return (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-58px)] bg-slate-50 min-h-[calc(100vh-58px)]">
      {/* Top Header & Subcategory Navigation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-500" />
              Gestão Financeira
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle centralizado de Clientes (Fiado), Fornecedores e Fluxo de Caixa do estabelecimento.
            </p>
          </div>

          {/* 3 Main Subdivisions: Clientes, Fornecedores, Fluxo de Caixa */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 shrink-0">
            <button
              type="button"
              id="subtab-financeiro-clientes"
              onClick={() => setActiveCategory('clientes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'clientes'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className={`w-4 h-4 ${activeCategory === 'clientes' ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>Clientes</span>
              {customersInDebtCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-mono font-bold">
                  {customersInDebtCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="subtab-financeiro-fornecedores"
              onClick={() => setActiveCategory('fornecedores')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'fornecedores'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Truck className={`w-4 h-4 ${activeCategory === 'fornecedores' ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>Fornecedores</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono font-bold">
                {suppliers.length}
              </span>
            </button>

            <button
              type="button"
              id="subtab-financeiro-fluxo"
              onClick={() => setActiveCategory('fluxo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'fluxo'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <DollarSign className={`w-4 h-4 ${activeCategory === 'fluxo' ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>Fluxo de Caixa</span>
            </button>

            <button
              type="button"
              id="subtab-financeiro-relatorios"
              onClick={() => setActiveCategory('relatorios')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'relatorios'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeCategory === 'relatorios' ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>Relatórios & Gráficos</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CATEGORIA: CLIENTES (Caderninho / Fiado) */}
      {/* ========================================================================= */}
      {activeCategory === 'clientes' && (
        <div className="space-y-4">
          {/* Summary metrics for Customers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50/90 p-4 rounded-xl border border-amber-200 shadow-xs">
              <span className="text-[11px] uppercase font-bold text-amber-800 block">
                Total a Receber no Fiado
              </span>
              <span className="text-2xl font-black font-mono text-amber-900 mt-1 block">
                R$ {totalFiadoDebt.toFixed(2)}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">
                {customersInDebtCount} cliente(s) com dívida em aberto
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Clientes Cadastrados
                </span>
                <span className="text-2xl font-black font-mono text-slate-800 mt-1 block">
                  {customers.length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Com cadastro e limite liberado
                </span>
              </div>
              <button
                type="button"
                id="btn-add-customer"
                onClick={() => handleOpenCustomerModal()}
                className="py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Novo Cliente</span>
              </button>
            </div>

            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] uppercase font-bold text-slate-700 block">
                Limite Total Concedido
              </span>
              <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                R$ {totalCustomerLimit.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Crédito rotativo de confiança
              </span>
            </div>
          </div>

          {/* Search & Filter bar for Customers */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou telefone..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerFilter('todos')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    customerFilter === 'todos' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Todos ({customers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter('devendo')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    customerFilter === 'devendo' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Com Dívida ({customersInDebtCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerFilter('em_dia')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    customerFilter === 'em_dia' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Em Dia ({customers.length - customersInDebtCount})
                </button>
              </div>
            </div>
          </div>

          {/* Customers Caderninho Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((cust) => {
              const hasDebt = cust.balance > 0;
              const available = Math.max(0, cust.creditLimit - cust.balance);
              const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
              const initials = cust.name
                ? cust.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : 'CL';

              return (
                <div
                  key={cust.id}
                  id={`card-customer-${cust.id}`}
                  onClick={() => handleOpenCustomerModal(cust)}
                  className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all cursor-pointer hover:border-slate-400 hover:shadow-md group relative ${
                    hasDebt ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                  }`}
                  title="Clique para ver detalhes, editar dados ou foto do cliente"
                >
                  <div>
                    {/* Customer Header with Photo & Details */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3">
                        {/* Customer Photo / Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          {cust.imageUrl ? (
                            <img
                              src={cust.imageUrl}
                              alt={cust.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-slate-300 shadow-xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-2.5 h-2.5 text-slate-700" />
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">
                            {cust.name}
                          </h4>
                          
                          {/* Phone & ZAP Button */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cust.phone || 'Sem telefone'}
                            </span>
                            
                            {cleanPhone.length >= 8 && (
                              <a
                                href={`https://wa.me/55${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                id={`btn-zap-${cust.id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#25D366] hover:bg-[#20bd5a] text-white text-[10px] font-black tracking-wider uppercase shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                                title={`Abrir conversa no WhatsApp com ${cust.name}`}
                              >
                                <MessageCircle className="w-3 h-3 fill-current" />
                                <span>ZAP</span>
                              </a>
                            )}
                          </div>

                          {cust.address && (
                            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[190px]">
                              {cust.address}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          hasDebt ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {hasDebt ? 'Devendo' : 'Em Dia'}
                      </span>
                    </div>

                    {/* Balance & Limits Box */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 grid grid-cols-2 text-center my-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Dívida Atual
                        </span>
                        <span
                          className={`text-base font-black font-mono ${
                            hasDebt ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          R$ {cust.balance.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Limite Disponível
                        </span>
                        <span className="text-base font-bold font-mono text-slate-800">
                          R$ {available.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Mini history list */}
                    {cust.history && cust.history.length > 0 && (
                      <div className="space-y-1 my-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Últimas Movimentações no Fiado:
                        </span>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {cust.history.slice(0, 3).map((h) => (
                            <div
                              key={h.id}
                              className="text-[10px] flex items-center justify-between text-slate-600 p-1.5 rounded bg-slate-50 border border-slate-100"
                            >
                              <span className="truncate max-w-[160px] font-medium">{h.description}</span>
                              <span
                                className={`font-mono font-bold shrink-0 ${
                                   h.type === 'compra' ? 'text-rose-600' : 'text-slate-900'
                                }`}
                              >
                                {h.type === 'compra' ? '+' : '-'} R$ {h.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions & Hint */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 mt-2">
                    {hasDebt ? (
                      <button
                        type="button"
                        id={`btn-receive-${cust.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPayingCustomer(cust);
                          setPaymentAmount(cust.balance.toFixed(2));
                        }}
                        className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Receber / Abater Dívida</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-600 font-semibold italic text-center w-full py-1">
                        ✓ Nenhuma pendência no momento
                      </div>
                    )}

                    <p className="text-[9px] text-slate-400 text-center flex items-center justify-center gap-1">
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Clique no cartão para editar dados ou alterar foto</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CATEGORIA: FORNECEDORES */}
      {/* ========================================================================= */}
      {activeCategory === 'fornecedores' && (
        <div className="space-y-4">
          {/* Summary metrics for Suppliers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Fornecedores Cadastrados
                </span>
                <span className="text-2xl font-black font-mono text-slate-800 mt-1 block">
                  {suppliers.length}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Parceiros e distribuidores ativos
                </span>
              </div>
              <button
                type="button"
                id="btn-new-supplier"
                onClick={() => handleOpenSupplierModal()}
                className="py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Fornecedor</span>
              </button>
            </div>

            {/* Faturas Pendentes Card (Clickable to view details of all pending items) */}
            <div
              id="dash-card-faturas-pendentes"
              onClick={() => setIsPendingBillsModalOpen(true)}
              title="Clique para visualizar os detalhes de todas as faturas e boletos pendentes"
              className="bg-amber-50/90 p-4 rounded-xl border border-amber-200 hover:border-amber-400 shadow-xs hover:shadow-md flex items-center justify-between transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase font-bold text-amber-900 block">
                    Faturas Pendentes a Pagar
                  </span>
                  {supplierPendingBills > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                      Ver Itens
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black font-mono text-rose-600 mt-1 block">
                  R$ {supplierPendingBills.toFixed(2)}
                </span>
                <span className="text-[11px] text-amber-700 font-medium group-hover:underline flex items-center gap-1">
                  <span>Boletos e compras a liquidar</span>
                  <span className="font-bold text-amber-900">→</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-100/80 group-hover:bg-amber-200 text-amber-900 border border-amber-300/80 transition-colors">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            {/* Total Pago Card (Clickable to view details of all paid supplier expenses) */}
            <div
              id="dash-card-faturas-pagas"
              onClick={() => setIsPaidBillsModalOpen(true)}
              title="Clique para visualizar o histórico de todas as faturas e notas quitadas em fornecedores"
              className="bg-slate-100 p-4 rounded-xl border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md flex items-center justify-between transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase font-bold text-slate-700 block">
                    Total Pago em Fornecedores
                  </span>
                  {supplierPaidBills > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-200 text-slate-800 border border-slate-300">
                      Ver Histórico
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                  R$ {supplierPaidBills.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium group-hover:underline flex items-center gap-1">
                  <span>Despesas quitadas no período</span>
                  <span className="font-bold text-slate-700">→</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 border border-slate-300 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-slate-800" />
              </div>
            </div>
          </div>

          {/* Search & Category Filter for Suppliers */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar fornecedor por nome, CNPJ ou telefone..."
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Categoria:</span>
              <select
                value={supplierCategoryFilter}
                onChange={(e) => setSupplierCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="todas">Todas as Categorias</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Padaria">Padaria & Mercearia</option>
                <option value="Hortifruti">Hortifruti</option>
                <option value="Laticínios">Laticínios & Frios</option>
                <option value="Limpeza">Higiene & Limpeza</option>
              </select>
            </div>
          </div>

          {/* Suppliers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((sup) => {
              const cleanPhone = sup.phone ? sup.phone.replace(/\D/g, '') : '';
              const supBills = financialEntries.filter((e) => {
                if (e.supplierId === sup.id) return true;
                if (e.category === 'Fornecedores') {
                  const desc = e.description.toLowerCase();
                  return desc.includes((sup.tradeName || sup.name).toLowerCase()) || desc.includes(sup.name.toLowerCase());
                }
                return false;
              });
              const pendingBills = supBills.filter((b) => b.status === 'pendente');

              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupplierDetail(sup)}
                  title="Clique para ver a ficha completa e o histórico de notas deste fornecedor"
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="space-y-3">
                    {/* Top Supplier Title */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-orange-400 transition-colors">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
                              {sup.tradeName || sup.name}
                            </h4>
                            {sup.tradeName && sup.name !== sup.tradeName && (
                              <p className="text-[11px] text-slate-400">
                                {sup.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {sup.category}
                        </span>
                        <span className="text-[10px] text-orange-600 font-bold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver Ficha →
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {sup.cnpj && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">CNPJ / CPF:</span>
                          <span className="font-mono text-slate-700">{sup.cnpj}</span>
                        </div>
                      )}

                      {sup.contactPerson && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Contato / Vendedor:</span>
                          <span className="text-slate-700 font-medium">{sup.contactPerson}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Telefone:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-slate-700">{sup.phone}</span>
                          {cleanPhone.length >= 10 && (
                            <a
                              href={`https://wa.me/55${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-orange-600 hover:text-orange-800"
                              title="Conversar no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {sup.paymentTerms && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Condição de Pagamento:</span>
                          <span className="text-slate-700 font-semibold">{sup.paymentTerms}</span>
                        </div>
                      )}
                    </div>

                    {/* PIX Box */}
                    {sup.pixKey && (
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-700 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Chave PIX:</span>
                            <span className="font-mono font-bold text-slate-900">{sup.pixKey}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPix(sup.pixKey!, sup.id);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-orange-50 text-slate-800 border border-slate-300 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedPixId === sup.id ? (
                            <>
                              <Check className="w-3 h-3 text-orange-600" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Copiar PIX</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Pending bills alert if any */}
                    {pendingBills.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-rose-800">
                          <span>Faturas Pendentes ({pendingBills.length}):</span>
                          <span className="font-mono">
                            R$ {pendingBills.reduce((acc, b) => acc + b.amount, 0).toFixed(2)}
                          </span>
                        </div>
                        {pendingBills.map((bill) => (
                          <div key={bill.id} className="flex items-center justify-between text-[11px] text-rose-900 pt-1 border-t border-rose-100">
                            <span className="truncate max-w-[200px]">{bill.description}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFinancialEntryStatus(bill.id);
                              }}
                              className="font-bold text-orange-600 underline hover:text-orange-800 cursor-pointer"
                            >
                              Dar Baixa (Pago)
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {sup.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                        Obs: {sup.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSupplierDetail(sup);
                      }}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-orange-50 text-slate-800 hover:text-orange-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Lançar Entrada</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSupplierModal(sup);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Editar Fornecedor"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (safeConfirm(`Deseja remover o fornecedor "${sup.tradeName || sup.name}"?`)) {
                            deleteSupplier(sup.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Excluir Fornecedor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CATEGORIA: FLUXO DE CAIXA */}
      {/* ========================================================================= */}
      {activeCategory === 'fluxo' && (
        <div className="space-y-4">
          {/* Main Financial KPI Metrics (Responsive & Interactive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {/* 1. Saldo em Gaveta */}
            <div 
              id="dash-card-gaveta"
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-500">
                  Saldo em Gaveta (Caixa)
                </span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black font-mono text-slate-900 block">
                  R$ {cashRegisterCurrentBalance.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                  {cashRegister.isOpen ? 'Caixa Aberto no PDV' : 'Caixa Fechado'}
                </span>
              </div>
            </div>

            {/* 2. Total Entradas / Receitas (Clickable Filter) */}
            <div 
              id="dash-card-receitas"
              onClick={() => setFinancialTypeFilter(financialTypeFilter === 'receita' ? 'todos' : 'receita')}
              title="Clique para filtrar apenas lançamentos de Entradas / Receitas"
              className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                financialTypeFilter === 'receita'
                  ? 'bg-orange-100/90 border-orange-500 ring-2 ring-orange-500/30'
                  : 'bg-slate-100 border-slate-200 hover:border-orange-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase font-bold text-slate-900">
                    Total Entradas / Receitas
                  </span>
                  {financialTypeFilter === 'receita' && (
                    <span className="px-1.5 py-0.2 bg-orange-500 text-white rounded text-[9px] font-black">
                      Ativo
                    </span>
                  )}
                </div>
                <span className="p-2 rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black font-mono text-orange-600 block">
                  R$ {totalReceitas.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5 group-hover:underline">
                  Entradas e receitas recebidas →
                </span>
              </div>
            </div>

            {/* 3. Total Despesas / Saídas (Clickable Filter) */}
            <div 
              id="dash-card-despesas"
              onClick={() => setFinancialTypeFilter(financialTypeFilter === 'despesa' ? 'todos' : 'despesa')}
              title="Clique para filtrar apenas lançamentos de Despesas / Saídas"
              className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                financialTypeFilter === 'despesa'
                  ? 'bg-rose-100/90 border-rose-500 ring-2 ring-rose-500/30'
                  : 'bg-rose-50/80 border-rose-200 hover:border-rose-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase font-bold text-rose-900">
                    Total Despesas / Saídas
                  </span>
                  {financialTypeFilter === 'despesa' && (
                    <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black">
                      Ativo
                    </span>
                  )}
                </div>
                <span className="p-2 rounded-xl bg-rose-200 text-rose-900 group-hover:bg-rose-300 transition-colors">
                  <TrendingDown className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black font-mono text-rose-700 block">
                  R$ {totalDespesas.toFixed(2)}
                </span>
                <span className="text-[11px] text-rose-600 font-medium block mt-0.5 group-hover:underline">
                  Fornecedores e custos operacionais →
                </span>
              </div>
            </div>

            {/* 4. Saldo Líquido (Clickable to Reset) */}
            <div 
              id="dash-card-saldo-liquido"
              onClick={() => setFinancialTypeFilter('todos')}
              title="Clique para visualizar todos os lançamentos (Balanço consolidado)"
              className={`p-4 rounded-2xl text-white border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                financialTypeFilter === 'todos'
                  ? 'bg-slate-900 border-slate-600 ring-2 ring-orange-500/30'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-300">
                  Saldo Líquido
                </span>
                <span className="p-2 rounded-xl bg-slate-800 text-white group-hover:bg-slate-700 transition-colors">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black font-mono text-white block">
                  R$ {(totalReceitas - totalDespesas).toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5 group-hover:text-orange-300">
                  Balanço consolidado (Ver Todos) →
                </span>
              </div>
            </div>
          </div>

          {/* Table Header & Quick Action Buttons (Responsive flex layout) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-bold">Filtrar por:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs flex-wrap gap-0.5">
                <button
                  type="button"
                  onClick={() => setFinancialTypeFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    financialTypeFilter === 'todos' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas ({financialEntries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFinancialTypeFilter('receita')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    financialTypeFilter === 'receita' ? 'bg-orange-100 text-orange-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Receitas
                </button>
                <button
                  type="button"
                  onClick={() => setFinancialTypeFilter('despesa')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    financialTypeFilter === 'despesa' ? 'bg-rose-100 text-rose-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Despesas
                </button>
                <button
                  type="button"
                  onClick={() => setFinancialTypeFilter('pendente')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    financialTypeFilter === 'pendente' ? 'bg-amber-100 text-amber-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pendentes
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  setCashOpType('sangria');
                  setIsCashOpModalOpen(true);
                }}
                className="flex-1 sm:flex-initial py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Sangria / Retirada</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCashOpType('suprimento');
                  setIsCashOpModalOpen(true);
                }}
                className="flex-1 sm:flex-initial py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Suprimento (Troco)</span>
              </button>

              <button
                type="button"
                id="btn-new-entry"
                onClick={() => setIsEntryModalOpen(true)}
                className="w-full sm:w-auto py-2 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Lançar Movimentação</span>
              </button>
            </div>
          </div>

          {/* Table of Financial Entries (Responsive with Horizontal Scroll) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Forma Pagto</th>
                  <th className="p-3 text-right">Valor (R$)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => {
                  const isExpense = entry.type === 'despesa';
                  const isPaid = entry.status === 'pago';

                  return (
                    <tr 
                      key={entry.id} 
                      onClick={() => setSelectedEntryDetail(entry)}
                      title="Clique para visualizar detalhes deste lançamento ou excluí-lo"
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 font-mono text-slate-600 group-hover:text-slate-900 font-semibold">{entry.date}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isExpense ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-900'
                          }`}
                        >
                          {isExpense ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {entry.type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{entry.category}</td>
                      <td className="p-3 text-slate-800 font-medium group-hover:text-orange-600 font-bold">{entry.description}</td>
                      <td className="p-3 text-slate-600">{entry.paymentMethod || 'Diversos'}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={isExpense ? 'text-rose-600' : 'text-orange-600'}>
                          {isExpense ? '-' : '+'} R$ {entry.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPaid ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleFinancialEntryStatus(entry.id)}
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            {isPaid ? 'Marcar Pendente' : 'Marcar Pago'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (safeConfirm(`Deseja realmente excluir o lançamento "${entry.description}"?`)) {
                                deleteFinancialEntry(entry.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CATEGORIA: RELATÓRIOS & GRÁFICOS INTERATIVOS */}
      {/* ========================================================================= */}
      {activeCategory === 'relatorios' && (
        <RelatoriosFinanceiroSection />
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal 1: Pay Customer Debt (Abater Fiado) */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-400" />
                <span>Receber Pagamento de Fiado</span>
              </h3>
              <button onClick={() => setPayingCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayDebtSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="font-bold text-sm text-slate-800">{payingCustomer.name}</div>
                <div className="flex justify-between text-amber-900 mt-1">
                  <span>Dívida Atual no Caderninho:</span>
                  <span className="font-mono font-black text-sm text-rose-600">
                    R$ {payingCustomer.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Valor a Receber / Abater (R$):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="flex-1 px-3 py-2 text-base font-bold font-mono border-2 border-orange-500 rounded-lg focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(payingCustomer.balance.toFixed(2))}
                    className="px-3 py-2 bg-orange-100 text-orange-900 rounded-lg font-bold hover:bg-orange-200 cursor-pointer"
                  >
                    Quitar Tudo
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Anotação / Observação:
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View / Edit / Add Customer */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                {selectedCustomerForEdit ? (
                  <>
                    <User className="w-4 h-4 text-orange-400" />
                    <span>Dados do Cliente & Caderninho</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-orange-400" />
                    <span>Novo Cliente no Caderninho</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setSelectedCustomerForEdit(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveCustomerSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              {/* Photo Upload Section (same rules as stock) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-700 text-xs">
                  Foto do Cliente (Avatar / Identificação):
                </label>

                {custImageError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{custImageError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview */}
                  <div className="relative shrink-0">
                    {custImageUrl ? (
                      <div className="relative group">
                        <img
                          src={custImageUrl}
                          alt="Foto do Cliente"
                          className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustImageUrl('');
                            if (custFileInputRef.current) custFileInputRef.current.value = '';
                          }}
                          className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer"
                          title="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-center">
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-[9px] font-semibold">Sem Foto</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      ref={custFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustImageFileUpload}
                      className="hidden"
                      id="customer-photo-upload"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => custFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-orange-500" />
                        <span>{custImageUrl ? 'Alterar Foto' : 'Carregar Foto'}</span>
                      </button>

                      {custImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustImageUrl('');
                            if (custFileInputRef.current) custFileInputRef.current.value = '';
                          }}
                          className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo permitido: <strong>5 MB</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo do Cliente:</label>
                  <input
                    type="text"
                    placeholder="Ex: Dona Maria de Fátima"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Telefone / WhatsApp:</label>
                    {custPhone.replace(/\D/g, '').length >= 8 && (
                      <a
                        href={`https://wa.me/55${custPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#25D366] text-white text-[10px] font-black uppercase shadow-xs hover:bg-[#20bd5a]"
                        title="Abrir no WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3 fill-current" />
                        <span>ZAP</span>
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="(11) 97123-4567"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 font-mono border rounded-lg focus:outline-none focus:border-orange-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Limite Máximo de Fiado (R$):</label>
                  <input
                    type="number"
                    step="10"
                    value={custLimit}
                    onChange={(e) => setCustLimit(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold border rounded-lg focus:outline-none focus:border-orange-500 text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Endereço / Ponto de Referência:</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua das Flores, 45 - Ao lado da padaria"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 text-xs"
                  />
                </div>
              </div>

              {/* If editing existing customer, show financial balance & movements history */}
              {selectedCustomerForEdit && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center justify-between">
                    <span>Situação Financeira do Cliente</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedCustomerForEdit.balance > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {selectedCustomerForEdit.balance > 0 ? 'Devendo no Fiado' : 'Em Dia'}
                    </span>
                  </h4>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <span className="text-[10px] text-amber-800 uppercase font-semibold block">Dívida Atual</span>
                      <span className="text-sm font-black font-mono text-rose-600">
                        R$ {(selectedCustomerForEdit.balance ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Limite Total</span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        R$ {(selectedCustomerForEdit.creditLimit ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-700 uppercase font-semibold block">Disponível</span>
                      <span className="text-sm font-black font-mono text-slate-900">
                        R$ {Math.max(0, (selectedCustomerForEdit.creditLimit ?? 0) - (selectedCustomerForEdit.balance ?? 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* History of customer movements */}
                  {selectedCustomerForEdit.history && selectedCustomerForEdit.history.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <label className="block font-bold text-slate-600 text-[11px]">
                        Histórico de Compras e Pagamentos:
                      </label>
                      <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                        {selectedCustomerForEdit.history.map((h) => (
                          <div
                            key={h.id}
                            className="text-[11px] flex items-center justify-between p-1.5 rounded bg-white border border-slate-100"
                          >
                            <div>
                              <span className="font-semibold text-slate-800 block">{h.description}</span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(h.date).toLocaleDateString('pt-BR')} às {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span
                              className={`font-mono font-bold text-xs shrink-0 ${
                                h.type === 'compra' ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {h.type === 'compra' ? '+' : '-'} R$ {h.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <div>
                  {selectedCustomerForEdit && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(selectedCustomerForEdit.id)}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerModalOpen(false);
                      setSelectedCustomerForEdit(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                <span>{editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}</span>
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Razão Social / Nome Oficial:</label>
                  <input
                    type="text"
                    placeholder="Ex: Distribuidora de Alimentos Ltda"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Fantasia (Como é conhecido):</label>
                  <input
                    type="text"
                    placeholder="Ex: Ambev Regional"
                    value={supTradeName}
                    onChange={(e) => setSupTradeName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNPJ ou CPF:</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={supCnpj}
                    onChange={(e) => setSupCnpj(e.target.value)}
                    className="w-full px-3 py-2 font-mono border rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria de Fornecimento:</label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    <option value="Mercearia">Mercearia</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Padaria & Mercearia">Padaria & Mercearia</option>
                    <option value="Laticínios & Frios">Laticínios & Frios</option>
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                    <option value="Açougue">Açougue & Carnes</option>
                    <option value="Embalagens & Outros">Embalagens & Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendedor / Pessoa de Contato:</label>
                  <input
                    type="text"
                    placeholder="Ex: Roberto Vendas"
                    value={supContactPerson}
                    onChange={(e) => setSupContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chave PIX para Pagamentos:</label>
                  <input
                    type="text"
                    placeholder="CNPJ, E-mail ou Telefone"
                    value={supPixKey}
                    onChange={(e) => setSupPixKey(e.target.value)}
                    className="w-full px-3 py-2 font-mono border rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condições de Pagamento:</label>
                  <input
                    type="text"
                    placeholder="Ex: Boleto 28 dias, Semanal, À vista"
                    value={supPaymentTerms}
                    onChange={(e) => setSupPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço / Cidade:</label>
                <input
                  type="text"
                  placeholder="Av. Principal, 100 - Centro"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações / Dias de Entrega:</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Entregas toda terça e quinta de manhã..."
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Lançar Fatura / Despesa de Fornecedor */}
      {isSupBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-400" />
                <span>Lançar Fatura de Fornecedor</span>
              </h3>
              <button onClick={() => setIsSupBillModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierBillSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Selecione o Fornecedor:</label>
                <select
                  value={selectedSupplierForBill}
                  onChange={(e) => setSelectedSupplierForBill(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tradeName || s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição / Número da Nota:</label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 45892 - Carga de Bebidas"
                  value={supBillDesc}
                  onChange={(e) => setSupBillDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Total (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={supBillAmount}
                    onChange={(e) => setSupBillAmount(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold border rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento:</label>
                  <select
                    value={supBillPaymentMethod}
                    onChange={(e) => setSupBillPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  >
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Situação Inicial:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSupBillStatus('pendente')}
                    className={`flex-1 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                      supBillStatus === 'pendente'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Pendente (A Pagar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupBillStatus('pago')}
                    className={`flex-1 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                      supBillStatus === 'pago'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Já Pago (Quitado)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSupBillModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Registrar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Nova Movimentação Financeira Profissional */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            
            {/* Header com Gradiente Dinâmico */}
            <div className={`px-6 py-4 flex items-center justify-between text-white transition-all ${
              entryType === 'despesa'
                ? 'bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900'
                : 'bg-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs text-white">
                  {entryType === 'despesa' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5 text-orange-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    {entryType === 'despesa' ? 'Novo Lançamento de Despesa / Saída' : 'Novo Lançamento de Receita / Entrada'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Registre movimentações, contas a pagar, boletos ou aportes de caixa
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEntryModalOpen(false)} 
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEntrySubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* 1. Seletor de Tipo (Despesa / Receita) */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Natureza da Movimentação:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('despesa');
                      if (entryCategory === 'Aporte' || entryCategory === 'Recicláveis') {
                        setEntryCategory('Infraestrutura');
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                      entryType === 'despesa'
                        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 text-rose-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${entryType === 'despesa' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block">Despesa / Saída</span>
                      <span className="text-[10px] text-slate-500 block">Contas, boletos, custos</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('receita');
                      setEntryCategory('Aporte');
                      setEntrySupplierId('');
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                      entryType === 'receita'
                        ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${entryType === 'receita' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block">Receita / Entrada</span>
                      <span className="text-[10px] text-slate-500 block">Aportes, vendas extras</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Valor em Destaque com Atalhos Rápidos */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                    Valor do Lançamento (R$):
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Obrigatório</span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400 font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-lg font-black font-mono bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 shadow-2xs"
                    required
                  />
                </div>

                {/* Atalhos de Valores Rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">Atalhos:</span>
                  {[20, 50, 100, 200, 500, 1000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEntryAmount(v.toFixed(2))}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-orange-50 hover:text-orange-800 text-slate-600 border border-slate-200 text-[10px] font-bold font-mono transition-colors cursor-pointer"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Categoria & Classificação Financeira */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Categoria da Despesa:
                  </label>
                  <select
                    value={entryCategory}
                    onChange={(e) => {
                      setEntryCategory(e.target.value);
                      if (e.target.value !== 'Fornecedores') {
                        setEntrySupplierId('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 font-semibold text-slate-800"
                  >
                    {entryType === 'despesa' ? (
                      <>
                        <option value="Fornecedores">🚚 Fornecedores & Mercadorias</option>
                        <option value="Infraestrutura">⚡ Energia, Água, Internet & Aluguel</option>
                        <option value="Pessoal">👥 Salários, Diárias & Pró-Labore</option>
                        <option value="Manutenção">🛠️ Manutenção & Reparos</option>
                        <option value="Embalagens">📦 Sacolas, Embalagens & Limpeza</option>
                        <option value="Marketing">📢 Marketing & Propaganda</option>
                        <option value="Impostos">🏛️ Impostos & Tributos (DAS / MEI)</option>
                        <option value="Taxas">💳 Taxas de Cartão & Bancárias</option>
                        <option value="Outros">☕ Outras Despesas Gerais</option>
                      </>
                    ) : (
                      <>
                        <option value="Aporte">💰 Aporte dos Sócios / Capital Inicial</option>
                        <option value="Recicláveis">📦 Venda de Caixas / Sucatas / Reciclagem</option>
                        <option value="Bonificação">🎁 Bonificação / Cashback de Fornecedor</option>
                        <option value="Rendimentos">📈 Rendimentos de Aplicações</option>
                        <option value="Outros">💵 Outras Receitas Avulsas</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Meio de Pagamento:
                  </label>
                  <select
                    value={entryMethod}
                    onChange={(e) => setEntryMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 font-semibold text-slate-800"
                  >
                    <option value="PIX">⚡ PIX (Instantâneo)</option>
                    <option value="Dinheiro">💵 Dinheiro em Espécie</option>
                    <option value="Boleto">📄 Boleto Bancário</option>
                    <option value="Débito">💳 Cartão de Débito</option>
                    <option value="Crédito">💳 Cartão de Crédito</option>
                    <option value="Transferência">🏦 Transferência / TED</option>
                  </select>
                </div>
              </div>

              {/* 4. Fornecedor Vinculado (Se for Fornecedores ou Despesa) */}
              {entryType === 'despesa' && entryCategory === 'Fornecedores' && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-900 text-[11px] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-600" />
                      Vincular ao Fornecedor Cadastrado:
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Histórico Automático</span>
                  </div>
                  <select
                    value={entrySupplierId}
                    onChange={(e) => {
                      const supId = e.target.value;
                      setEntrySupplierId(supId);
                      const s = suppliers.find((sup) => sup.id === supId);
                      if (s && !entryDesc.trim()) {
                        setEntryDesc(`Fatura/Compra - ${s.tradeName || s.name}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none font-semibold"
                  >
                    <option value="">Nenhum Fornecedor Específico (Geral)</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName || s.name} ({s.category}) {s.cnpj ? `- CNPJ: ${s.cnpj}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 5. Descrição Detalhada com Sugestões */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Descrição do Lançamento:
                  </label>
                  <span className="text-[10px] text-slate-400">Identificação clara</span>
                </div>
                <input
                  type="text"
                  placeholder={entryType === 'despesa' ? 'Ex: Conta de Energia Neoenergia / Compra Sacolas' : 'Ex: Aporte para Troco / Venda de Caixas de Papelão'}
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 bg-slate-50 focus:bg-white"
                  required
                />

                {/* Sugestões Rápidas de Descrição */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Exemplos:</span>
                  {(entryType === 'despesa' ? [
                    'Conta de Energia',
                    'Conta de Água',
                    'Internet Fibra',
                    'Aluguel do Ponto',
                    'Boleto Fornecedor',
                    'Reposição de Sacolas'
                  ] : [
                    'Aporte Troco Inicial',
                    'Venda Recicláveis',
                    'Cashback Fornecedor',
                    'Rendimento Mensal'
                  ]).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setEntryDesc(sug)}
                      className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Datas: Competência / Lançamento & Vencimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Data do Lançamento:
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    Nº do Documento / NF (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NF-e 4589 / Bol 1024"
                    value={entryInvoiceNumber}
                    onChange={(e) => setEntryInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* 7. Status da Movimentação */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Situação do Pagamento:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEntryStatus('pago')}
                    className={`py-2 px-3 rounded-xl font-extrabold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      entryStatus === 'pago'
                        ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    <span>Pago / Liquidado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEntryStatus('pendente');
                      if (!entryDueDate) {
                        const in7Days = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
                        setEntryDueDate(in7Days);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl font-extrabold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      entryStatus === 'pendente'
                        ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Pendente / A Pagar</span>
                  </button>
                </div>
              </div>

              {/* Campo de Vencimento se estiver Pendente */}
              {entryStatus === 'pendente' && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-amber-900 text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Data de Vencimento do Compromisso:
                    </label>
                    <span className="text-[10px] text-amber-800 font-semibold">Alerta no Fluxo de Caixa</span>
                  </div>
                  <input
                    type="date"
                    value={entryDueDate}
                    onChange={(e) => setEntryDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-600"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-amber-900 font-bold">Vencer em:</span>
                    {[
                      { label: 'Hoje', days: 0 },
                      { label: 'Amanhã', days: 1 },
                      { label: '+7 dias', days: 7 },
                      { label: '+15 dias', days: 15 },
                      { label: '+30 dias', days: 30 },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 86400000 * opt.days).toISOString().slice(0, 10);
                          setEntryDueDate(d);
                        }}
                        className="px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-200 text-[10px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Observações Adicionais */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações Adicionais (Opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais, chave PIX utilizada, código de barras do boleto..."
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all ${
                    entryType === 'despesa'
                      ? 'bg-rose-700 hover:bg-rose-800'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {entryType === 'despesa' ? 'Salvar Despesa' : 'Salvar Receita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Sangria / Suprimento */}
      {isCashOpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className={`text-white px-5 py-3.5 flex items-center justify-between ${
              cashOpType === 'sangria' ? 'bg-rose-800' : 'bg-slate-900'
            }`}>
              <h3 className="font-bold text-sm flex items-center gap-2">
                {cashOpType === 'sangria' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4 text-orange-400" />}
                <span>{cashOpType === 'sangria' ? 'Realizar Sangria (Retirada)' : 'Realizar Suprimento (Entrada de Troco)'}</span>
              </h3>
              <button onClick={() => setIsCashOpModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCashOpSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Saldo Atual em Caixa:</span>
                <span className="font-mono font-black text-base text-slate-900">
                  R$ {cashRegisterCurrentBalance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor da Operação (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashOpAmount}
                  onChange={(e) => setCashOpAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold font-mono border rounded-lg focus:outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Justificativa:</label>
                <input
                  type="text"
                  placeholder={cashOpType === 'sangria' ? 'Ex: Sangria para cofre de segurança' : 'Ex: Troco inicial em moedas'}
                  value={cashOpReason}
                  onChange={(e) => setCashOpReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCashOpModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-lg font-bold shadow-xs cursor-pointer ${
                    cashOpType === 'sangria' ? 'bg-rose-700 hover:bg-rose-800' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  Confirmar {cashOpType === 'sangria' ? 'Sangria' : 'Suprimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Supplier Detail Modal (Opens when clicking anywhere on a supplier card) */}
      <SupplierDetailModal
        isOpen={!!selectedSupplierDetail}
        supplier={selectedSupplierDetail}
        onClose={() => setSelectedSupplierDetail(null)}
        onEdit={(sup) => {
          setSelectedSupplierDetail(null);
          handleOpenSupplierModal(sup);
        }}
      />

      {/* Pending Supplier Bills Modal (Opens when clicking on the pending bills dash card) */}
      <PendingSupplierBillsModal
        isOpen={isPendingBillsModalOpen}
        onClose={() => setIsPendingBillsModalOpen(false)}
        onSelectSupplier={(sup) => setSelectedSupplierDetail(sup)}
      />

      {/* Paid Supplier Bills Modal (Opens when clicking on the paid bills dash card) */}
      <PaidSupplierBillsModal
        isOpen={isPaidBillsModalOpen}
        onClose={() => setIsPaidBillsModalOpen(false)}
        onSelectSupplier={(sup) => setSelectedSupplierDetail(sup)}
      />

      {/* Financial Entry Detail Modal (Opens when clicking on any row in the Fluxo de Caixa table) */}
      <FinancialEntryDetailModal
        isOpen={!!selectedEntryDetail}
        entry={selectedEntryDetail}
        onClose={() => setSelectedEntryDetail(null)}
      />
    </div>
  );
};
