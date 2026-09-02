import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Lock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  History, 
  X,
  AlertCircle
} from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ isOpen, onClose }) => {
  const { cashRegister, addCashMovement, closeCashRegister, logout, sales } = useApp();
  const [movementType, setMovementType] = useState<'sangria' | 'suprimento'>('sangria');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  // Calculate current expected cash in drawer
  const cashSalesTotal = sales
    .filter((s) => s.paymentMethod === 'dinheiro' && s.status === 'concluida')
    .reduce((acc, s) => acc + s.total, 0);

  const suprimentosTotal = cashRegister.movements
    .filter((m) => m.type === 'suprimento')
    .reduce((acc, m) => acc + m.amount, 0);

  const sangriasTotal = cashRegister.movements
    .filter((m) => m.type === 'sangria')
    .reduce((acc, m) => acc + m.amount, 0);

  const expectedCashInDrawer =
    cashRegister.initialAmount + cashSalesTotal + suprimentosTotal - sangriasTotal;

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (!reason.trim()) return;

    addCashMovement(movementType, val, reason.trim());
    setAmount('');
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-base">Controle de Caixa & Sangria (F10)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Drawer summary status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Fundo Inicial</span>
              <span className="text-sm font-bold font-mono text-slate-800">
                R$ {cashRegister.initialAmount.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-orange-800 block">+ Vendas Dinheiro</span>
              <span className="text-sm font-bold font-mono text-orange-800">
                R$ {cashSalesTotal.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">- Sangrias</span>
              <span className="text-sm font-bold font-mono text-rose-800">
                R$ {sangriasTotal.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-900 text-white border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-black text-orange-400 block">Em Gaveta</span>
              <span className="text-base font-black font-mono text-white">
                R$ {expectedCashInDrawer.toFixed(2)}
              </span>
            </div>
          </div>

          {/* New Movement Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <span>Registrar Movimentação</span>
            </h4>

            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMovementType('sangria')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  movementType === 'sangria'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Sangria (Retirada de Dinheiro)</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('suprimento')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  movementType === 'suprimento'
                    ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Suprimento (Entrada de Troco)</span>
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-bold font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo / Justificativa:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pagamento fornecedor pão, recolhimento..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Registrar {movementType === 'sangria' ? 'Sangria' : 'Suprimento'}
                </button>
              </div>
            </form>
          </div>

          {/* Movements History */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Histórico de Movimentações deste Caixa</span>
            </h4>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2">Hora</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Motivo</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashRegister.movements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        Nenhuma movimentação avulsa registrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    cashRegister.movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-500">{mov.time}</td>
                        <td className="p-2 font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              mov.type === 'sangria'
                                ? 'bg-rose-100 text-rose-700'
                                : mov.type === 'suprimento'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 truncate max-w-[180px]">{mov.reason}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {mov.type === 'sangria' ? '-' : '+'} R$ {mov.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Fechar Caixa & Sair</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Fechar Janela (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
