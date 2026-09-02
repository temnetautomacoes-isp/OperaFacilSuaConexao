import React from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialEntry } from '../../types';
import { safeConfirm } from '../../utils/safeConfirm';
import { 
  DollarSign, 
  X, 
  Calendar, 
  CreditCard, 
  Trash2, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  Clock, 
  FileText,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface FinancialEntryDetailModalProps {
  isOpen: boolean;
  entry: FinancialEntry | null;
  onClose: () => void;
}

export const FinancialEntryDetailModal: React.FC<FinancialEntryDetailModalProps> = ({
  isOpen,
  entry,
  onClose,
}) => {
  const { toggleFinancialEntryStatus, deleteFinancialEntry, suppliers } = useApp();

  if (!isOpen || !entry) return null;

  const isExpense = entry.type === 'despesa';
  const isPaid = entry.status === 'pago';

  const matchedSupplier = entry.supplierId 
    ? suppliers.find((s) => s.id === entry.supplierId)
    : suppliers.find((s) => entry.description.toLowerCase().includes((s.tradeName || s.name).toLowerCase()));

  const handleDelete = () => {
    if (safeConfirm(`Tem certeza que deseja excluir o lançamento "${entry.description}" no valor de R$ ${entry.amount.toFixed(2)}?`)) {
      deleteFinancialEntry(entry.id);
      onClose();
    }
  };

  const handleToggleStatus = () => {
    toggleFinancialEntryStatus(entry.id);
  };

  return (
    <div
      id="financial-entry-detail-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full text-slate-800 shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isExpense ? 'bg-gradient-to-r from-rose-700 to-rose-900' : 'bg-gradient-to-r from-slate-900 to-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              {isExpense ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5 text-orange-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                  {entry.type}
                </span>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                  isPaid ? 'bg-orange-400 text-slate-950 font-black' : 'bg-amber-400 text-amber-950 font-black'
                }`}>
                  {entry.status}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg mt-1 text-white leading-tight">
                {entry.description}
              </h3>
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

        {/* Amount Big Highlight */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isExpense ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Valor do Lançamento
            </span>
            <span className={`text-2xl sm:text-3xl font-black font-mono block mt-0.5 ${isExpense ? 'text-rose-700' : 'text-orange-600'}`}>
              {isExpense ? '- ' : '+ '}R$ {entry.amount.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
              isPaid 
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isPaid ? 'Marcar como Pendente' : 'Dar Baixa (Marcar Pago)'}</span>
          </button>
        </div>

        {/* Detailed Grid */}
        <div className="p-5 space-y-3 text-xs overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Data de Lançamento:
              </span>
              <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                {entry.date}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Categoria:
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {entry.category}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-400" />
                Forma de Pagamento:
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {entry.paymentMethod || 'Não especificado / Diversos'}
              </span>
            </div>

            {entry.dueDate && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-800 block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Data de Vencimento:
                </span>
                <span className="font-mono font-bold text-amber-900 text-sm mt-0.5 block">
                  {entry.dueDate}
                </span>
              </div>
            )}

            {entry.invoiceNumber && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  Nº da Nota Fiscal / Documento:
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {entry.invoiceNumber}
                </span>
              </div>
            )}

            {matchedSupplier && (
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-700 block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-orange-500" />
                  Fornecedor Vinculado:
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-900 text-sm">
                    {matchedSupplier.tradeName || matchedSupplier.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {matchedSupplier.category}
                  </span>
                </div>
              </div>
            )}
          </div>

          {entry.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Observações / Detalhes:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                {entry.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Lançamento</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
