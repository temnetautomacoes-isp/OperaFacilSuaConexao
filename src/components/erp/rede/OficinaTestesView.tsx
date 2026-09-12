import React, { useState } from 'react';
import { 
  Network, 
  Layers, 
  Zap, 
  Terminal, 
  Calculator, 
  Download, 
  Save, 
  Play, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  FolderOpen
} from 'lucide-react';
import { NetworkNode, NetworkLink, SimulationPacket, LinkType, NetworkFolder } from '../../../types/network';
import { DEVICE_CATALOG } from './initialNetworkData';
import { NetworkCanvas } from './NetworkCanvas';
import { DevicePalette } from './DevicePalette';
import { DeviceInspector } from './DeviceInspector';
import { SubnetCalculatorModal } from './SubnetCalculatorModal';
import { FiberPowerModal } from './FiberPowerModal';
import { PacketTracerModal } from './PacketTracerModal';

interface OficinaTestesViewProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  folders: NetworkFolder[];
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectLink: (linkId: string | null) => void;
  onUpdateNode: (node: NetworkNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateLink: (link: NetworkLink) => void;
  onDeleteLink: (linkId: string) => void;
  onAddDevice: (stencil: typeof DEVICE_CATALOG[0]) => void;
  onAddLink: (sourceNodeId: string, targetNodeId: string, linkType: LinkType) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onSaveTopology: () => void;
  onExportJson: () => void;
  onLoadTemplate: (type: 'default_isp' | 'corporate_vlan' | 'empty') => void;
  onStartPingSimulation: (sourceId: string, targetId: string) => void;
  activePackets: SimulationPacket[];
}

export const OficinaTestesView: React.FC<OficinaTestesViewProps> = ({
  nodes,
  links,
  folders,
  selectedNodeId,
  selectedLinkId,
  onSelectNode,
  onSelectLink,
  onUpdateNode,
  onDeleteNode,
  onUpdateLink,
  onDeleteLink,
  onAddDevice,
  onAddLink,
  onMoveNode,
  onSaveTopology,
  onExportJson,
  onLoadTemplate,
  onStartPingSimulation,
  activePackets,
}) => {
  // Canvas Transform
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Mode and Tools
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [selectedCableType, setSelectedCableType] = useState<string>('fiber_sm');
  const [isConnectingMode, setIsConnectingMode] = useState(false);

  // Modals
  const [isSubnetModalOpen, setIsSubnetModalOpen] = useState(false);
  const [isFiberPowerModalOpen, setIsFiberPowerModalOpen] = useState(false);
  const [isPacketTracerModalOpen, setIsPacketTracerModalOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedLink = links.find((l) => l.id === selectedLinkId) || null;

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden bg-slate-100 relative">
      {/* Workshop Action Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none z-10">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setIsSimulationMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !isSimulationMode
                  ? 'bg-white text-orange-600 shadow-2xs border border-orange-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Modo Desenho (Draw.io)
            </button>
            <button
              type="button"
              onClick={() => setIsSimulationMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSimulationMode
                  ? 'bg-slate-900 text-orange-400 shadow-2xs ring-1 ring-orange-500 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Modo Simulação (Packet Tracer)
            </button>
          </div>
        </div>

        {/* Center: Test Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPacketTracerModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-orange-400" />
            Terminal CLI / Sim
          </button>

          <button
            type="button"
            onClick={() => setIsSubnetModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            Calc Sub-rede
          </button>

          <button
            type="button"
            onClick={() => setIsFiberPowerModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Atenuação PON (dBm)
          </button>
        </div>

        {/* Right: Zoom & Export */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono font-bold text-slate-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Ajustar ao Centro (100%)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Templates */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              Modelos
            </button>

            {isTemplateMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 space-y-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    onLoadTemplate('default_isp');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition-colors cursor-pointer"
                >
                  Provedor FTTH & BGP (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadTemplate('corporate_vlan');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition-colors cursor-pointer"
                >
                  Rede Corporativa com VLANs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadTemplate('empty');
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors cursor-pointer border-t border-slate-100"
                >
                  Limpar / Diagrama em Branco
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSaveTopology}
            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
            title="Exportar Topologia como JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 h-full flex overflow-hidden relative">
        {/* Left Side: Stencil Library */}
        <DevicePalette
          onAddDevice={onAddDevice}
          selectedCableType={selectedCableType}
          onSelectCableType={setSelectedCableType}
          isConnectingMode={isConnectingMode}
          onToggleConnectingMode={() => setIsConnectingMode(!isConnectingMode)}
        />

        {/* Central Canvas */}
        <NetworkCanvas
          nodes={nodes}
          links={links}
          folders={folders}
          selectedNodeId={selectedNodeId}
          selectedLinkId={selectedLinkId}
          onSelectNode={onSelectNode}
          onSelectLink={onSelectLink}
          onMoveNode={onMoveNode}
          onAddLink={onAddLink}
          isSimulationMode={isSimulationMode}
          activePackets={activePackets}
          zoom={zoom}
          panOffset={panOffset}
          onPanChange={setPanOffset}
          onZoomChange={setZoom}
          selectedCableType={selectedCableType}
          isConnectingMode={isConnectingMode}
        />

        {/* Right Property Inspector */}
        <DeviceInspector
          selectedNode={selectedNode}
          selectedLink={selectedLink}
          folders={folders}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
          onUpdateLink={onUpdateLink}
          onDeleteLink={onDeleteLink}
          onOpenCli={(node) => {
            onSelectNode(node.id);
            setIsPacketTracerModalOpen(true);
          }}
          onClose={() => {
            onSelectNode(null);
            onSelectLink(null);
          }}
        />
      </div>

      {/* Modals */}
      <SubnetCalculatorModal
        isOpen={isSubnetModalOpen}
        onClose={() => setIsSubnetModalOpen(false)}
      />

      <FiberPowerModal
        isOpen={isFiberPowerModalOpen}
        onClose={() => setIsFiberPowerModalOpen(false)}
      />

      <PacketTracerModal
        isOpen={isPacketTracerModalOpen}
        onClose={() => setIsPacketTracerModalOpen(false)}
        selectedNode={selectedNode}
        nodes={nodes}
        links={links}
        onStartPingSimulation={onStartPingSimulation}
      />
    </div>
  );
};
