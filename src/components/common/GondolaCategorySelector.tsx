import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProductCategory } from '../../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Store, 
  Sparkles, 
  Settings2, 
  Edit3, 
  Plus, 
  Trash2, 
  X, 
  Save, 
  RotateCcw, 
  Layers,
  ArrowUp,
  ArrowDown,
  Tag,
  Check
} from 'lucide-react';
import { safeGetItem, safeSetItem } from '../../utils/safeStorage';
import { supabaseService } from '../../services/supabaseService';

export interface GondolaCategoryItem {
  category: 'Todas' | ProductCategory | string;
  label: string;
  aisle: string;
  icon: string;
  accent?: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    gondolaTrim: string;
  };
}

export const DEFAULT_GONDOLA_CATEGORIES: GondolaCategoryItem[] = [
  {
    category: 'Todas',
    label: 'Todas as Seções',
    aisle: 'Geral',
    icon: '🏢',
  },
  {
    category: 'Fibra Óptica',
    label: 'Fibra Óptica & Drop',
    aisle: 'Corredor 01',
    icon: '🧵',
  },
  {
    category: 'Roteadores & Wi-Fi',
    label: 'Roteadores & Mesh',
    aisle: 'Corredor 02',
    icon: '📶',
  },
  {
    category: 'ONUs & Modems',
    label: 'ONUs & GPON/EPON',
    aisle: 'Corredor 03',
    icon: '📟',
  },
  {
    category: 'Cabos & Conectores',
    label: 'Cabos & Conectividade',
    aisle: 'Corredor 04',
    icon: '🔌',
  },
  {
    category: 'Equipamentos de Rede',
    label: 'Switches & OLTs',
    aisle: 'Corredor 05',
    icon: '🖥️',
  },
  {
    category: 'Ferramentas & EPI',
    label: 'Ferramentas & Máquinas',
    aisle: 'Corredor 06',
    icon: '🛠️',
  },
  {
    category: 'Acessórios & Suprimentos',
    label: 'Fixação & Suprimentos',
    aisle: 'Corredor 07',
    icon: '📦',
  },
  {
    category: 'Serviços & Planos',
    label: 'Serviços & Instalações',
    aisle: 'Corredor 08',
    icon: '⚡',
  },
];

export const GONDOLA_CATEGORIES = DEFAULT_GONDOLA_CATEGORIES;

const QUICK_EMOJIS = [
  '🧵', '📶', '📟', '🔌', '🖥️', '🛠️', '📦', '⚡',
  '💻', '🏷️', '💡', '🔧', '📡', '🔋', '🛒', '☕',
  '🔒', '⚙️', '🧰', '🧱', '📍', '🏢', '🏷️', '📱',
  '🛰️', '🎧', '📋', '🖨️', '💾', '💿', '📏', '🪙'
];

export const getSavedGondolaCategories = (): GondolaCategoryItem[] => {
  const saved = safeGetItem<GondolaCategoryItem[]>('operafacil_gondola_categories', null);
  if (saved && Array.isArray(saved) && saved.length > 0) {
    // Se o usuário tinha as categorias antigas de mercado salvas por padrão (Mercearia, Bebidas, etc.)
    const isLegacySupermarket = saved.some(s => ['Mercearia', 'Bebidas', 'Laticínios & Frios', 'Padaria', 'Açougue'].includes(String(s.category)));
    if (isLegacySupermarket) {
      safeSetItem('operafacil_gondola_categories', DEFAULT_GONDOLA_CATEGORIES);
      supabaseService.saveGondolaCategories(DEFAULT_GONDOLA_CATEGORIES).catch(console.error);
      return DEFAULT_GONDOLA_CATEGORIES;
    }
    return saved;
  }
  return DEFAULT_GONDOLA_CATEGORIES;
};

interface GondolaCategorySelectorProps {
  selectedCategory: 'Todas' | ProductCategory | string;
  onSelectCategory: (category: 'Todas' | ProductCategory | string) => void;
  categoryCounts?: Record<string, number>;
}

export const GondolaCategorySelector: React.FC<GondolaCategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [categories, setCategories] = useState<GondolaCategoryItem[]>(() => {
    return getSavedGondolaCategories();
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Form states for creating / editing category
  const [formCategory, setFormCategory] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formAisle, setFormAisle] = useState('');
  const [formIcon, setFormIcon] = useState('📦');

  // Synchronize on custom storage events and initial cloud fetch
  useEffect(() => {
    const handleSync = () => {
      setCategories(getSavedGondolaCategories());
    };
    window.addEventListener('gondola_categories_updated', handleSync);
    window.addEventListener('storage', handleSync);

    // Initial check against Supabase
    supabaseService.fetchGondolaCategories().then((cloudCats) => {
      if (cloudCats && cloudCats.length > 0) {
        setCategories(cloudCats);
        safeSetItem('operafacil_gondola_categories', cloudCats);
      }
    }).catch(console.error);

    return () => {
      window.removeEventListener('gondola_categories_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveCategories = (newCategories: GondolaCategoryItem[]) => {
    setCategories(newCategories);
    safeSetItem('operafacil_gondola_categories', newCategories);
    supabaseService.saveGondolaCategories(newCategories).catch(console.error);
    window.dispatchEvent(new Event('gondola_categories_updated'));
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenEditItem = (index: number) => {
    const item = categories[index];
    setEditingItemIndex(index);
    setFormCategory(item.category);
    setFormLabel(item.label);
    setFormAisle(item.aisle);
    setFormIcon(item.icon);
    setIsEditModalOpen(true);
  };

  const handleOpenAddNew = () => {
    setEditingItemIndex(-1); // -1 indicates new
    const nextCorredor = String(categories.length).padStart(2, '0');
    setFormCategory(`Nova Categoria ${categories.length}`);
    setFormLabel(`Nova Seção ${categories.length}`);
    setFormAisle(`Corredor ${nextCorredor}`);
    setFormIcon('📦');
    setIsEditModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = formLabel.trim();
    if (!cleanLabel) return;

    const catKey = cleanLabel;

    if (editingItemIndex === -1) {
      // Add new
      const newItem: GondolaCategoryItem = {
        category: catKey,
        label: cleanLabel,
        aisle: formAisle.trim() || `Corredor ${String(categories.length).padStart(2, '0')}`,
        icon: formIcon || '📦',
      };
      saveCategories([...categories, newItem]);
    } else if (editingItemIndex !== null && editingItemIndex >= 0) {
      // Update existing
      const oldItem = categories[editingItemIndex];
      const oldCatKey = oldItem.category;
      const targetCatKey = editingItemIndex === 0 ? 'Todas' : catKey;

      const updated = categories.map((c, i) => {
        if (i === editingItemIndex) {
          return {
            ...c,
            category: targetCatKey,
            label: cleanLabel,
            aisle: formAisle.trim() || c.aisle,
            icon: formIcon || c.icon,
          };
        }
        return c;
      });
      saveCategories(updated);

      // If category key renamed, dispatch event to update products
      if (oldCatKey !== targetCatKey && oldCatKey !== 'Todas') {
        window.dispatchEvent(
          new CustomEvent('gondola_category_renamed', {
            detail: { oldKey: oldCatKey, newKey: targetCatKey },
          })
        );
      }
    }

    setIsEditModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleDeleteCategory = (index: number) => {
    if (index === 0) return; // Cannot delete "Todas"
    const cat = categories[index];
    if (confirm(`Deseja remover a seção "${cat.label}" da gôndola?`)) {
      const updated = categories.filter((_, i) => i !== index);
      saveCategories(updated);
      supabaseService.deleteGondolaCategory(String(cat.category)).catch(console.error);
      if (selectedCategory === cat.category) {
        onSelectCategory('Todas');
      }
      setIsEditModalOpen(false);
      setEditingItemIndex(null);
    }
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    if (index === 0) return; // "Todas" stays at index 0
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 1 || targetIndex >= categories.length) return;

    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[targetIndex];
    newCats[targetIndex] = temp;
    saveCategories(newCats);
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as categorias para o padrão original de gôndola?')) {
      saveCategories(DEFAULT_GONDOLA_CATEGORIES);
      setIsEditModalOpen(false);
      setEditingItemIndex(null);
    }
  };

  return (
    <div className="relative w-full select-none">
      {/* Supermarket Gondola Top Header Indicator */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="p-1 bg-slate-900 text-white rounded-md shadow-xs">
            <Store className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
            Gôndola de Produtos & Seções do Mercado
          </span>
          <span className="text-[10px] bg-orange-100 text-orange-900 font-bold px-1.5 py-0.5 rounded-full border border-orange-300 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-orange-600" />
            Corredores
          </span>
        </div>

        {/* Action Controls & Scroll Buttons */}
        <div className="flex items-center gap-1.5">
          
          {/* Edit Categories Button */}
          <button
            type="button"
            onClick={() => {
              setEditingItemIndex(null);
              setIsEditModalOpen(true);
            }}
            title="Gerenciar e editar seções e categorias da gôndola"
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-slate-700"
          >
            <Settings2 className="w-3.5 h-3.5 text-orange-400" />
            <span>Editar Categorias</span>
          </button>

          <div className="flex items-center gap-1 pl-1 border-l border-slate-300">
            <button
              type="button"
              onClick={() => scroll('left')}
              title="Rolar para esquerda"
              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              title="Rolar para direita"
              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gondola Shelf Rack Container */}
      <div className="relative rounded-xl p-2.5 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 border-2 border-slate-300 shadow-inner">
        {/* Gondola Top Metal Rail */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-t-lg border-b border-slate-300"></div>

        {/* Horizontal Scrolling Aisle Cards */}
        <div
          ref={scrollContainerRef}
          className="flex items-end gap-2.5 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent"
          style={{ scrollBehavior: 'smooth' }}
        >
          {categories.map((item, index) => {
            const isSelected = selectedCategory === item.category;
            const count = categoryCounts[item.category] ?? 0;

            return (
              <div
                key={item.category}
                className="relative group shrink-0"
              >
                {/* Edit Pencil on Card Hover (for categories other than 'Todas') */}
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditItem(index);
                    }}
                    title={`Editar seção ${item.label}`}
                    className="absolute -top-2 -right-1 opacity-0 group-hover:opacity-100 p-1 bg-slate-900 hover:bg-orange-600 text-white rounded-full transition-all shadow-md cursor-pointer z-20 border border-white"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectCategory(item.category)}
                  className={`relative flex flex-col items-center justify-between shrink-0 rounded-xl transition-all duration-200 cursor-pointer text-center ${
                    isSelected
                      ? 'w-32 sm:w-36 bg-white border-2 border-orange-500 shadow-lg -translate-y-1.5 ring-2 ring-orange-400/40 z-10'
                      : 'w-28 sm:w-32 bg-white/90 hover:bg-white border border-slate-300 hover:border-slate-400 shadow-xs hover:-translate-y-0.5 opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Hanging Aisle Sign (Supermarket ceiling plaque) */}
                  <div
                    className={`w-full py-0.5 px-1.5 rounded-t-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border-b ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-800'
                        : 'bg-slate-200 text-slate-600 border-slate-300 group-hover:bg-slate-300'
                    }`}
                  >
                    <span className="truncate">{item.aisle}</span>
                  </div>

                  {/* Shelf Product Showcase Area */}
                  <div className="p-2.5 w-full flex flex-col items-center">
                    {/* Emoji / Category 3D icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs transition-transform duration-200 ${
                        isSelected
                          ? 'scale-110 bg-orange-50 ring-2 ring-orange-300 shadow-sm'
                          : 'bg-slate-50 group-hover:scale-105'
                      }`}
                    >
                      <span className="drop-shadow-xs group-hover:animate-bounce">
                        {item.icon}
                      </span>
                    </div>

                    {/* Category Title */}
                    <span
                      className={`mt-2 text-xs font-bold leading-tight line-clamp-1 ${
                        isSelected ? 'text-slate-950 font-extrabold' : 'text-slate-700'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Stock items count badge on the shelf */}
                    <span
                      className={`mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isSelected
                          ? 'bg-orange-100 text-orange-900 border border-orange-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {count} {count === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  {/* Supermarket Shelf Price Rail Strip at bottom */}
                  <div
                    className={`w-full py-1 px-2 rounded-b-lg border-t text-[9px] font-bold uppercase tracking-tight flex items-center justify-center ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {isSelected ? '★ Corredor Ativo' : 'Ver Seção'}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Gondola Bottom Heavy Wood/Steel Shelf Rack Ledge */}
        <div className="mt-1 h-3 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-b-lg border-t-2 border-slate-950 shadow-md flex items-center justify-between px-3">
          <div className="w-8 h-1 bg-orange-500/40 rounded-full"></div>
          <div className="text-[8px] font-mono text-slate-300 tracking-widest uppercase opacity-75">
            PRATELEIRA DA GÔNDOLA
          </div>
          <div className="w-8 h-1 bg-orange-500/40 rounded-full"></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAMENTO & EDIÇÃO DAS CATEGORIAS DA GÔNDOLA */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 text-white rounded-xl shadow-xs">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {editingItemIndex !== null 
                      ? editingItemIndex === -1 ? 'Adicionar Nova Categoria' : `Editar Categoria: ${categories[editingItemIndex]?.label}` 
                      : 'Gerenciar Categorias & Corredores'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Personalize os nomes, corredores e ícones exibidos na gôndola.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItemIndex(null);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Form View when editing or adding a category */}
              {editingItemIndex !== null ? (
                <form onSubmit={handleSaveForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome da Categoria / Seção *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Bebidas & Sucos"
                        value={formLabel}
                        onChange={(e) => {
                          setFormLabel(e.target.value);
                          if (!formCategory || formCategory === formLabel) {
                            setFormCategory(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Identificação do Corredor / Placa
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Corredor 02 ou Setor A"
                        value={formAisle}
                        onChange={(e) => setFormAisle(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Emoji / Icon Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Ícone da Seção (Emoji 3D)</span>
                      <span className="text-xl">{formIcon}</span>
                    </label>
                    <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormIcon(emoji)}
                          className={`p-2 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                            formIcon === emoji
                              ? 'bg-orange-500 text-white shadow-md scale-110'
                              : 'hover:bg-white hover:shadow-xs'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    {editingItemIndex > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(editingItemIndex)}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Categoria</span>
                      </button>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItemIndex(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Voltar à Lista
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Categoria</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* List of all categories with management actions */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">
                      Lista de Seções Ativas na Gôndola ({categories.length}):
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAddNew}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Seção / Categoria</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                    {categories.map((cat, idx) => (
                      <div
                        key={cat.category}
                        className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                            {cat.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {cat.label}
                            </h4>
                            <span className="text-[10px] text-orange-600 font-semibold block">
                              {cat.aisle} &bull; Chave: <code className="font-mono text-slate-500">{cat.category}</code>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Move Up/Down (except 'Todas') */}
                          {idx > 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveCategory(idx, 'up')}
                              title="Mover para esquerda/cima"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx > 0 && idx < categories.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveCategory(idx, 'down')}
                              title="Mover para direita/baixo"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(idx)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-orange-500" />
                            <span>Editar</span>
                          </button>

                          {/* Delete Button (disabled for 'Todas') */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(idx)}
                              title="Excluir Categoria"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Categorias Padrão</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      Concluído
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
