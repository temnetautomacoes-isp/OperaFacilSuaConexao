import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Layers, 
  Box, 
  Cable, 
  Sliders, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Upload, 
  Image as ImageIcon,
  Save,
  Tag,
  Info,
  ShieldCheck,
  ZapOff,
  Copy,
  FolderOpen
} from 'lucide-react';
import { NetworkNode, DeviceType, DeviceCategory, NetworkPort } from '../../../types/network';
import { supabaseService } from '../../../services/supabaseService';
import { safeSetItem } from '../../../utils/safeStorage';

export interface SavedPassiveTemplate {
  id: string;
  name: string;
  type: DeviceType;
  category: DeviceCategory;
  vendor: string;
  model: string;
  rackUnits: number;
  passiveTypeCategory: string; // 'dio' | 'cable_organizer' | 'front_panel_blank' | 'patch_panel_rj45' | 'patch_panel_dio' | 'rack_tray' | 'pdu_power_strip' | 'other'
  portsCount?: number;
  connectorType?: string;
  notes?: string;
  customImageUrl?: string;
  colorScheme?: string;
  createdAt: string;
}

export const PASSIVE_TYPE_CATEGORIES = [
  { id: 'dio', name: 'Distribuidor Interno Óptico (DIO)', defaultType: 'dio_fiber' as DeviceType, icon: Cable, defaultUnits: 1 },
  { id: 'cable_organizer', name: 'Guia / Organizador de Cabos', defaultType: 'cable_organizer' as DeviceType, icon: Sliders, defaultUnits: 1 },
  { id: 'front_panel_blank', name: 'Painel Cego / Frente Falsa', defaultType: 'front_panel_blank' as DeviceType, icon: Box, defaultUnits: 1 },
  { id: 'patch_panel_rj45', name: 'Patch Panel Metálico (RJ45)', defaultType: 'patch_panel_rj45' as DeviceType, icon: Layers, defaultUnits: 1 },
  { id: 'patch_panel_dio', name: 'Patch Panel Óptico / Híbrido', defaultType: 'patch_panel_dio' as DeviceType, icon: Cable, defaultUnits: 1 },
  { id: 'rack_tray', name: 'Bandeja Fixa / Móvel de Rack', defaultType: 'rack_tray' as DeviceType, icon: Box, defaultUnits: 1 },
  { id: 'pdu_power_strip', name: 'Régua de Tomadas / PDU Passiva', defaultType: 'pdu_power_strip' as DeviceType, icon: ZapOff, defaultUnits: 1 },
  { id: 'other', name: 'Outro Elemento Passivo', defaultType: 'front_panel_blank' as DeviceType, icon: Box, defaultUnits: 1 },
];

interface NewPassiveModalProps {
  isOpen: boolean;
  rackNode: NetworkNode | null;
  initialSlotU?: number;
  allNodes?: NetworkNode[];
  onClose: () => void;
  onAddPassive: (passiveNode: Partial<NetworkNode>) => void;
}

export const NewPassiveModal: React.FC<NewPassiveModalProps> = ({
  isOpen,
  rackNode,
  initialSlotU,
  allNodes = [],
  onClose,
  onAddPassive,
}) => {
  if (!isOpen || !rackNode) return null;

  const totalUnits = rackNode.totalRackCapacityU || rackNode.rackUnits || 42;

  // Generate slots array from top to 1
  const availableSlots: number[] = [];
  for (let i = totalUnits; i >= 1; i--) {
    availableSlots.push(i);
  }

  // Saved templates state (starts empty as requested, persisted in localStorage / Supabase)
  const [savedTemplates, setSavedTemplates] = useState<SavedPassiveTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('operafacil_saved_passive_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Sync passive templates from Supabase on mount
  useEffect(() => {
    async function loadCloudPassiveTemplates() {
      try {
        const cloudTpls = await supabaseService.fetchNetworkPassiveTemplates();
        if (cloudTpls && cloudTpls.length > 0) {
          setSavedTemplates(cloudTpls);
          safeSetItem('operafacil_saved_passive_templates', cloudTpls);
        }
      } catch (e) {
        console.warn('Erro ao carregar modelos passivos do Supabase:', e);
      }
    }
    loadCloudPassiveTemplates();
  }, []);

  const [activeTab, setActiveTab] = useState<'create_scratch' | 'saved_templates'>('create_scratch');

  // Form Fields
  const [passiveTypeCategory, setPassiveTypeCategory] = useState<string>('dio');
  const [name, setName] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [rackUnits, setRackUnits] = useState<number>(1);
  const [slotU, setSlotU] = useState<number>(initialSlotU || 1);
  const [portsCount, setPortsCount] = useState<number>(24);
  const [connectorType, setConnectorType] = useState<string>('SC/APC');
  const [colorScheme, setColorScheme] = useState<string>('dark_metal');
  const [notes, setNotes] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(true);

  // Search in Saved Templates
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (initialSlotU) {
      setSlotU(initialSlotU);
    }
  }, [initialSlotU]);

  // Handle Category Select
  const handleSelectCategoryType = (catId: string) => {
    setPassiveTypeCategory(catId);
    const cat = PASSIVE_TYPE_CATEGORIES.find(c => c.id === catId);
    if (cat) {
      setRackUnits(cat.defaultUnits);
      if (catId === 'front_panel_blank' || catId === 'cable_organizer') {
        setPortsCount(0);
      } else if (catId === 'dio') {
        setPortsCount(24);
        setConnectorType('SC/APC');
      } else if (catId === 'patch_panel_rj45') {
        setPortsCount(24);
        setConnectorType('RJ45 Cat6');
      } else if (catId === 'pdu_power_strip') {
        setPortsCount(8);
        setConnectorType('NBR 14136 10A/20A');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, SVG, JPG, WebP).');
        return;
      }
      try {
        const publicUrl = await supabaseService.uploadFile(file, 'network/devices');
        setCustomImageUrl(publicUrl);
      } catch (err) {
        console.error('Erro ao enviar imagem ao Supabase Storage:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setCustomImageUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Submit and create new passive node
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const catObj = PASSIVE_TYPE_CATEGORIES.find(c => c.id === passiveTypeCategory) || PASSIVE_TYPE_CATEGORIES[0];
    const generatedPorts: NetworkPort[] = [];

    if (portsCount > 0) {
      for (let i = 1; i <= portsCount; i++) {
        generatedPorts.push({
          id: `pass-port-${Date.now()}-${i}`,
          name: passiveTypeCategory === 'dio' 
            ? `Fibra ${i} (${connectorType})`
            : passiveTypeCategory === 'pdu_power_strip'
            ? `Tomada ${i}`
            : `Porta ${i}`,
          type: passiveTypeCategory === 'dio' ? 'sfp_10g' : 'copper_1g',
          mediaType: passiveTypeCategory === 'dio' ? 'fiber' : 'ethernet',
          status: 'up',
          connectorType: connectorType || 'SC/APC',
        });
      }
    }

    const newPassiveNode: Partial<NetworkNode> = {
      id: `passive-${Date.now()}`,
      name: name.trim(),
      type: catObj.defaultType,
      category: 'passive' as DeviceCategory,
      vendor: vendor.trim() || 'Genérico',
      model: model.trim() || catObj.name,
      folderId: rackNode.folderId,
      location: `${rackNode.name} (U${slotU})`,
      parentRackId: rackNode.id,
      rackPosition: `U${slotU}`,
      rackUnits: rackUnits || 1,
      isPassive: true,
      powerConsumptionWatts: 0,
      powerSupply: 'none',
      status: 'online',
      ports: generatedPorts,
      notes: notes.trim(),
      customImageUrl: customImageUrl.trim() || undefined,
      imageUrl: customImageUrl.trim() || undefined,
      colorScheme,
      createdAt: new Date().toISOString(),
    };

    // Save as reusable template if requested
    if (saveAsTemplate) {
      const templateItem: SavedPassiveTemplate = {
        id: `tpl-pass-${Date.now()}`,
        name: name.trim(),
        type: catObj.defaultType,
        category: 'passive',
        vendor: vendor.trim() || 'Genérico',
        model: model.trim() || catObj.name,
        rackUnits: rackUnits || 1,
        passiveTypeCategory,
        portsCount,
        connectorType,
        notes: notes.trim(),
        customImageUrl: customImageUrl.trim() || undefined,
        colorScheme,
        createdAt: new Date().toISOString(),
      };

      const updatedTpls = [templateItem, ...savedTemplates.filter(t => t.name !== templateItem.name)];
      setSavedTemplates(updatedTpls);
      safeSetItem('operafacil_saved_passive_templates', updatedTpls);
      supabaseService.saveNetworkPassiveTemplate(templateItem).catch(console.error);
    }

    onAddPassive(newPassiveNode);
    onClose();
  };

  // Instantiate from saved template
  const handleInstantiateSavedTemplate = (tpl: SavedPassiveTemplate) => {
    const catObj = PASSIVE_TYPE_CATEGORIES.find(c => c.id === tpl.passiveTypeCategory) || PASSIVE_TYPE_CATEGORIES[0];
    const generatedPorts: NetworkPort[] = [];

    if (tpl.portsCount && tpl.portsCount > 0) {
      for (let i = 1; i <= tpl.portsCount; i++) {
        generatedPorts.push({
          id: `pass-port-${Date.now()}-${i}`,
          name: tpl.passiveTypeCategory === 'dio' 
            ? `Fibra ${i} (${tpl.connectorType || 'SC/APC'})`
            : tpl.passiveTypeCategory === 'pdu_power_strip'
            ? `Tomada ${i}`
            : `Porta ${i}`,
          type: tpl.passiveTypeCategory === 'dio' ? 'sfp_10g' : 'copper_1g',
          mediaType: tpl.passiveTypeCategory === 'dio' ? 'fiber' : 'ethernet',
          status: 'up',
          connectorType: tpl.connectorType || 'SC/APC',
        });
      }
    }

    const newPassiveNode: Partial<NetworkNode> = {
      id: `passive-${Date.now()}`,
      name: tpl.name,
      type: tpl.type || catObj.defaultType,
      category: 'passive' as DeviceCategory,
      vendor: tpl.vendor,
      model: tpl.model,
      folderId: rackNode.folderId,
      location: `${rackNode.name} (U${slotU})`,
      parentRackId: rackNode.id,
      rackPosition: `U${slotU}`,
      rackUnits: tpl.rackUnits || 1,
      isPassive: true,
      powerConsumptionWatts: 0,
      powerSupply: 'none',
      status: 'online',
      ports: generatedPorts,
      notes: tpl.notes || '',
      customImageUrl: tpl.customImageUrl,
      imageUrl: tpl.customImageUrl,
      colorScheme: tpl.colorScheme || 'dark_metal',
      createdAt: new Date().toISOString(),
    };

    onAddPassive(newPassiveNode);
    onClose();
  };

  // Load template into form
  const handleLoadTemplateIntoForm = (tpl: SavedPassiveTemplate) => {
    setName(tpl.name);
    setVendor(tpl.vendor);
    setModel(tpl.model);
    setRackUnits(tpl.rackUnits || 1);
    setPassiveTypeCategory(tpl.passiveTypeCategory || 'dio');
    setPortsCount(tpl.portsCount || 0);
    setConnectorType(tpl.connectorType || 'SC/APC');
    setColorScheme(tpl.colorScheme || 'dark_metal');
    setNotes(tpl.notes || '');
    setCustomImageUrl(tpl.customImageUrl || '');
    setActiveTab('create_scratch');
  };

  // Delete saved template
  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    safeSetItem('operafacil_saved_passive_templates', updated);
    supabaseService.deleteNetworkPassiveTemplate(id).catch(console.error);
  };

  const filteredTemplates = savedTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.model.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.vendor.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCat = categoryFilter === 'all' || t.passiveTypeCategory === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 select-none">
      <div className="bg-slate-900 border border-slate-700/90 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Novo Passivo de Rack
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                  Infraestrutura & Passivos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cadastre ou selecione um passivo (DIO, Frente Falsa, Guia de Cabos, Patch Panel, Bandejas) para o rack <strong className="text-white">{rackNode.name}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('create_scratch')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create_scratch'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Novo Passivo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved_templates')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'saved_templates'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Passivos Salvos / Biblioteca ({savedTemplates.length})
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'create_scratch' ? (
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
            
            {/* Passive Type / Category Selector Pills */}
            <div className="space-y-2 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <label className="block text-[11px] font-black uppercase text-sky-400">
                1. Selecione o Tipo de Elemento Passivo:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PASSIVE_TYPE_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = passiveTypeCategory === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleSelectCategoryType(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-950/70 border-sky-500 text-white shadow-md ring-1 ring-sky-500/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                      </div>
                      <span className="text-[11px] font-bold leading-tight line-clamp-2">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* General Identification & Rack Placement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Left Column: Specs */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block border-b border-slate-800 pb-1">
                  2. Identificação do Passivo
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nome de Identificação: *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: DIO 24F SC/APC, Frente Falsa 1U, Guia Horiz. 01"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Fabricante / Marca:
                    </label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Ex: Furukawa, Fibracem"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Modelo / Referência:
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: B48, GCH-1U"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Ports / Capacity */}
                {(passiveTypeCategory === 'dio' || passiveTypeCategory === 'patch_panel_rj45' || passiveTypeCategory === 'patch_panel_dio' || passiveTypeCategory === 'pdu_power_strip') && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Qtd. Portas / Fibras:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="96"
                        value={portsCount}
                        onChange={(e) => setPortsCount(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sky-400 font-mono font-bold text-xs focus:border-sky-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Padrão Conector:
                      </label>
                      <input
                        type="text"
                        value={connectorType}
                        onChange={(e) => setConnectorType(e.target.value)}
                        placeholder="Ex: SC/APC, RJ45 Cat6, LC"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:border-sky-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Rack Slot Placement */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block border-b border-slate-800 pb-1">
                  3. Posição no Rack ({rackNode.name})
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Slot de Destino:
                    </label>
                    <select
                      value={slotU}
                      onChange={(e) => setSlotU(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sky-400 font-bold font-mono text-xs cursor-pointer focus:border-sky-500 focus:outline-hidden"
                    >
                      {availableSlots.map(num => (
                        <option key={num} value={num}>
                          Slot U{num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Altura Ocupada (U):
                    </label>
                    <select
                      value={rackUnits}
                      onChange={(e) => setRackUnits(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer focus:border-sky-500 focus:outline-hidden"
                    >
                      <option value={1}>1U (Padrão 44mm)</option>
                      <option value={2}>2U (88mm)</option>
                      <option value={3}>3U (132mm)</option>
                      <option value={4}>4U (176mm)</option>
                    </select>
                  </div>
                </div>

                {/* Appearance / Custom Image */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Imagem Personalizada (PNG Frontal):
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      Upload Imagem
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {customImageUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomImageUrl('')}
                        className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                      >
                        Remover Imagem
                      </button>
                    )}
                  </div>
                </div>

                {/* Checkbox Save Reusable Template */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsTemplate}
                      onChange={(e) => setSaveAsTemplate(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>Salvar este item na biblioteca de modelos para reutilizar</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <label className="block text-[11px] font-bold text-slate-300">
                Observações Técnicas / Aplicação:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Interligação com o DIO 02. Cordões ópticos azuis SM. Ocupando U vazia para fluxo térmico..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-sky-500 focus:outline-hidden resize-none"
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Instalar Passivo no Rack (Slot U{slotU})
              </button>
            </div>
          </form>
        ) : (
          /* Saved Templates Library Tab */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs flex flex-col justify-between">
            <div className="space-y-3">
              {/* Library Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Buscar passivo cadastrado por nome, modelo ou marca..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-200 focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 font-bold text-xs focus:outline-hidden focus:border-sky-500 cursor-pointer"
                >
                  <option value="all">Todas as Categorias</option>
                  {PASSIVE_TYPE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Slot Selector for Instantiation */}
              <div className="flex items-center gap-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Instalar no Slot:</span>
                <select
                  value={slotU}
                  onChange={(e) => setSlotU(parseInt(e.target.value) || 1)}
                  className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-sky-400 font-bold font-mono text-xs cursor-pointer focus:border-sky-500 focus:outline-hidden"
                >
                  {availableSlots.map(num => (
                    <option key={num} value={num}>
                      Slot U{num}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">
                  (Clique em "Instalar no Rack" no card abaixo para alocar neste slot)
                </span>
              </div>

              {/* Templates Grid or Empty State */}
              {filteredTemplates.length === 0 ? (
                <div className="p-10 text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-950/50 border border-sky-800/60 flex items-center justify-center text-sky-400 mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-300">Nenhum passivo cadastrado ainda</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Você pode cadastrar seus passivos (ex: DIO, Frente Falsa, Guia de Cabos, Patch Panel) na aba <strong>"Cadastrar Novo Passivo"</strong> para que fiquem salvos aqui na sua biblioteca.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create_scratch')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Primeiro Passivo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[42vh] overflow-y-auto pr-1">
                  {filteredTemplates.map(tpl => {
                    const catObj = PASSIVE_TYPE_CATEGORIES.find(c => c.id === tpl.passiveTypeCategory);
                    return (
                      <div
                        key={tpl.id}
                        className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-sky-500/70 transition-all flex flex-col justify-between gap-3 group/card shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white group-hover/card:text-sky-300 transition-colors">
                                {tpl.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-900 font-bold">
                                {tpl.rackUnits}U
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {tpl.vendor} • {tpl.model}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {catObj?.name || 'Passivo'} {tpl.portsCount ? `• ${tpl.portsCount} Portas (${tpl.connectorType})` : ''}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                            className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Excluir este modelo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {tpl.notes && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-850">
                            {tpl.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                          <button
                            type="button"
                            onClick={() => handleLoadTemplateIntoForm(tpl)}
                            className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[11px] border border-slate-800 transition-colors cursor-pointer"
                          >
                            Editar / Usar Base
                          </button>

                          <button
                            type="button"
                            onClick={() => handleInstantiateSavedTemplate(tpl)}
                            className="flex-1 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Instalar (Slot U{slotU})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Library Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Total de modelos salvos: {savedTemplates.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
