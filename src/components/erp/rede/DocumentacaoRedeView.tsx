import React, { useState } from 'react';
import { 
  FolderTree, 
  Layers, 
  Server, 
  Zap, 
  MapPin, 
  Plus, 
  Search, 
  Save, 
  Download, 
  Calendar, 
  Network, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  ChevronRight,
  ShieldCheck,
  FolderPlus,
  Boxes
} from 'lucide-react';
import { NetworkFolder, NetworkNode, NetworkLink, LinkType } from '../../../types/network';
import { FolderTreeSidebar } from './FolderTreeSidebar';
import { NetworkCanvas } from './NetworkCanvas';
import { DeviceInspector } from './DeviceInspector';
import { NewAssetModal } from './NewAssetModal';
import { RackElevationModal } from './RackElevationModal';
import { DEVICE_CATALOG } from './initialNetworkData';

interface DocumentacaoRedeViewProps {
  folders: NetworkFolder[];
  nodes: NetworkNode[];
  links: NetworkLink[];
  selectedFolderId: string | null;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectNode: (nodeId: string | null) => void;
  onSelectLink: (linkId: string | null) => void;
  onToggleFolderVisibility: (folderId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onUpdateNode: (node: NetworkNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateLink: (link: NetworkLink) => void;
  onDeleteLink: (linkId: string) => void;
  onAddDevice: (stencil: typeof DEVICE_CATALOG[0]) => void;
  onAddLink: (sourceNodeId: string, targetNodeId: string, linkType: LinkType) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onSaveTopology: () => void;
  onExportJson: () => void;
  onOpenCli: (node: NetworkNode) => void;
}

export const DocumentacaoRedeView: React.FC<DocumentacaoRedeViewProps> = ({
  folders,
  nodes,
  links,
  selectedFolderId,
  selectedNodeId,
  selectedLinkId,
  onSelectFolder,
  onSelectNode,
  onSelectLink,
  onToggleFolderVisibility,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onUpdateNode,
  onDeleteNode,
  onUpdateLink,
  onDeleteLink,
  onAddDevice,
  onAddLink,
  onMoveNode,
  onSaveTopology,
  onExportJson,
  onOpenCli,
}) => {
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');
  const [selectedCableType, setSelectedCableType] = useState<string>('fiber_sm');
  const [isConnectingMode, setIsConnectingMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [rackElevationModalNode, setRackElevationModalNode] = useState<NetworkNode | null>(null);
  const [targetRackForNewAsset, setTargetRackForNewAsset] = useState<{ rack: NetworkNode; slotU?: number } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleOpenAddAssetToRack = (rackNode: NetworkNode, slotU?: number) => {
    setTargetRackForNewAsset({ rack: rackNode, slotU });
    setIsAddDeviceModalOpen(true);
  };

  const activeFolder = folders.find(f => f.id === selectedFolderId) || folders[0] || null;

  // Build Breadcrumb hierarchy
  const getBreadcrumbs = (folderId: string | null): NetworkFolder[] => {
    if (!folderId) return [];
    const current = folders.find(f => f.id === folderId);
    if (!current) return [];
    if (!current.parentId) return [current];
    return [...getBreadcrumbs(current.parentId), current];
  };

  const breadcrumbs = getBreadcrumbs(selectedFolderId);
  const folderNodes = selectedFolderId ? nodes.filter(n => n.folderId === selectedFolderId) : nodes;
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const selectedLink = links.find(l => l.id === selectedLinkId) || null;

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden bg-slate-100 relative">
      {/* Sub-header / Documentacao Controls */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none z-10">
        {/* Left: Breadcrumbs & Active Folder Summary */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-500 overflow-hidden">
            <span className="text-slate-400">Documentação:</span>
            {breadcrumbs.length > 0 ? (
              breadcrumbs.map((b, idx) => (
                <React.Fragment key={b.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => onSelectFolder(b.id)}
                    className={`hover:underline cursor-pointer truncate max-w-[150px] ${
                      idx === breadcrumbs.length - 1 ? 'text-orange-600 font-extrabold' : 'text-slate-600'
                    }`}
                  >
                    📁 {b.name}
                  </button>
                </React.Fragment>
              ))
            ) : (
              <span className="text-slate-800 font-bold">Todas as Pastas (Visão Geral)</span>
            )}
          </div>

          {activeFolder && (
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {folderNodes.length} equipamentos nesta pasta
            </span>
          )}
        </div>

        {/* Center: View Switcher (Diagram / Table) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            id="view-diagram-btn"
            onClick={() => setViewMode('canvas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'canvas'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Diagrama
          </button>
          <button
            type="button"
            id="view-table-btn"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tabela / Inventário
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {viewMode === 'canvas' && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-500 px-1">Cabo:</span>
              <select
                value={selectedCableType}
                onChange={(e) => setSelectedCableType(e.target.value)}
                className="bg-transparent font-bold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="fiber_sm">Fibra Monomodo (SM)</option>
                <option value="fiber_mm">Fibra Multimodo (MM)</option>
                <option value="fiber_drop">Drop FTTH Flat</option>
                <option value="dac_10g">Cabo DAC 10G SFP+</option>
                <option value="utp_cat6">Cabo UTP Cat6</option>
                <option value="radio_ptp">Enlace Rádio PTP</option>
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setTargetRackForNewAsset(null);
              setIsAddDeviceModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Equipamento
          </button>

          <button
            type="button"
            onClick={onSaveTopology}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-orange-400" />
            Salvar
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
            title="Exportar Documentação como JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 h-full flex overflow-hidden relative">
        {/* Left Side: SGP TSMX Folder Tree */}
        <FolderTreeSidebar
          folders={folders}
          nodes={nodes}
          selectedFolderId={selectedFolderId}
          selectedNodeId={selectedNodeId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onSelectFolder={onSelectFolder}
          onSelectNode={onSelectNode}
          onToggleFolderVisibility={onToggleFolderVisibility}
          onCreateFolder={onCreateFolder}
          onDeleteFolder={onDeleteFolder}
          onRenameFolder={onRenameFolder}
          onAddAssetToRack={handleOpenAddAssetToRack}
          onOpenRackElevation={setRackElevationModalNode}
        />

        {/* Center: Canvas or Inventory Table */}
        {viewMode === 'canvas' ? (
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
            isSimulationMode={false}
            activePackets={[]}
            zoom={zoom}
            panOffset={panOffset}
            onPanChange={setPanOffset}
            onZoomChange={setZoom}
            selectedCableType={selectedCableType}
            isConnectingMode={isConnectingMode}
            onOpenRackElevation={setRackElevationModalNode}
          />
        ) : (
          <div className="flex-1 bg-white overflow-y-auto p-6 space-y-6 select-none">
            {/* Folder Header Info */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-3xl border border-orange-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block mb-1">
                  Documentação Detalhada do POP / Pasta
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  📁 {activeFolder ? activeFolder.name : 'Inventário Geral da Rede'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeFolder?.description || 'Lista completa de todos os equipamentos e portas ópticas/elétricas registradas no sistema.'}
                </p>
              </div>

              {activeFolder && (
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-orange-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Criado em:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {new Date(activeFolder.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Dispositivos:</span>
                    <span className="font-mono font-black text-orange-600">{folderNodes.length}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-500" />
                  Equipamentos e Ativos de Rack nesta Pasta ({folderNodes.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddDeviceModalOpen(true)}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Novo Ativo
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="p-3">Equipamento / Hostname</th>
                      <th className="p-3">Tipo / Fabricante</th>
                      <th className="p-3">Rack (U) / Posição</th>
                      <th className="p-3">IP Gerência</th>
                      <th className="p-3">Interfaces / Velocidades (/10 /100 /1000 /10000)</th>
                      <th className="p-3">Alimentação</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {folderNodes.map((node) => {
                      const portCounts = node.ports.reduce((acc, p) => {
                        const speed = p.speedMode || '1000M';
                        acc[speed] = (acc[speed] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      return (
                        <tr 
                          key={node.id} 
                          onClick={() => onSelectNode(node.id)}
                          className={`hover:bg-orange-50/50 transition-colors cursor-pointer ${
                            selectedNodeId === node.id ? 'bg-orange-50 font-bold' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              {node.name}
                              {node.isCustomAsset && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-orange-100 text-orange-800 font-bold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">{node.hostname}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-800 font-bold">{node.model}</div>
                            <div className="text-[10px] text-slate-500">{node.vendor}</div>
                          </td>
                          <td className="p-3 font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                              {node.rackUnits || 1}U {node.rackPosition ? `(${node.rackPosition})` : ''}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <div className="font-bold text-blue-600">{node.ip || node.managementIp || '---'}</div>
                            {node.mac && <div className="text-[10px] text-purple-600 font-semibold">{node.mac}</div>}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {Object.entries(portCounts).map(([spd, count]) => (
                                <span
                                  key={spd}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    spd === '10000M' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                                    spd === '1000M' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                    spd === '100M' ? 'bg-lime-100 text-lime-800 border border-lime-300' :
                                    spd === '2.5G' ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                                    spd === '10M' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                    'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {count}x {spd === '10000M' ? '10G' : spd === '1000M' ? '1G' : spd}
                                </span>
                              ))}
                              <span className="text-[10px] text-slate-400 font-mono">({node.ports.length} total)</span>
                            </div>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600">
                            {node.powerSupply || 'AC Bivolt'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              node.status === 'online'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {node.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {(node.type === 'rack_floor' || node.type === 'rack_wall' || node.type === 'rack_19') && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRackElevationModalNode(node);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                                >
                                  📐 Layout 19"
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectNode(node.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Detalhes
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenCli(node);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                CLI
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Right Property Inspector */}
        <DeviceInspector
          selectedNode={selectedNode}
          selectedLink={selectedLink}
          folders={folders}
          allNodes={nodes}
          onUpdateNode={onUpdateNode}
          onDeleteNode={onDeleteNode}
          onUpdateLink={onUpdateLink}
          onDeleteLink={onDeleteLink}
          onOpenCli={onOpenCli}
          onOpenRackElevation={setRackElevationModalNode}
          onAddAssetToRack={handleOpenAddAssetToRack}
          onSaveTopology={onSaveTopology}
          onClose={() => {
            onSelectNode(null);
            onSelectLink(null);
          }}
        />
      </div>

      {/* Add Device / New Asset Full Modal */}
      <NewAssetModal
        isOpen={isAddDeviceModalOpen}
        folders={folders}
        defaultFolderId={targetRackForNewAsset?.rack.folderId || selectedFolderId}
        allNodes={nodes}
        initialParentRackId={targetRackForNewAsset?.rack.id}
        initialRackPosition={targetRackForNewAsset?.slotU ? `U${targetRackForNewAsset.slotU}` : undefined}
        onClose={() => {
          setIsAddDeviceModalOpen(false);
          setTargetRackForNewAsset(null);
        }}
        onAddDevice={(node) => {
          onAddDevice(node as any);
          setIsAddDeviceModalOpen(false);
          setTargetRackForNewAsset(null);
        }}
      />

      {/* Rack 19" Elevation & Stacking Modal */}
      <RackElevationModal
        rackNode={rackElevationModalNode}
        allNodes={nodes}
        folders={folders}
        onUpdateNode={onUpdateNode}
        onAddDevice={onAddDevice}
        onAddNewAssetToSlot={(slotU) => {
          if (rackElevationModalNode) {
            handleOpenAddAssetToRack(rackElevationModalNode, slotU);
          }
        }}
        onClose={() => setRackElevationModalNode(null)}
      />
    </div>
  );
};
