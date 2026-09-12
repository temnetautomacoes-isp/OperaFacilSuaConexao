import React, { useState } from 'react';
import { 
  Server, 
  Router, 
  Network, 
  Radio, 
  Wifi, 
  HardDrive, 
  Layers, 
  Cloud, 
  Cpu, 
  Shield, 
  Monitor, 
  Plus, 
  Search,
  Box,
  Zap,
  Cable,
  PhoneCall,
  BatteryCharging
} from 'lucide-react';
import { DEVICE_CATALOG } from './initialNetworkData';
import { DeviceCategory, NetworkNode } from '../../../types/network';

interface DevicePaletteProps {
  onAddDevice: (stencil: typeof DEVICE_CATALOG[0]) => void;
  selectedCableType: string;
  onSelectCableType: (cableType: string) => void;
  isConnectingMode: boolean;
  onToggleConnectingMode: () => void;
}

export const DevicePalette: React.FC<DevicePaletteProps> = ({
  onAddDevice,
  selectedCableType,
  onSelectCableType,
  isConnectingMode,
  onToggleConnectingMode,
}) => {
  const [activeCategory, setActiveCategory] = useState<DeviceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all' as const, label: 'Todos' },
    { id: 'isp_core' as const, label: 'Core / BGP' },
    { id: 'access_ftth' as const, label: 'Acesso FTTH' },
    { id: 'telephony_voip' as const, label: 'Centrais Telefônicas / PABX' },
    { id: 'rack_power' as const, label: 'Energia / Retificadoras' },
    { id: 'wireless' as const, label: 'Wireless' },
    { id: 'enterprise' as const, label: 'Empresarial' },
    { id: 'passive' as const, label: 'Passivos' },
  ];

  const cableTypes = [
    { id: 'fiber_sm', label: 'Fibra Monomodo', color: 'bg-blue-500', desc: 'SC/APC - 1310/1490nm' },
    { id: 'fiber_drop', label: 'Cabo Drop FTTH', color: 'bg-purple-600', desc: 'Atendimento 1FO' },
    { id: 'utp_cat6', label: 'UTP Cat6 (10G)', color: 'bg-emerald-500', desc: 'RJ45 Gigabit' },
    { id: 'wireless_ptp', label: 'Enlace Rádio PTP', color: 'bg-amber-500', desc: '5GHz / 60GHz' },
  ];

  const filteredDevices = DEVICE_CATALOG.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router_bgp':
      case 'router_cgnat':
        return <Router className="w-5 h-5 text-orange-500" />;
      case 'olt_gpon':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'switch_core':
      case 'switch_access':
        return <Network className="w-5 h-5 text-indigo-500" />;
      case 'telephony_pabx':
        return <PhoneCall className="w-5 h-5 text-pink-500" />;
      case 'rectifier_power':
        return <BatteryCharging className="w-5 h-5 text-emerald-500" />;
      case 'patch_panel_dio':
        return <Layers className="w-5 h-5 text-cyan-500" />;
      case 'onu_ont':
      case 'wifi_router':
        return <Wifi className="w-5 h-5 text-emerald-500" />;
      case 'radio_ptp':
        return <Radio className="w-5 h-5 text-amber-500" />;
      case 'server_datacenter':
        return <Server className="w-5 h-5 text-purple-500" />;
      case 'pc_workstation':
        return <Monitor className="w-5 h-5 text-cyan-500" />;
      case 'cto':
      case 'ceo':
      case 'splitter':
        return <Layers className="w-5 h-5 text-slate-500" />;
      case 'rack_19':
        return <Box className="w-5 h-5 text-slate-600" />;
      case 'internet_cloud':
        return <Cloud className="w-5 h-5 text-sky-500" />;
      default:
        return <HardDrive className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden select-none shrink-0 shadow-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-500" />
            Biblioteca de Stencils
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800">
            {DEVICE_CATALOG.length} Dispositivos
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar OLT, BGP, Switch, ONU..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
          />
        </div>
      </div>

      {/* Cable Tool Selector (Draw.io connector tool) */}
      <div className="p-3 border-b border-slate-100 bg-orange-50/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
            <Cable className="w-3.5 h-3.5 text-orange-600" />
            Ferramenta de Cabos
          </span>
          <button
            type="button"
            onClick={onToggleConnectingMode}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              isConnectingMode
                ? 'bg-orange-600 text-white shadow-xs animate-pulse'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {isConnectingMode ? 'Conectando...' : 'Conectar Cabos'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {cableTypes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCableType(c.id)}
              className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                selectedCableType === c.id
                  ? 'bg-white border-orange-400 shadow-2xs ring-1 ring-orange-400'
                  : 'bg-white/60 hover:bg-white border-slate-200'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${c.color} shrink-0`} />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{c.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="p-2 border-b border-slate-100 flex gap-1 overflow-x-auto no-scrollbar bg-slate-50/50">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-orange-500 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Device List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredDevices.map((item) => (
          <div
            key={item.type}
            onClick={() => onAddDevice(item)}
            className="p-2.5 rounded-2xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 bg-white transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
            title="Clique para adicionar ao canvas"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getDeviceIcon(item.type)}
                </div>
                <div className="overflow-hidden">
                  <h5 className="font-bold text-xs text-slate-800 group-hover:text-orange-600 truncate transition-colors">
                    {item.name}
                  </h5>
                  <p className="text-[10px] text-slate-500 truncate">{item.vendor} • {item.model}</p>
                </div>
              </div>

              <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
