import React from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, FinancialEntry } from '../../types';
import { 
  CheckCircle2, 
  X, 
  Building2, 
  Calendar, 
  CreditCard, 
  Receipt,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Download
} from 'lucide-react';

interface PaidSupplierBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplier?: (supplier: Supplier) => void;
}

export const PaidSupplierBillsModal: React.FC<PaidSupplierBillsModalProps> = ({
  isOpen,
  onClose,
  onSelectSupplier,
}) => {
  const { financialEntries, suppliers } = useApp();

  if (!isOpen) return null;

  // Filter all paid entries under Fornecedores category
  const paidBills = financialEntries.filter(
    (e) => e.category === 'Fornecedores' && e.status === 'pago'
  );

  const totalPaidAmount = paidBills.reduce((acc, b) => acc + b.amount, 0);

  const getSupplierForBill = (bill: FinancialEntry): Supplier | undefined => {
    if (bill.supplierId) {
      return suppliers.find((s) => s.id === bill.supplierId);
    }
    const desc = bill.description.toLowerCase();
    return suppliers.find(
      (s) => desc.includes((s.tradeName || s.name).toLowerCase()) || desc.includes(s.name.toLowerCase())
    );
  };

  return (
    <div
      id="paid-supplier-bills-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full text-slate-800 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-orange-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Histórico de Faturas & Despesas Quitadas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {paidBills.length} quitada(s)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Relatório de todas as notas fiscais, boletos e compras liquidadas com fornecedores.
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

        {/* Total Summary Banner */}
        <div className="bg-slate-100 border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-700 block">
              Total Pago aos Fornecedores
            </span>
            <span className="text-2xl font-black font-mono text-slate-900 block mt-0.5">
              R$ {totalPaidAmount.toFixed(2)}
            </span>
          </div>
          <div className="text-right text-xs text-slate-700">
            <span className="font-semibold block">{paidBills.length} pagamento(s) realizado(s)</span>
            <span className="text-[11px] text-slate-500">Integrado ao fluxo de caixa</span>
          </div>
        </div>

        {/* Paid Items List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {paidBills.length === 0 ? (
            <div className="p-10 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <Receipt className="w-12 h-12 text-slate-400 mx-auto opacity-60" />
              <h4 className="font-bold text-slate-800 text-sm">
                Nenhum pagamento registrado ainda
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Assim que você lançar ou der baixa em notas e faturas de fornecedores, o histórico aparecerá aqui detalhado.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {paidBills.map((bill) => {
                const sup = getSupplierForBill(bill);

                return (
                  <div
                    key={bill.id}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-400 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group"
                  >
                    <div className="space-y-1">
                      {/* Supplier Tag */}
                      {sup ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Building2 className="w-3 h-3 text-orange-500" />
                            {sup.tradeName || sup.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            ({sup.category})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          Fornecedor Geral
                        </span>
                      )}

                      {/* Description */}
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {bill.description}
                      </h4>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Data: {bill.date}
                        </span>
                        {bill.paymentMethod && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            {bill.paymentMethod}
                          </span>
                        )}
                        <span className="text-slate-800 font-bold flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 text-orange-500" />
                          Quitado
                        </span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-black font-mono text-slate-900 block">
                          R$ {bill.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Pago
                        </span>
                      </div>

                      {sup && onSelectSupplier && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectSupplier(sup);
                          }}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Ver ficha completa deste fornecedor"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Despesas sincronizadas com DRE e relatórios financeiros</span>
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
