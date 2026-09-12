import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  CheckSquare, 
  Square, 
  Server, 
  Layers, 
  Box, 
  Radio, 
  Wifi, 
  Zap, 
  Plus, 
  Trash2, 
  Edit2, 
  MoreVertical, 
  Calendar,
  Eye,
  EyeOff,
  Filter,
  Monitor,
  Network,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { NetworkFolder, NetworkNode } from '../../../types/network';

interface FolderTreeSidebarProps {
  folders: NetworkFolder[];
  nodes: NetworkNode[];
  selectedFolderId: string | null;
  selectedNodeId: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectNode: (nodeId: string | null) => void;
  onToggleFolderVisibility: (folderId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}

export const FolderTreeSidebar: React.FC<FolderTreeSidebarProps> = ({
  folders,
  nodes,
  selectedFolderId,
  selectedNodeId,
  isCollapsed = false,
  onToggleCollapse,
  onSelectFolder,
  onSelectNode,
  onToggleFolderVisibility,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f-ala': true,
    'f-ala-rack': true,
    'f-ala-ceos': true,
    'f-ala-ctos': true,
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Quick Filter (SGP TSMX style buttons)
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleStartCreate = (parentId: string | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNewFolderParentId(parentId);
    setNewFolderName('');
    setIsCreatingFolder(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderParentId);
      if (newFolderParentId) {
        setExpandedFolders(prev => ({ ...prev, [newFolderParentId]: true }));
      }
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  };

  const handleStartRename = (folder: NetworkFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
  };

  const handleConfirmRename = (folderId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim()) {
      onRenameFolder(folderId, editingName.trim());
      setEditingFolderId(null);
    }
  };

  // Filter root folders
  const rootFolders = folders.filter(f => f.parentId === null);

  const getSubfolders = (parentId: string) => {
    return folders.filter(f => f.parentId === parentId);
  };

  const getFolderNodes = (folderId: string) => {
    return nodes.filter(n => n.folderId === folderId);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  // Render a folder branch recursively
  const renderFolderItem = (folder: NetworkFolder, level: number = 0) => {
    const isExpanded = !!expandedFolders[folder.id];
    const isSelected = selectedFolderId === folder.id;
    const subfolders = getSubfolders(folder.id);
    const folderNodes = getFolderNodes(folder.id);
    const isVisible = folder.visible !== false;

    const hasChildren = subfolders.length > 0 || folderNodes.length > 0;

    const matchesSearch = searchQuery === '' || 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folderNodes.some(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch && searchQuery !== '') return null;

    return (
      <div key={folder.id} className="space-y-0.5">
        {/* Folder Row */}
        <div
          onClick={() => onSelectFolder(folder.id)}
          style={{ paddingLeft: `${level * 14 + 6}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-xl text-xs transition-all cursor-pointer group ${
            isSelected
              ? 'bg-orange-500/15 text-orange-900 font-black border border-orange-300 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            {/* Expand / Collapse Icon */}
            <button
              type="button"
              onClick={(e) => toggleExpand(folder.id, e)}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <span className="w-3.5 inline-block" />
              )}
            </button>

            {/* SGP Layer Visibility Checkbox */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolderVisibility(folder.id);
              }}
              title={isVisible ? 'Ocultar camada/pasta no mapa' : 'Exibir camada/pasta no mapa'}
              className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              {isVisible ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* Folder Icon */}
            <Folder 
              className={`w-4 h-4 shrink-0 ${
                isSelected ? 'text-orange-600 fill-orange-500/30' : 'text-slate-800 fill-slate-800'
              }`} 
            />

            {/* Folder Name or Inline Rename */}
            {editingFolderId === folder.id ? (
              <form onSubmit={(e) => handleConfirmRename(folder.id, e)} className="flex-1 mr-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => setEditingFolderId(null)}
                  autoFocus
                  className="w-full px-1.5 py-0.5 text-xs font-bold border border-orange-400 bg-white rounded"
                />
              </form>
            ) : (
              <span className={`truncate font-mono text-[11px] ${isSelected ? 'font-black text-orange-950' : 'font-bold'}`}>
                {folder.name}
              </span>
            )}
          </div>

          {/* Right Actions & Badge */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
            {/* Device Count Badge */}
            {(folderNodes.length > 0 || subfolders.length > 0) && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                {folderNodes.length}
              </span>
            )}

            {/* Add Subfolder Button */}
            <button
              type="button"
              onClick={(e) => handleStartCreate(folder.id, e)}
              className="p-1 text-slate-400 hover:text-orange-600 hover:bg-slate-200 rounded transition-colors"
              title="Nova Subpasta aqui"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Rename */}
            <button
              type="button"
              onClick={(e) => handleStartRename(folder, e)}
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors"
              title="Renomear Pasta"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Excluir pasta "${folder.name}"?`)) {
                  onDeleteFolder(folder.id);
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded transition-colors"
              title="Excluir Pasta"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Sub-items (Subfolders & Nodes) */}
        {isExpanded && (
          <div className="space-y-0.5">
            {/* Subfolders */}
            {subfolders.map((sub) => renderFolderItem(sub, level + 1))}

            {/* Nodes inside this folder */}
            {folderNodes.map((node) => {
              const isNodeSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id);
                  }}
                  style={{ paddingLeft: `${(level + 1) * 14 + 14}px` }}
                  className={`flex items-center justify-between py-1 pr-2 rounded-lg text-xs transition-all cursor-pointer ${
                    isNodeSelected
                      ? 'bg-orange-600 text-white font-black shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      node.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                    <span className="truncate text-[11px] font-medium">{node.name}</span>
                  </div>

                  <span className={`text-[9px] font-mono shrink-0 ${
                    isNodeSelected ? 'text-orange-200' : 'text-slate-400'
                  }`}>
                    {node.ip}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-3 h-full min-h-0 shrink-0 select-none shadow-xs transition-all duration-200">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer"
          title="Expandir Pastas / Itens (SGP TSMX)"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>

        <div className="w-8 h-px bg-slate-200 my-1" />

        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Layers className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] font-bold text-slate-400 [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest mt-2">
            Pastas / POPs
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-full min-h-0 overflow-hidden select-none shrink-0 shadow-xs transition-all duration-200">
      {/* SGP TSMX Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-100/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-500" />
            Pastas / Itens
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStartCreate(null)}
              className="px-2 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              title="Criar Pasta Raiz (ex: Cidade / POP)"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Nova Pasta
            </button>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Recolher barra lateral"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SGP TSMX Quick Filter Icons Bar */}
        <div className="flex items-center justify-between p-1 bg-white rounded-xl border border-slate-200 shadow-2xs mb-2">
          {[
            { id: 'rack', label: 'Racks', icon: <Server className="w-3.5 h-3.5" /> },
            { id: 'ceo', label: 'CEOs', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'cto', label: 'CTOs', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'wifi', label: 'Wi-Fi/ONUs', icon: <Wifi className="w-3.5 h-3.5" /> },
            { id: 'radio', label: 'Rádios', icon: <Radio className="w-3.5 h-3.5" /> },
            { id: 'pc', label: 'PCs', icon: <Monitor className="w-3.5 h-3.5" /> },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveQuickFilter(activeQuickFilter === f.id ? null : f.id)}
              className={`p-1.5 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer ${
                activeQuickFilter === f.id ? 'bg-orange-500 text-white shadow-2xs' : ''
              }`}
              title={f.label}
            >
              {f.icon}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Procurar Pastas / Itens..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
          />
        </div>
      </div>

      {/* New Folder Inline Form */}
      {isCreatingFolder && (
        <div className="p-2.5 bg-orange-50/80 border-b border-orange-200">
          <form onSubmit={handleConfirmCreate} className="space-y-2">
            <span className="text-[10px] font-bold text-orange-900 block">
              {newFolderParentId ? 'Nova Subpasta' : 'Nova Pasta Raiz (POP / Cidade)'}:
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: POP ALAGOINHAS, CEOS ALA..."
                autoFocus
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-orange-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-500 cursor-pointer"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
              >
                X
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tree View Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-sans">
        {rootFolders.map((root) => renderFolderItem(root, 0))}
      </div>

      {/* Footer Info / Selected Folder Summary */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {selectedFolderId
              ? `Pasta Ativa: ${folders.find(f => f.id === selectedFolderId)?.name}`
              : 'Nenhuma pasta selecionada'}
          </span>
        </div>
        <span className="font-bold text-slate-700 shrink-0">
          {nodes.length} nós
        </span>
      </div>
    </div>
  );
};
