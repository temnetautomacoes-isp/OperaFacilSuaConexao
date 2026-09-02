import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import { safeConfirm } from '../../utils/safeConfirm';
import confetti from 'canvas-confetti';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  BookOpen, 
  Check, 
  X, 
  AlertTriangle,
  ArrowRight,
  UserPlus
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
}) => {
  const { cartTotal, completeSale, customers, addCustomer, showNotification } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [cashReceived, setCashReceived] = useState<string>(cartTotal.toFixed(2));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('300.00');

  useEffect(() => {
    if (isOpen) {
      setCashReceived(cartTotal.toFixed(2));
      if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
      }
    }
  }, [isOpen, cartTotal, customers]);

  if (!isOpen) return null;

  const parsedCash = parseFloat(cashReceived) || 0;
  const change = Math.max(0, parsedCash - cartTotal);
  const isCashSufficient = parsedCash >= cartTotal;

  // Selected customer for Fiado
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const availableCredit = selectedCustomer ? selectedCustomer.creditLimit - selectedCustomer.balance : 0;
  const isCreditSufficient = availableCredit >= cartTotal;

  const handleQuickCash = (addition: number) => {
    const current = parseFloat(cashReceived) || 0;
    setCashReceived((current + addition).toFixed(2));
  };

  const handleExactCash = () => {
    setCashReceived(cartTotal.toFixed(2));
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    addCustomer(newCustName.trim(), newCustPhone.trim(), parseFloat(newCustLimit) || 300);
    setShowAddCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  const handleFinalize = () => {
    if (paymentMethod === 'dinheiro' && !isCashSufficient) {
      showNotification('Valor recebido é menor que o total da venda!');
      return;
    }

    if (paymentMethod === 'fiado') {
      if (!selectedCustomer) {
        showNotification('Selecione um cliente para o caderninho/fiado!');
        return;
      }
      if (!isCreditSufficient) {
        if (!safeConfirm(`Atenção: A compra ultrapassa o limite de crédito do cliente em R$ ${(cartTotal - availableCredit).toFixed(2)}. Deseja autorizar mesmo assim?`)) {
          return;
        }
      }
    }

    // Complete sale
    completeSale(
      paymentMethod,
      parsedCash,
      paymentMethod === 'fiado' ? selectedCustomer?.name : 'Consumidor Final',
      paymentMethod === 'fiado' ? selectedCustomer?.id : undefined
    );

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0f172a', '#ea580c', '#f97316', '#64748b']
      });
    } catch {
      // ignore
    }

    onClose();
    onSaleCompleted();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-orange-400 font-bold block">
              Finalização de Venda
            </span>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>Total a Receber:</span>
              <span className="font-mono text-orange-400">R$ {cartTotal.toFixed(2)}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Selecione a Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'dinheiro'
                    ? 'bg-orange-50 border-orange-500 text-orange-600 ring-2 ring-orange-500/20 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Banknote className="w-6 h-6 text-orange-500" />
                <span className="text-xs">Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'pix'
                    ? 'bg-slate-900 border-slate-900 text-white ring-2 ring-slate-900/20 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <QrCode className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-orange-400' : 'text-slate-600'}`} />
                <span className="text-xs">PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-orange-50 border-orange-500 text-orange-600 ring-2 ring-orange-500/20 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="w-6 h-6 text-orange-500" />
                <span className="text-xs">Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'cartao_credito'
                    ? 'bg-orange-50 border-orange-500 text-orange-600 ring-2 ring-orange-500/20 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="w-6 h-6 text-orange-500" />
                <span className="text-xs">Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('fiado')}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'fiado'
                    ? 'bg-orange-50 border-orange-500 text-orange-600 ring-2 ring-orange-500/20 font-bold shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <BookOpen className="w-6 h-6 text-orange-500" />
                <span className="text-xs">Fiado / Caderninho</span>
              </button>
            </div>
          </div>

          {/* Conditional Method Panels */}

          {/* 1. DINHEIRO */}
          {paymentMethod === 'dinheiro' && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor Recebido em Dinheiro (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full text-xl font-bold font-mono px-3 py-2 border-2 border-orange-500 bg-white rounded-lg focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={handleExactCash}
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Exato
                    </button>
                    {[10, 20, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickCash(val)}
                        className="px-2 py-1 rounded bg-white border border-orange-300 text-orange-800 text-xs font-bold hover:bg-orange-50 font-mono cursor-pointer"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change calculation box */}
                <div className="bg-white rounded-lg p-4 border border-slate-300 flex flex-col justify-center items-center text-center shadow-xs">
                  <span className="text-xs uppercase font-bold text-slate-500">
                    Troco a Devolver
                  </span>
                  <span
                    className={`text-3xl font-black font-mono mt-1 ${
                      isCashSufficient ? 'text-orange-600' : 'text-rose-600'
                    }`}
                  >
                    R$ {change.toFixed(2)}
                  </span>
                  {!isCashSufficient && (
                    <span className="text-[11px] text-rose-600 font-bold mt-1">
                      Falta: R$ {(cartTotal - parsedCash).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PIX */}
          {paymentMethod === 'pix' && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-150">
              <div className="bg-white p-3 rounded-lg border-2 border-slate-900 shadow-sm flex flex-col items-center">
                {/* Simulated dynamic QR code SVG */}
                <svg className="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner markers */}
                  <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="2" />
                  <rect x="9" y="9" width="17" height="17" fill="#ffffff" rx="1" />
                  <rect x="13" y="13" width="9" height="9" fill="#0f172a" rx="1" />

                  <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="2" />
                  <rect x="74" y="9" width="17" height="17" fill="#ffffff" rx="1" />
                  <rect x="78" y="13" width="9" height="9" fill="#0f172a" rx="1" />

                  <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="2" />
                  <rect x="9" y="74" width="17" height="17" fill="#ffffff" rx="1" />
                  <rect x="13" y="78" width="9" height="9" fill="#0f172a" rx="1" />

                  {/* QR Matrix random dots */}
                  <rect x="35" y="10" width="5" height="10" fill="#0f172a" />
                  <rect x="45" y="15" width="10" height="5" fill="#0f172a" />
                  <rect x="60" y="8" width="5" height="8" fill="#0f172a" />
                  <rect x="35" y="25" width="8" height="8" fill="#0f172a" />
                  <rect x="10" y="35" width="10" height="5" fill="#0f172a" />
                  <rect x="25" y="40" width="5" height="15" fill="#0f172a" />
                  <rect x="38" y="38" width="24" height="24" fill="#0f172a" rx="2" />
                  <rect x="42" y="42" width="16" height="16" fill="#ffffff" />
                  <rect x="46" y="46" width="8" height="8" fill="#0f172a" />
                  <rect x="70" y="40" width="8" height="18" fill="#0f172a" />
                  <rect x="82" y="35" width="12" height="6" fill="#0f172a" />
                  <rect x="85" y="50" width="8" height="15" fill="#0f172a" />
                  <rect x="35" y="70" width="15" height="5" fill="#0f172a" />
                  <rect x="55" y="68" width="8" height="12" fill="#0f172a" />
                  <rect x="70" y="72" width="12" height="6" fill="#0f172a" />
                  <rect x="88" y="70" width="6" height="20" fill="#0f172a" />
                </svg>
                <span className="text-[10px] font-bold text-slate-900 uppercase mt-1">
                  Chave Dinâmica PIX
                </span>
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                  <span>Aguardando transferência de R$ {cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Mostre o QR code acima ao cliente ou copie a chave Pix gerada para confirmação instantânea.
                </p>
                <div className="bg-white p-2 rounded border border-slate-300 text-xs font-mono text-slate-700 truncate">
                  00020126580014br.gov.bcb.pix0136mercadinho-familiar@pix.local520400005303986540{cartTotal.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* 3. CARTÕES */}
          {(paymentMethod === 'cartao_debito' || paymentMethod === 'cartao_credito') && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex items-center gap-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Transação TEF / Maquininha ({paymentMethod === 'cartao_debito' ? 'Débito' : 'Crédito'})
                </h4>
                <p className="text-xs text-slate-600">
                  Insira ou aproxime o cartão na maquininha. Confirme o valor de{' '}
                  <span className="font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span> na tela do terminal.
                </p>
              </div>
            </div>
          )}

          {/* 4. FIADO / CADERNINHO */}
          {paymentMethod === 'fiado' && (
            <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-4 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                  Selecione o Cliente do Caderninho:
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="text-xs text-orange-800 hover:text-orange-950 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddCustomer ? 'Cancelar' : '+ Novo Cliente'}</span>
                </button>
              </div>

              {/* Add New Customer Form inline */}
              {showAddCustomer ? (
                <form onSubmit={handleCreateCustomer} className="bg-white p-3 rounded-lg border border-orange-300 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">Cadastrar Novo Cliente</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Cliente"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-orange-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Telefone / WhatsApp"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="Limite (R$)"
                      value={newCustLimit}
                      onChange={(e) => setNewCustLimit(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-orange-500 text-white rounded text-xs font-bold hover:bg-orange-600 cursor-pointer"
                    >
                      Salvar Cliente
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none font-medium text-slate-800 focus:border-orange-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Devendo R$ {c.balance.toFixed(2)} / Limite: R$ {c.creditLimit.toFixed(2)})
                      </option>
                    ))}
                  </select>

                  {selectedCustomer && (
                    <div className="bg-white p-3 rounded-lg border border-orange-200 grid grid-cols-3 text-center text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Dívida Atual</span>
                        <span className="font-bold font-mono text-rose-600">
                          R$ {selectedCustomer.balance.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Limite Total</span>
                        <span className="font-bold font-mono text-slate-700">
                          R$ {selectedCustomer.creditLimit.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Limite Disponível</span>
                        <span
                          className={`font-bold font-mono ${
                            isCreditSufficient ? 'text-orange-600' : 'text-rose-600'
                          }`}
                        >
                          R$ {availableCredit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isCreditSufficient && (
                    <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Atenção: A compra excede o limite disponível do cliente em R${' '}
                        {(cartTotal - availableCredit).toFixed(2)}.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Voltar (ESC)
          </button>

          <button
            id="btn-confirmar-pagamento"
            type="button"
            onClick={handleFinalize}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-[0.99] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>CONFIRMAR VENDA (F4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
