import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Copy, 
  Terminal, 
  Settings, 
  Activity, 
  Zap, 
  MapPin, 
  Cpu, 
  Layers, 
  Server, 
  Network,
  Plus,
  Image as ImageIcon,
  Upload,
  Link2,
  Save,
  CheckCircle2
} from 'lucide-react';
import { NetworkNode, NetworkLink, NetworkFolder } from '../../../types/network';

interface DeviceInspectorProps {
  selectedNode: NetworkNode | null;
  selectedLink: NetworkLink | null;
  folders: NetworkFolder[];
  allNodes?: NetworkNode[];
  onUpdateNode: (node: NetworkNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateLink: (link: NetworkLink) => void;
  onDeleteLink: (linkId: string) => void;
  onOpenCli: (node: NetworkNode) => void;
  onOpenRackElevation?: (rackNode: NetworkNode) => void;
  onAddAssetToRack?: (rackNode: NetworkNode) => void;
  onClose: () => void;
  onSaveTopology?: () => void;
}

export const DeviceInspector: React.FC<DeviceInspectorProps> = ({
  selectedNode,
  selectedLink,
  folders,
  allNodes = [],
  onUpdateNode,
  onDeleteNode,
  onUpdateLink,
  onDeleteLink,
  onOpenCli,
  onOpenRackElevation,
  onAddAssetToRack,
  onClose,
  onSaveTopology,
}) => {
  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleSaveDevice = () => {
    if (selectedNode) {
      onUpdateNode({
        ...selectedNode,
        ip: selectedNode.ip || selectedNode.managementIp || '',
        managementIp: selectedNode.ip || selectedNode.managementIp || '',
      });
      if (onSaveTopology) {
        onSaveTopology();
      }
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2500);
    }
  };
  if (!selectedNode && !selectedLink) return null;

  const isRack = selectedNode && (selectedNode.type === 'rack_floor' || selectedNode.type === 'rack_wall' || selectedNode.type === 'rack_19');
  const isPowerSource = selectedNode && (selectedNode.type === 'ups_nobreak' || selectedNode.type === 'pdu_power_strip' || selectedNode.type === 'rectifier_power' || selectedNode.type === 'electrical_outlet');

  // Related devices
  const existingRacks = allNodes.filter(n => n.id !== selectedNode?.id && (n.type === 'rack_floor' || n.type === 'rack_wall' || n.type === 'rack_19'));
  const existingPowerSources = allNodes.filter(n => n.id !== selectedNode?.id && (n.type === 'ups_nobreak' || n.type === 'pdu_power_strip' || n.type === 'rectifier_power' || n.type === 'electrical_outlet'));

  // Devices mounted in this rack if this node is a rack
  const mountedDevicesInThisRack = isRack ? allNodes.filter(n => n.parentRackId === selectedNode.id) : [];
  // Devices powered by this node if it is a power source
  const poweredDevicesByThisNode = isPowerSource ? allNodes.filter(n => n.powerSourceNodeId === selectedNode.id) : [];
  const totalPowerConsumedWatts = poweredDevicesByThisNode.reduce((sum, n) => sum + (n.powerConsumptionWatts || 35), 0);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNode) return;
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
          onUpdateNode({
            ...selectedNode,
            customImageUrl: url,
            imageUrl: url,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden shrink-0 shadow-lg select-none z-10 animate-in slide-in-from-right duration-200">
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <Settings className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 truncate">
            {selectedNode ? 'Inspetor de Dispositivo' : 'Inspetor de Enlace / Cabo'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedNode && (
          <>
            {/* Device Header Card with PNG Preview */}
            <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-md text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-600 flex items-center justify-center p-1.5 shrink-0 overflow-hidden relative group shadow-inner">
                {(selectedNode.customImageUrl || selectedNode.imageUrl) ? (
                  <img
                    src={selectedNode.customImageUrl || selectedNode.imageUrl}
                    alt={selectedNode.name}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                ) : (
                  <Server className="w-6 h-6 text-orange-400" />
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="font-black text-xs text-white truncate leading-tight">
                  {selectedNode.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {selectedNode.hostname}
                </p>
                <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {selectedNode.type}
                </span>
              </div>
            </div>

            {/* Save Changes Button Top */}
            <button
              type="button"
              onClick={handleSaveDevice}
              className={`w-full py-2 px-3.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSavedToast
                  ? 'bg-emerald-600 text-white shadow-emerald-500/40 ring-2 ring-emerald-400'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/25'
              }`}
            >
              {isSavedToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Alterações Salvas com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>

            {/* PNG Image Management */}
            <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
                  Imagem PNG no Mapa
                </span>
                {(selectedNode.customImageUrl || selectedNode.imageUrl) && (
                  <button
                    type="button"
                    onClick={() => onUpdateNode({ ...selectedNode, customImageUrl: undefined, imageUrl: undefined })}
                    className="text-[9px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Remover Imagem
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 py-1.5 px-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors">
                  <Upload className="w-3 h-3" />
                  Trocar Imagem PNG...
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenCli(selectedNode)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-orange-400" />
                Abrir Terminal CLI
              </button>
            </div>

            {/* General Properties */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Pasta / POP Pertencente (SGP TSMX)
                </label>
                <select
                  value={selectedNode.folderId || ''}
                  onChange={(e) => onUpdateNode({ ...selectedNode, folderId: e.target.value || undefined })}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"
                >
                  <option value="">Sem Pasta (Raiz)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>📁 {f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => onUpdateNode({ ...selectedNode, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Hostname
                  </label>
                  <input
                    type="text"
                    value={selectedNode.hostname}
                    onChange={(e) => onUpdateNode({ ...selectedNode, hostname: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={selectedNode.status}
                    onChange={(e) => onUpdateNode({ ...selectedNode, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"
                  >
                    <option value="online">Online (Ativo)</option>
                    <option value="warning">Alerta / Instável</option>
                    <option value="offline">Offline (Inativo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Endereço IP
                </label>
                <input
                  type="text"
                  value={selectedNode.ip || selectedNode.managementIp || ''}
                  onChange={(e) => onUpdateNode({ ...selectedNode, ip: e.target.value, managementIp: e.target.value })}
                  placeholder="Ex: 192.168.1.1 ou 177.131.104.189:9000"
                  className="w-full px-3 py-1.5 text-xs font-mono text-blue-600 font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Endereço MAC
                </label>
                <input
                  type="text"
                  value={selectedNode.mac || ''}
                  onChange={(e) => onUpdateNode({ ...selectedNode, mac: e.target.value.toUpperCase() })}
                  placeholder="Ex: CC:2D:E0:44:89:1F"
                  className="w-full px-3 py-1.5 text-xs font-mono text-purple-600 font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Fabricante
                  </label>
                  <input
                    type="text"
                    value={selectedNode.vendor}
                    onChange={(e) => onUpdateNode({ ...selectedNode, vendor: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={selectedNode.model}
                    onChange={(e) => onUpdateNode({ ...selectedNode, model: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Localização Física / POP / Rack
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={selectedNode.location}
                    onChange={(e) => onUpdateNode({ ...selectedNode, location: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    placeholder="Ex: POP Central - Rack 01"
                  />
                </div>
              </div>

              {/* If Selected Node is a Rack: Quick Rack Elevation & Add Asset Buttons */}
              {isRack && (
                <div className="p-3.5 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl text-white shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider">Painel do Rack 19"</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                      {mountedDevicesInThisRack.length} Equipamentos
                    </span>
                  </div>

                  {onAddAssetToRack && (
                    <button
                      type="button"
                      onClick={() => onAddAssetToRack(selectedNode)}
                      className="w-full py-2 px-3 rounded-xl bg-orange-950 hover:bg-black text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-800"
                    >
                      <Plus className="w-4 h-4 text-orange-400" />
                      ➕ Adicionar Ativo a este Rack
                    </button>
                  )}

                  {onOpenRackElevation && (
                    <button
                      type="button"
                      onClick={() => onOpenRackElevation(selectedNode)}
                      className="w-full py-2 px-3 rounded-xl bg-white text-orange-950 font-black text-xs hover:bg-orange-50 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      📐 Abrir Elevação Visual ({selectedNode.totalRackCapacityU || selectedNode.rackUnits || 44}U)
                    </button>
                  )}
                </div>
              )}

              {/* Physical & Electrical Relationships */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-orange-50/40 border border-orange-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-900 block">
                  Anexação & Relacionamentos
                </span>

                {/* Parent Rack Selector (Not applicable if this node is a rack itself) */}
                {!isRack && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      📦 Instalado Dentro do Rack:
                    </label>
                    <select
                      value={selectedNode.parentRackId || ''}
                      onChange={(e) => onUpdateNode({ 
                        ...selectedNode, 
                        parentRackId: e.target.value || undefined,
                        location: e.target.value ? `${allNodes.find(n => n.id === e.target.value)?.name || 'Rack'} (${selectedNode.rackPosition || 'U1'})` : selectedNode.location
                      })}
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-orange-200 bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="">Nenhum (Dispositivo Avulso)</option>
                      {existingRacks.map(r => (
                        <option key={r.id} value={r.id}>
                          🏢 {r.name} ({r.totalRackCapacityU || r.rackUnits || 44}U)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Power Source Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    ⚡ Alimentado por (Nobreak / PDU / Tomada):
                  </label>
                  <select
                    value={selectedNode.powerSourceNodeId || ''}
                    onChange={(e) => onUpdateNode({ ...selectedNode, powerSourceNodeId: e.target.value || undefined })}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-orange-200 bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="">Alimentação Direta / Sem Nobreak</option>
                    {existingPowerSources.map(p => (
                      <option key={p.id} value={p.id}>
                        🔌 {p.name} ({p.model})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rack & Power Specs */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Tamanho Rack (U)</label>
                  <select
                    value={selectedNode.rackUnits || 1}
                    onChange={(e) => onUpdateNode({ ...selectedNode, rackUnits: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                  >
                    <option value={1}>1U</option>
                    <option value={2}>2U</option>
                    <option value={3}>3U</option>
                    <option value={4}>4U</option>
                    <option value={6}>6U</option>
                    <option value={8}>8U</option>
                    <option value={9}>9U (Rack Parede)</option>
                    <option value={12}>12U (Rack Parede)</option>
                    <option value={24}>24U (Rack Chão)</option>
                    <option value={44}>44U (Rack Chão)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Posição U</label>
                  <input
                    type="text"
                    value={selectedNode.rackPosition || ''}
                    onChange={(e) => onUpdateNode({ ...selectedNode, rackPosition: e.target.value })}
                    placeholder="Ex: U42"
                    className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Alimentação Elétrica</label>
                  <select
                    value={selectedNode.powerSupply || 'AC 110/220V Bivolt'}
                    onChange={(e) => onUpdateNode({ ...selectedNode, powerSupply: e.target.value as any })}
                    className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="AC 110/220V Bivolt">AC 110/220V Bivolt</option>
                    <option value="DC -48V Telecom">DC -48V Telecom</option>
                    <option value="Redundante AC/DC">Redundante AC/DC</option>
                    <option value="DC 24V">DC 24V</option>
                    <option value="DC 12V">DC 12V</option>
                  </select>
                </div>
              </div>

              {/* Optical Power (dBm) for PON/Fiber nodes */}
              {(selectedNode.category === 'access_ftth' || selectedNode.fiberPowerDbm !== undefined) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Potência Óptica TX/RX (dBm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedNode.fiberPowerDbm || 0}
                    onChange={(e) => onUpdateNode({ ...selectedNode, fiberPowerDbm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold text-purple-700 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              )}

              {/* Port Interfaces List */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    <Network className="w-3.5 h-3.5 text-indigo-500" />
                    Portas / Interfaces ({selectedNode.ports.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newPort = {
                        id: `p-${Date.now()}`,
                        name: `ether${selectedNode.ports.length + 1}`,
                        type: 'copper_1g' as const,
                        mediaType: 'ethernet' as const,
                        speedMode: '1000M' as const,
                        duplex: 'full' as const,
                        status: 'up' as const,
                      };
                      onUpdateNode({ ...selectedNode, ports: [...selectedNode.ports, newPort] });
                    }}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Porta
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedNode.ports.map((port, idx) => (
                    <div key={port.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={port.name}
                          onChange={(e) => {
                            const updated = [...selectedNode.ports];
                            updated[idx].name = e.target.value;
                            onUpdateNode({ ...selectedNode, ports: updated });
                          }}
                          className="font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded-md border border-slate-200 focus:outline-hidden w-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = selectedNode.ports.filter(p => p.id !== port.id);
                            onUpdateNode({ ...selectedNode, ports: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Remover Porta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={port.mediaType || 'ethernet'}
                          onChange={(e) => {
                            const updated = [...selectedNode.ports];
                            updated[idx].mediaType = e.target.value as any;
                            onUpdateNode({ ...selectedNode, ports: updated });
                          }}
                          className="px-1.5 py-1 text-[10px] font-bold rounded-md border border-slate-200 bg-white"
                        >
                          <option value="ethernet">RJ45 Ethernet</option>
                          <option value="fiber">Fibra SFP/SFP+</option>
                          <option value="pon">GPON / EPON</option>
                          <option value="voice">Telefonia VoIP</option>
                          <option value="serial">Console Serial</option>
                        </select>

                        <select
                          value={port.speedMode || '1000M'}
                          onChange={(e) => {
                            const updated = [...selectedNode.ports];
                            updated[idx].speedMode = e.target.value as any;
                            onUpdateNode({ ...selectedNode, ports: updated });
                          }}
                          className="px-1.5 py-1 text-[10px] font-bold rounded-md border border-slate-200 bg-white text-orange-900"
                        >
                          <option value="10M">10 Mbps (/10)</option>
                          <option value="100M">100 Mbps (/100)</option>
                          <option value="1000M">1000 Mbps (/1000 - 1G)</option>
                          <option value="2.5G">2.5G PON</option>
                          <option value="10000M">10000 Mbps (/10000 - 10G)</option>
                          <option value="25G">25 Gbps</option>
                          <option value="40G">40 Gbps</option>
                          <option value="100G">100 Gbps</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Anotações / Documentação
                </label>
                <textarea
                  rows={3}
                  value={selectedNode.notes || ''}
                  onChange={(e) => onUpdateNode({ ...selectedNode, notes: e.target.value })}
                  placeholder="Observações técnicas, VLANs, senhas de gerência, circuitos..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Bottom Actions: Save and Delete */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleSaveDevice}
                className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSavedToast
                    ? 'bg-emerald-600 text-white shadow-emerald-500/40 ring-2 ring-emerald-400'
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/25'
                }`}
              >
                {isSavedToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Alterações Salvas com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onDeleteNode(selectedNode.id)}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Dispositivo
              </button>
            </div>
          </>
        )}

        {/* Link / Cable Inspector */}
        {selectedLink && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Etiqueta / Nome do Enlace
              </label>
              <input
                type="text"
                value={selectedLink.label || ''}
                onChange={(e) => onUpdateLink({ ...selectedLink, label: e.target.value })}
                placeholder="Ex: Tronco 10G / PTT"
                className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
              <label className="flex items-center gap-2 cursor-pointer mt-2 select-none">
                <input
                  type="checkbox"
                  checked={selectedLink.style?.showLabel !== false}
                  onChange={(e) => {
                    onUpdateLink({
                      ...selectedLink,
                      style: {
                        ...(selectedLink.style || {}),
                        showLabel: e.target.checked
                      }
                    });
                  }}
                  className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-orange-400 bg-slate-100 border-slate-300 accent-orange-500 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-700">
                  Exibir texto/etiqueta na linha
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tipo de Cabo
                </label>
                <select
                  value={selectedLink.type}
                  onChange={(e) => onUpdateLink({ ...selectedLink, type: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 cursor-pointer"
                >
                  <option value="fiber_sm">Fibra Monomodo (SM)</option>
                  <option value="fiber_drop">Cabo Drop FTTH</option>
                  <option value="utp_cat6">UTP Cat6 (10G)</option>
                  <option value="wireless_ptp">Enlace Rádio PTP</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Capacidade / Velocidade
                </label>
                <input
                  type="text"
                  value={selectedLink.speed || '1 Gbps'}
                  onChange={(e) => onUpdateLink({ ...selectedLink, speed: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Distância (km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedLink.distanceKm || 0}
                  onChange={(e) => onUpdateLink({ ...selectedLink, distanceKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Atenuação (dB)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedLink.lossDb || 0}
                  onChange={(e) => onUpdateLink({ ...selectedLink, lossDb: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs font-mono text-purple-700 font-bold rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onDeleteLink(selectedLink.id)}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Enlace / Cabo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
