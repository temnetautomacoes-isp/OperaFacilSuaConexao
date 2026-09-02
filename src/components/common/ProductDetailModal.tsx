import React, { useEffect } from 'react';
import { Product } from '../../types';
import {
  X,
  Barcode,
  Layers,
  TrendingUp,
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Plus,
  Minus,
  Copy,
  Check,
  Truck,
  Building2,
  CalendarClock
} from 'lucide-react';
import { GONDOLA_CATEGORIES } from './GondolaCategorySelector';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onAdjustStock?: (productId: string, delta: number, batchId?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onAdjustStock,
}) => {
  const [copiedBarcode, setCopiedBarcode] = React.useState(false);

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

  if (!isOpen || !product) return null;

  const isLow = product.stock <= product.minStock && product.stock > 0;
  const isOut = product.stock <= 0;
  const unitProfit = Math.max(0, product.salePrice - product.costPrice);
  const marginPercent = product.costPrice > 0 
    ? (((product.salePrice - product.costPrice) / product.costPrice) * 100).toFixed(1)
    : '0';

  const totalCostValue = product.stock * product.costPrice;
  const totalSaleValue = product.stock * product.salePrice;
  const totalPotentialProfit = totalSaleValue - totalCostValue;

  const gondolaInfo = GONDOLA_CATEGORIES.find((g) => g.category === product.category);

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  return (
    <div
      id="product-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="product-detail-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header with Category Badge & Close button */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/15 rounded-lg backdrop-blur-xs text-white">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Ficha Detalhada do Produto
              </h3>
              <p className="text-[11px] text-slate-400">
                Informações completas de estoque, precificação e identificação
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Fechar (Esc)"
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Main Showcase Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Product Image / Icon representation */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center overflow-hidden shrink-0 relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-5xl drop-shadow-xs select-none">
                  {product.icon || '📦'}
                </span>
              )}
              {isOut ? (
                <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[9px] font-bold py-0.5 text-center">
                  ESGOTADO
                </div>
              ) : isLow ? (
                <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[9px] font-bold py-0.5 text-center">
                  ESTOQUE BAIXO
                </div>
              ) : null}
            </div>

            {/* Product Identity */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white">
                  <Layers className="w-3 h-3 text-orange-400" />
                  {product.category}
                </span>

                {gondolaInfo?.aisle && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-900 border border-orange-300">
                    🏛 {gondolaInfo.aisle}
                  </span>
                )}

                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                  Unidade: {product.unit}
                </span>

                {product.supplierName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">
                    <Truck className="w-3 h-3 text-orange-500" />
                    Fornecedor: {product.supplierName}
                  </span>
                )}

                {product.manufacturingDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                    <CalendarClock className="w-3 h-3 text-slate-500" />
                    Fab: {product.manufacturingDate.split('-').reverse().join('/')}
                  </span>
                )}

                {product.expirationDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 font-mono">
                    <CalendarClock className="w-3 h-3 text-amber-700" />
                    Val: {product.expirationDate.split('-').reverse().join('/')}
                  </span>
                )}

                {product.batchNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 font-mono">
                    Lote: {product.batchNumber}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {product.name}
              </h2>

              {/* Barcode badge with copy button */}
              <div className="inline-flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-mono text-xs text-slate-700">
                <Barcode className="w-4 h-4 text-slate-400" />
                <span className="font-bold tracking-wider">{product.barcode}</span>
                <button
                  type="button"
                  onClick={handleCopyBarcode}
                  title="Copiar código de barras"
                  className="p-1 text-slate-400 hover:text-orange-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedBarcode ? (
                    <Check className="w-3.5 h-3.5 text-orange-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Pricing & Margin Metrics Grid */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Precificação & Rentabilidade Unitária
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Preço de Custo</span>
                <span className="text-base font-bold font-mono text-slate-800 block mt-0.5">
                  R$ {product.costPrice.toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <span className="text-[10px] text-orange-800 font-semibold uppercase block">Preço de Venda</span>
                <span className="text-base font-black font-mono text-orange-600 block mt-0.5">
                  R$ {product.salePrice.toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-600 font-semibold uppercase block">Lucro Unitário</span>
                <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
                  R$ {unitProfit.toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-700 font-semibold uppercase block flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 text-orange-500" />
                  Margem
                </span>
                <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                  +{marginPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Stock Level & Quick Adjust Control */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Controle & Situação do Estoque Total
                </span>
              </div>

              {isOut ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <XCircle className="w-3.5 h-3.5" />
                  Estoque Zerado
                </span>
              ) : isLow ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Abaixo do Mínimo ({product.minStock})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                  Estoque Regular
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Estoque Físico Total</span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {product.stock} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
                  </span>
                </div>

                {onAdjustStock && (
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => onAdjustStock(product.id, -1)}
                      title="Diminuir 1 unidade do estoque total (FEFO)"
                      className="w-7 h-7 rounded bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 shadow-2xs flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustStock(product.id, 1)}
                      title="Adicionar 1 unidade ao estoque"
                      className="w-7 h-7 rounded bg-orange-500 hover:bg-orange-600 text-white shadow-2xs flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">Estoque Mínimo de Alerta</span>
                <span className="text-base font-bold font-mono text-slate-700 block">
                  {product.minStock} {product.unit}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Alerta disparado quando atingir ou baixar deste limite.
                </span>
              </div>
            </div>
          </div>

          {/* Divisão por Remessas & Lotes */}
          {(() => {
            const allBatches = (product.batches && product.batches.length > 0)
              ? product.batches
              : product.stock > 0
              ? [{
                  id: `batch-init-${product.id}`,
                  batchNumber: product.batchNumber,
                  quantity: product.stock,
                  entryDate: product.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                  manufacturingDate: product.manufacturingDate,
                  expirationDate: product.expirationDate,
                  costPrice: product.costPrice,
                  supplierName: product.supplierName,
                }]
              : [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const getBatchExpStatus = (expDate?: string) => {
              if (!expDate) return { label: 'Sem data', color: 'bg-slate-100 text-slate-600' };
              const exp = new Date(expDate + 'T00:00:00');
              const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0) return { label: `Vencido (${Math.abs(diffDays)}d)`, color: 'bg-rose-100 text-rose-800 border-rose-300' };
              if (diffDays === 0) return { label: 'Vence Hoje!', color: 'bg-rose-100 text-rose-800 border-rose-300' };
              if (diffDays <= 7) return { label: `Vence em ${diffDays}d`, color: 'bg-amber-100 text-amber-900 border-amber-300' };
              if (diffDays <= 30) return { label: `Vence em ${diffDays}d`, color: 'bg-orange-100 text-orange-900 border-orange-200' };
              return { label: `Vence em ${diffDays}d`, color: 'bg-slate-100 text-slate-800 border-slate-200' };
            };

            return (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                      Divisão de Estoque por Lotes & Remessas ({allBatches.filter(b => b.quantity > 0).length} Ativos)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Rastreabilidade por Entrada & Validade
                  </span>
                </div>

                {allBatches.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2 italic">
                    Nenhum lote registrado com estoque no momento.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {allBatches.map((b, idx) => {
                      const status = getBatchExpStatus(b.expirationDate);
                      return (
                        <div 
                          key={b.id || idx}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900 font-mono">
                                {b.batchNumber ? `Lote: ${b.batchNumber}` : `Remessa #${idx + 1}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${status.color}`}>
                                {status.label}
                              </span>
                              {b.supplierName && (
                                <span className="text-[10px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                                  {b.supplierName}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono flex-wrap">
                              <span>Lançado em: <strong>{b.entryDate.split('-').reverse().join('/')}</strong></span>
                              {b.manufacturingDate && (
                                <span>Fab: <strong>{b.manufacturingDate.split('-').reverse().join('/')}</strong></span>
                              )}
                              {b.expirationDate && (
                                <span>Val: <strong>{b.expirationDate.split('-').reverse().join('/')}</strong></span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Neste Lote</span>
                              <span className="text-sm font-black font-mono text-slate-900">
                                {b.quantity} <span className="text-xs font-normal text-slate-500">{product.unit}</span>
                              </span>
                            </div>

                            {onAdjustStock && (
                              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => onAdjustStock(product.id, -1, b.id)}
                                  disabled={b.quantity <= 0}
                                  title="Diminuir 1 unidade deste lote"
                                  className="w-6 h-6 rounded bg-white hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 text-slate-700 shadow-2xs flex items-center justify-center font-bold transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAdjustStock(product.id, 1, b.id)}
                                  title="Adicionar 1 unidade a este lote"
                                  className="w-6 h-6 rounded bg-orange-500 hover:bg-orange-600 text-white shadow-2xs flex items-center justify-center font-bold transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Financial Totals in Stock */}
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Patrimônio & Valor Acumulado no Estoque
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">Custo Total em Estoque</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-slate-700">
                  R$ {totalCostValue.toFixed(2)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-600 font-semibold block">Valor Total a Venda</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-orange-600">
                  R$ {totalSaleValue.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-900 text-white p-2 rounded-lg shadow-2xs">
                <span className="text-[10px] text-orange-400 font-semibold block">Lucro Potencial Total</span>
                <span className="text-xs sm:text-sm font-black font-mono">
                  R$ {totalPotentialProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {onEdit ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-orange-500" />
              <span>Editar Informações</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
