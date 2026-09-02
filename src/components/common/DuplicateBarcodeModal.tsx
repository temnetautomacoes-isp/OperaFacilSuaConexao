import React, { useEffect } from 'react';
import { Product } from '../../types';
import { 
  AlertTriangle, 
  PlusCircle, 
  ArrowLeft, 
  Package, 
  Barcode, 
  Layers, 
  TrendingUp, 
  Boxes,
  Check
} from 'lucide-react';

interface DuplicateBarcodeModalProps {
  isOpen: boolean;
  existingProduct: Product | null;
  newQuantityToAdd: number;
  onAddToExisting: () => void;
  onReturnToPrevious: () => void;
}

export const DuplicateBarcodeModal: React.FC<DuplicateBarcodeModalProps> = ({
  isOpen,
  existingProduct,
  newQuantityToAdd,
  onAddToExisting,
  onReturnToPrevious,
}) => {
  // Support ESC to return to previous page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onReturnToPrevious();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onReturnToPrevious]);

  if (!isOpen || !existingProduct) return null;

  const currentStock = existingProduct.stock;
  const newStockTotal = currentStock + newQuantityToAdd;
  const marginPercent = existingProduct.costPrice > 0 
    ? (((existingProduct.salePrice - existingProduct.costPrice) / existingProduct.costPrice) * 100).toFixed(1)
    : '0';

  return (
    <div
      id="duplicate-barcode-backdrop"
      className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="duplicate-barcode-card"
        className="bg-white rounded-2xl shadow-2xl border-2 border-orange-400 w-full max-w-lg overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200"
      >
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/20 rounded-xl backdrop-blur-xs border border-orange-500/30">
              <AlertTriangle className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Produto Já Cadastrado!
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Já existe um item cadastrado com este mesmo código de barras.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body: Existing Product Detailed Dossier */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Visual Product Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3.5 shadow-xs">
            {/* Product Image / Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border-2 border-orange-300 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {existingProduct.imageUrl ? (
                <img
                  src={existingProduct.imageUrl}
                  alt={existingProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl sm:text-4xl drop-shadow-xs">
                  {existingProduct.icon || '📦'}
                </span>
              )}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-200 mb-1">
                <Layers className="w-3 h-3" />
                {existingProduct.category}
              </span>
              <h4 className="font-bold text-slate-900 text-base leading-snug truncate" title={existingProduct.name}>
                {existingProduct.name}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                <Barcode className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{existingProduct.barcode}</span>
                <span className="text-slate-300">•</span>
                <span>Unid: <strong className="text-slate-700">{existingProduct.unit}</strong></span>
              </div>
            </div>
          </div>

          {/* Pricing & Margin info */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Preço de Custo</span>
              <span className="text-sm font-bold font-mono text-slate-700">
                R$ {existingProduct.costPrice.toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200 text-center">
              <span className="text-[10px] text-orange-700 font-semibold uppercase block">Preço de Venda</span>
              <span className="text-sm font-bold font-mono text-orange-600">
                R$ {existingProduct.salePrice.toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-600 font-semibold uppercase block flex items-center justify-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Margem
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                +{marginPercent}%
              </span>
            </div>
          </div>

          {/* Stock Addition Projection Box */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-orange-500" />
                Simulação de Entrada de Estoque:
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Alerta mín: {existingProduct.minStock} {existingProduct.unit}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 font-mono text-center">
              <div className="flex-1 bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">Estoque Atual</span>
                <span className="text-base font-bold text-slate-700">{currentStock}</span>
              </div>

              <div className="px-2 text-slate-400 font-bold text-lg">+</div>

              <div className="flex-1 bg-orange-50 p-2 rounded-lg border border-orange-200">
                <span className="text-[10px] text-orange-800 block font-sans font-bold">A Adicionar</span>
                <span className="text-base font-black text-orange-600">+{newQuantityToAdd}</span>
              </div>

              <div className="px-2 text-slate-400 font-bold text-lg">=</div>

              <div className="flex-1 bg-slate-900 text-white p-2 rounded-lg shadow-sm border border-slate-800">
                <span className="text-[10px] text-orange-400 block font-sans font-bold">Novo Estoque</span>
                <span className="text-base font-black">{newStockTotal} {existingProduct.unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            id="btn-return-previous"
            type="button"
            onClick={onReturnToPrevious}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retornar à página anterior</span>
          </button>

          <button
            id="btn-add-to-existing"
            type="button"
            onClick={onAddToExisting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Adicionar ao item já existente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
