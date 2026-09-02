import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { safeConfirm } from '../../utils/safeConfirm';
import { ProductCatalog } from './ProductCatalog';
import { CartSidebar } from './CartSidebar';
import { CheckoutModal } from './CheckoutModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { CashRegisterModal } from './CashRegisterModal';

export const PdvView: React.FC = () => {
  const { cart, clearCart } = useApp();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);

  // Global PDV Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F4 -> Finalizar Venda / Abrir Checkout
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutOpen(true);
        }
      }
      // F10 -> Sangria / Suprimento / Caixa
      else if (e.key === 'F10') {
        e.preventDefault();
        setIsCashRegisterOpen((prev) => !prev);
      }
      // ESC -> Fechar modais abertos ou limpar carrinho se nada estiver aberto
      else if (e.key === 'Escape') {
        if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
        } else if (isReceiptOpen) {
          setIsReceiptOpen(false);
        } else if (isCashRegisterOpen) {
          setIsCashRegisterOpen(false);
        } else if (cart.length > 0) {
          if (safeConfirm('Deseja cancelar e limpar a venda atual?')) {
            clearCart();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isCheckoutOpen, isReceiptOpen, isCashRegisterOpen, clearCart]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100 h-[calc(100vh-58px)]">
      {/* Product selection and barcode scan area */}
      <ProductCatalog />

      {/* Real-time side cart & total display */}
      <CartSidebar onOpenCheckout={() => setIsCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleCompleted={() => {
          setIsReceiptOpen(true);
        }}
      />

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Cash Register Movements / Sangria Modal */}
      <CashRegisterModal
        isOpen={isCashRegisterOpen}
        onClose={() => setIsCashRegisterOpen(false)}
      />
    </div>
  );
};
