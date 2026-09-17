import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { supabase } from '../../../lib/supabase';
import { supabaseService } from '../../../services/supabaseService';
import { ExplorerFolder, ExplorerFile } from '../../../types';
import {
  Folder,
  FolderPlus,
  Upload,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  RotateCw,
  LayoutGrid,
  List,
  Grid,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  File,
  Download,
  Trash2,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Info,
  X,
  HardDrive,
  Clock,
  Star,
  Layers,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Filter,
  MoreVertical,
  Plus
} from 'lucide-react';

type ViewMode = 'large-icons' | 'grid' | 'details';
type QuickFilter = 'all' | 'recent' | 'documents' | 'images' | 'media' | 'archives';

export const ArquivoModule: React.FC = () => {
  const { currentUser } = useApp();

  // State
  const [folders, setFolders] = useState<ExplorerFolder[]>([]);
  const [files, setFiles] = useState<ExplorerFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('large-icons');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Modals
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#f59e0b');

  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [editFolderTarget, setEditFolderTarget] = useState<ExplorerFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('#f59e0b');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFilesQueue, setUploadFilesQueue] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [previewFile, setPreviewFile] = useState<ExplorerFile | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'folder' | 'file'; item: ExplorerFolder | ExplorerFile } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedFolderTree, setExpandedFolderTree] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available Folder Colors
  const folderColors = [
    { name: 'Âmbar (Padrão)', value: '#f59e0b' },
    { name: 'Azul Opera', value: '#3b82f6' },
    { name: 'Laranja TemNet', value: '#ea580c' },
    { name: 'Verde Esmeralda', value: '#10b981' },
    { name: 'Roxo Índigo', value: '#8b5cf6' },
    { name: 'Rosa Coral', value: '#f43f5e' },
    { name: 'Cinza Slate', value: '#64748b' },
  ];

  // Load Data
  const loadData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsSyncing(true);
    try {
      const [fetchedFolders, fetchedFiles] = await Promise.all([
        supabaseService.fetchExplorerFolders(),
        supabaseService.fetchExplorerFiles(),
      ]);
      setFolders(fetchedFolders);
      setFiles(fetchedFiles);
    } catch (err) {
      console.error('Erro ao carregar dados do Explorer:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // Supabase Real-time listener for multi-user collaboration
    const channel = supabase
      .channel('explorer_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'explorer_folders' },
        () => {
          loadData(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'explorer_files' },
        () => {
          loadData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Navigation Handlers
  const navigateToFolder = (folderId: string | null) => {
    if (folderId === currentFolderId) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(folderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
    setSelectedFolderId(null);
    setSelectedFileId(null);
    setQuickFilter('all');
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentFolderId(history[nextIndex]);
      setSelectedFolderId(null);
      setSelectedFileId(null);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentFolderId(history[nextIndex]);
      setSelectedFolderId(null);
      setSelectedFileId(null);
    }
  };

  const handleGoUp = () => {
    if (!currentFolderId) return;
    const current = folders.find((f) => f.id === currentFolderId);
    navigateToFolder(current ? current.parentId : null);
  };

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Arquivo' }];
    if (!currentFolderId) return crumbs;

    const path: { id: string; name: string }[] = [];
    let curr: ExplorerFolder | undefined = folders.find((f) => f.id === currentFolderId);

    while (curr) {
      path.unshift({ id: curr.id, name: curr.name });
      curr = curr.parentId ? folders.find((f) => f.id === curr?.parentId) : undefined;
    }

    return [...crumbs, ...path];
  }, [currentFolderId, folders]);

  // Current folder data
  const currentFolder = useMemo(() => {
    return folders.find((f) => f.id === currentFolderId);
  }, [currentFolderId, folders]);

  // Filtered and Sorted Items
  const displayedFolders = useMemo(() => {
    if (quickFilter !== 'all') return [];

    let list = folders.filter((f) => f.parentId === currentFolderId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = folders.filter((f) => f.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [folders, currentFolderId, searchQuery, quickFilter, sortBy, sortOrder]);

  const displayedFiles = useMemo(() => {
    let list = files;

    if (quickFilter === 'all' && !searchQuery.trim()) {
      list = list.filter((f) => f.folderId === currentFolderId);
    } else if (quickFilter === 'recent') {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 30);
    } else if (quickFilter === 'documents') {
      list = list.filter((f) =>
        ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(f.fileExt?.toLowerCase() || '')
      );
    } else if (quickFilter === 'images') {
      list = list.filter((f) =>
        ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(
          f.fileExt?.toLowerCase() || ''
        )
      );
    } else if (quickFilter === 'media') {
      list = list.filter((f) =>
        ['mp4', 'mkv', 'avi', 'mov', 'mp3', 'wav', 'ogg', 'aac'].includes(
          f.fileExt?.toLowerCase() || ''
        )
      );
    } else if (quickFilter === 'archives') {
      list = list.filter((f) =>
        ['zip', 'rar', '7z', 'tar', 'gz', 'iso'].includes(
          f.fileExt?.toLowerCase() || ''
        )
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'size') {
        return sortOrder === 'asc' ? a.sizeBytes - b.sizeBytes : b.sizeBytes - a.sizeBytes;
      }
      if (sortBy === 'type') {
        return sortOrder === 'asc'
          ? (a.fileExt || '').localeCompare(b.fileExt || '')
          : (b.fileExt || '').localeCompare(a.fileExt || '');
      }
      return 0;
    });
  }, [files, currentFolderId, searchQuery, quickFilter, sortBy, sortOrder]);

  // Storage Stats
  const totalSizeBytes = useMemo(() => {
    return files.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  }, [files]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper for File Icon
  const getFileIcon = (file: ExplorerFile, size = 'w-10 h-10') => {
    const ext = file.fileExt?.toLowerCase() || '';

    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return <FileImage className={`${size} text-blue-500`} />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className={`${size} text-red-500`} />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className={`${size} text-emerald-600`} />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className={`${size} text-blue-600`} />;
    }
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
      return <FileVideo className={`${size} text-purple-500`} />;
    }
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return <FileAudio className={`${size} text-amber-500`} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className={`${size} text-orange-600`} />;
    }
    if (['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'sql', 'py'].includes(ext)) {
      return <FileCode className={`${size} text-cyan-500`} />;
    }
    return <File className={`${size} text-slate-400`} />;
  };

  // Actions: Folder Creation
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const newFolder: ExplorerFolder = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `folder_${Date.now()}`,
        name: newFolderName.trim(),
        parentId: currentFolderId,
        color: newFolderColor,
        icon: 'folder',
        createdBy: currentUser?.name || currentUser?.username || 'Usuário',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await supabaseService.saveExplorerFolder(newFolder);
      setFolders((prev) => [...prev, newFolder]);
      setNewFolderName('');
      setIsNewFolderOpen(false);
    } catch (err) {
      alert('Erro ao criar pasta no Supabase.');
    }
  };

  // Actions: Folder Edit
  const openEditFolderModal = (folder: ExplorerFolder) => {
    setEditFolderTarget(folder);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color || '#f59e0b');
    setIsEditFolderOpen(true);
  };

  const handleSaveEditFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFolderTarget || !editFolderName.trim()) return;

    try {
      const updated: ExplorerFolder = {
        ...editFolderTarget,
        name: editFolderName.trim(),
        color: editFolderColor,
        updatedAt: new Date().toISOString(),
      };

      await supabaseService.saveExplorerFolder(updated);
      setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setIsEditFolderOpen(false);
      setEditFolderTarget(null);
    } catch (err) {
      alert('Erro ao salvar alterações da pasta.');
    }
  };

  // Actions: Upload
  const handleUploadSubmit = async () => {
    if (uploadFilesQueue.length === 0) return;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const total = uploadFilesQueue.length;
      for (let i = 0; i < total; i++) {
        const file = uploadFilesQueue[i];
        const uploaded = await supabaseService.uploadExplorerFileBlob(
          file,
          currentFolderId,
          currentUser?.name || currentUser?.username || 'Usuário'
        );
        setFiles((prev) => [uploaded, ...prev]);
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }
      setUploadFilesQueue([]);
      setIsUploadOpen(false);
    } catch (err: any) {
      alert('Erro ao enviar arquivos para a nuvem: ' + (err?.message || 'Falha no upload'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setUploadFilesQueue(droppedFiles);
      setIsUploadOpen(true);
    }
  };

  // Deletion
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'folder') {
        const folder = itemToDelete.item as ExplorerFolder;
        await supabaseService.deleteExplorerFolder(folder.id);
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
        if (currentFolderId === folder.id) {
          navigateToFolder(folder.parentId);
        }
      } else {
        const file = itemToDelete.item as ExplorerFile;
        await supabaseService.deleteExplorerFile(file.id, file.storagePath);
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
      setItemToDelete(null);
      setSelectedFolderId(null);
      setSelectedFileId(null);
    } catch (err) {
      alert('Erro ao excluir item.');
    }
  };

  // Copy link
  const copyFileLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Toggle tree node
  const toggleTreeNode = (folderId: string) => {
    setExpandedFolderTree((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Recursive folder tree item
  const renderFolderTreeNode = (parentId: string | null, depth = 0) => {
    const childFolders = folders.filter((f) => f.parentId === parentId);
    if (childFolders.length === 0) return null;

    return (
      <div className="space-y-0.5" style={{ paddingLeft: depth > 0 ? `${depth * 10}px` : 0 }}>
        {childFolders.map((f) => {
          const isSelected = currentFolderId === f.id;
          const isExpanded = !!expandedFolderTree[f.id];
          const hasChildren = folders.some((child) => child.parentId === f.id);
          const childFilesCount = files.filter((fl) => fl.folderId === f.id).length;

          return (
            <div key={f.id}>
              <div
                onClick={() => navigateToFolder(f.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all group ${
                  isSelected
                    ? 'bg-orange-100 text-orange-950 font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTreeNode(f.id);
                      }}
                      className="p-0.5 hover:bg-slate-200 rounded text-slate-400"
                    >
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isExpanded ? 'rotate-90 text-orange-500' : ''
                        }`}
                      />
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}
                  <Folder
                    className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                    style={{ color: f.color || '#f59e0b', fill: f.color ? `${f.color}25` : '#f59e0b25' }}
                  />
                  <span className="truncate text-xs">{f.name}</span>
                </div>
                {childFilesCount > 0 && (
                  <span className="text-[10px] text-slate-400 px-1 rounded-full bg-slate-200/50">
                    {childFilesCount}
                  </span>
                )}
              </div>
              {isExpanded && renderFolderTreeNode(f.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full bg-[#f8fafc] text-slate-800 select-none relative overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragOver(false);
      }}
      onDrop={handleDrop}
    >
      {/* DRAG OVERLAY */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-orange-500/10 border-4 border-dashed border-orange-500 backdrop-blur-xs flex flex-col items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-orange-200 flex flex-col items-center gap-3 animate-bounce">
            <Upload className="w-12 h-12 text-orange-500" />
            <h3 className="text-lg font-black text-slate-800">Solte seus arquivos aqui</h3>
            <p className="text-xs text-slate-500">
              Os arquivos serão enviados para {currentFolder ? `"${currentFolder.name}"` : 'Arquivo Principal'}
            </p>
          </div>
        </div>
      )}

      {/* TOP WINDOWS EXPLORER TOOLBAR & RIBBON */}
      <div className="bg-white border-b border-slate-200 shrink-0 shadow-2xs z-10">
        {/* Ribbon Actions Header */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {/* Nova Pasta */}
            <button
              type="button"
              id="btn-explorer-new-folder"
              onClick={() => {
                setNewFolderName('');
                setIsNewFolderOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-700 border border-orange-200 font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-all hover:scale-[1.02]"
            >
              <FolderPlus className="w-4 h-4 text-orange-600" />
              <span>Nova Pasta</span>
            </button>

            {/* Fazer Upload */}
            <button
              type="button"
              id="btn-explorer-upload"
              onClick={() => {
                setUploadFilesQueue([]);
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Fazer Upload</span>
            </button>

            {/* Editar / Renomear Pasta Selecionada ou Pasta Aberta */}
            {(selectedFolderId || currentFolderId) && (
              <button
                type="button"
                id="btn-explorer-edit-folder"
                onClick={() => {
                  const target = selectedFolderId
                    ? folders.find((f) => f.id === selectedFolderId)
                    : currentFolder;
                  if (target) openEditFolderModal(target);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl shadow-2xs cursor-pointer transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Editar Pasta</span>
              </button>
            )}

            {/* Excluir Seleção */}
            {(selectedFolderId || selectedFileId) && (
              <button
                type="button"
                id="btn-explorer-delete-selected"
                onClick={() => {
                  if (selectedFolderId) {
                    const f = folders.find((fol) => fol.id === selectedFolderId);
                    if (f) setItemToDelete({ type: 'folder', item: f });
                  } else if (selectedFileId) {
                    const fl = files.find((fil) => fil.id === selectedFileId);
                    if (fl) setItemToDelete({ type: 'file', item: fl });
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl shadow-2xs cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Excluir</span>
              </button>
            )}
          </div>

          {/* View Mode & Realtime Sync Badge */}
          <div className="flex items-center gap-2">
            {/* Realtime Supabase Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isSyncing
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
              title="Sincronização em tempo real via Supabase"
            >
              <Cloud
                className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-500' : 'text-emerald-500'}`}
              />
              <span className="hidden sm:inline">
                {isSyncing ? 'Sincronizando...' : 'Supabase Nuvem (Tempo Real)'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => loadData(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Atualizar"
            >
              <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            {/* View Mode Toggles */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('large-icons')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'large-icons'
                    ? 'bg-white shadow-xs text-orange-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ícones Grandes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-xs text-orange-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grade Média"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('details')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'details'
                    ? 'bg-white shadow-xs text-orange-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Detalhes / Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Address Bar & Search Navigation */}
        <div className="px-4 py-2 flex items-center gap-2 bg-slate-50/70">
          {/* Navigation controls: Back, Forward, Up */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleGoBack}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Voltar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleGoForward}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Avançar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleGoUp}
              disabled={!currentFolderId}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Subir um nível de pasta"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          {/* Breadcrumb Path Bar (Windows Address Bar Style) */}
          <div className="flex-1 flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto text-xs font-semibold scrollbar-none">
            <HardDrive className="w-4 h-4 text-orange-500 shrink-0 mr-1" />
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => navigateToFolder(crumb.id)}
                    className={`px-1.5 py-0.5 rounded-md truncate max-w-[150px] transition-colors cursor-pointer ${
                      isLast
                        ? 'font-bold text-slate-900 bg-slate-100'
                        : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar arquivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT: LEFT TREE PANE + RIGHT EXPLORER GRID */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT WINDOWS EXPLORER NAVIGATION PANE */}
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex overflow-y-auto p-3 space-y-4">
          <div className="space-y-4">
            {/* Quick Access Section */}
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-2 mb-1.5">
                Acesso Rápido
              </span>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigateToFolder(null);
                    setQuickFilter('all');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentFolderId === null && quickFilter === 'all'
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-500" />
                    <span>Todos os Arquivos</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {files.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter('recent')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    quickFilter === 'recent'
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Recentes</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter('documents')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    quickFilter === 'documents'
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>Documentos (PDF/Doc)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter('images')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    quickFilter === 'images'
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-purple-500" />
                    <span>Imagens e Fotos</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter('media')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    quickFilter === 'media'
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileVideo className="w-4 h-4 text-rose-500" />
                    <span>Vídeos e Áudios</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter('archives')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    quickFilter === 'archives'
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileArchive className="w-4 h-4 text-amber-500" />
                    <span>Compactados (ZIP/RAR)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Folder Hierarchy Tree */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Pastas do Sistema
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderName('');
                    setIsNewFolderOpen(true);
                  }}
                  className="text-orange-600 hover:text-orange-700 p-0.5 rounded cursor-pointer"
                  title="Criar Nova Pasta"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {renderFolderTreeNode(null)}
                {folders.length === 0 && (
                  <p className="text-[11px] text-slate-400 px-2 italic">Nenhuma pasta criada</p>
                )}
              </div>
            </div>
          </div>

          {/* Storage Footer Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-orange-500" />
                Nuvem Supabase
              </span>
              <span className="text-[10px] font-extrabold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                {files.length} itens
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Espaço utilizado:</span>
              <span className="font-bold text-slate-800">{formatBytes(totalSizeBytes)}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, (totalSizeBytes / (1024 * 1024 * 1024)) * 100))}%` }}
              />
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN EXPLORER CONTENT AREA */}
        <main
          className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 space-y-6"
          onClick={() => {
            setSelectedFolderId(null);
            setSelectedFileId(null);
          }}
        >
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <RotateCw className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-xs font-semibold">Carregando seus arquivos e pastas...</p>
            </div>
          )}

          {!isLoading && (
            <>
              {/* SECTION 1: PASTAS */}
              {displayedFolders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-amber-500" />
                      Pastas ({displayedFolders.length})
                    </h4>
                  </div>

                  {/* FOLDERS GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {displayedFolders.map((folder) => {
                      const isSelected = selectedFolderId === folder.id;
                      const childFiles = files.filter((f) => f.folderId === folder.id);

                      return (
                        <div
                          key={folder.id}
                          id={`folder-card-${folder.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderId(folder.id);
                            setSelectedFileId(null);
                          }}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                          className={`relative p-3 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                            isSelected
                              ? 'bg-orange-50/90 border-orange-400 shadow-md ring-2 ring-orange-400/30'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            {/* Windows Folder Icon */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                              style={{
                                backgroundColor: folder.color ? `${folder.color}15` : '#f59e0b15',
                              }}
                            >
                              <Folder
                                className="w-7 h-7"
                                style={{
                                  color: folder.color || '#f59e0b',
                                  fill: folder.color ? `${folder.color}35` : '#f59e0b35',
                                }}
                              />
                            </div>

                            {/* Options Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditFolderModal(folder);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-opacity"
                              title="Editar Pasta"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-2.5">
                            <h5 className="font-bold text-xs text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                              {folder.name}
                            </h5>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                              <span>{childFiles.length} {childFiles.length === 1 ? 'item' : 'itens'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: ARQUIVOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <File className="w-4 h-4 text-blue-500" />
                    Arquivos ({displayedFiles.length})
                  </h4>

                  {/* Sort Order Toggles */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 text-[11px]">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="name">Nome</option>
                      <option value="date">Data de Modificação</option>
                      <option value="size">Tamanho</option>
                      <option value="type">Tipo</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                      title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>

                {/* EMPTY STATE */}
                {displayedFolders.length === 0 && displayedFiles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-dashed border-slate-300 rounded-3xl text-center space-y-4 shadow-2xs">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                      <FolderOpen className="w-8 h-8" />
                    </div>
                    <div className="max-w-md space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm">Esta pasta está vazia</h4>
                      <p className="text-xs text-slate-500">
                        Clique em "Fazer Upload" para enviar documentos ou imagens, ou crie uma nova subpasta.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewFolderName('');
                          setIsNewFolderOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Nova Pasta
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFilesQueue([]);
                          setIsUploadOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fazer Upload Agora</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* FILES DISPLAY ACCORDING TO VIEW MODE */}

                {/* 1. LARGE ICONS VIEW (Windows Explorer Style) */}
                {viewMode === 'large-icons' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                    {displayedFiles.map((file) => {
                      const isSelected = selectedFileId === file.id;
                      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(
                        file.fileExt?.toLowerCase() || ''
                      );

                      return (
                        <div
                          key={file.id}
                          id={`file-card-${file.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFileId(file.id);
                            setSelectedFolderId(null);
                          }}
                          onDoubleClick={() => setPreviewFile(file)}
                          className={`relative p-3 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-400 shadow-md ring-2 ring-blue-400/30'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          {/* File Preview Thumbnail / Icon */}
                          <div className="w-full aspect-4/3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden relative group-hover:border-slate-300 transition-all">
                            {isImg ? (
                              <img
                                src={file.fileUrl}
                                alt={file.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            ) : (
                              getFileIcon(file, 'w-10 h-10')
                            )}

                            {/* Quick Action Overlay on Hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-2xs transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFile(file);
                                }}
                                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-xs transition-all hover:scale-110"
                                title="Visualizar / Detalhes"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={file.fileUrl}
                                download={file.name}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-xs transition-all hover:scale-110"
                                title="Baixar Arquivo"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {/* File Meta */}
                          <div className="mt-2.5 space-y-0.5">
                            <h5
                              className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-600 transition-colors"
                              title={file.name}
                            >
                              {file.name}
                            </h5>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{formatBytes(file.sizeBytes)}</span>
                              <span className="uppercase font-semibold text-slate-500">
                                {file.fileExt || 'ARQ'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. GRID VIEW (Medium Tiles) */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {displayedFiles.map((file) => {
                      const isSelected = selectedFileId === file.id;

                      return (
                        <div
                          key={file.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFileId(file.id);
                            setSelectedFolderId(null);
                          }}
                          onDoubleClick={() => setPreviewFile(file)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-400 shadow-xs ring-2 ring-blue-400/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(file, 'w-6 h-6 shrink-0')}
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </h5>
                              <p className="text-[10px] text-slate-400">
                                {formatBytes(file.sizeBytes)} • {formatDate(file.createdAt)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Visualizar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. DETAILS / LIST VIEW (Windows Explorer Table) */}
                {viewMode === 'details' && displayedFiles.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Nome</th>
                            <th className="py-2.5 px-3">Data de Envio</th>
                            <th className="py-2.5 px-3">Tipo</th>
                            <th className="py-2.5 px-3">Tamanho</th>
                            <th className="py-2.5 px-3">Enviado por</th>
                            <th className="py-2.5 px-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedFiles.map((file) => {
                            const isSelected = selectedFileId === file.id;

                            return (
                              <tr
                                key={file.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFileId(file.id);
                                  setSelectedFolderId(null);
                                }}
                                onDoubleClick={() => setPreviewFile(file)}
                                className={`transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50/80 font-semibold'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="py-2.5 px-3 flex items-center gap-2">
                                  {getFileIcon(file, 'w-4 h-4 shrink-0')}
                                  <span className="font-bold text-slate-800 truncate max-w-xs" title={file.name}>
                                    {file.name}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                  {formatDate(file.createdAt)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 uppercase font-semibold text-[10px]">
                                  {file.fileExt || 'Desconhecido'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                  {formatBytes(file.sizeBytes)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                  {file.createdBy || 'Sistema'}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewFile(file);
                                      }}
                                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                                      title="Visualizar"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <a
                                      href={file.fileUrl}
                                      download={file.name}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                      title="Baixar"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemToDelete({ type: 'file', item: file });
                                      }}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* FOOTER STATUS BAR (Windows Explorer Style) */}
      <footer className="bg-white border-t border-slate-200 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-3">
          <span>
            {displayedFolders.length + displayedFiles.length} itens no total
          </span>
          {(selectedFolderId || selectedFileId) && (
            <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
              1 item selecionado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sincronizado na Nuvem</span>
        </div>
      </footer>

      {/* MODAL 1: NOVA PASTA */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">Criar Nova Pasta</h3>
                  <p className="text-[11px] text-slate-400">
                    Local: {currentFolder ? currentFolder.name : 'Raiz (Arquivo)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Pasta *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Documentos Fiscais, Manuais Técnicos..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cor da Pasta
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {folderColors.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setNewFolderColor(col.value)}
                      style={{ backgroundColor: col.value }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center text-white ${
                        newFolderColor === col.value
                          ? 'scale-110 ring-2 ring-offset-2 ring-slate-800'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={col.name}
                    >
                      {newFolderColor === col.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR PASTA */}
      {isEditFolderOpen && editFolderTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">Editar Pasta</h3>
                  <p className="text-[11px] text-slate-400">Renomear ou alterar cor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditFolderOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFolder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Pasta *
                </label>
                <input
                  type="text"
                  required
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cor da Pasta
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {folderColors.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setEditFolderColor(col.value)}
                      style={{ backgroundColor: col.value }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center text-white ${
                        editFolderColor === col.value
                          ? 'scale-110 ring-2 ring-offset-2 ring-slate-800'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={col.name}
                    >
                      {editFolderColor === col.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditFolderOpen(false);
                    setItemToDelete({ type: 'folder', item: editFolderTarget });
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Pasta</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditFolderOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!editFolderName.trim()}
                    className="px-5 py-2 text-xs font-black text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FAZER UPLOAD */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">Upload de Arquivos</h3>
                  <p className="text-[11px] text-slate-400">
                    Enviar para: <span className="font-bold text-orange-600">{currentFolder ? currentFolder.name : 'Arquivo (Raiz)'}</span>
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Dropzone Area */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadFilesQueue(Array.from(e.target.files));
                  }
                }}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Clique aqui ou arraste seus arquivos para enviar
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Suporta PDFs, Planilhas, Imagens, Documentos, Vídeos, ZIPs e qualquer formato
                  </p>
                </div>
              </div>

              {/* Selected Files Queue */}
              {uploadFilesQueue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Arquivos selecionados ({uploadFilesQueue.length})</span>
                    <button
                      type="button"
                      onClick={() => setUploadFilesQueue([])}
                      className="text-rose-600 text-[11px] hover:underline"
                    >
                      Limpar lista
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {uploadFilesQueue.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {file.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold text-orange-600">
                    <span>Enviando para o Supabase...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isUploading || uploadFilesQueue.length === 0}
                  onClick={handleUploadSubmit}
                  className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Iniciar Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PREVIEW / DETALHES DO ARQUIVO */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileIcon(previewFile, 'w-6 h-6 shrink-0')}
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-slate-900 truncate" title={previewFile.name}>
                    {previewFile.name}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {formatBytes(previewFile.sizeBytes)} • Enviado em {formatDate(previewFile.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-slate-100/50 min-h-[250px]">
              {/* Image Preview */}
              {['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(previewFile.fileExt?.toLowerCase() || '') && (
                <div className="max-h-[60vh] max-w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                  <img
                    src={previewFile.fileUrl}
                    alt={previewFile.name}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
              )}

              {/* Video Preview */}
              {['mp4', 'webm', 'ogg', 'mov'].includes(previewFile.fileExt?.toLowerCase() || '') && (
                <video
                  src={previewFile.fileUrl}
                  controls
                  className="max-h-[50vh] max-w-full rounded-2xl shadow-lg"
                />
              )}

              {/* Audio Preview */}
              {['mp3', 'wav', 'ogg', 'aac'].includes(previewFile.fileExt?.toLowerCase() || '') && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md w-full max-w-md text-center space-y-3">
                  <FileAudio className="w-12 h-12 text-amber-500 mx-auto" />
                  <audio src={previewFile.fileUrl} controls className="w-full" />
                </div>
              )}

              {/* PDF or Generic Document Preview Link */}
              {!['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'mp4', 'webm', 'ogg', 'mov', 'mp3', 'wav', 'aac'].includes(
                previewFile.fileExt?.toLowerCase() || ''
              ) && (
                <div className="text-center space-y-3 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto">
                    {getFileIcon(previewFile, 'w-8 h-8')}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{previewFile.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Pré-visualização direta não disponível no navegador. Você pode baixar o arquivo abaixo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Bar */}
            <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyFileLink(previewFile.fileUrl)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const f = previewFile;
                    setPreviewFile(null);
                    setItemToDelete({ type: 'file', item: f });
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Excluir</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewFile.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir em Nova Aba</span>
                </a>
                <a
                  href={previewFile.fileUrl}
                  download={previewFile.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRMAR EXCLUSÃO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-slate-900 text-sm">
                Excluir {itemToDelete.type === 'folder' ? 'Pasta' : 'Arquivo'}?
              </h4>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir <span className="font-bold text-slate-800">"{itemToDelete.item.name}"</span>?
                {itemToDelete.type === 'folder' && ' Todos os itens contidos nela também serão excluídos.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
