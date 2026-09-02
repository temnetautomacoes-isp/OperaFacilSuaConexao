import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  PackageOpen, 
  AlertCircle 
} from 'lucide-react';

interface CartSidebarProps {
  onOpenCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ onOpenCheckout }) => {
  const { 
    cart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart, 
    cartSubtotal, 
    cartDiscount, 
    setCartDiscount, 
    cartTotal,
    cashRegister
  } = useApp();

  const totalItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-white border-l border-slate-200 shadow-sm h-full max-h-[calc(100vh-58px)]">
      {/* Cart Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 leading-tight">
              Cupom de Venda
            </h2>
            <p className="text-xs text-slate-500">
              {cart.length} item(ns) distintos • {totalItemsCount} unid.
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            title="Limpar carrinho (ESC)"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <PackageOpen className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Caixa Livre</p>
            <p className="text-xs text-slate-400 max-w-[200px] mt-1">
              Bipe um código de barras ou selecione produtos ao lado para iniciar a venda.
            </p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div key={item.id} className="pt-2 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-sm">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1 py-0.2 rounded font-mono border border-orange-200">
                        #{idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 truncate" title={item.product.name}>
                        {item.product.name}
                      </h3>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">EAN: {item.product.barcode}</span>
                      <span>•</span>
                      <span>R$ {item.unitPrice.toFixed(2)}/{item.product.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    R$ {item.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quantity controls and delete */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="0.1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateCartItemQuantity(item.id, val);
                    }}
                    className="w-10 text-center text-xs font-bold bg-transparent border-none focus:outline-none font-mono"
                  />
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  title="Remover item"
                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Action */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2.5">
        {/* Discount input toggle */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-orange-500" />
            Desconto (R$):
          </span>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="0.00"
            value={cartDiscount === 0 ? '' : cartDiscount}
            onChange={(e) => setCartDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-20 px-2 py-1 text-right text-xs font-semibold bg-white border border-slate-300 rounded focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Subtotal & Discount rows */}
        <div className="space-y-1 pt-1 border-t border-slate-200 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="font-mono">R$ {cartSubtotal.toFixed(2)}</span>
          </div>
          {cartDiscount > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Desconto:</span>
              <span className="font-mono">- R$ {cartDiscount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Total Price Banner */}
        <div className="bg-slate-900 text-white rounded-lg p-3 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-orange-400 font-bold block">
              TOTAL A PAGAR
            </span>
            <span className="text-2xl font-black font-mono tracking-tight text-white">
              R$ {cartTotal.toFixed(2)}
            </span>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono font-medium">
            {cart.length} itens
          </div>
        </div>

        {!cashRegister.isOpen && (
          <div className="flex items-center gap-1.5 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-xs">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>O caixa está fechado. Abra-o no topo para registrar pagamentos em dinheiro.</span>
          </div>
        )}

        {/* Big Checkout Button */}
        <button
          id="btn-finalizar-venda"
          disabled={cart.length === 0}
          onClick={onOpenCheckout}
          className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
            cart.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-[0.99] ring-2 ring-orange-500/30'
          }`}
        >
          <span>RECEBER PAGAMENTO (F4)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
