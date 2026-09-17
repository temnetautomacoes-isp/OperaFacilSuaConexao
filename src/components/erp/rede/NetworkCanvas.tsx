import React, { useState, useRef, useEffect } from 'react';
import { 
  NetworkNode, 
  NetworkLink, 
  SimulationPacket,
  LinkType,
  NetworkFolder,
  CanvasShape,
  LinkStyleConfig
} from '../../../types/network';
import { 
  Server, 
  Router, 
  Network, 
  Radio, 
  Wifi, 
  HardDrive, 
  Layers, 
  Cloud, 
  Monitor, 
  Zap, 
  Box, 
  PhoneCall,
  BatteryCharging,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Edit3
} from 'lucide-react';

interface NetworkCanvasProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  folders?: NetworkFolder[];
  shapes?: CanvasShape[];
  onAddShape?: (shape: CanvasShape) => void;
  onUpdateShape?: (shapeId: string, updates: Partial<CanvasShape>) => void;
  onDeleteShape?: (shapeId: string) => void;
  activeLineConfig?: LinkStyleConfig;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onDoubleClickNode?: (nodeId: string) => void;
  onSelectLink: (linkId: string | null) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onAddLink: (
    sourceNodeId: string, 
    targetNodeId: string, 
    linkType: LinkType, 
    customStyle?: LinkStyleConfig, 
    startPoint?: { x: number; y: number }, 
    endPoint?: { x: number; y: number }
  ) => void;
  onDeleteLink?: (linkId: string) => void;
  isSimulationMode: boolean;
  activePackets: SimulationPacket[];
  zoom: number;
  panOffset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  onZoomChange?: (zoom: number) => void;
  selectedCableType: string;
  isConnectingMode: boolean;
  onOpenRackElevation?: (rackNode: NetworkNode) => void;
}

const LINK_CONFIG: Record<string, { color: string; label: string; strokeDash: string; width: number }> = {
  fiber_sm: { color: '#38bdf8', label: 'Fibra 10G', strokeDash: 'none', width: 3 },
  fiber_mm: { color: '#06b6d4', label: 'Fibra MM', strokeDash: 'none', width: 3 },
  fiber_drop: { color: '#c084fc', label: 'Drop FTTH', strokeDash: 'none', width: 2.5 },
  dac_10g: { color: '#eab308', label: 'DAC 10G', strokeDash: 'none', width: 3.5 },
  utp_cat6: { color: '#34d399', label: 'UTP Cat6', strokeDash: 'none', width: 2.8 },
  wireless_ptp: { color: '#fb923c', label: 'Rádio PTP', strokeDash: '6,5', width: 3 },
  coaxial: { color: '#a3e635', label: 'Coaxial', strokeDash: 'none', width: 2.5 },
  power_cable: { color: '#f43f5e', label: 'Energia', strokeDash: 'none', width: 3 },
};

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  links,
  folders = [],
  shapes = [],
  onUpdateShape,
  onDeleteShape,
  activeLineConfig,
  selectedNodeId,
  selectedLinkId,
  onSelectNode,
  onDoubleClickNode,
  onSelectLink,
  onMoveNode,
  onAddLink,
  onDeleteLink,
  isSimulationMode,
  zoom,
  panOffset,
  onPanChange,
  onZoomChange,
  selectedCableType,
  isConnectingMode,
  onOpenRackElevation,
}) => {
  // Folder visibility map
  const hiddenFolderIds = new Set(
    folders.filter(f => f.visible === false).map(f => f.id)
  );

  const visibleNodes = nodes.filter(n => !n.folderId || !hiddenFolderIds.has(n.folderId));
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleLinks = links.filter(l => visibleNodeIds.has(l.sourceNodeId) && visibleNodeIds.has(l.targetNodeId));
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Shape selection & inline editing state
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [editingShapeText, setEditingShapeText] = useState('');

  // Connecting cable state (Drag to Connect)
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Mouse Wheel Zoom (centered at mouse position)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(3.5, Math.max(0.2, Math.round(zoom * zoomFactor * 100) / 100));
      if (newZoom === zoom) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);

      onPanChange({ x: Math.round(newPanX), y: Math.round(newPanY) });
      if (onZoomChange) {
        onZoomChange(newZoom);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [zoom, panOffset, onPanChange, onZoomChange]);

  // Global window listeners for drag & pan & cable dragging
  useEffect(() => {
    if (!draggingNodeId && !draggingShapeId && !isPanning && !connectingSourceId) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (connectingSourceId) {
        const curX = (e.clientX - rect.left - panOffset.x) / zoom;
        const curY = (e.clientY - rect.top - panOffset.y) / zoom;
        setMousePos({ x: Math.round(curX), y: Math.round(curY) });

        // Generous target node detection (radial and bounding box)
        const hovered = visibleNodes.find(n => {
          if (n.id === connectingSourceId) return false;
          const withinBox = curX >= n.x - 25 && curX <= n.x + 115 && curY >= n.y - 25 && curY <= n.y + 125;
          const withinRadius = Math.hypot(curX - (n.x + 45), curY - (n.y + 28)) <= 80;
          return withinBox || withinRadius;
        });
        setHoveredTargetNodeId(hovered ? hovered.id : null);
      }

      if (isPanning) {
        onPanChange({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      if (draggingNodeId) {
        let newX = (e.clientX - rect.left - panOffset.x) / zoom - dragOffset.x;
        let newY = (e.clientY - rect.top - panOffset.y) / zoom - dragOffset.y;

        // Snap to 20px grid
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;

        onMoveNode(draggingNodeId, newX, newY);
      }

      if (draggingShapeId && onUpdateShape) {
        let newX = (e.clientX - rect.left - panOffset.x) / zoom - dragOffset.x;
        let newY = (e.clientY - rect.top - panOffset.y) / zoom - dragOffset.y;

        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;

        onUpdateShape(draggingShapeId, { x: newX, y: newY });
      }
    };

    const onWindowMouseUp = () => {
      setIsPanning(false);
      setDraggingNodeId(null);
      setDraggingShapeId(null);

      if (connectingSourceId) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const curX = mousePos.x;
          const curY = mousePos.y;

          // Connect if dropped over target node
          let target = hoveredTargetNodeId ? visibleNodes.find(n => n.id === hoveredTargetNodeId) : null;
          if (!target) {
            target = visibleNodes.find(n => {
              if (n.id === connectingSourceId) return false;
              const withinBox = curX >= n.x - 30 && curX <= n.x + 120 && curY >= n.y - 30 && curY <= n.y + 130;
              const withinRadius = Math.hypot(curX - (n.x + 45), curY - (n.y + 28)) <= 85;
              return withinBox || withinRadius;
            }) || null;
          }

          if (target && target.id !== connectingSourceId) {
            onAddLink(
              connectingSourceId, 
              target.id, 
              (selectedCableType || 'fiber_sm') as LinkType,
              activeLineConfig
            );
          }
        }
        setConnectingSourceId(null);
        setHoveredTargetNodeId(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingSourceId(null);
        setHoveredTargetNodeId(null);
        setEditingShapeId(null);
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    draggingNodeId, 
    draggingShapeId, 
    isPanning, 
    connectingSourceId, 
    hoveredTargetNodeId, 
    visibleNodes, 
    selectedCableType, 
    activeLineConfig, 
    onAddLink, 
    panStart, 
    panOffset, 
    zoom, 
    dragOffset, 
    mousePos, 
    onPanChange, 
    onMoveNode, 
    onUpdateShape
  ]);

  // Handle Canvas Mouse Down (Pan canvas or deselect)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (connectingSourceId) {
      setConnectingSourceId(null);
      setHoveredTargetNodeId(null);
      return;
    }
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        onSelectNode(null);
        onSelectLink(null);
        setSelectedShapeId(null);
        setEditingShapeId(null);
      }
    }
  };

  // Handle Mouse Move (Local cursor tracking for wire connections)
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && connectingSourceId) {
      const curX = (e.clientX - rect.left - panOffset.x) / zoom;
      const curY = (e.clientY - rect.top - panOffset.y) / zoom;
      setMousePos({ x: Math.round(curX), y: Math.round(curY) });
    }
  };

  // Start Cable Drag from Connector Dot
  const handleStartCableDrag = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setConnectingSourceId(nodeId);
    const startX = node.x + 64;
    const startY = node.y + 28;
    setMousePos({ x: startX, y: startY });
  };

  // Handle Node Mouse Down (Single click for select & drag, or connecting link)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    // If currently in connection mode, clicking this node completes the link
    if (connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        onAddLink(
          connectingSourceId, 
          nodeId, 
          (selectedCableType || 'fiber_sm') as LinkType,
          activeLineConfig
        );
      }
      setConnectingSourceId(null);
      setHoveredTargetNodeId(null);
      return;
    }

    if (isConnectingMode) {
      setConnectingSourceId(nodeId);
      return;
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !containerRef.current) return;

    onSelectNode(nodeId);
    setSelectedShapeId(null);
    setDraggingNodeId(nodeId);

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - panOffset.x) / zoom;
    const clickY = (e.clientY - rect.top - panOffset.y) / zoom;

    setDragOffset({
      x: clickX - node.x,
      y: clickY - node.y,
    });
  };

  // Handle Node Mouse Up (Finish drag connection over target node)
  const handleNodeMouseUp = (e: React.MouseEvent, targetNodeId: string) => {
    if (connectingSourceId && connectingSourceId !== targetNodeId) {
      e.stopPropagation();
      onAddLink(
        connectingSourceId, 
        targetNodeId, 
        (selectedCableType || 'fiber_sm') as LinkType,
        activeLineConfig
      );
      setConnectingSourceId(null);
      setHoveredTargetNodeId(null);
    }
  };

  // Handle Node Double Click (2 Cliques para abrir inspetor e detalhes)
  const handleNodeDoubleClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    onSelectNode(nodeId);
    if (onDoubleClickNode) {
      onDoubleClickNode(nodeId);
    }

    const isRack = node.type === 'rack_floor' || node.type === 'rack_wall' || node.type === 'rack_19';
    if (isRack && onOpenRackElevation) {
      onOpenRackElevation(node);
    }
  };

  // Handle Shape Mouse Down
  const handleShapeMouseDown = (e: React.MouseEvent, shape: CanvasShape) => {
    e.stopPropagation();
    setSelectedShapeId(shape.id);
    onSelectNode(null);
    onSelectLink(null);
    setDraggingShapeId(shape.id);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - panOffset.x) / zoom;
      const clickY = (e.clientY - rect.top - panOffset.y) / zoom;
      setDragOffset({
        x: clickX - shape.x,
        y: clickY - shape.y,
      });
    }
  };

  // Save Shape Text
  const handleSaveShapeText = (shapeId: string) => {
    if (onUpdateShape) {
      onUpdateShape(shapeId, { label: editingShapeText });
    }
    setEditingShapeId(null);
  };

  // Calculate Link SVG Path according to curvature
  const calculatePath = (
    srcX: number, 
    srcY: number, 
    tgtX: number, 
    tgtY: number, 
    lineStyle: 'straight' | 'curved' | 'stepped' = 'straight'
  ) => {
    if (lineStyle === 'curved') {
      const dx = tgtX - srcX;
      const curvature = Math.max(35, Math.min(160, Math.abs(dx) * 0.5));
      const cp1x = srcX + curvature;
      const cp1y = srcY;
      const cp2x = tgtX - curvature;
      const cp2y = tgtY;
      return `M ${srcX} ${srcY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tgtX} ${tgtY}`;
    }

    if (lineStyle === 'stepped') {
      const midX = (srcX + tgtX) / 2;
      return `M ${srcX} ${srcY} H ${midX} V ${tgtY} H ${tgtX}`;
    }

    return `M ${srcX} ${srcY} L ${tgtX} ${tgtY}`;
  };

  // Get Cable Link Visual Styling
  const getLinkStroke = (link: NetworkLink) => {
    const baseConfig = LINK_CONFIG[link.type] || { color: '#64748b', label: 'Cabo', strokeDash: 'none', width: 2.5 };
    const style = link.style;

    const color = style?.strokeColor || baseConfig.color;
    let strokeDash = baseConfig.strokeDash;
    if (style?.strokeDash === 'dashed') strokeDash = '6,5';
    else if (style?.strokeDash === 'dotted') strokeDash = '2,4';
    else if (style?.strokeDash === 'solid') strokeDash = 'none';

    const width = style?.strokeWidth || baseConfig.width;
    const arrowType = style?.arrowType !== undefined ? style.arrowType : 'end';
    const lineStyle = style?.lineStyle || 'straight';

    return { color, strokeDash, width, arrowType, lineStyle, label: link.label || baseConfig.label };
  };

  // Render Device Stencil Icon
  const renderDeviceIcon = (node: NetworkNode) => {
    const iconClass = "w-7 h-7 text-white";
    switch (node.type) {
      case 'router_bgp':
      case 'router_cgnat':
        return <Router className={iconClass} />;
      case 'olt_gpon':
        return <Zap className={iconClass} />;
      case 'switch_core':
      case 'switch_access':
        return <Network className={iconClass} />;
      case 'telephony_pabx':
        return <PhoneCall className={iconClass} />;
      case 'rectifier_power':
      case 'ups_nobreak':
        return <BatteryCharging className={iconClass} />;
      case 'pdu_power_strip':
      case 'electrical_outlet':
        return <Zap className={iconClass} />;
      case 'patch_panel_rj45':
      case 'dio_fiber':
      case 'patch_panel_dio':
      case 'cable_organizer':
      case 'front_panel_blank':
      case 'rack_tray':
        return <Layers className={iconClass} />;
      case 'onu_ont':
      case 'wifi_router':
        return <Wifi className={iconClass} />;
      case 'radio_ptp':
        return <Radio className={iconClass} />;
      case 'server_datacenter':
        return <Server className={iconClass} />;
      case 'pc_workstation':
        return <Monitor className={iconClass} />;
      case 'cto':
      case 'ceo':
      case 'splitter':
        return <Layers className={iconClass} />;
      case 'rack_floor':
      case 'rack_wall':
      case 'rack_19':
        return <Box className={iconClass} />;
      case 'internet_cloud':
        return <Cloud className={iconClass} />;
      default:
        return <HardDrive className={iconClass} />;
    }
  };

  // Node Header Background Color by category
  const getNodeColor = (cat: NetworkNode['category']) => {
    switch (cat) {
      case 'isp_core':
        return 'from-orange-500 to-amber-600 border-orange-400';
      case 'access_ftth':
        return 'from-blue-600 to-indigo-700 border-blue-400';
      case 'telephony_voip':
        return 'from-pink-600 to-rose-700 border-pink-400';
      case 'rack_power':
        return 'from-emerald-600 to-teal-700 border-emerald-400';
      case 'wireless':
        return 'from-amber-500 to-yellow-600 border-amber-400';
      case 'enterprise':
        return 'from-emerald-600 to-teal-700 border-emerald-400';
      case 'passive':
        return 'from-slate-700 to-slate-900 border-slate-600';
      case 'cloud':
        return 'from-sky-500 to-blue-600 border-sky-400';
      default:
        return 'from-slate-700 to-slate-800 border-slate-600';
    }
  };

  const connectingSourceNode = nodes.find(n => n.id === connectingSourceId);
  const hoveredTargetNode = hoveredTargetNodeId ? nodes.find(n => n.id === hoveredTargetNodeId) : null;

  // Collect unique colors used by active lines to inject SVG markers dynamically
  const uniqueMarkerColors = Array.from(
    new Set([
      '#facc15',
      '#f97316',
      '#38bdf8',
      '#34d399',
      '#a855f7',
      '#f43f5e',
      '#22d3ee',
      '#ffffff',
      '#10b981',
      activeLineConfig?.strokeColor || '#facc15',
      ...links.map(l => l.style?.strokeColor || LINK_CONFIG[l.type]?.color || '#facc15')
    ])
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      className={`flex-1 h-full min-h-0 relative overflow-hidden bg-[#0a101d] cursor-${isPanning ? 'grabbing' : 'default'} select-none`}
      style={{
        backgroundImage: `radial-gradient(circle, #1e293b 1.2px, transparent 1.2px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* 1. LAYER DE FORMAS (SHAPES & ZONAS POP - renderizadas atrás dos nós) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {shapes.map((shape) => {
          const isSelected = selectedShapeId === shape.id;
          const isEditing = editingShapeId === shape.id;

          const borderDash = shape.borderStyle === 'dashed' ? 'dashed' : shape.borderStyle === 'dotted' ? 'dotted' : 'solid';

          return (
            <div
              key={shape.id}
              onMouseDown={(e) => handleShapeMouseDown(e, shape)}
              style={{
                left: `${shape.x}px`,
                top: `${shape.y}px`,
                width: `${shape.width}px`,
                height: shape.type === 'text_label' ? 'auto' : `${shape.height}px`,
                backgroundColor: shape.color || 'rgba(30, 41, 59, 0.4)',
                borderColor: isSelected ? '#facc15' : (shape.borderColor || '#facc15'),
                borderWidth: `${shape.borderWidth || 2}px`,
                borderStyle: borderDash,
                color: shape.textColor || '#f8fafc',
                fontSize: `${shape.fontSize || 13}px`,
              }}
              className={`absolute pointer-events-auto rounded-2xl p-3 flex flex-col justify-between group transition-shadow select-none cursor-move ${
                shape.type === 'circle' ? 'rounded-full text-center flex items-center justify-center' : ''
              } ${
                shape.type === 'sticky_note' ? 'shadow-xl text-slate-900 font-medium' : 'backdrop-blur-2xs'
              } ${
                isSelected ? 'ring-2 ring-amber-400 shadow-2xl' : 'hover:ring-1 hover:ring-amber-300/60'
              }`}
            >
              {/* Shape Top Header & Controls */}
              <div className="w-full flex items-center justify-between gap-1 mb-1 pointer-events-auto">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-75 truncate max-w-[80%]">
                  {shape.type === 'rectangle' ? 'ÁREA POP' : shape.type === 'circle' ? 'COBERTURA' : shape.type === 'sticky_note' ? 'NOTA' : 'RÓTULO'}
                </span>

                {/* Quick actions (Edit / Delete) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingShapeId(shape.id);
                      setEditingShapeText(shape.label || '');
                    }}
                    className="p-1 rounded bg-black/40 hover:bg-black/70 text-white cursor-pointer"
                    title="Editar Texto"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  {onDeleteShape && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteShape(shape.id);
                      }}
                      className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer"
                      title="Excluir Forma"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Shape Label / Body Content */}
              {isEditing ? (
                <div className="flex-1 flex flex-col gap-1 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
                  <textarea
                    value={editingShapeText}
                    onChange={(e) => setEditingShapeText(e.target.value)}
                    className="w-full h-full min-h-[50px] p-1.5 text-xs bg-black/60 text-white rounded-lg border border-amber-400 outline-none resize-none font-bold"
                    autoFocus
                    placeholder="Digite o texto da forma..."
                  />
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleSaveShapeText(shape.id)}
                      className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded hover:bg-amber-400"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingShapeId(null)}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingShapeId(shape.id);
                    setEditingShapeText(shape.label || '');
                  }}
                  className="flex-1 flex items-center justify-center text-center font-bold break-words px-1 overflow-hidden"
                >
                  {shape.label || 'Clique 2x para editar'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. SVG Canvas Layer for Clean Responsive Vector Links & Custom Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Dynamic Arrowhead Markers for All Used Colors (End & Start) */}
          {uniqueMarkerColors.map((color) => {
            const cleanId = color.replace(/[^a-zA-Z0-9]/g, '');
            return (
              <React.Fragment key={color}>
                {/* End Marker (Right facing) */}
                <marker
                  id={`arrow-end-${cleanId}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={color} />
                </marker>
                {/* Start Marker (Left facing) */}
                <marker
                  id={`arrow-start-${cleanId}`}
                  viewBox="0 0 10 10"
                  refX="2"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill={color} />
                </marker>
              </React.Fragment>
            );
          })}
        </defs>

        {/* Cable Links with Customizable Visual Mindmap Styles */}
        {visibleLinks.map((link) => {
          const src = visibleNodes.find((n) => n.id === link.sourceNodeId);
          const tgt = visibleNodes.find((n) => n.id === link.targetNodeId);
          if (!src || !tgt) return null;

          const isSelected = selectedLinkId === link.id;
          const stroke = getLinkStroke(link);
          const cleanColorId = stroke.color.replace(/[^a-zA-Z0-9]/g, '');

          // Source exit from connector dot (right side of card)
          const srcX = src.x + 64;
          const srcY = src.y + 28;

          // Target entrance: if target is to the right of source, connect to left side; else connect to right side
          const tgtX = tgt.x >= src.x ? tgt.x + 12 : tgt.x + 64;
          const tgtY = tgt.y + 28;

          const pathD = calculatePath(srcX, srcY, tgtX, tgtY, stroke.lineStyle);
          const midX = (srcX + tgtX) / 2;
          const midY = (srcY + tgtY) / 2;

          const hasEndArrow = stroke.arrowType === 'end' || stroke.arrowType === 'both';
          const hasStartArrow = stroke.arrowType === 'both';

          return (
            <g key={link.id} className="cursor-pointer pointer-events-auto group" onClick={(e) => { e.stopPropagation(); onSelectLink(link.id); }}>
              {/* Invisible wide click hitbox */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={24}
              />

              {/* Selection / Hover Glow */}
              {isSelected && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.width + 5}
                  opacity={0.6}
                  filter="url(#glow)"
                />
              )}

              {/* Dark outline for crisp contrast on dark theme */}
              <path
                d={pathD}
                fill="none"
                stroke="#020617"
                strokeWidth={stroke.width + 2}
                strokeLinecap="round"
              />

              {/* Main Arrow Line */}
              <path
                d={pathD}
                fill="none"
                stroke={stroke.color}
                strokeWidth={isSelected ? stroke.width + 1.2 : stroke.width}
                strokeDasharray={stroke.strokeDash}
                strokeLinecap="round"
                markerEnd={hasEndArrow ? `url(#arrow-end-${cleanColorId})` : undefined}
                markerStart={hasStartArrow ? `url(#arrow-start-${cleanColorId})` : undefined}
                className={`transition-all duration-100 ${isSimulationMode ? 'animate-pulse' : ''} group-hover:brightness-125`}
              />

              {/* Start Dot on Source Port */}
              <circle
                cx={srcX}
                cy={srcY}
                r={3.5}
                fill={stroke.color}
                stroke="#ffffff"
                strokeWidth={1}
              />

              {/* Midpoint Label Badge */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-38}
                  y={-9}
                  width={76}
                  height={18}
                  rx={9}
                  fill="#0f172a"
                  stroke={isSelected ? '#facc15' : stroke.color}
                  strokeWidth={isSelected ? 1.8 : 1}
                  className="transition-colors group-hover:fill-slate-900"
                />
                <circle cx={-26} cy={0} r={2.5} fill={stroke.color} />
                <text
                  x={4}
                  y={3}
                  fill="#f1f5f9"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {stroke.label}
                </text>

                {/* Delete button on selection */}
                {isSelected && onDeleteLink && (
                  <g
                    transform="translate(42, 0)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLink(link.id);
                    }}
                    className="cursor-pointer"
                  >
                    <circle r={7} fill="#ef4444" stroke="#ffffff" strokeWidth={1} />
                    <text x={0} y={2.5} fill="#ffffff" fontSize={9} fontWeight="900" textAnchor="middle">×</text>
                  </g>
                )}
              </g>
            </g>
          );
        })}

        {/* Temporary connecting line when dragging a new link */}
        {connectingSourceNode && (
          <g className="pointer-events-none">
            {(() => {
              const startX = connectingSourceNode.x + 64;
              const startY = connectingSourceNode.y + 28;

              let endX = mousePos.x;
              let endY = mousePos.y;

              if (hoveredTargetNode) {
                endX = hoveredTargetNode.x >= connectingSourceNode.x ? hoveredTargetNode.x + 12 : hoveredTargetNode.x + 64;
                endY = hoveredTargetNode.y + 28;
              }

              const isConnectedTarget = Boolean(hoveredTargetNode);
              const lineColor = isConnectedTarget ? '#10b981' : (activeLineConfig?.strokeColor || '#facc15');
              const cleanColorId = lineColor.replace(/[^a-zA-Z0-9]/g, '');
              const strokeDash = activeLineConfig?.strokeDash === 'dashed' ? '6,5' : activeLineConfig?.strokeDash === 'dotted' ? '2,4' : undefined;
              const strokeWidth = activeLineConfig?.strokeWidth || 3;
              const lineStyle = activeLineConfig?.lineStyle || 'straight';

              const dragPathD = calculatePath(startX, startY, endX, endY, lineStyle);

              return (
                <g>
                  {/* Subtle dark backdrop for high visibility on any dark canvas background */}
                  <path
                    d={dragPathD}
                    fill="none"
                    stroke="#020617"
                    strokeWidth={strokeWidth + 3}
                    strokeLinecap="round"
                  />

                  {/* Clean Responsive Vector Drag Line */}
                  <path
                    d={dragPathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={activeLineConfig?.arrowType !== 'none' ? `url(#arrow-end-${cleanColorId})` : undefined}
                    markerStart={activeLineConfig?.arrowType === 'both' ? `url(#arrow-start-${cleanColorId})` : undefined}
                    strokeLinecap="round"
                  />

                  {/* Start Point White-Center Circle */}
                  <circle
                    cx={startX}
                    cy={startY}
                    r={5}
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </g>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Connection Mode Helper Notification Banner */}
      {connectingSourceNode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-orange-500/80 shadow-2xl rounded-2xl px-4 py-2 flex items-center gap-3 text-white text-xs select-none pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping shrink-0" />
          <span>
            Arraste até outro equipamento para criar a ligação <strong className="text-orange-400">{activeLineConfig?.strokeColor || 'personalizada'}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setConnectingSourceId(null);
              setHoveredTargetNodeId(null);
            }}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-600 cursor-pointer ml-1 transition-colors"
          >
            Cancelar (ESC)
          </button>
        </div>
      )}

      {/* 3. HTML DOM Layer for Equipment Node Cards (PNG Icon + Item Name + IP + MAC) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {visibleNodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isConnectSource = connectingSourceId === node.id;
          const isTargetHovered = hoveredTargetNodeId === node.id;
          const isConnectTarget = Boolean(connectingSourceId && connectingSourceId !== node.id);
          const customImg = node.customImageUrl || node.imageUrl;
          const isRack = node.type === 'rack_floor' || node.type === 'rack_wall' || node.type === 'rack_19';

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '90px',
              }}
              className={`absolute pointer-events-auto flex flex-col items-center select-none group transition-transform duration-100 ${
                isConnectTarget ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
              }`}
              title={`Duplo clique para abrir ${node.name} (ou clique e arraste para mover)`}
            >
              {/* Icon / PNG Container */}
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center p-2 transition-all duration-200 ${
                    customImg
                      ? 'bg-slate-900/90 border-2 backdrop-blur-xs shadow-lg'
                      : `bg-gradient-to-br ${getNodeColor(node.category)} border-2`
                  } ${
                    isConnectSource
                      ? 'border-orange-500 ring-4 ring-orange-500/60 shadow-lg shadow-orange-500/40 scale-110'
                      : isTargetHovered
                      ? 'border-emerald-400 ring-4 ring-emerald-400/80 scale-115 shadow-xl shadow-emerald-400/50'
                      : isConnectTarget
                      ? 'border-emerald-400/80 ring-2 ring-emerald-400/40 shadow-lg scale-105'
                      : isSelected
                      ? 'border-orange-400 ring-4 ring-orange-500/40 shadow-xl shadow-orange-500/30 scale-105'
                      : 'border-slate-700/80 group-hover:border-orange-400/80 group-hover:scale-105 shadow-md shadow-black/40'
                  }`}
                >
                  {customImg ? (
                    <img
                      src={customImg}
                      alt={node.name}
                      className="w-full h-full object-contain drop-shadow-md pointer-events-none"
                    />
                  ) : (
                    renderDeviceIcon(node)
                  )}
                </div>

                {/* Status Dot */}
                <div
                  className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                    node.status === 'online'
                      ? 'bg-emerald-400 animate-pulse'
                      : node.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  title={`Status: ${node.status}`}
                />

                {/* Right Port Connector Dot (Bolinha com centro branco exatamente como na imagem de referência) */}
                <div
                  onMouseDown={(e) => handleStartCableDrag(e, node.id)}
                  onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                  className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-slate-950 bg-orange-500 flex items-center justify-center cursor-crosshair transition-all z-30 shadow-md ${
                    isConnectSource
                      ? 'ring-4 ring-yellow-400 scale-125 animate-pulse bg-orange-500'
                      : isTargetHovered
                      ? 'ring-4 ring-emerald-400 scale-135 bg-emerald-500'
                      : connectingSourceId
                      ? 'ring-2 ring-emerald-400/80 scale-110 opacity-100'
                      : 'hover:scale-125 hover:ring-2 hover:ring-yellow-400/80'
                  }`}
                  title="Clique e arraste para ligar cabo a outro equipamento"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs pointer-events-none" />
                </div>
              </div>

              {/* Node Name & Subtitle Badge */}
              <div className="mt-1.5 flex flex-col items-center min-w-[130px] max-w-[160px] pointer-events-none">
                <span
                  className={`text-[11px] font-bold text-center leading-tight px-1.5 py-0.5 rounded-md transition-colors line-clamp-2 ${
                    isSelected
                      ? 'bg-orange-500 text-white font-black shadow-xs'
                      : 'text-slate-200 bg-slate-900/85 group-hover:text-orange-300 group-hover:bg-slate-900 shadow-2xs backdrop-blur-xs border border-slate-800'
                  }`}
                >
                  {node.name}
                </span>

                {/* Rack position tag if attached to a rack or rack capacity badge */}
                {isRack ? (
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-md bg-orange-600/30 text-orange-300 border border-orange-500/50 mt-0.5 shadow-2xs">
                    [{node.totalRackCapacityU || node.rackUnits || 44}U Rack]
                  </span>
                ) : (node.parentRackId || node.rackPosition) ? (
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-md bg-orange-500/25 text-orange-300 border border-orange-500/40 mt-0.5 shadow-2xs">
                    {node.rackPosition ? `[${node.rackPosition}]` : '[Ativo]'}
                  </span>
                ) : null}

                {(node.ip || node.managementIp || node.hostname) && (
                  <span className="text-[9.5px] text-slate-300 font-mono font-bold mt-0.5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 shadow-xs max-w-[150px] truncate text-center">
                    {node.ip || node.managementIp || node.hostname}
                  </span>
                )}

                {node.mac && (
                  <span className="text-[8.5px] text-purple-300 font-mono font-bold mt-0.5 whitespace-nowrap px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 shadow-xs max-w-[150px] truncate text-center" title={`MAC: ${node.mac}`}>
                    {node.mac}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset 100%, Center) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-2xl select-none">
        <button
          type="button"
          onClick={() => {
            const newZoom = Math.max(0.2, Math.round((zoom - 0.15) * 100) / 100);
            if (onZoomChange) onZoomChange(newZoom);
          }}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (onZoomChange) onZoomChange(1);
            onPanChange({ x: 0, y: 0 });
          }}
          className="px-2 py-1 text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Resetar Zoom e Centralizar (100%)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => {
            const newZoom = Math.min(3.5, Math.round((zoom + 0.15) * 100) / 100);
            if (onZoomChange) onZoomChange(newZoom);
          }}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={() => {
            if (onZoomChange) onZoomChange(1);
            onPanChange({ x: 0, y: 0 });
          }}
          className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Centralizar e Redefinir Posição"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
