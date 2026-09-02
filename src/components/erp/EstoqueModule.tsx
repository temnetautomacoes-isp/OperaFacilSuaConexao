import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, ProductUnit } from '../../types';
import { safeConfirm } from '../../utils/safeConfirm';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Barcode, 
  AlertTriangle, 
  ArrowUpDown, 
  X, 
  Check, 
  Sparkles,
  Layers,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  PackagePlus,
  Camera,
  Truck,
  Building2,
  CalendarClock
} from 'lucide-react';
import { GondolaCategorySelector, getSavedGondolaCategories } from '../common/GondolaCategorySelector';
import { DuplicateBarcodeModal } from '../common/DuplicateBarcodeModal';
import { ProductDetailModal } from '../common/ProductDetailModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { StockEntryModal } from './StockEntryModal';

const DEFAULT_CATEGORIES: ('Todas' | ProductCategory)[] = [
  'Todas',
  'Fibra Óptica',
  'Roteadores & Wi-Fi',
  'ONUs & Modems',
  'Cabos & Conectores',
  'Equipamentos de Rede',
  'Ferramentas & EPI',
  'Acessórios & Suprimentos',
  'Serviços & Planos',
];

const ICONS = ['🍚', '🥣', '🌻', '🧂', '☕', '🥛', '🥤', '💧', '🍺', '🧼', '🧺', '🧻', '🥖', '🧈', '🧀', '🍌', '🍅', '🍪', '🍫', '🥩', '🥚', '🍎', '📦'];

export const EstoqueModule: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, suppliers } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | ProductCategory>('Todas');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low_critical' | 'low' | 'out'>('all');

  // Dynamic Category List from Gondola
  const [gondolaCategories, setGondolaCategories] = useState(() => getSavedGondolaCategories());
  const categoriesList = useMemo(() => {
    return gondolaCategories.map((c) => c.category);
  }, [gondolaCategories]);

  useEffect(() => {
    const handleSync = () => {
      setGondolaCategories(getSavedGondolaCategories());
    };
    const handleCategoryRenamed = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.oldKey && detail.newKey) {
        products.forEach((p) => {
          if (p.category === detail.oldKey) {
            updateProduct(p.id, { category: detail.newKey });
          }
        });
      }
      handleSync();
    };

    window.addEventListener('gondola_categories_updated', handleSync);
    window.addEventListener('gondola_category_renamed', handleCategoryRenamed);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('gondola_categories_updated', handleSync);
      window.removeEventListener('gondola_category_renamed', handleCategoryRenamed);
      window.removeEventListener('storage', handleSync);
    };
  }, [products, updateProduct]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form'>('search');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  // Duplicate Barcode states
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Form states
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Fibra Óptica');
  const [formUnit, setFormUnit] = useState<ProductUnit>('un');
  const [formCostPrice, setFormCostPrice] = useState('0.00');
  const [formSalePrice, setFormSalePrice] = useState('0.00');
  const [formStock, setFormStock] = useState('10');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formIcon, setFormIcon] = useState('📦');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formSupplierId, setFormSupplierId] = useState<string>('');
  const [formSupplierName, setFormSupplierName] = useState<string>('');
  const [formManufacturingDate, setFormManufacturingDate] = useState<string>('');
  const [formExpirationDate, setFormExpirationDate] = useState<string>('');
  const [formBatchNumber, setFormBatchNumber] = useState<string>('');
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // List of active selectable category options (from gondola + products)
  const categoryOptions = useMemo(() => {
    const fromGondola = gondolaCategories.filter((c) => c.category !== 'Todas');
    const existingKeys = new Set(fromGondola.map((c) => c.category.toLowerCase()));
    
    const extraCategories: { category: string; label: string; icon: string }[] = [];
    products.forEach((p) => {
      if (p.category && !existingKeys.has(p.category.toLowerCase())) {
        existingKeys.add(p.category.toLowerCase());
        extraCategories.push({
          category: p.category,
          label: p.category,
          icon: p.icon || '📦',
        });
      }
    });

    if (formCategory && !existingKeys.has(formCategory.toLowerCase())) {
      extraCategories.push({
        category: formCategory,
        label: formCategory,
        icon: '📦',
      });
    }

    return [...fromGondola, ...extraCategories];
  }, [gondolaCategories, products, formCategory]);

  // Stock alert counts
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock && p.stock > 0).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock <= 0).length,
    [products]
  );
  const criticalStockCount = lowStockCount + outOfStockCount;

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchesStatus =
      filterStockStatus === 'all'
        ? true
        : filterStockStatus === 'low_critical'
        ? p.stock <= p.minStock
        : filterStockStatus === 'low'
        ? p.stock <= p.minStock && p.stock > 0
        : p.stock <= 0;
    return matchesCategory && matchesSearch && matchesStatus;
  });

  // Financial totals of inventory
  const totalCostValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalSaleValue = products.reduce((acc, p) => acc + p.salePrice * p.stock, 0);
  const totalItemsCount = products.reduce((acc, p) => acc + p.stock, 0);

  // Compute quantity of products per category for gondola display
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Todas: products.length,
    };
    categoriesList.forEach((cat) => {
      if (cat !== 'Todas') {
        counts[cat] = products.filter((p) => p.category === cat).length;
      }
    });
    products.forEach((p) => {
      if (p.category && !counts[p.category]) {
        counts[p.category] = products.filter((prod) => prod.category === p.category).length;
      }
    });
    return counts;
  }, [products, categoriesList]);

  const handleOpenAddModal = () => {
    const latestGondola = getSavedGondolaCategories();
    setGondolaCategories(latestGondola);
    const defaultCat = latestGondola.find((c) => c.category !== 'Todas')?.category || 'Fibra Óptica';

    setEditingProductId(null);
    setFormBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormName('');
    setFormCategory(defaultCat);
    setFormUnit('un');
    setFormCostPrice('');
    setFormSalePrice('');
    setFormStock('10');
    setFormMinStock('5');
    setFormIcon('📦');
    setFormImageUrl('');
    setFormSupplierId('');
    setFormSupplierName('');
    setFormManufacturingDate('');
    setFormExpirationDate('');
    setFormBatchNumber('');
    setImageUploadError(null);
    setDuplicateProduct(null);
    setShowDuplicateModal(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    const latestGondola = getSavedGondolaCategories();
    setGondolaCategories(latestGondola);

    setEditingProductId(p.id);
    setFormBarcode(p.barcode);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormUnit(p.unit);
    setFormCostPrice(p.costPrice.toString());
    setFormSalePrice(p.salePrice.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormIcon(p.icon || '📦');
    setFormImageUrl(p.imageUrl || '');
    setFormSupplierId(p.supplierId || '');
    setFormSupplierName(p.supplierName || '');
    setFormManufacturingDate(p.manufacturingDate || '');
    setFormExpirationDate(p.expirationDate || '');
    setFormBatchNumber(p.batchNumber || '');
    setImageUploadError(null);
    setDuplicateProduct(null);
    setShowDuplicateModal(false);
    setIsModalOpen(true);
  };

  const handleGenerateBarcode = () => {
    setFormBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB max limit validation (5 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setImageUploadError(
        `Arquivo muito grande (${fileSizeMB} MB). O limite máximo permitido para fotos é de 5 MB.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setFormImageUrl(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(formCostPrice) || 0;
    const sale = parseFloat(formSalePrice) || 0;
    const stock = parseFloat(formStock) || 0;
    const minStock = parseFloat(formMinStock) || 0;

    if (!formName.trim() || !formBarcode.trim()) return;

    // Check if another product already exists with this exact barcode
    const cleanBarcode = formBarcode.trim().toLowerCase();
    const existingWithSameBarcode = products.find(
      (p) =>
        p.barcode.trim().toLowerCase() === cleanBarcode &&
        (!editingProductId || p.id !== editingProductId)
    );

    if (existingWithSameBarcode) {
      // Show the duplicate warning modal with all details and actions
      setDuplicateProduct(existingWithSameBarcode);
      setShowDuplicateModal(true);
      return;
    }

    const selectedSup = suppliers.find((s) => s.id === formSupplierId);
    const finalSupplierName = formSupplierId
      ? (selectedSup ? (selectedSup.tradeName || selectedSup.name) : undefined)
      : (formSupplierName.trim() || undefined);

    if (editingProductId) {
      updateProduct(editingProductId, {
        barcode: formBarcode.trim(),
        name: formName.trim(),
        category: formCategory,
        unit: formUnit,
        costPrice: cost,
        salePrice: sale,
        stock,
        minStock,
        icon: formIcon,
        imageUrl: formImageUrl.trim() || undefined,
        supplierId: formSupplierId || undefined,
        supplierName: finalSupplierName,
        manufacturingDate: formManufacturingDate || undefined,
        expirationDate: formExpirationDate || undefined,
        batchNumber: formBatchNumber.trim() || undefined,
      });
    } else {
      addProduct({
        barcode: formBarcode.trim(),
        name: formName.trim(),
        category: formCategory,
        unit: formUnit,
        costPrice: cost,
        salePrice: sale,
        stock,
        minStock,
        icon: formIcon,
        imageUrl: formImageUrl.trim() || undefined,
        supplierId: formSupplierId || undefined,
        supplierName: finalSupplierName,
        manufacturingDate: formManufacturingDate || undefined,
        expirationDate: formExpirationDate || undefined,
        batchNumber: formBatchNumber.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleAddToExisting = () => {
    if (!duplicateProduct) return;
    const additionalStock = parseFloat(formStock) || 0;
    const previousStock = duplicateProduct.stock;
    const finalStock = previousStock + additionalStock;

    // Adjust existing product stock
    adjustStock(duplicateProduct.id, additionalStock);

    // Close both modals
    setShowDuplicateModal(false);
    setIsModalOpen(false);
    setDuplicateProduct(null);

    // Show friendly success confirmation message
    setNotificationMessage(
      `✓ Sucesso: Foram adicionadas +${additionalStock} ${duplicateProduct.unit} ao produto "${duplicateProduct.name}". O estoque total agora é de ${finalStock} ${duplicateProduct.unit}.`
    );
    setTimeout(() => {
      setNotificationMessage(null);
    }, 6000);
  };

  const handleReturnToPrevious = () => {
    // Return back to the product registration form so user can edit barcode or data
    setShowDuplicateModal(false);
  };

  // Calculate profit margin for modal form preview
  const costNum = parseFloat(formCostPrice) || 0;
  const saleNum = parseFloat(formSalePrice) || 0;
  const profitMarginPercent = costNum > 0 ? (((saleNum - costNum) / costNum) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-58px)]">
      {/* Toast Notification for Stock Merge & Actions */}
      {notificationMessage && (
        <div className="p-3.5 bg-emerald-700 text-white rounded-xl shadow-lg border border-emerald-500 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs font-bold">{notificationMessage}</span>
          </div>
          <button
            onClick={() => setNotificationMessage(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1 rounded-md hover:bg-emerald-800"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Catálogo & Gestão de Estoque
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre produtos com foto, código de barras, controle custos, margens e estoque mínimo.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            id="btn-lancar-produto-cadastrado"
            type="button"
            onClick={() => setIsStockEntryOpen(true)}
            className="py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 text-orange-400" />
            <span>Lançar Produto já Cadastrado</span>
          </button>

          <button
            id="btn-novo-produto"
            type="button"
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards with Interactive Stock Alert Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Items Card */}
        <div
          onClick={() => setFilterStockStatus('all')}
          title="Clique para visualizar todos os itens"
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterStockStatus === 'all'
              ? 'bg-white border-slate-300 shadow-xs ring-2 ring-slate-200'
              : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de Itens</span>
            <span className="text-[10px] text-slate-400 font-semibold">Geral</span>
          </div>
          <span className="text-lg font-bold font-mono text-slate-800 block mt-0.5">
            {products.length} cadastrados
          </span>
          <span className="text-[11px] text-slate-400">
            Total físico: {totalItemsCount} unid.
          </span>
        </div>

        {/* Cost Value Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor em Custo</span>
          <span className="text-lg font-bold font-mono text-slate-700 block mt-0.5">
            R$ {totalCostValue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">Capital investido</span>
        </div>

        {/* Sale Value Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-700 block">Valor em Venda (Estimado)</span>
          <span className="text-lg font-bold font-mono text-orange-600 block mt-0.5">
            R$ {totalSaleValue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400">Projeção bruta</span>
        </div>

        {/* Low / Critical Stock Interactive Dash Card */}
        <div
          id="dash-card-estoque-critico"
          onClick={() => {
            setFilterStockStatus(filterStockStatus === 'low_critical' ? 'all' : 'low_critical');
          }}
          title="Clique para filtrar e visualizar itens em estoque baixo ou crítico"
          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
            filterStockStatus === 'low_critical' || filterStockStatus === 'low' || filterStockStatus === 'out'
              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400 shadow-sm'
              : criticalStockCount > 0
              ? 'bg-gradient-to-br from-white to-amber-50/50 border-amber-200 hover:border-amber-400 hover:shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${criticalStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              Estoque Baixo / Crítico
            </span>
            {filterStockStatus === 'low_critical' || filterStockStatus === 'low' || filterStockStatus === 'out' ? (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-600 text-white animate-pulse">
                Filtro Ativo
              </span>
            ) : criticalStockCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Ver Alertas
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                100% OK
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-lg font-extrabold font-mono ${criticalStockCount > 0 ? 'text-amber-900' : 'text-slate-700'}`}>
              {criticalStockCount} {criticalStockCount === 1 ? 'item' : 'itens'}
            </span>
            {outOfStockCount > 0 && (
              <span className="text-[10px] font-bold text-rose-600">
                ({outOfStockCount} {outOfStockCount === 1 ? 'esgotado' : 'esgotados'})
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>
              {criticalStockCount > 0 ? 'Clique para listar reposição' : 'Nenhum item em nível crítico'}
            </span>
            <span className="text-[10px] text-amber-700 font-bold group-hover:underline">
              {filterStockStatus === 'low_critical' ? 'Limpar ✕' : 'Filtrar →'}
            </span>
          </p>
        </div>
      </div>

      {/* Active Filter Notice Bar */}
      {filterStockStatus !== 'all' && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Exibindo apenas produtos em <strong>{filterStockStatus === 'low_critical' ? 'Estoque Baixo & Crítico' : filterStockStatus === 'low' ? 'Abaixo do Mínimo' : 'Esgotados'}</strong> ({filteredProducts.length} itens encontrados).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilterStockStatus('all')}
            className="text-amber-800 hover:text-amber-950 font-bold text-xs underline cursor-pointer px-2 py-0.5 hover:bg-amber-100 rounded-md transition-colors"
          >
            Limpar Filtro (Mostrar Todos)
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome ou código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-24 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
            <div className="absolute right-1.5 top-1 flex items-center gap-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setScannerTarget('search');
                  setIsScannerOpen(true);
                }}
                title="Ler código de barras com a Câmera"
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
              >
                <Camera className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Câmera</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">Todos os Estoques</option>
              <option value="low_critical">Estoque Baixo & Crítico ({criticalStockCount})</option>
              <option value="low">Abaixo do Mínimo ({lowStockCount})</option>
              <option value="out">Esgotados (0) ({outOfStockCount})</option>
            </select>
          </div>
        </div>

        {/* Playful Supermarket Gondola Category Shelf Selector */}
        <div className="pt-1">
          <GondolaCategorySelector
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Código de Barras</th>
                <th className="p-3">Categoria</th>
                <th className="p-3 text-right">Custo (R$)</th>
                <th className="p-3 text-right">Venda (R$)</th>
                <th className="p-3 text-center">Margem</th>
                <th className="p-3 text-center">Estoque Atual</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStock && p.stock > 0;
                  const isOut = p.stock <= 0;
                  const margin = p.costPrice > 0 ? (((p.salePrice - p.costPrice) / p.costPrice) * 100).toFixed(0) : '0';

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedDetailProduct(p)}
                      title="Clique para ver todas as informações e ficha detalhada deste produto"
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      {/* Name & Icon/Image */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-lg">{p.icon || '📦'}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight group-hover:text-orange-600 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400">Unidade: {p.unit}</span>
                          </div>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="p-3 font-mono text-slate-600 text-[11px]">
                        {p.barcode}
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="p-3 text-right font-mono text-slate-600">
                        {p.costPrice.toFixed(2)}
                      </td>

                      {/* Sale */}
                      <td className="p-3 text-right font-mono font-bold text-orange-600">
                        {p.salePrice.toFixed(2)}
                      </td>

                      {/* Margin */}
                      <td className="p-3 text-center font-mono text-[11px] font-semibold text-slate-700">
                        +{margin}%
                      </td>

                      {/* Stock with quick buttons */}
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustStock(p.id, -1);
                            }}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              adjustStock(p.id, 1);
                            }}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Mín: {p.minStock}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(p);
                            }}
                            title="Editar produto"
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (safeConfirm(`Deseja realmente excluir "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Excluir produto"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-400" />
                <span>{editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4">
              {/* Barcode with auto-generate and camera scan buttons */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-orange-500" />
                    Código de Barras (EAN-13):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('form');
                        setIsScannerOpen(true);
                      }}
                      className="text-[11px] text-slate-600 hover:text-orange-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-orange-500" />
                      Escanear Câmera
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[11px] text-orange-600 hover:text-orange-800 font-bold cursor-pointer"
                    >
                      Gerar Código Automático
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Produto:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Arroz Tio João 5kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Categoria:
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Gôndola / Seções</span>
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.icon ? `${c.icon} ` : ''}{c.label || c.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade de Medida:
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as ProductUnit)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="pct">Pacote (pct)</option>
                    <option value="cx">Caixa (cx)</option>
                    <option value="l">Litro (l)</option>
                    <option value="g">Grama (g)</option>
                  </select>
                </div>
              </div>

              {/* Fornecedor Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-orange-500" />
                    Fornecedor do Produto:
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Cadastrado ou Avulso</span>
                </div>
                <select
                  value={formSupplierId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setFormSupplierId(chosenId);
                    const chosenSup = suppliers.find((s) => s.id === chosenId);
                    if (chosenSup) {
                      setFormSupplierName(chosenSup.tradeName || chosenSup.name);
                      if (chosenSup.category) {
                        const matchedCat = categoryOptions.find(
                          (c) =>
                            c.category.toLowerCase() === chosenSup.category.toLowerCase() ||
                            chosenSup.category.toLowerCase().includes(c.category.toLowerCase()) ||
                            c.label.toLowerCase().includes(chosenSup.category.toLowerCase())
                        );
                        if (matchedCat) {
                          setFormCategory(matchedCat.category as ProductCategory);
                        }
                      }
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                >
                  <option value="">🚚 Fornecedor Avulso / Não Cadastrado (Digitar Manualmente)</option>
                  {suppliers.length > 0 && (
                    <optgroup label="── Fornecedores Cadastrados ──">
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          🏢 {sup.tradeName || sup.name} ({sup.category}) {sup.cnpj ? `- CNPJ: ${sup.cnpj}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* If Avulso (formSupplierId is empty), allow user to write the supplier name */}
                {!formSupplierId ? (
                  <div className="p-2.5 bg-orange-50/70 rounded-xl border border-orange-200/90 animate-in fade-in duration-150 space-y-1">
                    <label className="block text-[11px] font-bold text-orange-950 flex items-center justify-between">
                      <span>Nome do Fornecedor Avulso (Opcional):</span>
                      <span className="text-[10px] font-normal text-orange-800">Escrita Livre</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Distribuidora Silva, Produtor Local, Zé do Queijo..."
                      value={formSupplierName}
                      onChange={(e) => setFormSupplierName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-900 placeholder:text-slate-400"
                    />
                    <p className="text-[10px] text-orange-900 leading-tight">
                      💡 O nome digitado será salvo junto ao produto e exibido nas consultas e relatórios.
                    </p>
                  </div>
                ) : (
                  /* Selected Supplier Micro-Card */
                  (() => {
                    const s = suppliers.find((sup) => sup.id === formSupplierId);
                    if (!s) return null;
                    return (
                      <div className="mt-1.5 p-2 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-[11px] animate-in fade-in duration-150">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="font-bold text-slate-800">{s.tradeName || s.name}</span>
                          {s.phone && <span className="text-slate-500">&bull; Tel: {s.phone}</span>}
                        </div>
                        <span className="text-[10px] font-extrabold bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {s.category}
                        </span>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Pricing & Profit Margin */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preço de Custo (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-orange-600 mb-1">
                      Preço de Venda (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formSalePrice}
                      onChange={(e) => setFormSalePrice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border-2 border-orange-500 rounded-lg focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-slate-600">Margem de Lucro Estimada:</span>
                  <span className="font-mono font-bold text-orange-600">
                    +{profitMarginPercent}% (R$ {(saleNum - costNum).toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Validade, Fabricação & Lote (Prevenção de Perdas) */}
              <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-orange-700" />
                    Fabricação, Validade & Lote:
                  </label>
                  <span className="text-[10px] text-orange-800 font-semibold">Prevenção de Perdas</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Data de Fabricação (Opcional):
                    </label>
                    <input
                      type="date"
                      value={formManufacturingDate}
                      onChange={(e) => setFormManufacturingDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Data de Validade:
                    </label>
                    <input
                      type="date"
                      value={formExpirationDate}
                      onChange={(e) => setFormExpirationDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Número do Lote:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LOTE-0824"
                    value={formBatchNumber}
                    onChange={(e) => setFormBatchNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Stocks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estoque Inicial:
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estoque Mínimo (Alerta):
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Photo & Icon Selector */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                    Foto / Imagem do Produto:
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Aparece nos cards e gôndola</span>
                </div>

                {/* Upload & Preview Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-3">
                    {/* Visual Representative Preview Box */}
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-orange-400 shadow-xs flex items-center justify-center overflow-hidden shrink-0 relative group">
                      {formImageUrl ? (
                        <>
                          <img
                            src={formImageUrl}
                            alt="Prévia do produto"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-3xl select-none">{formIcon}</span>
                      )}
                    </div>

                    {/* Upload Actions */}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white hover:bg-orange-50 text-slate-800 border border-slate-300 hover:border-orange-500 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-orange-500" />
                          <span>{formImageUrl ? 'Alterar Foto' : 'Escolher Foto do Computador'}</span>
                        </button>

                        {/* 5MB Limit Visual Pill */}
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          📦 Limite Máx: 5 MB
                        </span>

                        {formImageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Remover Foto
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 leading-tight">
                        <strong className="text-slate-700">Tamanho máximo: 5 MB por foto</strong> (para economizar espaço no storage). Suporta JPG, PNG e WEBP.
                      </p>
                    </div>
                  </div>

                  {/* 5MB Exceeded Error Alert */}
                  {imageUploadError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg flex items-center justify-between gap-2 text-rose-800 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold leading-tight">{imageUploadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUploadError(null)}
                        className="text-rose-600 hover:text-rose-900 font-bold text-[11px] px-1.5 py-0.5 rounded hover:bg-rose-100 transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>

                {/* Emoji Alternative Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ou selecione um ícone temático de fallback:
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto p-1.5 border rounded-lg bg-slate-50">
                    {ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormIcon(emoji)}
                        className={`w-7 h-7 rounded text-sm flex items-center justify-center transition-colors cursor-pointer ${
                          formIcon === emoji && !formImageUrl
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal footer buttons */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-cadastrar-produto"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  {editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Barcode Warning & Resolution Modal */}
      <DuplicateBarcodeModal
        isOpen={showDuplicateModal}
        existingProduct={duplicateProduct}
        newQuantityToAdd={parseFloat(formStock) || 0}
        onAddToExisting={handleAddToExisting}
        onReturnToPrevious={handleReturnToPrevious}
      />

      {/* Product Detail Modal (Opens when clicking any part of an individual item row) */}
      <ProductDetailModal
        isOpen={!!selectedDetailProduct}
        product={
          selectedDetailProduct
            ? products.find((p) => p.id === selectedDetailProduct.id) || selectedDetailProduct
            : null
        }
        onClose={() => setSelectedDetailProduct(null)}
        onEdit={(prod) => {
          setSelectedDetailProduct(null);
          handleOpenEditModal(prod);
        }}
        onAdjustStock={(productId, delta) => {
          adjustStock(productId, delta);
        }}
      />

      {/* Stock Entry Modal (Lançar Produto já Cadastrado) */}
      <StockEntryModal
        isOpen={isStockEntryOpen}
        onClose={() => setIsStockEntryOpen(false)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          if (scannerTarget === 'search') {
            setSearchTerm(code);
          } else {
            setFormBarcode(code);
          }
        }}
        title="Escanear Código de Barras"
        description="Aponte a câmera para o código de barras ou tire uma foto para preencher automaticamente."
      />
    </div>
  );
};
