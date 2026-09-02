import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { safeConfirm } from '../../utils/safeConfirm';
import { 
  Receipt, 
  Search, 
  Filter, 
  Printer, 
  RotateCcw, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle,
  Eye,
  X
} from 'lucide-react';
import { ThermalReceiptModal } from '../pdv/ThermalReceiptModal';

export const VendasModule: React.FC = () => {
  const { sales, cancelSale, setLastCompletedSale } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluida' | 'cancelada'>('all');
  
  // Selected sale for detail modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.cashierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = methodFilter === 'all' || sale.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalFilteredRevenue = filteredSales
    .filter((s) => s.status === 'concluida')
    .reduce((acc, s) => acc + s.total, 0);

  const handlePrintReceipt = (sale: Sale) => {
    setLastCompletedSale(sale);
    setIsReceiptModalOpen(true);
  };

  // Keyboard escape listener for modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSale(null);
      }
    };
    if (selectedSale) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSale]);

  return (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-58px)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-500" />
            Histórico & Gestão de Vendas
          </h2>
          <p className="text-xs text-slate-500">
            Consulte cupons emitidos, reimprima vias térmicas e gerencie cancelamentos.
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Total Filtrado:</span>
          <span className="text-lg font-black font-mono text-orange-600">
            R$ {totalFilteredRevenue.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            ({filteredSales.length} vendas)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código (#00101), cliente ou operador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todas Formas de Pagamento</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="cartao_debito">Cartão Débito</option>
            <option value="cartao_credito">Cartão Crédito</option>
            <option value="fiado">Caderninho / Fiado</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos os Status</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Itens</th>
                <th className="p-3">Forma Pagto</th>
                <th className="p-3 text-right">Total (R$)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCanceled = sale.status === 'cancelada';

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      title="Clique para ver os detalhes completos desta venda"
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="p-3 font-mono font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {sale.code}
                      </td>

                      <td className="p-3 text-slate-600 font-mono">
                        {new Date(sale.date).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3 text-slate-700">
                        <span className="font-semibold block truncate max-w-[140px] group-hover:text-orange-600 transition-colors">
                          {sale.customerName || 'Consumidor Final'}
                        </span>
                        <span className="text-[10px] text-slate-400">Op: {sale.cashierName}</span>
                      </td>

                      <td className="p-3 text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium">
                          {sale.items.length} produto(s)
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {sale.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        R$ {sale.total.toFixed(2)}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCanceled
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-orange-100 text-orange-900 border border-orange-200'
                          }`}
                        >
                          {isCanceled ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              Cancelada
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-orange-600" />
                              Concluída
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSale(sale);
                            }}
                            title="Ver detalhes da venda"
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintReceipt(sale);
                            }}
                            title="Reimprimir cupom"
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {!isCanceled && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  safeConfirm(
                                    `Deseja realmente cancelar a venda ${sale.code}? Os produtos retornarão ao estoque.`
                                  )
                                ) {
                                  cancelSale(sale.id);
                                }
                              }}
                              title="Cancelar venda e estornar estoque"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div
          id="sale-detail-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSale(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            id="sale-detail-card"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-lg text-orange-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-2">
                    <span>Detalhes da Venda</span>
                    <span className="font-mono text-orange-400">{selectedSale.code}</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Informações completas do cupom fiscal e itens registrados
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                title="Fechar janela (Esc ou clique fora)"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Data / Hora</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {new Date(selectedSale.date).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Operador do Caixa</span>
                  <span className="font-semibold text-slate-800">{selectedSale.cashierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Cliente Identificado</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSale.customerName || 'Consumidor Final'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Forma de Pagamento</span>
                  <span className="font-bold text-orange-600 uppercase inline-block">
                    {selectedSale.paymentMethod.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Items List with Photos & Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Itens Registrados ({selectedSale.items.length}):
                  </h4>
                  <span className="text-[10px] text-slate-400">Preço un. e subtotal</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {selectedSale.items.map((item, idx) => (
                    <div key={item.id || idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Item Photo / Icon */}
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-base">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            item.product.icon || '📦'
                          )}
                        </div>

                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate" title={item.product.name}>
                            {item.product.name}
                          </span>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span className="font-mono">
                              {item.quantity} {item.product.unit} × R$ {item.unitPrice.toFixed(2)}
                            </span>
                            {item.product.barcode && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-400">EAN: {item.product.barcode}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-slate-900 text-right shrink-0">
                        R$ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal dos Produtos:</span>
                  <span className="font-mono font-semibold">R$ {selectedSale.subtotal.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Desconto Concedido:</span>
                    <span className="font-mono">- R$ {selectedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base text-orange-600 pt-1.5 border-t border-slate-200">
                  <span>Total Final:</span>
                  <span className="font-mono">R$ {selectedSale.total.toFixed(2)}</span>
                </div>
                {selectedSale.change > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
                    <span>Troco Devolvido:</span>
                    <span className="font-mono font-medium">R$ {selectedSale.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar Janela
              </button>

              <button
                type="button"
                onClick={() => {
                  handlePrintReceipt(selectedSale);
                  setSelectedSale(null);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reimprimir Cupom</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal receipt modal */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};
