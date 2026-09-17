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

  // Connecting cable state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
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

  // Global window listeners for drag & pan (ensures smooth, unrestricted movement across full screen)
  useEffect(() => {
    if (!draggingNodeId && !isPanning && !connectingSourceId) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (connectingSourceId) {
        const curX = (e.clientX - rect.left - panOffset.x) / zoom;
        const curY = (e.clientY - rect.top - panOffset.y) / zoom;
        setMousePos({ x: Math.round(curX), y: Math.round(curY) });
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

        // Unrestricted movement: allow placing items anywhere in the 2D infinite workspace
        onMoveNode(draggingNodeId, newX, newY);
      }
    };

    const onWindowMouseUp = () => {
      setIsPanning(false);
      setDraggingNodeId(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingSourceId(null);
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
  }, [draggingNodeId, isPanning, connectingSourceId, panStart, panOffset, zoom, dragOffset, onPanChange, onMoveNode]);

  // Handle Canvas Mouse Down (Pan canvas or deselect)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (connectingSourceId) {
      setConnectingSourceId(null);
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

  // Handle Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Handle Node Mouse Down (Single click for select & drag, or connecting link)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    // If currently in connection mode, clicking this node completes the link
    if (connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        onAddLink(connectingSourceId, nodeId, selectedCableType as LinkType);
      }
      setConnectingSourceId(null);
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
    switch (type) {
      case 'fiber_sm':
        return { color: '#3b82f6', dash: 'none', width: 3.5 }; // Azul vibrante
      case 'fiber_drop':
        return { color: '#9333ea', dash: 'none', width: 2.5 }; // Roxo
      case 'utp_cat6':
        return { color: '#10b981', dash: 'none', width: 3 }; // Verde esmeralda
      case 'wireless_ptp':
        return { color: '#f59e0b', dash: '6,6', width: 3 }; // Amarelo tracejado
      case 'coaxial':
        return { color: '#06b6d4', dash: 'none', width: 3 };
      default:
        return { color: '#64748b', dash: 'none', width: 2.5 };
    }
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

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`flex-1 h-full min-h-0 relative overflow-hidden bg-[#0e1726] cursor-${isPanning ? 'grabbing' : 'default'} select-none`}
      style={{
        backgroundImage: `radial-gradient(circle, #2d3748 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* SVG Canvas Layer for Links, Cables and Packet Animations */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Cable Links */}
        {visibleLinks.map((link) => {
          const src = visibleNodes.find((n) => n.id === link.sourceNodeId);
          const tgt = visibleNodes.find((n) => n.id === link.targetNodeId);
          if (!src || !tgt) return null;

          const isSelected = selectedLinkId === link.id;
          const stroke = getLinkStroke(link.type);

          const x1 = src.x + 45;
          const y1 = src.y + 28;
          const x2 = tgt.x + 45;
          const y2 = tgt.y + 28;

          // Orthogonal or smooth curve path
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const pathD = `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${midY} T ${x2} ${y2}`;

          return (
            <g key={link.id} className="cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); onSelectLink(link.id); }}>
              {/* Hitbox */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
              />
              {/* Outline / Selection Glow */}
              {isSelected && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth={stroke.width + 5}
                  opacity={0.8}
                  filter="url(#glow)"
                />
              )}
              {/* Cable Line */}
              <path
                d={pathD}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeDasharray={stroke.dash}
                className={isSimulationMode ? 'animate-pulse' : ''}
              />

              {/* Link Center Label */}
              {link.label && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-45}
                    y={-10}
                    width={90}
                    height={20}
                    rx={6}
                    fill="#1e293b"
                    stroke={isSelected ? '#fb923c' : '#334155'}
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={4}
                    fill="#cbd5e1"
                    fontSize={9}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {link.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Temporary connecting line when drawing a new cable (smooth glowing bezier curve) */}
        {connectingSourceNode && (
          <g>
            <path
              d={`M ${connectingSourceNode.x + 45} ${connectingSourceNode.y + 28} Q ${(connectingSourceNode.x + 45 + mousePos.x) / 2} ${connectingSourceNode.y + 28} ${mousePos.x} ${mousePos.y}`}
              fill="none"
              stroke="#fb923c"
              strokeWidth={4}
              strokeDasharray="8,6"
              filter="url(#glow)"
              className="animate-pulse"
            />
            <circle cx={mousePos.x} cy={mousePos.y} r={6} fill="#f97316" stroke="#ffffff" strokeWidth={2} />
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
            Ligando cabo <strong className="text-orange-400">{selectedCableType.toUpperCase()}</strong> de{' '}
            <strong className="text-white">{connectingSourceNode.name}</strong> → Clique no dispositivo de destino
          </span>
          <button
            type="button"
            onClick={() => setConnectingSourceId(null)}
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
          const isConnectTarget = Boolean(connectingSourceId && connectingSourceId !== node.id);
          const customImg = node.customImageUrl || node.imageUrl;
          const isRack = node.type === 'rack_floor' || node.type === 'rack_wall' || node.type === 'rack_19';

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
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
                      : isConnectTarget
                      ? 'border-emerald-400 ring-4 ring-emerald-400/50 shadow-lg shadow-emerald-400/30 scale-105'
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

                {/* Port Anchor Point (for connecting cables) */}
                <button
                  type="button"
                  className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full font-black text-xs border-2 border-slate-900 shadow-lg flex items-center justify-center cursor-crosshair transition-all z-20 ${
                    isConnectSource
                      ? 'bg-amber-400 text-slate-950 scale-125 ring-4 ring-amber-400/50'
                      : isConnectTarget
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white scale-115 opacity-100 ring-2 ring-emerald-400/50'
                      : 'bg-orange-500 hover:bg-orange-400 text-white opacity-0 group-hover:opacity-100 hover:scale-125 shadow-orange-500/30'
                  }`}
                  title={
                    isConnectSource
                      ? 'Conexão ativa! Clique em outro equipamento para ligar'
                      : connectingSourceId
                      ? 'Clique para conectar o cabo aqui'
                      : 'Clique para puxar cabo / ligar a outro equipamento'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!connectingSourceId) {
                      setConnectingSourceId(node.id);
                    } else if (connectingSourceId === node.id) {
                      setConnectingSourceId(null);
                    } else {
                      onAddLink(connectingSourceId, node.id, selectedCableType as LinkType);
                      setConnectingSourceId(null);
                    }
                  }}
                >
                  {isConnectTarget ? '✔' : isConnectSource ? '✕' : '+'}
                </button>
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
