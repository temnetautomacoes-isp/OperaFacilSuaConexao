import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { 
  Barcode, 
  Search, 
  Plus, 
  Layers, 
  Sparkles, 
  Check, 
  Calculator,
  X,
  Info
} from 'lucide-react';
import { GondolaCategorySelector } from '../common/GondolaCategorySelector';
import { ProductDetailModal } from '../common/ProductDetailModal';

const CATEGORIES: ('Todas' | ProductCategory)[] = [
  'Todas',
  'Fibra Óptica',
  'Roteadores & Wi-Fi',
  'ONUs & Modems',
  'Cabos & Conectores',
  'Equipamentos de Rede',
  'Ferramentas & EPI',
  'Acessórios & Suprimentos',
  'Serviços & Planos'
];

interface ProductCatalogProps {
  onFocusBarcode?: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = () => {
  const { products, addToCart, showNotification } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | ProductCategory>('Todas');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [multiplier, setMultiplier] = useState(1);
  const [showKeypad, setShowKeypad] = useState(false);
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount and on F2
  useEffect(() => {
    barcodeInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle barcode submission (supports 3*7891000100101 syntax)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    let qty = multiplier;
    let code = raw;

    // Check multiplier syntax: e.g. "3*7891000100101"
    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseFloat(parts[0]);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        code = parts.slice(1).join('*').trim();
      }
    }

    const found = products.find(
      (p) => p.barcode === code || p.name.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      addToCart(found, qty);
      setRecentAddedId(found.id);
      setTimeout(() => setRecentAddedId(null), 1200);
      setBarcodeInput('');
      setMultiplier(1);
    } else {
      showNotification(`Código de barras ou produto não encontrado: "${code}"`);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'Todas' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const handleQuickAdd = (product: Product) => {
    addToCart(product, multiplier);
    setRecentAddedId(product.id);
    setTimeout(() => setRecentAddedId(null), 1200);
    setMultiplier(1);
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Todas: products.length,
    };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'Todas') {
        counts[cat] = products.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [products]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-slate-100/70">
      {/* Top Search & Barcode Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Barcode Fast Reader */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-500">
                <Barcode className="w-5 h-5" />
              </div>
              <input
                ref={barcodeInputRef}
                id="input-barcode-scanner"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Bipar ou digitar Código de Barras (F2)... Ex: 3*789..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Bipar</span>
                <span className="text-[10px] opacity-75 font-mono">↵</span>
              </button>
            </div>
          </form>

          {/* Search Term Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-search-products"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Numeric keypad toggle */}
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
              showKeypad
                ? 'bg-orange-100 border-orange-300 text-orange-900'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <Calculator className="w-4 h-4 text-orange-500" />
            <span>Teclado / Qtd</span>
          </button>
        </div>

        {/* Multiplier / Virtual Keypad Drawer */}
        {showKeypad && (
          <div className="bg-orange-50/70 border border-orange-200/80 rounded-lg p-3 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-orange-900 flex items-center gap-1">
              Multiplicador de Quantidade:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 10].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setMultiplier(qty)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    multiplier === qty
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-orange-300 hover:bg-orange-100'
                  }`}
                >
                  {qty}x
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600">Personalizado:</span>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={multiplier}
                onChange={(e) => setMultiplier(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-16 px-2 py-0.5 text-xs font-bold bg-white border border-orange-300 rounded text-center focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-orange-800 ml-auto italic">
              Dica: Digite a quantidade no código, ex: "3*7891..."
            </span>
          </div>
        )}

        {/* Playful Supermarket Gondola Category Shelf Selector */}
        <div className="pt-1">
          <GondolaCategorySelector
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Layers className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Verifique a busca "{searchTerm}" ou a categoria selecionada.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;
              const isJustAdded = recentAddedId === product.id;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleQuickAdd(product)}
                  className={`relative text-left p-3 rounded-lg border transition-all duration-150 flex flex-col justify-between group shadow-xs cursor-pointer ${
                    isJustAdded
                      ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400'
                      : isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-orange-500 hover:shadow-md'
                  }`}
                >
                  {/* Top category & stock badge */}
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">
                      {product.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                          Esgotado
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">
                          {product.stock} {product.unit}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">
                          {product.stock} {product.unit}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailProduct(product);
                        }}
                        title="Ver detalhes do produto"
                        className="p-0.5 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Icon / Photo & Title */}
                  <div className="flex items-center gap-2 my-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 text-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        product.icon || '📦'
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600">
                      {product.name}
                    </h4>
                  </div>

                  {/* Barcode */}
                  <span className="text-[10px] text-slate-400 font-mono tracking-tighter mb-2 truncate">
                    {product.barcode}
                  </span>

                  {/* Price and Add Button */}
                  <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 block -mb-0.5">Preço</span>
                      <span className="text-sm font-black font-mono text-orange-600">
                        R$ {product.salePrice.toFixed(2)}
                      </span>
                    </div>

                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isJustAdded
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'
                    }`}>
                      {isJustAdded ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <ProductDetailModal
        isOpen={!!detailProduct}
        product={
          detailProduct
            ? products.find((p) => p.id === detailProduct.id) || detailProduct
            : null
        }
        onClose={() => setDetailProduct(null)}
      />
    </div>
  );
};
