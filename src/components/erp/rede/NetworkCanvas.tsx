import React, { useState, useRef, useEffect } from 'react';
import { 
  NetworkNode, 
  NetworkLink, 
  SimulationPacket,
  LinkType,
  NetworkFolder
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
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PhoneCall,
  BatteryCharging,
  Cable,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface NetworkCanvasProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  folders?: NetworkFolder[];
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onDoubleClickNode?: (nodeId: string) => void;
  onSelectLink: (linkId: string | null) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onAddLink: (sourceNodeId: string, targetNodeId: string, linkType: LinkType) => void;
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
  selectedNodeId,
  selectedLinkId,
  onSelectNode,
  onDoubleClickNode,
  onSelectLink,
  onMoveNode,
  onAddLink,
  onDeleteLink,
  isSimulationMode,
  activePackets,
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
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connecting cable state (Drag to Connect)
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [draggedCableStartPos, setDraggedCableStartPos] = useState<{ x: number; y: number; side?: string } | null>(null);
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

  // Calculate Port Coordinates for clean Mindmap connections
  const getPortCoordinates = (node: NetworkNode, targetX: number, targetY: number) => {
    const nodeCenterX = node.x + 45;
    const nodeCenterY = node.y + 28;
    const dx = targetX - nodeCenterX;
    const dy = targetY - nodeCenterY;

    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx >= 0) {
        return { x: node.x + 65, y: node.y + 28, dir: 'right' };
      } else {
        return { x: node.x + 25, y: node.y + 28, dir: 'left' };
      }
    } else {
      if (dy >= 0) {
        return { x: node.x + 45, y: node.y + 56, dir: 'bottom' };
      } else {
        return { x: node.x + 45, y: node.y, dir: 'top' };
      }
    }
  };

  // Calculate smooth Mindmap / Flowchart S-curve path
  const calculateMindmapPath = (
    x1: number,
    y1: number,
    dir1: string,
    x2: number,
    y2: number,
    dir2: string
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const curvature = Math.max(40, Math.min(180, Math.hypot(dx, dy) * 0.45));

    let cp1x = x1;
    let cp1y = y1;
    let cp2x = x2;
    let cp2y = y2;

    if (dir1 === 'right') cp1x += curvature;
    else if (dir1 === 'left') cp1x -= curvature;
    else if (dir1 === 'bottom') cp1y += curvature;
    else if (dir1 === 'top') cp1y -= curvature;

    if (dir2 === 'right') cp2x += curvature;
    else if (dir2 === 'left') cp2x -= curvature;
    else if (dir2 === 'bottom') cp2y += curvature;
    else if (dir2 === 'top') cp2y -= curvature;

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  };

  // Global window listeners for drag & pan & cable dragging
  useEffect(() => {
    if (!draggingNodeId && !isPanning && !connectingSourceId) return;

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
    };

    const onWindowMouseUp = (e: MouseEvent) => {
      setIsPanning(false);
      setDraggingNodeId(null);

      if (connectingSourceId) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const curX = (e.clientX - rect.left - panOffset.x) / zoom;
          const curY = (e.clientY - rect.top - panOffset.y) / zoom;

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
            onAddLink(connectingSourceId, target.id, (selectedCableType || 'fiber_sm') as LinkType);
          }
        }
        setConnectingSourceId(null);
        setDraggedCableStartPos(null);
        setHoveredTargetNodeId(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingSourceId(null);
        setDraggedCableStartPos(null);
        setHoveredTargetNodeId(null);
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
  }, [draggingNodeId, isPanning, connectingSourceId, hoveredTargetNodeId, visibleNodes, selectedCableType, onAddLink, panStart, panOffset, zoom, dragOffset, onPanChange, onMoveNode]);

  // Handle Canvas Mouse Down (Pan canvas or deselect)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (connectingSourceId) {
      setConnectingSourceId(null);
      setDraggedCableStartPos(null);
      setHoveredTargetNodeId(null);
      return;
    }
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        onSelectNode(null);
        onSelectLink(null);
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

  // Handle Canvas Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Start Cable Drag from Connector Dot
  const handleStartCableDrag = (e: React.MouseEvent, nodeId: string, side: 'right' | 'left' | 'top' | 'bottom' = 'right') => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setConnectingSourceId(nodeId);
    let startX = node.x + 45;
    let startY = node.y + 28;

    if (side === 'right') {
      startX = node.x + 65;
      startY = node.y + 28;
    } else if (side === 'left') {
      startX = node.x + 25;
      startY = node.y + 28;
    } else if (side === 'bottom') {
      startX = node.x + 45;
      startY = node.y + 56;
    } else if (side === 'top') {
      startX = node.x + 45;
      startY = node.y;
    }

    setDraggedCableStartPos({ x: startX, y: startY, side });
    setMousePos({ x: startX, y: startY });
  };

  // Handle Node Mouse Down (Single click for select & drag, or connecting link)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    // If currently in connection mode, clicking this node completes the link
    if (connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        onAddLink(connectingSourceId, nodeId, (selectedCableType || 'fiber_sm') as LinkType);
      }
      setConnectingSourceId(null);
      setDraggedCableStartPos(null);
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
      onAddLink(connectingSourceId, targetNodeId, (selectedCableType || 'fiber_sm') as LinkType);
      setConnectingSourceId(null);
      setDraggedCableStartPos(null);
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

  // Get Cable Link Visual Styling
  const getLinkStroke = (type: LinkType) => {
    return LINK_CONFIG[type] || { color: '#64748b', label: 'Cabo', strokeDash: 'none', width: 2.5 };
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

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`flex-1 h-full min-h-0 relative overflow-hidden bg-[#0a101d] cursor-${isPanning ? 'grabbing' : 'default'} select-none`}
      style={{
        backgroundImage: `radial-gradient(circle, #1e293b 1.2px, transparent 1.2px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* SVG Canvas Layer for Mindmap / Diagram Links & Cables */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
          </filter>

          {/* SVG Arrow Markers for each Cable Type in Mindmap Style */}
          {Object.entries(LINK_CONFIG).map(([type, cfg]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={cfg.color} />
            </marker>
          ))}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
          </marker>
          <marker
            id="arrow-hover"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
          </marker>
        </defs>

        {/* Cable Links in Mindmap / Flow Diagram Style */}
        {visibleLinks.map((link) => {
          const src = visibleNodes.find((n) => n.id === link.sourceNodeId);
          const tgt = visibleNodes.find((n) => n.id === link.targetNodeId);
          if (!src || !tgt) return null;

          const isSelected = selectedLinkId === link.id;
          const stroke = getLinkStroke(link.type);

          const srcPort = getPortCoordinates(src, tgt.x + 45, tgt.y + 28);
          const tgtPort = getPortCoordinates(tgt, src.x + 45, src.y + 28);

          const pathD = calculateMindmapPath(
            srcPort.x,
            srcPort.y,
            srcPort.dir,
            tgtPort.x,
            tgtPort.y,
            tgtPort.dir
          );

          const midX = (srcPort.x + tgtPort.x) / 2;
          const midY = (srcPort.y + tgtPort.y) / 2;

          return (
            <g key={link.id} className="cursor-pointer pointer-events-auto group" onClick={(e) => { e.stopPropagation(); onSelectLink(link.id); }}>
              {/* Invisible wide hitbox */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={24}
              />

              {/* Selection / Hover Glow Aura */}
              {isSelected && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.width + 6}
                  opacity={0.7}
                  filter="url(#glow)"
                />
              )}

              {/* Underlying border / shadow line */}
              <path
                d={pathD}
                fill="none"
                stroke="#020617"
                strokeWidth={stroke.width + 2.5}
                strokeLinecap="round"
              />

              {/* Main Mindmap Cable Line */}
              <path
                d={pathD}
                fill="none"
                stroke={stroke.color}
                strokeWidth={isSelected ? stroke.width + 1 : stroke.width}
                strokeDasharray={stroke.strokeDash}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#arrow-${link.type || 'default'})`}
                className={`transition-all duration-150 ${isSimulationMode ? 'animate-pulse' : ''} group-hover:brightness-125`}
              />

              {/* Start Terminal Bullet Dot */}
              <circle
                cx={srcPort.x}
                cy={srcPort.y}
                r={4}
                fill={stroke.color}
                stroke="#0f172a"
                strokeWidth={1.5}
              />

              {/* Midpoint Info Badge Pill */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-42}
                  y={-10}
                  width={84}
                  height={20}
                  rx={10}
                  fill="#0f172a"
                  stroke={isSelected ? '#f97316' : stroke.color}
                  strokeWidth={isSelected ? 2 : 1.2}
                  filter="url(#drop-shadow)"
                  className="transition-colors group-hover:fill-slate-900"
                />
                <circle cx={-30} cy={0} r={3} fill={stroke.color} />
                <text
                  x={4}
                  y={3.5}
                  fill="#f1f5f9"
                  fontSize={8.5}
                  fontWeight="800"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {link.label || stroke.label}
                </text>

                {/* Quick Delete Cable Button when selected or hovered */}
                {isSelected && onDeleteLink && (
                  <g
                    transform="translate(48, 0)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLink(link.id);
                    }}
                    className="cursor-pointer"
                  >
                    <circle r={8} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
                    <text x={0} y={3} fill="#ffffff" fontSize={10} fontWeight="900" textAnchor="middle">×</text>
                  </g>
                )}
              </g>
            </g>
          );
        })}

        {/* Temporary connecting line when dragging a new cable (Live Smooth Mindmap Bezier) */}
        {connectingSourceNode && (
          <g>
            {(() => {
              const startX = draggedCableStartPos?.x || (connectingSourceNode.x + 45);
              const startY = draggedCableStartPos?.y || (connectingSourceNode.y + 28);
              const side = draggedCableStartPos?.side || 'right';

              let endX = mousePos.x;
              let endY = mousePos.y;
              let targetDir = 'left';

              if (hoveredTargetNode) {
                const port = getPortCoordinates(hoveredTargetNode, startX, startY);
                endX = port.x;
                endY = port.y;
                targetDir = port.dir;
              }

              const livePath = calculateMindmapPath(
                startX,
                startY,
                side,
                endX,
                endY,
                targetDir
              );

              return (
                <>
                  {/* Glowing Preview Curve */}
                  <path
                    d={livePath}
                    fill="none"
                    stroke={hoveredTargetNode ? '#10b981' : '#f97316'}
                    strokeWidth={hoveredTargetNode ? 4.5 : 3.5}
                    strokeDasharray={hoveredTargetNode ? 'none' : '6,5'}
                    strokeLinecap="round"
                    markerEnd={hoveredTargetNode ? 'url(#arrow-hover)' : 'url(#arrow-default)'}
                    filter="url(#glow)"
                    className="animate-pulse"
                  />

                  {/* Start Point Dot */}
                  <circle
                    cx={startX}
                    cy={startY}
                    r={5}
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />

                  {/* Target Cursor Pulse Dot */}
                  <circle
                    cx={endX}
                    cy={endY}
                    r={hoveredTargetNode ? 8 : 6}
                    fill={hoveredTargetNode ? '#10b981' : '#f97316'}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="animate-ping"
                  />
                  <circle
                    cx={endX}
                    cy={endY}
                    r={hoveredTargetNode ? 7 : 5}
                    fill={hoveredTargetNode ? '#10b981' : '#f97316'}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </>
              );
            })()}
          </g>
        )}

        {/* Active Simulation Packet Animations (Traveling ICMP Echo / Ping dots) */}
        {activePackets.map((pkt) => {
          const src = nodes.find(n => n.id === pkt.sourceNodeId);
          const tgt = nodes.find(n => n.id === pkt.targetNodeId);
          if (!src || !tgt) return null;

          const px = src.x + (tgt.x - src.x) * pkt.progress + 45;
          const py = src.y + (tgt.y - src.y) * pkt.progress + 28;

          return (
            <g key={pkt.id} transform={`translate(${px}, ${py})`}>
              <circle r={9} fill="#f97316" filter="url(#glow)" opacity={0.6} />
              <circle r={6} fill="#ffffff" stroke="#f97316" strokeWidth={2} />
              <text x={12} y={4} fill="#fdba74" fontSize={10} fontWeight="900" fontFamily="monospace">
                ICMP Echo
              </text>
            </g>
          );
        })}
      </svg>

      {/* Connection Mode Helper Notification Banner */}
      {connectingSourceNode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-orange-500/80 shadow-2xl rounded-2xl px-4 py-2 flex items-center gap-3 text-white text-xs select-none pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping shrink-0" />
          <span>
            Solte a bolinha sobre outro equipamento para ligar o cabo <strong className="text-orange-400">{(selectedCableType || 'fiber_sm').toUpperCase()}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setConnectingSourceId(null);
              setDraggedCableStartPos(null);
              setHoveredTargetNodeId(null);
            }}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-600 cursor-pointer ml-1 transition-colors"
          >
            Cancelar (ESC)
          </button>
        </div>
      )}

      {/* HTML DOM Layer for Clean Item Nodes (PNG Image + Item Name) */}
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

                {/* Right Port Connector Dot (Bolinha para clicar e arrastar cabo) */}
                <div
                  onMouseDown={(e) => handleStartCableDrag(e, node.id, 'right')}
                  onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                  className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-crosshair transition-all z-30 ${
                    isConnectSource
                      ? 'bg-orange-500 border-white ring-4 ring-orange-400 scale-125 shadow-lg animate-pulse'
                      : isTargetHovered
                      ? 'bg-emerald-400 border-white ring-4 ring-emerald-400 scale-135 shadow-xl'
                      : connectingSourceId
                      ? 'bg-emerald-500 border-slate-900 ring-2 ring-emerald-400/80 scale-110 opacity-100 shadow-md animate-pulse'
                      : 'bg-orange-500 hover:bg-orange-400 border-slate-900 opacity-80 group-hover:opacity-100 hover:scale-125 shadow-md shadow-orange-500/40'
                  }`}
                  title="Clique e arraste esta bolinha até outro equipamento para ligar o cabo"
                >
                  <div className="w-2 h-2 rounded-full bg-white pointer-events-none" />
                </div>

                {/* Left Port Connector Dot (Bolinha esquerda para clicar e arrastar cabo) */}
                <div
                  onMouseDown={(e) => handleStartCableDrag(e, node.id, 'left')}
                  onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                  className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-crosshair transition-all z-30 ${
                    isConnectSource
                      ? 'bg-orange-500 border-white ring-4 ring-orange-400 scale-125 shadow-lg animate-pulse'
                      : isTargetHovered
                      ? 'bg-emerald-400 border-white ring-4 ring-emerald-400 scale-135 shadow-xl'
                      : connectingSourceId
                      ? 'bg-emerald-500 border-slate-900 ring-2 ring-emerald-400/80 scale-110 opacity-100 shadow-md animate-pulse'
                      : 'bg-orange-500 hover:bg-orange-400 border-slate-900 opacity-0 group-hover:opacity-100 hover:scale-125 shadow-md shadow-orange-500/40'
                  }`}
                  title="Clique e arraste esta bolinha até outro equipamento para ligar o cabo"
                >
                  <div className="w-2 h-2 rounded-full bg-white pointer-events-none" />
                </div>

                {/* Top Port Connector Dot */}
                <div
                  onMouseDown={(e) => handleStartCableDrag(e, node.id, 'top')}
                  onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-crosshair transition-all z-30 ${
                    isConnectSource
                      ? 'bg-orange-500 border-white ring-2 ring-orange-400'
                      : isTargetHovered
                      ? 'bg-emerald-400 border-white ring-4 ring-emerald-400'
                      : connectingSourceId
                      ? 'bg-emerald-500 border-slate-900 opacity-90 scale-105 animate-pulse'
                      : 'bg-orange-500 border-slate-900 opacity-0 group-hover:opacity-90 hover:scale-115'
                  }`}
                  title="Conectar porta superior"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />
                </div>

                {/* Bottom Port Connector Dot */}
                <div
                  onMouseDown={(e) => handleStartCableDrag(e, node.id, 'bottom')}
                  onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                  className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-crosshair transition-all z-30 ${
                    isConnectSource
                      ? 'bg-orange-500 border-white ring-2 ring-orange-400'
                      : isTargetHovered
                      ? 'bg-emerald-400 border-white ring-4 ring-emerald-400'
                      : connectingSourceId
                      ? 'bg-emerald-500 border-slate-900 opacity-90 scale-105 animate-pulse'
                      : 'bg-orange-500 border-slate-900 opacity-0 group-hover:opacity-90 hover:scale-115'
                  }`}
                  title="Conectar porta inferior"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />
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
