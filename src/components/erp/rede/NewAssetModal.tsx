import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Server, 
  Router, 
  Network, 
  Zap, 
  PhoneCall, 
  BatteryCharging, 
  Cpu, 
  Radio, 
  Sliders, 
  Check, 
  Trash2, 
  Sparkles, 
  Layers2, 
  HardDrive, 
  Box,
  Cable,
  CheckCircle2,
  FolderOpen,
  Image as ImageIcon,
  Upload,
  Link2,
  ShieldCheck,
  Monitor,
  Wifi,
  SlidersHorizontal,
  Bookmark,
  Copy,
  Tag,
  Search,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { 
  NetworkNode, 
  NetworkPort, 
  NetworkFolder, 
  DeviceType, 
  DeviceCategory, 
  PortMediaType, 
  PortSpeedMode, 
  PortDuplex, 
  PortPoe 
} from '../../../types/network';
import { supabaseService } from '../../../services/supabaseService';
import { safeSetItem } from '../../../utils/safeStorage';
import { DEVICE_CATALOG } from './initialNetworkData';

export interface ActiveCategory {
  id: string;
  name: string;
  badge: string;
  defaultType: DeviceType;
  defaultCategory: DeviceCategory;
  defaultVendor: string;
  defaultOs: NetworkNode['osType'];
  description: string;
}

const DEFAULT_ACTIVE_CATEGORIES: ActiveCategory[] = [
  { id: 'concentrador', name: 'Concentrador (PPPoE / CGNAT / BRAS)', badge: 'Core / BRAS', defaultType: 'router_cgnat', defaultCategory: 'isp_core', defaultVendor: 'MikroTik', defaultOs: 'mikrotik_routeros', description: 'Autenticação de clientes, sessões PPPoE/IPoE e CGNAT' },
  { id: 'roteador_borda', name: 'Roteador de Borda (BGP Core)', badge: 'Trânsito IP / PTT', defaultType: 'router_bgp', defaultCategory: 'isp_core', defaultVendor: 'MikroTik', defaultOs: 'mikrotik_routeros', description: 'BGP Full-Routing, trânsito IP, IX.br / PTT e roteamento dinâmico' },
  { id: 'roteador_residencial', name: 'Roteador Residencial / Wi-Fi', badge: 'CPE / Wi-Fi', defaultType: 'onu_ont', defaultCategory: 'access_ftth', defaultVendor: 'Huawei', defaultOs: 'generic', description: 'Roteador doméstico Wi-Fi 6, Mesh, AP e CPE de cliente' },
  { id: 'switch_gerenciavel', name: 'Switch Gerenciável (L2+ / L3)', badge: 'VLANs / SFP+', defaultType: 'switch_core', defaultCategory: 'isp_core', defaultVendor: 'Huawei', defaultOs: 'huawei_vrp', description: 'Switch com VLANs, agregação LACP, STP e portas SFP+/10G' },
  { id: 'switch_sem_gerencia', name: 'Switch Sem Gerência (Unmanaged)', badge: 'Plug & Play', defaultType: 'switch_access', defaultCategory: 'isp_core', defaultVendor: 'TP-Link', defaultOs: 'generic', description: 'Switch de acesso básico não configurável' },
  { id: 'olt', name: 'OLT (GPON / EPON / XGS-PON)', badge: 'FTTH Central', defaultType: 'olt_gpon', defaultCategory: 'access_ftth', defaultVendor: 'Huawei', defaultOs: 'huawei_vrp', description: 'Concentrador óptico FTTH com portas PON para atendimento de ONUs' },
  { id: 'onu', name: 'ONU (Optical Network Unit)', badge: 'Terminal Óptico', defaultType: 'onu_ont', defaultCategory: 'access_ftth', defaultVendor: 'Fiberhome', defaultOs: 'generic', description: 'Unidade de rede óptica em modo Bridge ou Router simples' },
  { id: 'ont', name: 'ONT (Optical Network Terminal)', badge: 'Wi-Fi / VoIP', defaultType: 'onu_ont', defaultCategory: 'access_ftth', defaultVendor: 'Huawei', defaultOs: 'generic', description: 'Terminal de rede óptica com roteamento Wi-Fi e portas de voz FXS' },
  { id: 'servidor', name: 'Servidor / Cache / DNS', badge: 'Data Center', defaultType: 'server_datacenter', defaultCategory: 'isp_core', defaultVendor: 'Dell', defaultOs: 'linux', description: 'Servidor Linux/Windows para Speedtest, DNS, Virtualização e ERP' },
  { id: 'pabx_ip', name: 'Central Telefônica / PABX IP', badge: 'VoIP / SIP', defaultType: 'telephony_pabx', defaultCategory: 'telephony_voip', defaultVendor: 'Intelbras', defaultOs: 'linux', description: 'Central IP PBX, gateways FXS/FXO e troncos SIP E1' },
  { id: 'nobreak_retificadora', name: 'Nobreak Online / Retificadora -48V', badge: 'Energia / Backup', defaultType: 'ups_nobreak', defaultCategory: 'rack_power', defaultVendor: 'APC by Schneider', defaultOs: 'generic', description: 'Alimentação ininterrupta UPS, fontes redundantes e baterias' },
  { id: 'radio_enlace', name: 'Rádio Enlace PTP / PTMP', badge: 'Wireless Backhaul', defaultType: 'radio_ptp', defaultCategory: 'wireless', defaultVendor: 'Ubiquiti', defaultOs: 'generic', description: 'Transmissão sem fio de alta capacidade para torres e enlaces' },
];

export interface SavedAssetTemplate {
  id: string;
  name: string;
  categoryName: string;
  deviceType: DeviceType;
  category: DeviceCategory;
  vendor: string;
  model: string;
  rackUnits: number;
  powerSupply: NetworkNode['powerSupply'];
  powerConsumptionWatts: number;
  osType: NetworkNode['osType'];
  defaultPorts: NetworkPort[];
  notes?: string;
  customImageUrl?: string;
  createdAt: string;
  isCustomTemplate?: boolean;
}

interface NewAssetModalProps {
  isOpen: boolean;
  folders: NetworkFolder[];
  defaultFolderId: string | null;
  allNodes?: NetworkNode[];
  initialParentRackId?: string | null;
  initialRackPosition?: string | null;
  onClose: () => void;
  onAddDevice: (node: Partial<NetworkNode>) => void;
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  folders,
  defaultFolderId,
  allNodes = [],
  initialParentRackId,
  initialRackPosition,
  onClose,
  onAddDevice,
}) => {
  if (!isOpen) return null;

  const existingRacks = allNodes.filter(n => n.type === 'rack_floor' || n.type === 'rack_wall' || n.type === 'rack_19');
  const existingPowerSources = allNodes.filter(n => n.type === 'ups_nobreak' || n.type === 'pdu_power_strip' || n.type === 'rectifier_power' || n.type === 'electrical_outlet');

  const initialRackNode = initialParentRackId ? allNodes.find(n => n.id === initialParentRackId) : null;

  // Active Categories state (loaded from localStorage)
  const [categories, setCategories] = useState<ActiveCategory[]>(() => {
    try {
      const saved = localStorage.getItem('operafacil_active_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ACTIVE_CATEGORIES;
  });

  // Saved templates state (loaded from localStorage / Supabase)
  const [savedTemplates, setSavedTemplates] = useState<SavedAssetTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('operafacil_saved_asset_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Sync templates and categories from Supabase on mount
  useEffect(() => {
    async function loadCloudTemplates() {
      try {
        const cloudTpls = await supabaseService.fetchNetworkAssetTemplates();
        if (cloudTpls && cloudTpls.length > 0) {
          setSavedTemplates(cloudTpls);
          safeSetItem('operafacil_saved_asset_templates', cloudTpls);
        }

        const cloudCats = await supabaseService.fetchNetworkActiveCategories();
        if (cloudCats && cloudCats.length > 0) {
          setCategories(cloudCats);
          safeSetItem('operafacil_active_categories', cloudCats);
        }
      } catch (e) {
        console.warn('Erro ao carregar modelos do Supabase:', e);
      }
    }
    loadCloudTemplates();
  }, []);

  const [activeTab, setActiveTab] = useState<'create_scratch' | 'templates'>('create_scratch');

  // New Category Modal / Inline Prompt
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBadge, setNewCatBadge] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Form Fields for the Active Asset being created from scratch
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('concentrador');
  const [name, setName] = useState('');
  const [hostname, setHostname] = useState('');
  const [vendor, setVendor] = useState('MikroTik');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [mac, setMac] = useState('');
  
  // Installation & Location
  const [folderId, setFolderId] = useState<string>(initialRackNode?.folderId || defaultFolderId || folders[0]?.id || '');
  const [parentRackId, setParentRackId] = useState<string>(initialParentRackId || '');
  const [rackPosition, setRackPosition] = useState<string>(initialRackPosition || 'U42');
  const [rackUnits, setRackUnits] = useState<number>(1);
  const [location, setLocation] = useState(initialRackNode ? `${initialRackNode.name} (${initialRackPosition || 'U42'})` : 'POP Central');
  const [powerSourceNodeId, setPowerSourceNodeId] = useState<string>('');

  // Network & Management Specs
  const [osType, setOsType] = useState<NetworkNode['osType']>('mikrotik_routeros');
  const [managementIp, setManagementIp] = useState('');
  const [netmaskCidr, setNetmaskCidr] = useState('/24');
  const [gatewayIp, setGatewayIp] = useState('');
  const [accessProtocols, setAccessProtocols] = useState('SSH, Winbox, HTTPS');

  // Electrical & Hardware Specs
  const [powerSupply, setPowerSupply] = useState<NetworkNode['powerSupply']>('Redundante AC/DC');
  const [powerConsumptionWatts, setPowerConsumptionWatts] = useState<number>(45);
  const [hardwareCpuRam, setHardwareCpuRam] = useState('');
  const [throughputCapacity, setThroughputCapacity] = useState('');
  const [notes, setNotes] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(true);

  // Ports State
  const [ports, setPorts] = useState<NetworkPort[]>([
    { id: 'p-1', name: 'ether1 (Gerência)', type: 'copper_1g', mediaType: 'ethernet', speedMode: '1000M', duplex: 'full', status: 'up' },
    { id: 'p-2', name: 'ether2 (LAN)', type: 'copper_1g', mediaType: 'ethernet', speedMode: '1000M', duplex: 'full', status: 'up' },
    { id: 'p-3', name: 'sfp-sfpplus1 (10G Uplink)', type: 'sfp_10g', mediaType: 'fiber', speedMode: '10000M', duplex: 'full', status: 'up' },
    { id: 'p-4', name: 'sfp-sfpplus2 (10G Downlink)', type: 'sfp_10g', mediaType: 'fiber', speedMode: '10000M', duplex: 'full', status: 'up' },
  ]);

  // Batch Port Adder State
  const [batchCount, setBatchCount] = useState<number>(8);
  const [batchPrefix, setBatchPrefix] = useState('ether');
  const [batchMediaType, setBatchMediaType] = useState<PortMediaType>('ethernet');
  const [batchSpeedMode, setBatchSpeedMode] = useState<PortSpeedMode>('1000M');

  // Sync initial parent rack & slot position when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialParentRackId) {
        setParentRackId(initialParentRackId);
        const rack = allNodes.find(n => n.id === initialParentRackId);
        if (rack) {
          if (rack.folderId) setFolderId(rack.folderId);
          setLocation(`${rack.name} (${initialRackPosition || 'U1'})`);
        }
      }
      if (initialRackPosition) {
        setRackPosition(initialRackPosition);
      }
    }
  }, [isOpen, initialParentRackId, initialRackPosition, allNodes]);

  // Catalog / Template Library Filter
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCatFilter, setTemplateCatFilter] = useState('all');

  const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId) || categories[0];

  // Auto-fill defaults when category changes
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      if (!vendor || vendor === 'MikroTik' || vendor === 'Huawei') {
        setVendor(cat.defaultVendor);
      }
      setOsType(cat.defaultOs);

      if (cat.id === 'olt') {
        setBatchPrefix('gpon 0/1/');
        setBatchMediaType('pon');
        setBatchSpeedMode('2.5G');
      } else if (cat.id === 'pabx_ip') {
        setBatchPrefix('ramal-');
        setBatchMediaType('voice');
        setBatchSpeedMode('auto');
      } else if (cat.id === 'concentrador' || cat.id === 'roteador_borda') {
        setBatchPrefix('sfp-sfpplus');
        setBatchMediaType('fiber');
        setBatchSpeedMode('10000M');
      } else {
        setBatchPrefix('ether');
        setBatchMediaType('ethernet');
        setBatchSpeedMode('1000M');
      }
    }
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const id = `cat_${Date.now()}`;
    const newCat: ActiveCategory = {
      id,
      name: newCatName.trim(),
      badge: newCatBadge.trim() || 'Personalizado',
      defaultType: 'switch_core',
      defaultCategory: 'isp_core',
      defaultVendor: 'Genérico',
      defaultOs: 'generic',
      description: newCatDesc.trim() || 'Categoria personalizada de equipamento ativo',
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    safeSetItem('operafacil_active_categories', updated);
    supabaseService.saveNetworkActiveCategory(newCat).catch(console.error);
    setSelectedCategoryId(id);
    setIsAddingCategory(false);
    setNewCatName('');
    setNewCatBadge('');
    setNewCatDesc('');
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAddPortBatch = () => {
    const newPorts: NetworkPort[] = [];
    const startIndex = ports.length + 1;

    for (let i = 0; i < batchCount; i++) {
      const portNum = startIndex + i;
      const portName = `${batchPrefix}${portNum}`;
      newPorts.push({
        id: `port-${Date.now()}-${i}`,
        name: portName,
        type: batchMediaType === 'fiber' ? (batchSpeedMode === '10000M' ? 'sfp_10g' : batchSpeedMode === '25G' ? 'sfp_25g' : 'sfp_1g') :
              batchMediaType === 'pon' ? 'pon_gpon' :
              batchMediaType === 'voice' ? 'voice_fxs' : 'copper_1g',
        mediaType: batchMediaType,
        speedMode: batchSpeedMode,
        duplex: 'full',
        status: 'up',
      });
    }

    setPorts([...ports, ...newPorts]);
  };

  const handleRemovePort = (portId: string) => {
    setPorts(ports.filter(p => p.id !== portId));
  };

  const handleUpdatePort = (index: number, updated: Partial<NetworkPort>) => {
    const copy = [...ports];
    copy[index] = { ...copy[index], ...updated };
    setPorts(copy);
  };

  // Save the custom asset from scratch
  const handleSaveActiveAsset = () => {
    if (!name.trim()) {
      alert('Por favor, informe o Nome do Ativo de Rede.');
      return;
    }

    const cat = selectedCategoryObj;
    const resolvedType = cat.defaultType || 'switch_core';
    const resolvedCategory = cat.defaultCategory || 'isp_core';

    const fullLocation = parentRackId 
      ? `${allNodes.find(n => n.id === parentRackId)?.name || 'Rack'} (${rackPosition})`
      : (location || 'POP Central');

    const newNode: Partial<NetworkNode> = {
      name: name.trim(),
      hostname: hostname.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`,
      type: resolvedType,
      category: resolvedCategory,
      vendor: vendor.trim() || 'Genérico',
      model: model.trim() || name.trim(),
      folderId: folderId || undefined,
      location: fullLocation,
      parentRackId: parentRackId || undefined,
      powerSourceNodeId: powerSourceNodeId || undefined,
      rackUnits,
      rackPosition: rackPosition || 'U1',
      serialNumber: serialNumber.trim() || undefined,
      managementIp: managementIp.trim() || undefined,
      ip: managementIp.trim() || '192.168.1.1',
      mac: mac.trim() || undefined,
      powerSupply,
      powerConsumptionWatts,
      osType,
      notes: [
        notes.trim(),
        netmaskCidr ? `Máscara: ${netmaskCidr}` : '',
        gatewayIp ? `Gateway: ${gatewayIp}` : '',
        accessProtocols ? `Acesso: ${accessProtocols}` : '',
        hardwareCpuRam ? `Hardware: ${hardwareCpuRam}` : '',
        throughputCapacity ? `Capacidade: ${throughputCapacity}` : '',
      ].filter(Boolean).join('\n'),
      ports,
      status: 'online',
      isCustomAsset: true,
      isPassive: false, // Strict Active Device
      customImageUrl: customImageUrl.trim() || undefined,
      imageUrl: customImageUrl.trim() || undefined,
    };

    // Save as reusable template if checked
    if (saveAsTemplate) {
      const templateItem: SavedAssetTemplate = {
        id: `tpl-${Date.now()}`,
        name: name.trim(),
        categoryName: cat.name,
        deviceType: resolvedType,
        category: resolvedCategory,
        vendor: vendor.trim() || 'Genérico',
        model: model.trim() || name.trim(),
        rackUnits,
        powerSupply,
        powerConsumptionWatts,
        osType,
        defaultPorts: JSON.parse(JSON.stringify(ports)),
        notes: notes.trim(),
        customImageUrl: customImageUrl.trim() || undefined,
        createdAt: new Date().toISOString(),
        isCustomTemplate: true,
      };

      const updatedTpls = [templateItem, ...savedTemplates.filter(t => t.name !== templateItem.name)];
      setSavedTemplates(updatedTpls);
      safeSetItem('operafacil_saved_asset_templates', updatedTpls);
      supabaseService.saveNetworkAssetTemplate(templateItem).catch(console.error);
    }

    onAddDevice(newNode);
    onClose();
  };

  // Copy / Instantiate from Template Library
  const handleInstantiateFromTemplate = (tpl: SavedAssetTemplate | typeof DEVICE_CATALOG[0]) => {
    const isCustom = 'isCustomTemplate' in tpl && tpl.isCustomTemplate;
    const cat = categories.find(c => c.defaultType === tpl.type) || categories[0];

    const fullLocation = parentRackId 
      ? `${allNodes.find(n => n.id === parentRackId)?.name || 'Rack'} (${rackPosition})`
      : (location || 'POP Central');

    const newNode: Partial<NetworkNode> = {
      name: tpl.name,
      hostname: `${tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`,
      type: tpl.type as DeviceType,
      category: tpl.category as DeviceCategory,
      vendor: tpl.vendor,
      model: tpl.model,
      folderId: folderId || defaultFolderId || folders[0]?.id || undefined,
      location: fullLocation,
      parentRackId: parentRackId || undefined,
      powerSourceNodeId: powerSourceNodeId || undefined,
      rackUnits: tpl.rackUnits || 1,
      rackPosition: rackPosition || 'U42',
      powerSupply: tpl.powerSupply || 'Redundante AC/DC',
      powerConsumptionWatts: (tpl as any).powerConsumptionWatts || 45,
      osType: tpl.osType || 'generic',
      ports: JSON.parse(JSON.stringify(tpl.defaultPorts || [])),
      status: 'online',
      notes: (tpl as any).description || (tpl as any).notes || '',
      isCustomAsset: true,
      isPassive: false,
      customImageUrl: (tpl as any).customImageUrl,
      imageUrl: (tpl as any).customImageUrl,
    };

    onAddDevice(newNode);
    onClose();
  };

  // Load template into scratch form for editing
  const handleLoadTemplateIntoForm = (tpl: SavedAssetTemplate | typeof DEVICE_CATALOG[0]) => {
    setName(tpl.name);
    setModel(tpl.model);
    setVendor(tpl.vendor);
    setRackUnits(tpl.rackUnits || 1);
    if (tpl.powerSupply) setPowerSupply(tpl.powerSupply);
    if (tpl.osType) setOsType(tpl.osType);
    if (tpl.defaultPorts) setPorts(JSON.parse(JSON.stringify(tpl.defaultPorts)));
    if ((tpl as any).notes || (tpl as any).description) setNotes((tpl as any).notes || (tpl as any).description);
    if ((tpl as any).customImageUrl) setCustomImageUrl((tpl as any).customImageUrl);

    const matchingCat = categories.find(c => c.defaultType === tpl.type);
    if (matchingCat) setSelectedCategoryId(matchingCat.id);

    setActiveTab('create_scratch');
  };

  const handleDeleteCustomTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updated);
    safeSetItem('operafacil_saved_asset_templates', updated);
    supabaseService.deleteNetworkAssetTemplate(templateId).catch(console.error);
  };

  // Only user's saved models (NO hardcoded pre-configured items)
  const allAvailableTemplates = savedTemplates.map(t => ({
    ...t,
    type: t.deviceType,
  }));

  const filteredTemplates = allAvailableTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.model.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          t.vendor.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCat = templateCatFilter === 'all' || t.categoryName?.toLowerCase().includes(templateCatFilter.toLowerCase()) || t.deviceType === templateCatFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 select-none">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Cadastro Técnico de Ativo de Rede
                </h2>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-black border border-orange-200">
                  Telecom NOC • 100% Ativos
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Crie um novo ativo técnico do zero especificando todas as portas, potência, IP e chassi, ou copie um modelo da biblioteca.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Quick Context Bar */}
        <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('create_scratch')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'create_scratch'
                  ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-400/50'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              Criar Ativo do Zero (Especificação Completa)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-400/50'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4 text-orange-500" />
              Biblioteca de Modelos Pré-Cadastrados ({allAvailableTemplates.length})
            </button>
          </div>

          {/* Destination Folder Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Destino:</span>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-orange-200 bg-orange-50 text-orange-950 focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  📁 {f.parentId ? ' └─ ' : ''}{f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
          {activeTab === 'create_scratch' ? (
            <div className="space-y-6">
              {/* 1. CLASSIFICAÇÃO DO ATIVO (Com Botão de Nova Categoria) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/70 to-amber-50/70 border border-orange-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-950">
                      1. Classificação do Ativo de Rede
                    </label>
                    <p className="text-[11px] text-slate-600">
                      Selecione o tipo de função do ativo na sua rede ou adicione uma nova categoria personalizada.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Nova Categoria
                  </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group ${
                          isSelected
                            ? 'border-orange-500 bg-orange-600 text-white shadow-md'
                            : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-orange-800 text-orange-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {cat.badge}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-orange-600'}`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Inline New Category Form Modal / Banner */}
                {isAddingCategory && (
                  <form onSubmit={handleCreateNewCategory} className="p-3 bg-white rounded-xl border-2 border-orange-400 shadow-lg space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-orange-600" />
                        Cadastrar Nova Categoria de Ativo:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Nome da Categoria:</label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Ex: Firewall UTM, Balanceador SD-WAN, Sensor IoT"
                          autoFocus
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:border-orange-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Etiqueta / Sigla (Badge):</label>
                        <input
                          type="text"
                          value={newCatBadge}
                          onChange={(e) => setNewCatBadge(e.target.value)}
                          placeholder="Ex: UTM / VPN, IoT, Core"
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 focus:border-orange-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Descrição Técnica:</label>
                      <input
                        type="text"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        placeholder="Ex: Equipamento de segurança e filtragem de tráfego de borda"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-orange-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Salvar Categoria
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 2. DADOS PRINCIPAIS & IDENTIFICAÇÃO DO ATIVO */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-500" />
                  2. Identificação Principal & Modelo Comercial
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nome / Identificação do Ativo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Concentrador PPPoE 01, Switch Core Huawei S6730, OLT GPON 01..."
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Hostname / DNS
                    </label>
                    <input
                      type="text"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                      placeholder="Ex: bng01.pop.local"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Fabricante / Marca
                    </label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Ex: MikroTik, Huawei, Datacom, Cisco, Intelbras, Dell..."
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Modelo Comercial / Part Number
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: CCR2004-1G-12S+2XS, MA5800-X7..."
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Número de Série (S/N)
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="Ex: SN1234567890ABC"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3. LOCALIZAÇÃO FÍSICA & INSTALAÇÃO NO RACK 19" */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Box className="w-4 h-4 text-orange-500" />
                  3. Instalação Física & Posicionamento no Rack 19"
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      📦 Instalado Dentro do Rack:
                    </label>
                    <select
                      value={parentRackId}
                      onChange={(e) => {
                        setParentRackId(e.target.value);
                        if (e.target.value) {
                          const r = allNodes.find(n => n.id === e.target.value);
                          if (r?.folderId) setFolderId(r.folderId);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-orange-200 bg-orange-50/70 text-slate-900 cursor-pointer"
                    >
                      <option value="">Nenhum (Dispositivo Avulso no POP)</option>
                      {existingRacks.map(r => (
                        <option key={r.id} value={r.id}>
                          🏢 {r.name} ({r.totalRackCapacityU || r.rackUnits || 44}U)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Posição no Rack (Slot U):
                    </label>
                    <input
                      type="text"
                      value={rackPosition}
                      onChange={(e) => setRackPosition(e.target.value.toUpperCase())}
                      placeholder="Ex: U42, U40, U38..."
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-orange-600 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Altura do Chassi (Unidades U):
                    </label>
                    <select
                      value={rackUnits}
                      onChange={(e) => setRackUnits(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white cursor-pointer"
                    >
                      <option value={1}>1U (Padrão 19 Polegadas)</option>
                      <option value={2}>2U</option>
                      <option value={3}>3U</option>
                      <option value={4}>4U</option>
                      <option value={6}>6U</option>
                      <option value={7}>7U</option>
                      <option value={11}>11U (Chassi OLT Grande)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Fonte Alimentadora / PDU:
                    </label>
                    <select
                      value={powerSourceNodeId}
                      onChange={(e) => setPowerSourceNodeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white cursor-pointer"
                    >
                      <option value="">Rede Elétrica Direta</option>
                      {existingPowerSources.map(p => (
                        <option key={p.id} value={p.id}>
                          ⚡ {p.name} ({p.model})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. ESPECIFICAÇÕES DE REDE & GERENCIAMENTO */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Network className="w-4 h-4 text-orange-500" />
                  4. Configurações de Rede, IP & Sistema Operacional
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Sistema Operacional (SO)
                    </label>
                    <select
                      value={osType}
                      onChange={(e) => setOsType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white cursor-pointer"
                    >
                      <option value="mikrotik_routeros">MikroTik RouterOS v7/v6</option>
                      <option value="huawei_vrp">Huawei VRP</option>
                      <option value="cisco_ios">Cisco IOS / IOS-XR</option>
                      <option value="linux">Linux / Debian / Ubuntu Server</option>
                      <option value="generic">Firmware Proprietário / Genérico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      IP de Gerência Principal
                    </label>
                    <input
                      type="text"
                      value={managementIp}
                      onChange={(e) => setManagementIp(e.target.value)}
                      placeholder="Ex: 10.100.1.1 ou 192.168.88.1"
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-600 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Máscara / Gateway
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={netmaskCidr}
                        onChange={(e) => setNetmaskCidr(e.target.value)}
                        placeholder="/24"
                        className="w-20 px-2.5 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white text-center"
                      />
                      <input
                        type="text"
                        value={gatewayIp}
                        onChange={(e) => setGatewayIp(e.target.value)}
                        placeholder="Gateway: 10.100.1.254"
                        className="flex-1 px-2.5 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Endereço MAC de Gerência
                    </label>
                    <input
                      type="text"
                      value={mac}
                      onChange={(e) => setMac(e.target.value)}
                      placeholder="Ex: 48:8F:5A:12:34:56"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 5. ENERGIA & HARDWARE */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  5. Especificações Elétricas, Térmicas & Hardware
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Alimentação Elétrica
                    </label>
                    <select
                      value={powerSupply}
                      onChange={(e) => setPowerSupply(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white cursor-pointer"
                    >
                      <option value="Redundante AC/DC">Fonte Redundante Dupla (AC/DC)</option>
                      <option value="AC 110/220V Bivolt">AC 110/220V Bivolt</option>
                      <option value="DC -48V Telecom">DC -48V Telecom</option>
                      <option value="PoE 802.3af/at/bt">PoE in (802.3af/at/bt)</option>
                      <option value="DC 12V Adaptador">DC 12V Adaptador P4</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Consumo Máximo (Watts)
                    </label>
                    <input
                      type="number"
                      value={powerConsumptionWatts}
                      onChange={(e) => setPowerConsumptionWatts(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-600 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Processador / Memória RAM
                    </label>
                    <input
                      type="text"
                      value={hardwareCpuRam}
                      onChange={(e) => setHardwareCpuRam(e.target.value)}
                      placeholder="Ex: 4 Cores 1.7GHz / 4GB RAM"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Capacidade de Comutação / Throughput
                    </label>
                    <input
                      type="text"
                      value={throughputCapacity}
                      onChange={(e) => setThroughputCapacity(e.target.value)}
                      placeholder="Ex: 120 Gbps / 89 Mpps"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 6. GERENCIADOR DE PORTAS & INTERFACES */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Cable className="w-4 h-4 text-orange-500" />
                    6. Portas, Interfaces & Módulos Ópticos ({ports.length} Portas)
                  </h3>

                  {/* Quick Port Presets */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const newP: NetworkPort[] = [];
                        for (let i = 1; i <= 24; i++) {
                          newP.push({ id: `p-ge-${i}-${Date.now()}`, name: `ge0/${i}`, type: 'copper_1g', mediaType: 'ethernet', speedMode: '1000M', duplex: 'full', status: 'up' });
                        }
                        setPorts([...ports, ...newP]);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      + 24x 1G RJ45
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newP: NetworkPort[] = [];
                        for (let i = 1; i <= 4; i++) {
                          newP.push({ id: `p-10g-${i}-${Date.now()}`, name: `sfp-sfpplus${i}`, type: 'sfp_10g', mediaType: 'fiber', speedMode: '10000M', duplex: 'full', status: 'up' });
                        }
                        setPorts([...ports, ...newP]);
                      }}
                      className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      + 4x 10G SFP+
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newP: NetworkPort[] = [];
                        for (let i = 1; i <= 16; i++) {
                          newP.push({ id: `p-pon-${i}-${Date.now()}`, name: `gpon 0/1/${i}`, type: 'pon_gpon', mediaType: 'pon', speedMode: '2.5G', duplex: 'full', status: 'up' });
                        }
                        setPorts([...ports, ...newP]);
                      }}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      + 16x GPON
                    </button>
                  </div>
                </div>

                {/* Batch Port Adder Bar */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">Adicionar em Lote:</span>
                    <input
                      type="number"
                      min={1}
                      max={48}
                      value={batchCount}
                      onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-center"
                    />
                    <input
                      type="text"
                      value={batchPrefix}
                      onChange={(e) => setBatchPrefix(e.target.value)}
                      placeholder="Prefixo (ex: ether, sfp+)"
                      className="w-28 px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <select
                      value={batchMediaType}
                      onChange={(e) => setBatchMediaType(e.target.value as PortMediaType)}
                      className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white cursor-pointer"
                    >
                      <option value="ethernet">Ethernet (Cobre RJ45)</option>
                      <option value="fiber">Fibra Óptica (SFP/SFP+)</option>
                      <option value="pon">Porta PON (GPON/EPON)</option>
                      <option value="voice">Telefonia FXS/FXO</option>
                      <option value="power_ac">Tomada Elétrica PDU</option>
                    </select>
                    <select
                      value={batchSpeedMode}
                      onChange={(e) => setBatchSpeedMode(e.target.value as PortSpeedMode)}
                      className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white cursor-pointer"
                    >
                      <option value="1000M">1 Gbps (1000M)</option>
                      <option value="10000M">10 Gbps (10G SFP+)</option>
                      <option value="25G">25 Gbps (SFP28)</option>
                      <option value="40G">40 Gbps (QSFP+)</option>
                      <option value="100G">100 Gbps (QSFP28)</option>
                      <option value="2.5G">2.5G PON</option>
                      <option value="100M">100 Mbps Fast</option>
                      <option value="auto">Auto-negotiate</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPortBatch}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-400" />
                    Gerar Portas
                  </button>
                </div>

                {/* Ports List Table */}
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Nome da Porta</th>
                        <th className="p-2.5">Mídia</th>
                        <th className="p-2.5">Velocidade</th>
                        <th className="p-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ports.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2">
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => handleUpdatePort(idx, { name: e.target.value })}
                              className="px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white w-full max-w-xs"
                            />
                          </td>
                          <td className="p-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              p.mediaType === 'fiber' ? 'bg-cyan-100 text-cyan-800' :
                              p.mediaType === 'pon' ? 'bg-blue-100 text-blue-800' :
                              p.mediaType === 'voice' ? 'bg-pink-100 text-pink-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {p.mediaType?.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-[11px] font-bold text-slate-700">
                            {p.speedMode || '1000M'}
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemovePort(p.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover Porta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7. IMAGEM PNG PERSONALIZADA & OBSERVAÇÕES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PNG Image Upload */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-orange-600" />
                      Imagem PNG no Mapa
                    </span>
                    {customImageUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomImageUrl('')}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
                      {customImageUrl ? (
                        <img src={customImageUrl} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <Server className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <label className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Carregar Imagem PNG do Ativo...
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Technical Notes */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Anotações Técnicas / VLANs de Acesso
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: VLAN 100 Trânsito, VLAN 200 CGNAT, Senha padrão alterada no TACACS..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* 8. AUTO-SAVE TEMPLATE CHECKBOX */}
              <div className="p-3.5 bg-orange-50/80 rounded-2xl border border-orange-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="save_template_chk"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="save_template_chk" className="text-xs font-bold text-orange-950 cursor-pointer">
                    Salvar este modelo na <strong>Biblioteca de Modelos Pré-Cadastrados</strong> para reutilizar em outros POPs futuramente.
                  </label>
                </div>
                <Bookmark className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          ) : (
            /* TAB 2: BIBLIOTECA DE MODELOS PRÉ-CADASTRADOS */
            <div className="space-y-4">
              {/* Header & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Pesquisar por modelo, fabricante ou função..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setTemplateCatFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      templateCatFilter === 'all'
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    Todos ({allAvailableTemplates.length})
                  </button>
                  {savedTemplates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTemplateCatFilter('Personalizado')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        templateCatFilter === 'Personalizado'
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      ⭐ Meus Modelos ({savedTemplates.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Templates or Empty State */}
              {filteredTemplates.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-3 my-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-xs">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    Nenhum Modelo Pré-Cadastrado na Biblioteca
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Ao cadastrar ativos técnicos na aba <strong>"Criar Ativo do Zero"</strong>, marque a opção de salvar o modelo. Ele ficará guardado aqui para você duplicar e instanciar com 1 clique sempre que precisar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create_scratch')}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Meu Primeiro Ativo do Zero
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredTemplates.map((tpl, idx) => {
                    const isUserSaved = 'isCustomTemplate' in tpl && tpl.isCustomTemplate;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group relative bg-orange-50/30 border-orange-300 hover:border-orange-500 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {tpl.vendor}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-900 border border-orange-200">
                                ⭐ Salvo por Você
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {tpl.rackUnits || 1}U
                              </span>
                            </div>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                            {tpl.name}
                          </h4>
                          <p className="text-xs font-mono font-bold text-slate-500">
                            {tpl.model}
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {(tpl as any).notes || (tpl as any).description || 'Ativo de alta performance para operação telecom.'}
                          </p>

                          {/* Ports Badges */}
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                            {(tpl.defaultPorts || []).slice(0, 4).map((p, pIdx) => (
                              <span key={pIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                                {p.name} ({p.speedMode || p.type})
                              </span>
                            ))}
                            {(tpl.defaultPorts || []).length > 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold">
                                +{(tpl.defaultPorts || []).length - 4} portas
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleInstantiateFromTemplate(tpl)}
                            className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copiar & Usar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadTemplateIntoForm(tpl)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Carregar no Formulário para Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Excluir este Modelo Salvo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>

          {activeTab === 'create_scratch' && (
            <button
              type="button"
              onClick={handleSaveActiveAsset}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar & Adicionar Ativo ao Rack / POP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
