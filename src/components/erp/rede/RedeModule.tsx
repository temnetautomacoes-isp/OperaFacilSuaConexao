import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderTree, 
  FlaskConical, 
  CheckCircle2 
} from 'lucide-react';
import { NetworkNode, NetworkLink, SimulationPacket, LinkType, TopologyData, NetworkFolder, CanvasShape, LinkStyleConfig } from '../../../types/network';
import { INITIAL_TOPOLOGY, INITIAL_FOLDERS, DEVICE_CATALOG } from './initialNetworkData';
import { DocumentacaoRedeView } from './DocumentacaoRedeView';
import { OficinaTestesView } from './OficinaTestesView';
import { PacketTracerModal } from './PacketTracerModal';
import { supabaseService } from '../../../services/supabaseService';
import { supabase } from '../../../lib/supabase';
import { safeSetItem } from '../../../utils/safeStorage';

export const RedeModule: React.FC = () => {
  // Main Sub-Tab: 'documentacao' (Primary / SGP TSMX) or 'oficina' (Testing & Simulator)
  const [activeSubTab, setActiveSubTab] = useState<'documentacao' | 'oficina'>('documentacao');
  const isInitialLoad = useRef(true);

  const isCloudLoaded = useRef(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Helper to purge legacy example/mock data from localStorage
  const isMockData = (parsed: any): boolean => {
    if (!parsed) return false;
    if (parsed.id === 'topo-default-isp') return true;
    return false;
  };

  // Folders state (SGP TSMX tree)
  const [folders, setFolders] = useState<NetworkFolder[]>(() => {
    try {
      const saved = localStorage.getItem('operafacil_network_topology');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isMockData(parsed)) {
          localStorage.removeItem('operafacil_network_topology');
          return [];
        }
        if (parsed.folders && Array.isArray(parsed.folders)) {
          return parsed.folders;
        }
      }
    } catch {}
    return INITIAL_FOLDERS;
  });

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Topology state (Nodes, Links, and Shapes)
  const [nodes, setNodes] = useState<NetworkNode[]>(() => {
    try {
      const saved = localStorage.getItem('operafacil_network_topology');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isMockData(parsed)) return [];
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          return parsed.nodes;
        }
      }
    } catch {}
    return INITIAL_TOPOLOGY.nodes;
  });

  const [links, setLinks] = useState<NetworkLink[]>(() => {
    try {
      const saved = localStorage.getItem('operafacil_network_topology');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isMockData(parsed)) return [];
        if (parsed.links && Array.isArray(parsed.links)) {
          return parsed.links;
        }
      }
    } catch {}
    return INITIAL_TOPOLOGY.links;
  });

  const [shapes, setShapes] = useState<CanvasShape[]>(() => {
    try {
      const saved = localStorage.getItem('operafacil_network_topology');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shapes && Array.isArray(parsed.shapes)) {
          return parsed.shapes;
        }
      }
    } catch {}
    return [];
  });

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Live Packet Animation Simulation
  const [activePackets, setActivePackets] = useState<SimulationPacket[]>([]);
  const [saveToast, setSaveToast] = useState(false);
  const [cliModalNode, setCliModalNode] = useState<NetworkNode | null>(null);

  // Initial cloud loading and Realtime sync
  useEffect(() => {
    async function loadCloudTopology() {
      try {
        const cloudTopo = await supabaseService.fetchNetworkTopology();
        const saved = localStorage.getItem('operafacil_network_topology');
        let parsedSaved: TopologyData | null = null;
        if (saved) {
          try {
            parsedSaved = JSON.parse(saved);
            if (isMockData(parsedSaved)) parsedSaved = null;
          } catch {}
        }

        const cloudHasData = Boolean(
          cloudTopo &&
          ((cloudTopo.folders && cloudTopo.folders.length > 0) ||
           (cloudTopo.nodes && cloudTopo.nodes.length > 0) ||
           (cloudTopo.links && cloudTopo.links.length > 0) ||
           (cloudTopo.shapes && cloudTopo.shapes.length > 0)) &&
          !isMockData(cloudTopo)
        );

        const localHasData = Boolean(
          parsedSaved &&
          ((parsedSaved.folders && parsedSaved.folders.length > 0) ||
           (parsedSaved.nodes && parsedSaved.nodes.length > 0) ||
           (parsedSaved.links && parsedSaved.links.length > 0) ||
           (parsedSaved.shapes && parsedSaved.shapes.length > 0))
        );

        if (cloudHasData && cloudTopo) {
          // Cloud data takes precedence to unify all computers
          setFolders(cloudTopo.folders || []);
          setNodes(cloudTopo.nodes || []);
          setLinks(cloudTopo.links || []);
          setShapes(cloudTopo.shapes || []);
          safeSetItem('operafacil_network_topology', cloudTopo);
        } else if (localHasData && parsedSaved) {
          // If cloud is empty but this computer already has locally created work, upload it to cloud!
          setFolders(parsedSaved.folders || []);
          setNodes(parsedSaved.nodes || []);
          setLinks(parsedSaved.links || []);
          setShapes(parsedSaved.shapes || []);
          await supabaseService.saveNetworkTopology(parsedSaved);
        }
      } catch (err) {
        console.warn('Erro ao carregar topologia do Supabase:', err);
      } finally {
        isCloudLoaded.current = true;
      }
    }

    loadCloudTopology();

    // Supabase Realtime channel
    const channel = supabase
      .channel('realtime-network-topology')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'network_topology' }, async () => {
        try {
          const fresh = await supabaseService.fetchNetworkTopology();
          if (fresh && !isMockData(fresh)) {
            const hasAny = (fresh.folders?.length || 0) > 0 || (fresh.nodes?.length || 0) > 0 || (fresh.links?.length || 0) > 0;
            if (hasAny) {
              setFolders(fresh.folders || []);
              setNodes(fresh.nodes || []);
              setLinks(fresh.links || []);
              if (fresh.shapes) setShapes(fresh.shapes);
              safeSetItem('operafacil_network_topology', fresh);
            }
          }
        } catch (e) {
          console.warn('Realtime fetch failed:', e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Automatic persistence (localStorage + Supabase Cloud) ONLY after initial cloud load completes
  useEffect(() => {
    if (!isCloudLoaded.current) {
      return;
    }

    const topo: TopologyData = {
      id: 'topo-main',
      name: 'Topologia e Documentação de Rede',
      description: 'Infraestrutura de rede, POPs e rotas ópticas.',
      updatedAt: new Date().toISOString(),
      gridSnap: true,
      folders,
      nodes,
      links,
      shapes,
    };

    safeSetItem('operafacil_network_topology', topo);
    // Auto-save to cloud
    supabaseService.saveNetworkTopology(topo).catch(console.error);
  }, [folders, nodes, links, shapes]);

  // Save topology manually (with visual toast and cloud confirmation)
  const handleSaveTopology = async () => {
    setIsSavingCloud(true);
    const data: TopologyData = {
      id: 'topo-main',
      name: 'Topologia e Documentação de Rede',
      description: 'Infraestrutura de rede, POPs e rotas ópticas.',
      updatedAt: new Date().toISOString(),
      gridSnap: true,
      folders,
      nodes,
      links,
      shapes,
    };
    safeSetItem('operafacil_network_topology', data);
    try {
      await supabaseService.saveNetworkTopology(data);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (err) {
      console.error('Erro ao salvar no Supabase:', err);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Folder Operations
  const handleToggleFolderVisibility = (folderId: string) => {
    setFolders(prev =>
      prev.map(f => (f.id === folderId ? { ...f, visible: f.visible === false ? true : false } : f))
    );
  };

  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newFolder: NetworkFolder = {
      id: `f-${Date.now()}`,
      name,
      parentId,
      color: '#f97316',
      createdAt: new Date().toISOString(),
      visible: true,
    };
    setFolders(prev => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId && f.parentId !== folderId));
    setNodes(prev => prev.map(n => (n.folderId === folderId ? { ...n, folderId: undefined } : n)));
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(f => (f.id === folderId ? { ...f, name: newName } : f)));
  };

  // Add Device from Palette or Custom Modal
  const handleAddDevice = (deviceData: any) => {
    const parentRack = deviceData.parentRackId ? nodes.find(n => n.id === deviceData.parentRackId) : null;
    const defaultX = parentRack ? parentRack.x + 130 : (280 + Math.floor(Math.random() * 200));
    const defaultY = parentRack ? parentRack.y + 40 + Math.floor(Math.random() * 40) : (180 + Math.floor(Math.random() * 150));

    const newNode: NetworkNode = {
      id: `node-${Date.now()}`,
      folderId: deviceData.folderId !== undefined ? deviceData.folderId : (parentRack?.folderId || selectedFolderId || undefined),
      name: deviceData.name,
      hostname: deviceData.hostname || `${(deviceData.type || 'DEV').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: deviceData.type || 'switch_core',
      category: deviceData.category || 'isp_core',
      x: deviceData.x !== undefined ? deviceData.x : defaultX,
      y: deviceData.y !== undefined ? deviceData.y : defaultY,
      ip: deviceData.ip || deviceData.managementIp || `192.168.${nodes.length + 1}.1`,
      managementIp: deviceData.managementIp || deviceData.ip,
      mac: deviceData.mac,
      model: deviceData.model || deviceData.name,
      vendor: deviceData.vendor || 'Genérico',
      location: deviceData.location || (parentRack ? `${parentRack.name} (${deviceData.rackPosition || 'U1'})` : (selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'POP Central' : 'POP Central')),
      parentRackId: deviceData.parentRackId,
      powerSourceNodeId: deviceData.powerSourceNodeId,
      rackUnits: deviceData.rackUnits || 1,
      rackPosition: deviceData.rackPosition,
      totalRackCapacityU: deviceData.totalRackCapacityU,
      capacityVa: deviceData.capacityVa,
      totalOutlets: deviceData.totalOutlets,
      serialNumber: deviceData.serialNumber,
      powerSupply: deviceData.powerSupply || 'AC 110/220V Bivolt',
      powerConsumptionWatts: deviceData.powerConsumptionWatts,
      status: 'online',
      osType: deviceData.osType || 'generic',
      fiberPowerDbm: deviceData.fiberPowerDbm !== undefined ? deviceData.fiberPowerDbm : deviceData.defaultPowerDbm,
      ports: (deviceData.ports || deviceData.defaultPorts || []).map((p: any, idx: number) => ({
        ...p,
        id: p.id || `port-${Date.now()}-${idx}`,
      })),
      notes: deviceData.notes || deviceData.description || '',
      isCustomAsset: deviceData.isCustomAsset || false,
      isPassive: deviceData.isPassive || false,
      customImageUrl: deviceData.customImageUrl || deviceData.imageUrl,
      imageUrl: deviceData.imageUrl || deviceData.customImageUrl,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // Add Link / Cable with Optional Custom Style
  const handleAddLink = (
    sourceNodeId?: string,
    targetNodeId?: string,
    linkType: LinkType = 'fiber_sm',
    customStyle?: LinkStyleConfig,
    startPoint?: { x: number; y: number },
    endPoint?: { x: number; y: number },
    points?: Array<{ x: number; y: number }>
  ) => {
    if (sourceNodeId && targetNodeId && !points?.length) {
      const existing = links.find(
        (l) => (l.sourceNodeId === sourceNodeId && l.targetNodeId === targetNodeId) ||
               (l.sourceNodeId === targetNodeId && l.targetNodeId === sourceNodeId)
      );
      if (existing) return;
    }

    const newLink: NetworkLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sourceNodeId,
      targetNodeId,
      startPoint,
      endPoint,
      points,
      type: linkType,
      speed: linkType === 'fiber_sm' ? '10 Gbps' : linkType === 'utp_cat6' ? '1 Gbps' : '1 Gbps FTTH',
      status: 'active',
      label: customStyle?.strokeColor ? '' : (linkType === 'fiber_sm' ? 'Fibra 10G' : linkType === 'fiber_drop' ? 'Drop FTTH' : 'Cabo UTP'),
      style: customStyle,
    };

    setLinks((prev) => [...prev, newLink]);
  };

  // Shape Handlers
  const handleAddShape = (shape: CanvasShape) => {
    setShapes((prev) => {
      const updated = [...prev, shape];
      const topo: TopologyData = {
        id: 'topo-main',
        name: 'Topologia e Documentação de Rede',
        updatedAt: new Date().toISOString(),
        gridSnap: true,
        folders,
        nodes,
        links,
        shapes: updated,
      };
      safeSetItem('operafacil_network_topology', topo);
      supabaseService.saveNetworkTopology(topo).catch(console.error);
      return updated;
    });
  };

  const handleUpdateShape = (shapeOrId: CanvasShape | string, updates?: Partial<CanvasShape>) => {
    setShapes((prev) => {
      let updated: CanvasShape[];
      if (typeof shapeOrId === 'string') {
        const shapeId = shapeOrId;
        updated = prev.map((s) => (s.id === shapeId ? { ...s, ...(updates || {}) } : s));
      } else {
        const updatedShape = shapeOrId;
        updated = prev.map((s) => (s.id === updatedShape.id ? { ...s, ...updatedShape } : s));
      }
      const topo: TopologyData = {
        id: 'topo-main',
        name: 'Topologia e Documentação de Rede',
        updatedAt: new Date().toISOString(),
        gridSnap: true,
        folders,
        nodes,
        links,
        shapes: updated,
      };
      safeSetItem('operafacil_network_topology', topo);
      supabaseService.saveNetworkTopology(topo).catch(console.error);
      return updated;
    });
  };

  const handleDeleteShape = (shapeId: string) => {
    setShapes((prev) => {
      const updated = prev.filter((s) => s.id !== shapeId);
      const topo: TopologyData = {
        id: 'topo-main',
        name: 'Topologia e Documentação de Rede',
        updatedAt: new Date().toISOString(),
        gridSnap: true,
        folders,
        nodes,
        links,
        shapes: updated,
      };
      safeSetItem('operafacil_network_topology', topo);
      supabaseService.saveNetworkTopology(topo).catch(console.error);
      return updated;
    });
  };

  // Move Node
  const handleMoveNode = (nodeId: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
  };

  // Update or Upsert Node Properties
  // Update or Upsert Node Properties
  const handleUpdateNode = (updatedNode: NetworkNode) => {
    setNodes((prev) => {
      const exists = prev.some((n) => n.id === updatedNode.id);
      const nextNodes = exists
        ? prev.map((n) => (n.id === updatedNode.id ? updatedNode : n))
        : [...prev, updatedNode];
      
      const topo: TopologyData = {
        id: 'topo-main',
        name: 'Topologia e Documentação de Rede',
        updatedAt: new Date().toISOString(),
        gridSnap: true,
        folders,
        nodes: nextNodes,
        links,
        shapes,
      };
      safeSetItem('operafacil_network_topology', topo);
      supabaseService.saveNetworkTopology(topo).catch(console.error);
      return nextNodes;
    });
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    setNodes((prevNodes) => {
      const nextNodes = prevNodes.filter((n) => n.id !== nodeId);
      setLinks((prevLinks) => {
        const nextLinks = prevLinks.filter((l) => l.sourceNodeId !== nodeId && l.targetNodeId !== nodeId);
        const topo: TopologyData = {
          id: 'topo-main',
          name: 'Topologia e Documentação de Rede',
          updatedAt: new Date().toISOString(),
          gridSnap: true,
          folders,
          nodes: nextNodes,
          links: nextLinks,
          shapes,
        };
        safeSetItem('operafacil_network_topology', topo);
        supabaseService.saveNetworkTopology(topo).catch(console.error);
        return nextLinks;
      });
      return nextNodes;
    });
    setSelectedNodeId(null);
  };

  // Update Link Properties
  const handleUpdateLink = (updatedLink: NetworkLink) => {
    setLinks((prev) => {
      const nextLinks = prev.map((l) => (l.id === updatedLink.id ? updatedLink : l));
      const topo: TopologyData = {
        id: 'topo-main',
        name: 'Topologia e Documentação de Rede',
        updatedAt: new Date().toISOString(),
        gridSnap: true,
        folders,
        nodes,
        links: nextLinks,
        shapes,
      };
      safeSetItem('operafacil_network_topology', topo);
      supabaseService.saveNetworkTopology(topo).catch(console.error);
      return nextLinks;
    });
  };

  // Delete Link
  const handleDeleteLink = (linkId: string) => {
    setLinks((prev) => {
      const nextLinks = prev.filter((l) => l.id !== linkId);
      const topo: TopologyData = {
        id: 'topo-main',
        name: 'Topologia e Documentação de Rede',
        updatedAt: new Date().toISOString(),
        gridSnap: true,
        folders,
        nodes,
        links: nextLinks,
        shapes,
      };
      safeSetItem('operafacil_network_topology', topo);
      supabaseService.saveNetworkTopology(topo).catch(console.error);
      return nextLinks;
    });
    setSelectedLinkId(null);
  };

  // Packet Animation Engine (Traveling Echo simulation)
  const handleStartPingSimulation = (sourceId: string, targetId: string) => {
    const packet: SimulationPacket = {
      id: `pkt-${Date.now()}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      currentNodeId: sourceId,
      path: [sourceId, targetId],
      currentPathIndex: 0,
      progress: 0,
      type: 'icmp_ping',
      status: 'in_transit',
      rttMs: 2.8,
      ttl: 64,
      message: 'ICMP Echo Request',
    };

    setActivePackets([packet]);

    let startTime = performance.now();
    const duration = 1200;

    const animInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const prog = Math.min(1, elapsed / duration);

      setActivePackets((prev) =>
        prev.map((p) => ({
          ...p,
          progress: prog,
        }))
      );

      if (prog >= 1) {
        clearInterval(animInterval);
        setTimeout(() => {
          setActivePackets([]);
        }, 300);
      }
    }, 16);
  };

  // Load Preset Template
  const handleLoadTemplate = (type: 'default_isp' | 'corporate_vlan' | 'empty') => {
    if (type === 'default_isp') {
      setFolders(INITIAL_FOLDERS);
      setNodes(INITIAL_TOPOLOGY.nodes);
      setLinks(INITIAL_TOPOLOGY.links);
    } else if (type === 'corporate_vlan') {
      setFolders([
        { id: 'f-corp-matriz', name: 'MATRIZ EMPRESARIAL', parentId: null, createdAt: new Date().toISOString(), visible: true },
        { id: 'f-corp-rack', name: 'RACK TI SALA SERVIDORES', parentId: 'f-corp-matriz', createdAt: new Date().toISOString(), visible: true },
        { id: 'f-corp-setores', name: 'ESTAÇÕES DE TRABALHO', parentId: 'f-corp-matriz', createdAt: new Date().toISOString(), visible: true },
      ]);
      setNodes([
        {
          id: 'corp-fw',
          folderId: 'f-corp-rack',
          name: 'Firewall / Gateway Fortinet',
          hostname: 'FG-60F-CORP',
          type: 'firewall',
          category: 'enterprise',
          x: 200,
          y: 200,
          ip: '192.168.10.1',
          model: 'FortiGate 60F',
          vendor: 'Fortinet',
          location: 'Rack T.I. - Sala Servidores',
          status: 'online',
          ports: [
            { id: 'p-wan', name: 'wan1 (Internet)', type: 'copper_1g', status: 'up' },
            { id: 'p-lan', name: 'lan1 (Trunk VLAN)', type: 'copper_1g', status: 'up' },
          ],
        },
        {
          id: 'corp-sw',
          folderId: 'f-corp-rack',
          name: 'Switch Core L3 PoE',
          hostname: 'SW-CORE-24P',
          type: 'switch_core',
          category: 'enterprise',
          x: 480,
          y: 200,
          ip: '192.168.10.2',
          model: 'Catalyst 2960X 24P',
          vendor: 'Cisco',
          location: 'Rack T.I.',
          status: 'online',
          ports: [
            { id: 'p-sw-up', name: 'Gi1/0/1', type: 'copper_1g', status: 'up' },
            { id: 'p-sw-p1', name: 'Gi1/0/2 (VLAN 10 RH)', type: 'copper_1g', status: 'up' },
            { id: 'p-sw-p2', name: 'Gi1/0/3 (VLAN 20 Fin)', type: 'copper_1g', status: 'up' },
          ],
        },
        {
          id: 'corp-pc1',
          folderId: 'f-corp-setores',
          name: 'PC Recursos Humanos',
          hostname: 'PC-RH-01',
          type: 'pc_workstation',
          category: 'enterprise',
          x: 760,
          y: 120,
          ip: '192.168.10.50',
          model: 'Workstation',
          vendor: 'Dell',
          location: 'Setor RH',
          status: 'online',
          ports: [{ id: 'p-pc1', name: 'eth0', type: 'copper_1g', status: 'up' }],
        },
        {
          id: 'corp-pc2',
          folderId: 'f-corp-setores',
          name: 'PC Setor Financeiro',
          hostname: 'PC-FIN-01',
          type: 'pc_workstation',
          category: 'enterprise',
          x: 760,
          y: 280,
          ip: '192.168.20.50',
          model: 'Workstation',
          vendor: 'Dell',
          location: 'Setor Financeiro',
          status: 'online',
          ports: [{ id: 'p-pc2', name: 'eth0', type: 'copper_1g', status: 'up' }],
        },
      ]);
      setLinks([
        { id: 'l-1', sourceNodeId: 'corp-fw', targetNodeId: 'corp-sw', type: 'utp_cat6', speed: '1 Gbps Trunk', status: 'active' },
        { id: 'l-2', sourceNodeId: 'corp-sw', targetNodeId: 'corp-pc1', type: 'utp_cat6', speed: '1 Gbps (VLAN 10)', status: 'active' },
        { id: 'l-3', sourceNodeId: 'corp-sw', targetNodeId: 'corp-pc2', type: 'utp_cat6', speed: '1 Gbps (VLAN 20)', status: 'active' },
      ]);
    } else {
      setFolders([]);
      setNodes([]);
      setLinks([]);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      folders,
      nodes,
      links,
      shapes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentacao_rede_operafacil_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.folders || json.nodes || json.links) {
          const newFolders = Array.isArray(json.folders) ? json.folders : [];
          const newNodes = Array.isArray(json.nodes) ? json.nodes : [];
          const newLinks = Array.isArray(json.links) ? json.links : [];
          const newShapes = Array.isArray(json.shapes) ? json.shapes : [];

          setFolders(newFolders);
          setNodes(newNodes);
          setLinks(newLinks);
          setShapes(newShapes);

          const topo: TopologyData = {
            id: 'topo-main',
            name: 'Topologia e Documentação de Rede',
            description: 'Infraestrutura de rede, POPs e rotas ópticas.',
            updatedAt: new Date().toISOString(),
            gridSnap: true,
            folders: newFolders,
            nodes: newNodes,
            links: newLinks,
            shapes: newShapes,
          };
          safeSetItem('operafacil_network_topology', topo);
          await supabaseService.saveNetworkTopology(topo);
          setSaveToast(true);
          setTimeout(() => setSaveToast(false), 2500);
        }
      } catch (err) {
        alert('Arquivo JSON inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-slate-100 overflow-hidden relative select-none animate-in fade-in duration-200">
      {/* Top Main Navigation Bar for the Rede Module */}
      <header className="p-3 pr-20 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none z-20 shadow-xs">
        {/* Left: Module Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-900 tracking-tight flex items-center gap-2">
                Módulo de Rede & Telecom
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Gestão de POPs, FTTH, Documentação SGP & Testes</p>
            </div>
          </div>
        </div>

        {/* Center: Main Section Switcher Tabs */}
        <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          <button
            type="button"
            id="tab-documentacao-redes"
            onClick={() => setActiveSubTab('documentacao')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'documentacao'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Documentação de Redes (SGP TSMX)
          </button>

          <button
            type="button"
            id="tab-oficina-testes"
            onClick={() => setActiveSubTab('oficina')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'oficina'
                ? 'bg-slate-900 text-orange-400 shadow-md ring-1 ring-orange-500 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Oficina de Testes (Simulador & Diagramação)
          </button>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-500 hidden lg:inline-block">
            {folders.length} Pastas • {nodes.length} Dispositivos • {links.length} Enlaces
          </span>
        </div>
      </header>

      {/* Dynamic Sub-View Render */}
      {activeSubTab === 'documentacao' ? (
        <DocumentacaoRedeView
          folders={folders}
          nodes={nodes}
          links={links}
          shapes={shapes}
          selectedFolderId={selectedFolderId}
          selectedNodeId={selectedNodeId}
          selectedLinkId={selectedLinkId}
          onSelectFolder={setSelectedFolderId}
          onSelectNode={setSelectedNodeId}
          onSelectLink={setSelectedLinkId}
          onToggleFolderVisibility={handleToggleFolderVisibility}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFolder={handleRenameFolder}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateLink={handleUpdateLink}
          onDeleteLink={handleDeleteLink}
          onAddDevice={handleAddDevice}
          onAddLink={handleAddLink}
          onAddShape={handleAddShape}
          onUpdateShape={handleUpdateShape}
          onDeleteShape={handleDeleteShape}
          onMoveNode={handleMoveNode}
          isSavingCloud={isSavingCloud}
          onSaveTopology={handleSaveTopology}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onOpenCli={(node) => setCliModalNode(node)}
        />
      ) : (
        <OficinaTestesView
          nodes={nodes}
          links={links}
          folders={folders}
          selectedNodeId={selectedNodeId}
          selectedLinkId={selectedLinkId}
          onSelectNode={setSelectedNodeId}
          onSelectLink={setSelectedLinkId}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateLink={handleUpdateLink}
          onDeleteLink={handleDeleteLink}
          onAddDevice={handleAddDevice}
          onAddLink={handleAddLink}
          onMoveNode={handleMoveNode}
          onSaveTopology={handleSaveTopology}
          onExportJson={handleExportJson}
          onLoadTemplate={handleLoadTemplate}
          onStartPingSimulation={handleStartPingSimulation}
          activePackets={activePackets}
        />
      )}

      {/* Global CLI Modal if opened from Documentacao table */}
      {cliModalNode && (
        <PacketTracerModal
          isOpen={!!cliModalNode}
          onClose={() => setCliModalNode(null)}
          selectedNode={cliModalNode}
          nodes={nodes}
          links={links}
          onStartPingSimulation={handleStartPingSimulation}
        />
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="absolute bottom-6 right-6 z-40 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-orange-500/40 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Topologia e documentação salvas com sucesso!
        </div>
      )}
    </div>
  );
};
