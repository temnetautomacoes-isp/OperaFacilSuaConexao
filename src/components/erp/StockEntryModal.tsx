import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  PackagePlus, 
  Search, 
  Barcode, 
  Camera, 
  X, 
  Check, 
  ArrowRight, 
  DollarSign, 
  Building2, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  Layers,
  CheckCircle2,
  CalendarClock
} from 'lucide-react';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string | null;
}

export const StockEntryModal: React.FC<StockEntryModalProps> = ({
  isOpen,
  onClose,
  initialProductId = null,
}) => {
  const { 
    products, 
    suppliers, 
    adjustStock, 
    updateProduct, 
    addBatchToProduct,
    addFinancialEntry,
    showNotification 
  } = useApp();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [entryQuantity, setEntryQuantity] = useState<string>('10');
  const [costPrice, setCostPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [updatePrices, setUpdatePrices] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [invoiceReference, setInvoiceReference] = useState<string>('');
  const [entryManufacturingDate, setEntryManufacturingDate] = useState<string>('');
  const [entryExpirationDate, setEntryExpirationDate] = useState<string>('');
  const [entryBatchNumber, setEntryBatchNumber] = useState<string>('');
  const [registerFinancialExpense, setRegisterFinancialExpense] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSuccessMessage(null);
      if (initialProductId) {
        const prod = products.find((p) => p.id === initialProductId);
        if (prod) {
          handleSelectProduct(prod);
        }
      } else {
        setSelectedProduct(null);
        setSearchTerm('');
        setEntryQuantity('10');
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  }, [isOpen, initialProductId]);

  // Product suggestions based on search
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return products.slice(0, 8);
    const clean = searchTerm.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(clean) ||
        p.barcode.toLowerCase().includes(clean) ||
        p.category.toLowerCase().includes(clean)
    ).slice(0, 12);
  }, [searchTerm, products]);

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setSearchTerm('');
    setCostPrice(prod.costPrice.toFixed(2));
    setSalePrice(prod.salePrice.toFixed(2));
    setEntryManufacturingDate(prod.manufacturingDate || '');
    setEntryExpirationDate(prod.expirationDate || '');
    setEntryBatchNumber(prod.batchNumber || '');
    setUpdatePrices(false);
    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 100);
  };

  // Quick quantity buttons helper
  const handleQuickAddQty = (amount: number) => {
    const current = parseInt(entryQuantity, 10) || 0;
    setEntryQuantity(String(Math.max(1, current + amount)));
  };

  // Barcode scanned callback from camera/scanner
  const handleBarcodeScanned = (barcode: string) => {
    setSearchTerm(barcode);
    const exactMatch = products.find((p) => p.barcode === barcode);
    if (exactMatch) {
      handleSelectProduct(exactMatch);
    } else {
      // If no exact match, filter suggestions
      showNotification(`Código "${barcode}" não encontrado no catálogo.`);
    }
  };

  // Calculations
  const numericQty = Math.max(0, parseInt(entryQuantity, 10) || 0);
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const newProjectedStock = currentStock + numericQty;

  const numCostPrice = parseFloat(costPrice) || (selectedProduct?.costPrice || 0);
  const numSalePrice = parseFloat(salePrice) || (selectedProduct?.salePrice || 0);
  const totalCostAmount = numCostPrice * numericQty;
  const projectedMargin = numCostPrice > 0 
    ? (((numSalePrice - numCostPrice) / numCostPrice) * 100).toFixed(0) 
    : '0';

  const handleConfirmEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      showNotification('Selecione um produto cadastrado para lançar a entrada.');
      return;
    }

    if (numericQty <= 0) {
      showNotification('Informe uma quantidade de entrada válida maior que zero.');
      return;
    }

    const supplierName = suppliers.find((s) => s.id === selectedSupplierId)?.name || selectedProduct.supplierName;

    // 1. Add specific batch to product (automatically handles stock aggregation and FEFO tracking)
    addBatchToProduct(selectedProduct.id, {
      quantity: numericQty,
      entryDate: new Date().toISOString().slice(0, 10),
      manufacturingDate: entryManufacturingDate || undefined,
      expirationDate: entryExpirationDate || undefined,
      batchNumber: entryBatchNumber.trim() || undefined,
      costPrice: numCostPrice,
      supplierName: supplierName || undefined,
    });

    // 2. Update prices if enabled
    if (updatePrices) {
      updateProduct(selectedProduct.id, {
        costPrice: Math.max(0, numCostPrice),
        salePrice: Math.max(0, numSalePrice),
      });
    }

    // 3. Register financial expense if requested
    if (registerFinancialExpense && totalCostAmount > 0) {
      const supplierName = suppliers.find((s) => s.id === selectedSupplierId)?.name;
      addFinancialEntry({
        type: 'despesa',
        category: 'Estoque / Reposição de Mercadorias',
        description: `Entrada de ${numericQty}x ${selectedProduct.name}${invoiceReference ? ` (Ref/NF: ${invoiceReference})` : ''}${supplierName ? ` - Fornecedor: ${supplierName}` : ''}`,
        amount: totalCostAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'pago',
        paymentMethod: 'Pix / Transferência',
      });
    }

    showNotification(`Entrada de +${numericQty} un. em "${selectedProduct.name}" lançada com sucesso! Novo estoque: ${newProjectedStock}`);
    setSuccessMessage(`+${numericQty} unidades adicionadas com sucesso a "${selectedProduct.name}"!`);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        id="stock-entry-modal-backdrop"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-2xl max-w-2xl w-full text-slate-800 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-orange-400">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Lançar Produto já Cadastrado (Entrada de Estoque)
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                    Reposição
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Adicione quantidades ao estoque existente sem precisar recadastrar o item.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">

            {/* Success Message Banner */}
            {successMessage && (
              <div className="p-3.5 bg-orange-50 border border-orange-300 rounded-xl text-orange-900 flex items-center gap-2.5 font-semibold animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Step 1: Select or Search Product */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-orange-600" />
                  1. Localizar Produto Cadastrado:
                </label>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setSearchTerm('');
                      setTimeout(() => searchInputRef.current?.focus(), 100);
                    }}
                    className="text-orange-600 hover:text-orange-800 font-bold hover:underline cursor-pointer"
                  >
                    Trocar Produto ↺
                  </button>
                )}
              </div>

              {/* Search Bar with Camera / Barcode Reader Buttons */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Digite o nome ou bipe o código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredSuggestions.length > 0) {
                        e.preventDefault();
                        handleSelectProduct(filteredSuggestions[0]);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Camera / Barcode Scan Action Button */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  title="Abrir Câmera para Ler Código de Barras"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <Camera className="w-4 h-4 text-orange-400" />
                  <span className="hidden sm:inline">Escanear Câmera</span>
                </button>
              </div>

              {/* Instant Suggestions Dropdown / Cards (if no product selected or searching) */}
              {!selectedProduct && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
                    <span>Produtos Encontrados ({filteredSuggestions.length})</span>
                    <span>Clique para selecionar</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        Nenhum produto cadastrado encontrado com "{searchTerm}".
                      </div>
                    ) : (
                      filteredSuggestions.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 text-base">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                p.icon || '📦'
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 group-hover:text-orange-600 block">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="font-mono">{p.barcode}</span>
                                <span>•</span>
                                <span>{p.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-700 block">
                              Estoque: <strong className={p.stock <= p.minStock ? 'text-amber-600' : 'text-slate-900'}>{p.stock} {p.unit}</strong>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Venda: R$ {p.salePrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: If a product is selected, show details & quantity input */}
            {selectedProduct && (
              <form onSubmit={handleConfirmEntry} className="space-y-4">
                
                {/* Selected Product Card */}
                <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0 text-2xl">
                      {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedProduct.icon || '📦'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md uppercase">
                          {selectedProduct.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5" />
                          {selectedProduct.barcode}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {selectedProduct.name}
                      </h4>
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs text-right sm:text-center shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Estoque Físico Atual
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-900 block">
                      {selectedProduct.stock} {selectedProduct.unit}
                    </span>
                  </div>
                </div>

                {/* Quantity & Stock Calculator Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                    2. Quantidade de Entrada (Reposição):
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Quantity Input */}
                    <div className="w-full sm:w-48">
                      <div className="relative flex items-center">
                        <input
                          ref={qtyInputRef}
                          type="number"
                          min="1"
                          step="1"
                          value={entryQuantity}
                          onChange={(e) => setEntryQuantity(e.target.value)}
                          className="w-full text-center py-2.5 px-3 bg-white border-2 border-orange-500 rounded-xl font-mono text-lg font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex flex-wrap gap-1.5 w-full">
                      {[1, 5, 10, 20, 50, 100].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickAddQty(amt)}
                          className="px-2.5 py-1.5 bg-white hover:bg-orange-50 border border-slate-300 hover:border-orange-400 text-slate-700 hover:text-orange-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Projected Stock Result Calculation */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-around text-center mt-2 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Estoque Atual</span>
                      <span className="text-sm font-bold font-mono text-slate-700">{currentStock} {selectedProduct.unit}</span>
                    </div>

                    <div className="text-orange-600 font-bold text-sm">+</div>

                    <div>
                      <span className="text-[10px] text-orange-600 font-bold uppercase block">Entrada</span>
                      <span className="text-sm font-bold font-mono text-orange-600">+{numericQty} {selectedProduct.unit}</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400" />

                    <div className="p-1 px-3 bg-orange-50 rounded-lg border border-orange-300">
                      <span className="text-[10px] text-orange-900 font-extrabold uppercase block">Novo Estoque Final</span>
                      <span className="text-base font-extrabold font-mono text-orange-900">{newProjectedStock} {selectedProduct.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Optional: Cost & Sale Price Update */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updatePrices}
                        onChange={(e) => setUpdatePrices(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      Atualizar Preços deste Lote (Custo / Venda)
                    </label>
                    {updatePrices && (
                      <span className="text-[10px] text-orange-700 font-semibold">
                        Margem Projetada: <strong>{projectedMargin}%</strong>
                      </span>
                    )}
                  </div>

                  {updatePrices && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Novo Preço de Custo (R$):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Novo Preço de Venda (R$):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Metadata: Supplier & Invoice / Financial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Supplier */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Fornecedor (Opcional):
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Não informado / Diversos</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Invoice / Reference */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Nota Fiscal / Referência:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF 1045"
                      value={invoiceReference}
                      onChange={(e) => setInvoiceReference(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Expiration Date, Manufacturing & Batch for this Delivery */}
                <div className="p-3 bg-orange-50/70 border border-orange-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-900 flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5 text-orange-700" />
                      Fabricação, Validade & Lote desta Remessa:
                    </span>
                    <span className="text-[10px] text-orange-800 font-semibold">Prevenção de Perdas</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Data de Fabricação (Opcional):
                      </label>
                      <input
                        type="date"
                        value={entryManufacturingDate}
                        onChange={(e) => setEntryManufacturingDate(e.target.value)}
                        className="w-full py-1 px-2 bg-white border border-orange-300 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Data de Validade:
                      </label>
                      <input
                        type="date"
                        value={entryExpirationDate}
                        onChange={(e) => setEntryExpirationDate(e.target.value)}
                        className="w-full py-1 px-2 bg-white border border-orange-300 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Número do Lote (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: LOTE-0824"
                      value={entryBatchNumber}
                      onChange={(e) => setEntryBatchNumber(e.target.value)}
                      className="w-full py-1 px-2 bg-white border border-orange-300 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Financial Expense Registration Toggle */}
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registerFinancialExpense}
                      onChange={(e) => setRegisterFinancialExpense(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span className="text-[11px] text-slate-700 font-semibold">
                      Lançar como despesa no Módulo Financeiro
                    </span>
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    Custo Total: R$ {totalCostAmount.toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Entrada (+{numericQty} {selectedProduct.unit})</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      </div>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Escanear Código para Entrada de Estoque"
        description="Aponte a câmera para o código de barras da embalagem para selecionar o produto automaticamente."
      />
    </>
  );
};
