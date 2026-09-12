import React, { useState } from 'react';
import { 
  X, 
  Box, 
  Server, 
  Router, 
  Network, 
  Zap, 
  BatteryCharging, 
  PhoneCall, 
  Layers, 
  Power, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Sliders,
  Flame,
  ArrowDownUp
} from 'lucide-react';
import { NetworkNode } from '../../../types/network';

interface RackElevationModalProps {
  rackNode: NetworkNode | null;
  allNodes: NetworkNode[];
  onUpdateNode: (node: NetworkNode) => void;
  onAddNewAssetToSlot?: (slotU: number) => void;
  onClose: () => void;
}

export const RackElevationModal: React.FC<RackElevationModalProps> = ({
  rackNode,
  allNodes,
  onUpdateNode,
  onAddNewAssetToSlot,
  onClose,
}) => {
  if (!rackNode) return null;

  const totalUnits = rackNode.totalRackCapacityU || rackNode.rackUnits || 44;
  const isWallRack = rackNode.type === 'rack_wall' || rackNode.rackType === 'wall';

  // Find all devices mounted in this rack
  const mountedNodes = allNodes.filter(n => n.parentRackId === rackNode.id || n.location?.includes(rackNode.name));
  
  // Available nodes not mounted in this rack (excluding racks themselves)
  const availableNodesToMount = allNodes.filter(n => 
    n.id !== rackNode.id && 
    n.type !== 'rack_floor' && 
    n.type !== 'rack_wall' && 
    n.type !== 'rack_19' &&
    n.parentRackId !== rackNode.id
  );

  const [selectedSlotU, setSelectedSlotU] = useState<number | null>(null);
  const [deviceToMountId, setDeviceToMountId] = useState<string>('');

  // Calculate total power consumption
  const totalPowerWatts = mountedNodes.reduce((sum, n) => sum + (n.powerConsumptionWatts || 35), 0);
  const totalOccupiedU = mountedNodes.reduce((sum, n) => sum + (n.rackUnits || 1), 0);
  const occupationPercent = Math.min(100, Math.round((totalOccupiedU / totalUnits) * 100));

  // Find mounted node at unit U
  const getMountedNodeAtU = (u: number): NetworkNode | undefined => {
    return mountedNodes.find(n => {
      const posStr = n.rackPosition?.toUpperCase().replace('U', '') || '';
      const startU = parseInt(posStr) || -1;
      const height = n.rackUnits || 1;
      return startU <= u && u < startU + height;
    });
  };

  const handleMountDevice = (u: number) => {
    if (!deviceToMountId) return;
    const targetDevice = allNodes.find(n => n.id === deviceToMountId);
    if (!targetDevice) return;

    const updated: NetworkNode = {
      ...targetDevice,
      parentRackId: rackNode.id,
      rackPosition: `U${u}`,
      location: `${rackNode.name} (U${u})`,
    };

    onUpdateNode(updated);
    setSelectedSlotU(null);
    setDeviceToMountId('');
  };

  const handleUnmountDevice = (deviceId: string) => {
    const targetDevice = allNodes.find(n => n.id === deviceId);
    if (!targetDevice) return;

    const updated: NetworkNode = {
      ...targetDevice,
      parentRackId: undefined,
      rackPosition: undefined,
      location: 'POP Central (Desmontado)',
    };

    onUpdateNode(updated);
  };

  const getDeviceColor = (type: string) => {
    switch (type) {
      case 'router_bgp':
      case 'router_cgnat':
        return 'border-orange-500 bg-orange-950/80 text-orange-200';
      case 'olt_gpon':
        return 'border-blue-500 bg-blue-950/80 text-blue-200';
      case 'switch_core':
      case 'switch_access':
        return 'border-indigo-500 bg-indigo-950/80 text-indigo-200';
      case 'telephony_pabx':
        return 'border-pink-500 bg-pink-950/80 text-pink-200';
      case 'ups_nobreak':
      case 'rectifier_power':
        return 'border-emerald-500 bg-emerald-950/80 text-emerald-200';
      case 'pdu_power_strip':
      case 'electrical_outlet':
        return 'border-amber-500 bg-amber-950/80 text-amber-200';
      case 'patch_panel_rj45':
      case 'dio_fiber':
        return 'border-cyan-500 bg-cyan-950/80 text-cyan-200';
      case 'server_datacenter':
        return 'border-purple-500 bg-purple-950/80 text-purple-200';
      default:
        return 'border-slate-600 bg-slate-800 text-slate-200';
    }
  };

  // Generate slots array from top (totalUnits) down to 1
  const slots: number[] = [];
  for (let i = totalUnits; i >= 1; i--) {
    slots.push(i);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Elevação de Rack 19": {rackNode.name}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-950 text-orange-400 border border-orange-800">
                  {isWallRack ? 'Rack de Parede' : 'Rack de Chão'} ({totalUnits}U)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualização vertical em tempo real de ativos, passivos, réguas PDU, Nobreaks e ocupação de slots.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rack Stats Toolbar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Ocupação de Espaço:</span>
              <span className="font-bold font-mono text-orange-400">
                {totalOccupiedU} de {totalUnits}U ({occupationPercent}%)
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Consumo Térmico / Elétrico:</span>
              <span className="font-bold font-mono text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                {totalPowerWatts} Watts Total
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Equipamentos Instalados:</span>
              <span className="font-bold font-mono text-cyan-400">
                {mountedNodes.length} Unidades
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Mount helper */}
            {availableNodesToMount.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Instalar Existente:</span>
                <select
                  value={deviceToMountId}
                  onChange={(e) => setDeviceToMountId(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
                >
                  <option value="">Selecione Equipamento...</option>
                  {availableNodesToMount.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.model} - {n.rackUnits || 1}U)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onAddNewAssetToSlot && (
              <button
                type="button"
                onClick={() => onAddNewAssetToSlot(slots[0] || 42)}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Novo Ativo no Rack
              </button>
            )}
          </div>
        </div>

        {/* Body / 19" Rack Rails View */}
        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          {/* Rack Chassis Frame */}
          <div className="flex-1 max-w-2xl mx-auto bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-2xl p-4 flex flex-col space-y-1 select-none">
            {/* Top Roof of Rack */}
            <div className="h-6 bg-slate-800 rounded-t-lg border-b border-slate-700 flex items-center justify-between px-4 text-[10px] font-mono text-slate-400 uppercase">
              <span>◄ TRILHO ESQUERDO 19"</span>
              <span className="font-bold text-orange-400">EXAUSTÃO & CABEAMENTO TOPO</span>
              <span>TRILHO DIREITO 19" ►</span>
            </div>

            {/* Slots List (from totalUnits down to 1) */}
            <div className="space-y-1">
              {slots.map((u) => {
                const nodeAtU = getMountedNodeAtU(u);
                const isHeadOfMultiU = nodeAtU && (parseInt(nodeAtU.rackPosition?.replace('U', '') || '1') === u || !nodeAtU.rackPosition);

                // If part of multi-U but not the head, skip rendering individual slot or render sub-segment
                if (nodeAtU && !isHeadOfMultiU) {
                  return null; // Merged into head slot
                }

                const nodeHeight = nodeAtU ? (nodeAtU.rackUnits || 1) : 1;
                const slotHeightPx = Math.max(38, nodeHeight * 36);

                return (
                  <div
                    key={u}
                    style={{ height: nodeAtU ? `${slotHeightPx}px` : '36px' }}
                    className={`rounded-xl border transition-all flex items-center px-3 gap-3 relative ${
                      nodeAtU
                        ? `${getDeviceColor(nodeAtU.type)} shadow-md`
                        : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Unit Number Marker */}
                    <div className="w-8 shrink-0 text-center font-mono font-black text-xs text-slate-500 border-r border-slate-800/60 pr-2">
                      U{u}
                    </div>

                    {/* Slot Content */}
                    {nodeAtU ? (
                      <div className="flex-1 flex items-center justify-between gap-3 overflow-hidden">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center shrink-0">
                            {nodeAtU.type.includes('router') ? <Router className="w-4 h-4 text-orange-400" /> :
                             nodeAtU.type.includes('olt') ? <Zap className="w-4 h-4 text-blue-400" /> :
                             nodeAtU.type.includes('switch') ? <Network className="w-4 h-4 text-indigo-400" /> :
                             nodeAtU.type.includes('pabx') ? <PhoneCall className="w-4 h-4 text-pink-400" /> :
                             nodeAtU.type.includes('ups') || nodeAtU.type.includes('power') ? <BatteryCharging className="w-4 h-4 text-emerald-400" /> :
                             <Server className="w-4 h-4 text-purple-400" />}
                          </div>

                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate text-white">
                                {nodeAtU.name}
                              </span>
                              <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.2 rounded bg-black/40">
                                {nodeAtU.model}
                              </span>
                              {nodeAtU.rackUnits && nodeAtU.rackUnits > 1 && (
                                <span className="text-[9px] font-bold px-1 rounded bg-orange-900/60 text-orange-300">
                                  {nodeAtU.rackUnits}U
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                              <span>IP: {nodeAtU.managementIp || nodeAtU.ip}</span>
                              <span>• {nodeAtU.ports.length} Portas</span>
                              <span>• {nodeAtU.powerConsumptionWatts || 35}W</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUnmountDevice(nodeAtU.id)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer"
                            title="Desinstalar do Rack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty Slot */
                      <div className="flex-1 flex items-center justify-between text-xs text-slate-600">
                        <span className="font-mono text-[11px] italic text-slate-500">-- Slot Vazio --</span>
                        <div className="flex items-center gap-2">
                          {onAddNewAssetToSlot && (
                            <button
                              type="button"
                              onClick={() => onAddNewAssetToSlot(u)}
                              className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-orange-600 text-slate-400 hover:text-white font-bold text-[10px] flex items-center gap-1 border border-slate-700 hover:border-orange-500 transition-colors cursor-pointer"
                              title={`Criar novo ativo e instalar no slot U${u}`}
                            >
                              <Plus className="w-3 h-3" />
                              Novo Ativo U{u}
                            </button>
                          )}
                          {deviceToMountId && (
                            <button
                              type="button"
                              onClick={() => handleMountDevice(u)}
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              Instalar Aqui
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Base of Rack */}
            <div className="h-6 bg-slate-800 rounded-b-lg border-t border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400 uppercase">
              <span>BASE DO RACK / RODÍZIOS / ATERRAMENTO SPDA</span>
            </div>
          </div>

          {/* Right Panel: Mounted Devices Summary */}
          <div className="w-80 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-500" />
                Mapa de Ocupação do Rack
              </h3>

              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {mountedNodes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 text-center">
                    Nenhum dispositivo montado neste rack ainda. Selecione um equipamento no topo e clique em "Instalar Aqui" no slot desejado.
                  </p>
                ) : (
                  mountedNodes.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[170px]">{n.name}</span>
                        <span className="font-mono font-bold text-orange-400 text-[10px] bg-orange-950 px-1.5 py-0.5 rounded border border-orange-900">
                          {n.rackPosition || '1U'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{n.vendor} • {n.model}</span>
                        <span>{n.powerConsumptionWatts || 35}W</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>RACK:</span>
                <span className="text-white font-bold">{rackNode.name}</span>
              </div>
              <div className="flex justify-between">
                <span>LOCAL:</span>
                <span className="text-white font-bold">{rackNode.location}</span>
              </div>
              <div className="flex justify-between">
                <span>CAPACIDADE:</span>
                <span className="text-orange-400 font-bold">{totalUnits}U (Padrão 19 Polegadas)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
