import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, CheckCircle, ArrowRight, X } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ isOpen, onClose }) => {
  const { lastCompletedSale, settings } = useApp();

  if (!isOpen || !lastCompletedSale) return null;

  const sale = lastCompletedSale;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm">Venda Concluída com Sucesso!</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Simulation Container (printable) */}
        <div className="p-4 overflow-y-auto bg-slate-100 flex justify-center">
          <div 
            id="thermal-receipt-ticket"
            className="w-full max-w-[340px] bg-white p-5 rounded-sm shadow-md font-mono text-[11px] text-slate-800 border-t-4 border-dashed border-slate-300 space-y-3"
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
              {settings.logoUrl && (
                <div className="flex justify-center mb-1.5">
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="max-h-12 max-w-[140px] object-contain"
                  />
                </div>
              )}
              <h2 className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                {settings.name}
              </h2>
              {settings.slogan && (
                <p className="italic text-[10px] text-slate-600 leading-tight">
                  "{settings.slogan}"
                </p>
              )}
              <div className="text-[9px] text-slate-600 leading-tight space-y-0.5 pt-0.5">
                {settings.cnpj && <p>CNPJ: {settings.cnpj}</p>}
                {settings.address && <p>{settings.address}</p>}
                {settings.phone && <p>Tel: {settings.phone}</p>}
              </div>
            </div>

            {/* Sale Meta */}
            <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-300 text-slate-600">
              <div className="flex justify-between">
                <span>CUPOM NÃO FISCAL</span>
                <span className="font-bold text-slate-900">{sale.code}</span>
              </div>
              <div className="flex justify-between">
                <span>DATA/HORA:</span>
                <span>{new Date(sale.date).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>OPERADOR:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span className="font-bold text-slate-800">{sale.customerName || 'Consumidor Final'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] text-slate-700">
                <span>ITEM / DESCRIÇÃO</span>
                <span>TOTAL (R$)</span>
              </div>

              {sale.items.map((item, idx) => (
                <div key={item.id} className="text-[11px] leading-tight">
                  <div className="font-semibold text-slate-900 truncate">
                    {idx + 1}. {item.product.name}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 pl-2">
                    <span>
                      {item.quantity} {item.product.unit} x R$ {item.unitPrice.toFixed(2)}
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>SUBTOTAL:</span>
                <span>R$ {sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>DESCONTO:</span>
                  <span>- R$ {sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-950 pt-1">
                <span>TOTAL PAGO:</span>
                <span className="text-orange-600 font-black">R$ {sale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span className="uppercase">PAGAMENTO ({sale.paymentMethod.replace('_', ' ')}):</span>
                <span>R$ {sale.amountPaid.toFixed(2)}</span>
              </div>
              {sale.change > 0 && (
                <div className="flex justify-between font-bold text-slate-900 text-[10px]">
                  <span>TROCO:</span>
                  <span>R$ {sale.change.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Footer Blessing */}
            <div className="text-center space-y-1 text-[10px] text-slate-600 pt-1">
              <p className="font-bold text-slate-800">
                {settings.receiptFooter}
              </p>
              <p className="text-[9px] text-slate-400">
                Sistema MercadoFácil • PDV & Gestão Pro
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-3 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Cupom</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span>Nova Venda (F2)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
