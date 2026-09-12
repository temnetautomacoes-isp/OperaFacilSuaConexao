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
  ArrowDownUp,
  AlertTriangle,
  Activity,
  HardDrive,
  SlidersHorizontal,
  Info,
  Terminal,
  Search,
  Check,
  GripVertical,
  MoveVertical,
  Edit3,
  Save,
  Upload,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { NetworkNode, NetworkFolder } from '../../../types/network';

interface RackElevationModalProps {
  rackNode: NetworkNode | null;
  allNodes: NetworkNode[];
  folders?: NetworkFolder[];
  onUpdateNode: (node: NetworkNode) => void;
  onAddNewAssetToSlot?: (slotU: number) => void;
  onClose: () => void;
}

export const RackElevationModal: React.FC<RackElevationModalProps> = ({
  rackNode,
  allNodes,
  folders = [],
  onUpdateNode,
  onAddNewAssetToSlot,
  onClose,
}) => {
  if (!rackNode) return null;

  const totalUnits = rackNode.totalRackCapacityU || rackNode.rackUnits || 42;
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

  const [selectedInspectNodeId, setSelectedInspectNodeId] = useState<string | null>(mountedNodes[0]?.id || null);
  const [deviceToMountId, setDeviceToMountId] = useState<string>('');
  const [rackSearch, setRackSearch] = useState('');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverU, setDragOverU] = useState<number | null>(null);

  // Modal de edição / detalhes do ativo clicado
  const [editingAssetNode, setEditingAssetNode] = useState<NetworkNode | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<NetworkNode>>({});

  // Calculate total power consumption
  const totalPowerWatts = mountedNodes.reduce((sum, n) => sum + (n.powerConsumptionWatts || 35), 0);
  const totalOccupiedU = mountedNodes.reduce((sum, n) => sum + (n.rackUnits || 1), 0);
  const occupationPercent = Math.min(100, Math.round((totalOccupiedU / totalUnits) * 100));
  const btuPerHour = Math.round(totalPowerWatts * 3.412);

  // Find mounted node at unit U
  const getMountedNodeAtU = (u: number): NetworkNode | undefined => {
    return mountedNodes.find(n => {
      const posStr = n.rackPosition?.toUpperCase().replace('U', '') || '';
      const startU = parseInt(posStr) || -1;
      const height = n.rackUnits || 1;
      return startU <= u && u < startU + height;
    });
  };

  const handleMoveDeviceToSlot = (deviceId: string, targetU: number) => {
    const targetDevice = allNodes.find(n => n.id === deviceId);
    if (!targetDevice) return;

    const currentUStr = targetDevice.rackPosition?.replace('U', '') || '';
    const currentU = parseInt(currentUStr);
    if (currentU === targetU) return;

    // Check if there is already another device occupying targetU
    const existingDeviceAtTarget = getMountedNodeAtU(targetU);

    if (existingDeviceAtTarget && existingDeviceAtTarget.id !== deviceId) {
      // Swap positions
      const updatedExisting: NetworkNode = {
        ...existingDeviceAtTarget,
        parentRackId: rackNode.id,
        rackPosition: `U${currentU || targetU}`,
        location: `${rackNode.name} (U${currentU || targetU})`,
      };
      onUpdateNode(updatedExisting);
    }

    const updatedTarget: NetworkNode = {
      ...targetDevice,
      parentRackId: rackNode.id,
      rackPosition: `U${targetU}`,
      location: `${rackNode.name} (U${targetU})`,
    };

    onUpdateNode(updatedTarget);
    setSelectedInspectNodeId(targetDevice.id);
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
    setSelectedInspectNodeId(targetDevice.id);
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
    if (selectedInspectNodeId === deviceId) {
      setSelectedInspectNodeId(null);
    }
    if (editingAssetNode?.id === deviceId) {
      setEditingAssetNode(null);
    }
  };

  const handleOpenEditAsset = (node: NetworkNode) => {
    setEditingAssetNode(node);
    setEditFormData({ ...node });
    setSelectedInspectNodeId(node.id);
  };

  const handleSaveEditedAsset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingAssetNode) return;

    const newRackPosition = editFormData.rackPosition || editingAssetNode.rackPosition || 'U1';
    const updated: NetworkNode = {
      ...editingAssetNode,
      ...editFormData,
      rackPosition: newRackPosition,
      location: `${rackNode.name} (${newRackPosition})`,
    };

    onUpdateNode(updated);
    setSelectedInspectNodeId(updated.id);
    setEditingAssetNode(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingAssetNode) return;
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, SVG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setEditFormData(prev => ({
            ...prev,
            customImageUrl: url,
            imageUrl: url,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate slots array from top (totalUnits) down to 1
  const slots: number[] = [];
  for (let i = totalUnits; i >= 1; i--) {
    slots.push(i);
  }

  const inspectedNode = mountedNodes.find(n => n.id === selectedInspectNodeId) || null;

  // Filter mounted nodes for sidebar
  const filteredMountedNodes = mountedNodes.filter(n =>
    n.name.toLowerCase().includes(rackSearch.toLowerCase()) ||
    n.model.toLowerCase().includes(rackSearch.toLowerCase()) ||
    (n.managementIp || n.ip || '').includes(rackSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-white">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-md">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Diagrama de Elevação de Rack: {rackNode.name}
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-950 text-orange-400 border border-orange-800">
                  {totalUnits}U Server Rack • EIA-310 19"
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Diagrama técnico de infraestrutura com disposição vertical de servidores, concentradores, switches e réguas elétricas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddNewAssetToSlot && (
              <button
                type="button"
                onClick={() => onAddNewAssetToSlot(slots[0] || 42)}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Novo Ativo no Rack
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Stats Toolbar */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-6">
            {/* Space Occupation */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ocupação do Rack:</span>
                <span className="font-mono font-bold text-orange-400">
                  {totalOccupiedU} / {totalUnits}U ({occupationPercent}%)
                </span>
              </div>
              <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    occupationPercent > 90 ? 'bg-rose-500' : occupationPercent > 70 ? 'bg-amber-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${occupationPercent}%` }}
                />
              </div>
            </div>

            {/* Electrical Power */}
            <div className="border-l border-slate-800 pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Consumo Energético:</span>
              <span className="font-bold font-mono text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                {totalPowerWatts} Watts ({btuPerHour} BTU/h)
              </span>
            </div>

            {/* Devices Count */}
            <div className="border-l border-slate-800 pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Ativos Instalados:</span>
              <span className="font-bold font-mono text-cyan-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                {mountedNodes.length} Equipamentos
              </span>
            </div>
          </div>

          {/* Quick Mount Existing Device */}
          {availableNodesToMount.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-300">Instalar Existente:</span>
              <select
                value={deviceToMountId}
                onChange={(e) => setDeviceToMountId(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer focus:border-orange-500 focus:outline-hidden"
              >
                <option value="">Selecione Equipamento Avulso...</option>
                {availableNodesToMount.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.model} - {n.rackUnits || 1}U)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Main Content: Left/Center 19" Server Rack Diagram & Right Telemetry Inspector */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
          
          {/* 19" SERVER RACK DIAGRAM FRAME (Lucidchart Style) */}
          <div className="flex-1 flex flex-col items-center select-none min-w-0">
            {/* Top Label */}
            <div className="text-center mb-2">
              <span className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest">
                {totalUnits}U Server Rack ({rackNode.name})
              </span>
            </div>

            {/* Helpful Drag & Drop Hint Banner */}
            <div className="w-full max-w-2xl flex items-center justify-between gap-2 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl mb-2 text-xs text-slate-300 shadow-md">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-orange-400 animate-pulse shrink-0" />
                <span>
                  <strong className="text-orange-400 font-bold">Arrastar & Soltar:</strong> Arraste qualquer ativo segurando nele para reposicionar entre os slots <strong>(U)</strong> ou trocar de lugar.
                </span>
              </div>
              {draggedNodeId && (
                <span className="text-[10px] font-mono font-bold text-orange-300 bg-orange-950 px-2 py-0.5 rounded-md border border-orange-800 animate-bounce">
                  Solte no U desejado
                </span>
              )}
            </div>

            {/* Server Rack Outer Enclosure */}
            <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-3xl border-4 border-slate-700/90 shadow-2xl p-2 flex flex-col">
              
              {/* Top Roof of Cabinet (Exhaust Fans & Top Cable Ingress) */}
              <div className="h-8 bg-slate-800/90 rounded-t-2xl border-b border-slate-700 flex items-center justify-between px-4 text-[10px] font-mono text-slate-400 uppercase">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  CALHA ESQ
                </span>
                <span className="font-black text-orange-400 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  EXAUSTÃO TÉRMICA SUPERIOR & PASSAGEM DE CABOS
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  CALHA DIR
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                </span>
              </div>

              {/* Rails Container with Left/Right Cable Ducts */}
              <div className="flex bg-slate-950 p-2 gap-1 relative overflow-hidden">
                
                {/* Left Vertical Cable Duct (Calha de Cabos Esquerda com fios saindo) */}
                <div className="w-5 sm:w-7 bg-slate-900/90 rounded-lg border-r border-slate-800 flex flex-col items-center py-2 gap-1 shrink-0 relative">
                  <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-yellow-500/40 border-l border-dashed border-yellow-400/80" />
                  <div className="absolute inset-y-4 left-1/3 w-0.5 bg-cyan-400/30" />
                  <span className="text-[7px] font-mono [writing-mode:vertical-lr] text-slate-600 uppercase tracking-widest font-bold z-10">
                    CABEAMENTO 10G / FIBRA
                  </span>
                </div>

                {/* Slots Chassis Body (from totalUnits down to 1) */}
                <div className="flex-1 space-y-1">
                  {slots.map((u) => {
                    const nodeAtU = getMountedNodeAtU(u);
                    const isHeadOfMultiU = nodeAtU && (parseInt(nodeAtU.rackPosition?.replace('U', '') || '1') === u || !nodeAtU.rackPosition);

                    // Skip sub-segments of multi-U devices
                    if (nodeAtU && !isHeadOfMultiU) {
                      return null;
                    }

                    const isInspected = nodeAtU && inspectedNode?.id === nodeAtU.id;
                    const nodeHeight = nodeAtU ? (nodeAtU.rackUnits || 1) : 1;
                    const slotHeightPx = Math.max(42, nodeHeight * 40);
                    const isDragTarget = dragOverU === u;
                    const isBeingDragged = nodeAtU && draggedNodeId === nodeAtU.id;

                    return (
                      <div
                        key={u}
                        style={{ height: nodeAtU ? `${slotHeightPx}px` : '38px' }}
                        onClick={() => {
                          if (nodeAtU) {
                            setSelectedInspectNodeId(nodeAtU.id);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverU !== u) {
                            setDragOverU(u);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                          if (dragOverU === u) {
                            setDragOverU(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const droppedDeviceId = e.dataTransfer.getData('text/plain') || draggedNodeId;
                          if (droppedDeviceId) {
                            handleMoveDeviceToSlot(droppedDeviceId, u);
                          }
                          setDraggedNodeId(null);
                          setDragOverU(null);
                        }}
                        className={`rounded-xl border transition-all flex items-center px-2 sm:px-3 gap-2 relative ${
                          isDragTarget
                            ? 'border-orange-400 ring-4 ring-orange-500/40 bg-orange-500/20 shadow-xl shadow-orange-500/30 scale-[1.01] z-20'
                            : isBeingDragged
                            ? 'border-dashed border-orange-500/70 bg-slate-900/40 opacity-40'
                            : nodeAtU
                            ? isInspected
                              ? 'border-orange-500 ring-2 ring-orange-500/50 shadow-xl bg-slate-900'
                              : 'border-slate-700 hover:border-orange-400 bg-slate-900/90 shadow-md'
                            : 'border-dashed border-slate-800/80 bg-slate-950 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        {/* Left Rail Unit Marker with EIA-310 Screw Holes (:::) */}
                        <div className="w-7 sm:w-9 shrink-0 flex items-center justify-between border-r border-slate-800 pr-1.5 font-mono text-[11px] font-black text-slate-500">
                          <span className="text-[8px] text-slate-600 font-bold">:::</span>
                          <span className={nodeAtU ? 'text-orange-400' : 'text-slate-500'}>U{u}</span>
                        </div>

                        {/* Equipment Faceplate or Empty Slot */}
                        {nodeAtU ? (
                          <div
                            draggable={true}
                            onDragStart={(e) => {
                              setDraggedNodeId(nodeAtU.id);
                              e.dataTransfer.setData('text/plain', nodeAtU.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedNodeId(null);
                              setDragOverU(null);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAsset(nodeAtU);
                            }}
                            className="flex-1 h-full flex items-center justify-between gap-3 overflow-hidden cursor-pointer active:cursor-grabbing group/slot"
                            title="Clique para ver informações e editar, ou arraste para reposicionar no rack"
                          >
                            
                            {/* Device Faceplate Rendering (Dell Server / Router / Switch / OLT Style) */}
                            <div className="flex-1 flex items-center gap-3 overflow-hidden">
                              
                              {/* Left Handle, Drag Grip & Status LED */}
                              <div className="flex items-center gap-1 shrink-0">
                                <GripVertical 
                                  className="w-4 h-4 text-slate-500 group-hover/slot:text-orange-400 transition-colors shrink-0" 
                                  title="Segure e arraste para trocar de posição U"
                                />
                                <div className="w-1.5 h-6 rounded-full bg-slate-700 border border-slate-600" />
                                <div className={`w-2 h-2 rounded-full ${
                                  nodeAtU.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                                }`} />
                              </div>

                              {/* Realistic Faceplate Details */}
                              <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden bg-black/40 rounded-lg p-1.5 border border-slate-800/80 group-hover/slot:border-orange-500/50 transition-colors">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {/* Equipment Type Icon */}
                                  <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                    {nodeAtU.type.includes('server') ? <Server className="w-3.5 h-3.5 text-purple-400" /> :
                                     nodeAtU.type.includes('router') ? <Router className="w-3.5 h-3.5 text-orange-400" /> :
                                     nodeAtU.type.includes('olt') ? <Zap className="w-3.5 h-3.5 text-blue-400" /> :
                                     nodeAtU.type.includes('switch') ? <Network className="w-3.5 h-3.5 text-indigo-400" /> :
                                     <HardDrive className="w-3.5 h-3.5 text-emerald-400" />}
                                  </div>

                                  <div className="overflow-hidden">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs truncate text-white">
                                        {nodeAtU.name}
                                      </span>
                                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                                        {nodeAtU.model}
                                      </span>
                                      {nodeAtU.rackUnits && nodeAtU.rackUnits > 1 && (
                                        <span className="text-[9px] font-bold px-1 rounded bg-orange-950 text-orange-400 border border-orange-800">
                                          {nodeAtU.rackUnits}U
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-mono flex items-center gap-2">
                                      <span>IP: {nodeAtU.managementIp || nodeAtU.ip}</span>
                                      <span>• {nodeAtU.ports.length} Portas</span>
                                      <span>• {nodeAtU.powerConsumptionWatts || 35}W</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Lucidchart-style Realistic Honeycomb Mesh / Port Indicators */}
                                <div className="hidden md:flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 shrink-0">
                                  {/* Simulated Port Activity LEDs */}
                                  <div className="flex gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  </div>
                                  <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">10G/1G</span>
                                </div>
                              </div>

                              {/* Right Warning Alert Icon (like in the reference photo) */}
                              {nodeAtU.status !== 'online' && (
                                <div className="shrink-0 p-1 bg-rose-950/80 rounded border border-rose-700 text-rose-400 animate-pulse" title="Alerta Operacional">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            {/* Quick Edit & Unmount Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditAsset(nodeAtU);
                                }}
                                className="p-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/40 transition-colors cursor-pointer"
                                title="Ver Informações e Editar este Ativo"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnmountDevice(nodeAtU.id);
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer"
                                title="Desinstalar este Ativo do Rack"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Empty Slot Row */
                          <div className="flex-1 flex items-center justify-between text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              {isDragTarget && draggedNodeId ? (
                                <span className="font-mono text-xs text-orange-300 font-bold flex items-center gap-1.5 animate-pulse">
                                  <MoveVertical className="w-3.5 h-3.5" />
                                  ⚡ Solte aqui para mover para U{u}
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] text-slate-600 italic">
                                  -- Slot U{u} Vazio --
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {onAddNewAssetToSlot && (
                                <button
                                  type="button"
                                  onClick={() => onAddNewAssetToSlot(u)}
                                  className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-orange-600 text-slate-400 hover:text-white font-bold text-[10px] flex items-center gap-1 border border-slate-700 hover:border-orange-500 transition-colors cursor-pointer shadow-2xs"
                                  title={`Criar novo ativo para o slot U${u}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  + Novo Ativo U{u}
                                </button>
                              )}

                              {deviceToMountId && (
                                <button
                                  type="button"
                                  onClick={() => handleMountDevice(u)}
                                  className="px-2.5 py-0.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Instalar Aqui
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Right Rail Unit Marker with EIA-310 Screw Holes (:::) */}
                        <div className="w-7 sm:w-9 shrink-0 flex items-center justify-between border-l border-slate-800 pl-1.5 font-mono text-[11px] font-black text-slate-500">
                          <span className={nodeAtU ? 'text-orange-400' : 'text-slate-500'}>U{u}</span>
                          <span className="text-[8px] text-slate-600 font-bold">:::</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Vertical Cable Duct (Calha de Cabos Direita) */}
                <div className="w-5 sm:w-7 bg-slate-900/90 rounded-lg border-l border-slate-800 flex flex-col items-center py-2 gap-1 shrink-0 relative">
                  <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-blue-500/40 border-l border-dashed border-blue-400/80" />
                  <div className="absolute inset-y-4 right-1/3 w-0.5 bg-emerald-400/30" />
                  <span className="text-[7px] font-mono [writing-mode:vertical-lr] text-slate-600 uppercase tracking-widest font-bold z-10">
                    DISTRIBUIÇÃO UTP / ALIMENTAÇÃO
                  </span>
                </div>
              </div>

              {/* Bottom Base of Rack (Grounding Terminal & Heavy Duty Casters) */}
              <div className="h-7 bg-slate-800/90 rounded-b-2xl border-t border-slate-700 flex items-center justify-between px-4 text-[10px] font-mono text-slate-400 uppercase">
                <span>⚡ ATERRAMENTO SPDA NOC</span>
                <span className="font-bold text-slate-300">RODÍZIOS DUPLOS DE ALTA CARGA (1200KG)</span>
                <span>BASE TRAVADA</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: LIVE TELEMETRY & INSTALLED DEVICES INSPECTOR */}
          <div className="w-full lg:w-84 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-4 shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Ativos Instalados ({mountedNodes.length})
                </span>
              </div>

              {/* Search Inside Rack */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={rackSearch}
                  onChange={(e) => setRackSearch(e.target.value)}
                  placeholder="Filtrar por nome ou IP..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-200 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* List of Mounted Devices */}
              <div className="space-y-1.5 max-h-[36vh] overflow-y-auto pr-1">
                {filteredMountedNodes.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs italic bg-slate-900/50 rounded-xl border border-slate-800">
                    Nenhum ativo encontrado neste rack. Clique em "+ Novo Ativo no Rack" para adicionar.
                  </div>
                ) : (
                  filteredMountedNodes.map((n) => {
                    const isSelected = inspectedNode?.id === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleOpenEditAsset(n)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-950/50 border-orange-500 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate max-w-[170px]">{n.name}</span>
                          <span className="font-mono font-bold text-orange-400 text-[10px] bg-orange-950 px-1.5 py-0.5 rounded border border-orange-900">
                            {n.rackPosition || '1U'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                          <span>{n.vendor} • {n.model}</span>
                          <span className="font-mono text-emerald-400">{n.powerConsumptionWatts || 35}W</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inspected Active Telemetry Card */}
              {inspectedNode && (
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-black uppercase text-orange-400">
                      Telemetria do Ativo Selecionado
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      inspectedNode.status === 'online' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {inspectedNode.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">NOME:</span>
                      <span className="font-bold text-white truncate max-w-[160px]">{inspectedNode.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">IP GERÊNCIA:</span>
                      <span className="font-bold text-blue-400">{inspectedNode.managementIp || inspectedNode.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PORTAS:</span>
                      <span className="font-bold text-cyan-400">{inspectedNode.ports.length} Interfaces</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ALIMENTAÇÃO:</span>
                      <span>{inspectedNode.powerSupply || 'AC Bivolt'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CONSUMO:</span>
                      <span className="text-emerald-400 font-bold">{inspectedNode.powerConsumptionWatts || 35}W</span>
                    </div>
                  </div>

                  {/* Button to Open Edit Modal */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditAsset(inspectedNode)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar Informações deste Ativo
                  </button>
                </div>
              )}
            </div>

            {/* Rack Enclosure Specs Footer */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>RACK:</span>
                <span className="text-white font-bold">{rackNode.name}</span>
              </div>
              <div className="flex justify-between">
                <span>LOCAL / POP:</span>
                <span className="text-white font-bold">{rackNode.location}</span>
              </div>
              <div className="flex justify-between">
                <span>CAPACIDADE:</span>
                <span className="text-orange-400 font-bold">{totalUnits}U (Padrão 19")</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ASSET EDIT & DETAILS POPUP MODAL */}
      {editingAssetNode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-md">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Informações e Edição do Ativo
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editFormData.name || 'Equipamento'} • Slot {editFormData.rackPosition || 'U1'} ({rackNode.name})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingAssetNode(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEditedAsset} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              
              {/* Asset Header Card with PNG Preview & Status */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center p-2 shrink-0 shadow-md overflow-hidden relative group">
                    {(editFormData.customImageUrl || editFormData.imageUrl) ? (
                      <img
                        src={editFormData.customImageUrl || editFormData.imageUrl}
                        alt={editFormData.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Server className="w-7 h-7 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{editFormData.name || 'Novo Ativo'}</h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {editFormData.vendor || 'Fabricante'} • {editFormData.model || 'Modelo'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer transition-colors">
                        <Upload className="w-3 h-3" />
                        Trocar PNG
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml, image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {(editFormData.customImageUrl || editFormData.imageUrl) && (
                        <button
                          type="button"
                          onClick={() => setEditFormData(prev => ({ ...prev, customImageUrl: undefined, imageUrl: undefined }))}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                        >
                          Remover Imagem
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operational Status Selector */}
                <div className="w-full sm:w-auto">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Status Operacional:
                  </label>
                  <select
                    value={editFormData.status || 'online'}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 border border-slate-700 text-slate-200 cursor-pointer focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="online">🟢 Online (Operacional)</option>
                    <option value="warning">🟡 Alerta / Instabilidade</option>
                    <option value="offline">🔴 Offline (Inativo)</option>
                  </select>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Identification */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block border-b border-slate-800 pb-1">
                    Identificação do Ativo
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nome de Exibição:
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-orange-500 focus:outline-hidden"
                      placeholder="Ex: CCR OURICANGAS"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Hostname FQDN:
                    </label>
                    <input
                      type="text"
                      value={editFormData.hostname || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, hostname: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                      placeholder="Ex: ccr01.ouricangas.temnet.com.br"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Fabricante:
                    </label>
                    <input
                      type="text"
                      value={editFormData.vendor || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, vendor: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-orange-500 focus:outline-hidden"
                      placeholder="Ex: MikroTik, Cisco, Huawei, Dell"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Modelo Comercial:
                    </label>
                    <input
                      type="text"
                      value={editFormData.model || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-orange-500 focus:outline-hidden"
                      placeholder="Ex: CCR1009-8G-1S-1S+"
                    />
                  </div>

                  {folders.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Pasta / POP Pertencente:
                      </label>
                      <select
                        value={editFormData.folderId || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, folderId: e.target.value || undefined }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer focus:border-orange-500 focus:outline-hidden"
                      >
                        <option value="">Sem Pasta (Raiz)</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>
                            📁 {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Network & Physical Rack Location */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block border-b border-slate-800 pb-1">
                    Rede, Slot no Rack & Energia
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Endereço IP (Gerência / Loopback):
                    </label>
                    <input
                      type="text"
                      value={editFormData.managementIp || editFormData.ip || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, managementIp: e.target.value, ip: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-blue-400 font-mono font-bold text-xs focus:border-orange-500 focus:outline-hidden"
                      placeholder="Ex: 192.168.1.1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Posição no Rack:
                      </label>
                      <select
                        value={editFormData.rackPosition || 'U1'}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, rackPosition: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-orange-400 font-bold font-mono text-xs cursor-pointer focus:border-orange-500 focus:outline-hidden"
                      >
                        {slots.map(slotNum => (
                          <option key={slotNum} value={`U${slotNum}`}>
                            Slot U{slotNum}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Altura (Unidades U):
                      </label>
                      <select
                        value={editFormData.rackUnits || 1}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, rackUnits: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer focus:border-orange-500 focus:outline-hidden"
                      >
                        <option value={1}>1U (Padrão 44mm)</option>
                        <option value={2}>2U (88mm)</option>
                        <option value={3}>3U (132mm)</option>
                        <option value={4}>4U (176mm)</option>
                        <option value={5}>5U (220mm)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Consumo Elétrico (W):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.powerConsumptionWatts || 35}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, powerConsumptionWatts: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-xs focus:border-orange-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Alimentação:
                      </label>
                      <select
                        value={editFormData.powerSupply || 'AC 110/220V Bivolt'}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, powerSupply: e.target.value as any }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs cursor-pointer focus:border-orange-500 focus:outline-hidden"
                      >
                        <option value="AC 110/220V Bivolt">AC 110/220V Bivolt</option>
                        <option value="DC -48V Telecom">DC -48V Telecom</option>
                        <option value="DC 24V">DC 24V</option>
                        <option value="DC 12V">DC 12V</option>
                        <option value="Redundante AC/DC">Redundante AC/DC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Endereço MAC:
                      </label>
                      <input
                        type="text"
                        value={editFormData.mac || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, mac: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                        placeholder="Ex: 48:8F:5A:..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Número de Série / TAG:
                      </label>
                      <input
                        type="text"
                        value={editFormData.serialNumber || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:border-orange-500 focus:outline-hidden"
                        placeholder="Ex: SN-948271"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Notes / Remarks */}
              <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <label className="block text-[11px] font-bold text-slate-300">
                  Observações Técnicas & Configuração:
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-orange-500 focus:outline-hidden resize-none"
                  placeholder="Ex: Portas sfp-sfpplus1 conectada ao BGP Principal. VLAN 100 de Gerência configurada..."
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUnmountDevice(editingAssetNode.id)}
                  className="px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Desinstalar do Rack
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAssetNode(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
