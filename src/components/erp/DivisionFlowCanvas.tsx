import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { UserAccount, CompanyDivision, FlowNode, FlowEdge, DivisionFlow } from '../../types';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Save, 
  Sparkles, 
  Trash2, 
  X, 
  Move, 
  Crown, 
  Briefcase, 
  Users, 
  Lock, 
  Check, 
  MousePointer, 
  Layers, 
  Info,
  Maximize2,
  CheckCircle2
} from 'lucide-react';

interface DivisionFlowCanvasProps {
  division: CompanyDivision;
  allUsers: UserAccount[];
  isSuperAdmin: boolean;
  onSaveFlow: (divisionId: string, flow: DivisionFlow) => void;
  onOpenUserDossier: (user: UserAccount) => void;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 120;

export const DivisionFlowCanvas: React.FC<DivisionFlowCanvasProps> = ({
  division,
  allUsers,
  isSuperAdmin,
  onSaveFlow,
  onOpenUserDossier,
}) => {
  // Initialize nodes from division.flowData or default layout
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    if (division.flowData?.nodes && division.flowData.nodes.length > 0) {
      return division.flowData.nodes;
    }
    const divUsers = allUsers.filter((u) => u.department === division.name);
    const initialList = divUsers.length > 0 ? divUsers : allUsers.slice(0, 4);
    
    return initialList.map((u, index) => {
      const isLeader = u.id === division.leaderId || u.role === 'superadmin';
      if (isLeader) {
        return { id: u.id, x: 380, y: 50 };
      }
      const col = (index % 3);
      const row = Math.floor(index / 3) + 1;
      return {
        id: u.id,
        x: 100 + col * 320,
        y: 60 + row * 220
      };
    });
  });

  // Initialize edges
  const [edges, setEdges] = useState<FlowEdge[]>(() => {
    if (division.flowData?.edges) {
      return division.flowData.edges;
    }
    const leaderId = division.leaderId || allUsers.find((u) => u.department === division.name && (u.role === 'superadmin' || u.role === 'admin'))?.id;
    if (leaderId) {
      const otherNodes = allUsers
        .filter((u) => u.department === division.name && u.id !== leaderId)
        .slice(0, 3);
      return otherNodes.map((u, idx) => ({
        id: `edge-${leaderId}-${u.id}-${idx}`,
        from: leaderId,
        to: u.id,
      }));
    }
    return [];
  });

  // Sync state if division.flowData updates externally
  useEffect(() => {
    if (division.flowData?.nodes && division.flowData.nodes.length > 0) {
      setNodes(division.flowData.nodes);
    }
    if (division.flowData?.edges) {
      setEdges(division.flowData.edges);
    }
  }, [division.id]);

  // Canvas Viewport Transformation
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connecting State (linking output port to input port)
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Add Member to Canvas Dropdown
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [justSavedNotice, setJustSavedNotice] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<FlowNode[]>(nodes);
  const edgesRef = useRef<FlowEdge[]>(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Convert mouse screen coordinates to canvas space
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - pan.x) / zoom,
      y: (screenY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Global Window MouseMove & MouseUp listeners for silky smooth drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setMouseCanvasPos(canvasPos);

      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
      } else if (draggingNodeId) {
        const newX = Math.round(canvasPos.x - dragOffset.x);
        const newY = Math.round(canvasPos.y - dragOffset.y);

        setNodes((prev) =>
          prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
        );
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggingNodeId) {
        // Auto-persist node position immediately to division flow
        onSaveFlow(division.id, {
          nodes: nodesRef.current,
          edges: edgesRef.current,
        });
        setJustSavedNotice(true);
        setTimeout(() => setJustSavedNotice(false), 2000);
      }
      setIsPanning(false);
      setDraggingNodeId(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, startPan, draggingNodeId, dragOffset, screenToCanvas, onSaveFlow, division.id]);

  // Handle Mouse Down for Canvas Panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).id === 'flow-canvas-bg') {
      if (connectingFromId) {
        setConnectingFromId(null);
      }
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.2);
    setZoom(newZoom);
  };

  // Start Node Drag on Mouse Down anywhere on the card
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    // If clicking on button, input or port, ignore drag
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.flow-port') || target.closest('a')) {
      return;
    }

    e.stopPropagation();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setDraggingNodeId(nodeId);
      setDragOffset({
        x: canvasPos.x - node.x,
        y: canvasPos.y - node.y,
      });
    }
  };

  // Start connection from Output Port (bottom circle)
  const handleStartConnect = (e: React.MouseEvent, fromNodeId: string) => {
    e.stopPropagation();
    setConnectingFromId(fromNodeId);
  };

  // Complete connection on Input Port (top circle)
  const handleEndConnect = (e: React.MouseEvent, toNodeId: string) => {
    e.stopPropagation();
    if (!connectingFromId) return;

    if (connectingFromId === toNodeId) {
      setConnectingFromId(null);
      return;
    }

    const exists = edges.some((edge) => edge.from === connectingFromId && edge.to === toNodeId);
    if (!exists) {
      const newEdge: FlowEdge = {
        id: `edge-${connectingFromId}-${toNodeId}-${Date.now()}`,
        from: connectingFromId,
        to: toNodeId,
      };
      const updatedEdges = [...edges, newEdge];
      setEdges(updatedEdges);
      onSaveFlow(division.id, {
        nodes,
        edges: updatedEdges,
      });
      setJustSavedNotice(true);
      setTimeout(() => setJustSavedNotice(false), 2000);
    }

    setConnectingFromId(null);
  };

  // Delete an edge connection
  const handleDeleteEdge = (edgeId: string) => {
    const updatedEdges = edges.filter((e) => e.id !== edgeId);
    setEdges(updatedEdges);
    onSaveFlow(division.id, {
      nodes,
      edges: updatedEdges,
    });
    setJustSavedNotice(true);
    setTimeout(() => setJustSavedNotice(false), 2000);
  };

  // Add Member to Canvas
  const handleAddMemberToFlow = (user: UserAccount) => {
    if (nodes.some((n) => n.id === user.id)) return;
    const newX = 250 + (nodes.length % 4) * 60;
    const newY = 150 + (nodes.length % 3) * 60;
    const updatedNodes = [...nodes, { id: user.id, x: newX, y: newY }];
    setNodes(updatedNodes);
    setIsAddMemberOpen(false);

    onSaveFlow(division.id, {
      nodes: updatedNodes,
      edges,
    });
    setJustSavedNotice(true);
    setTimeout(() => setJustSavedNotice(false), 2000);
  };

  // Remove Node from Canvas
  const handleRemoveNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
    setNodes(updatedNodes);
    setEdges(updatedEdges);

    onSaveFlow(division.id, {
      nodes: updatedNodes,
      edges: updatedEdges,
    });
    setJustSavedNotice(true);
    setTimeout(() => setJustSavedNotice(false), 2000);
  };

  // Auto Layout in Cascading Tree
  const handleAutoLayout = () => {
    const targetNodeIds = new Set(edges.map((e) => e.to));
    let rootNodes = nodes.filter((n) => !targetNodeIds.has(n.id));
    if (rootNodes.length === 0 && nodes.length > 0) {
      rootNodes = [nodes[0]];
    }

    const levels: Map<string, number> = new Map();
    const visited: Set<string> = new Set();

    const assignLevels = (nodeId: string, currentLevel: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      levels.set(nodeId, Math.max(levels.get(nodeId) || 0, currentLevel));

      const outgoing = edges.filter((e) => e.from === nodeId);
      outgoing.forEach((e) => assignLevels(e.to, currentLevel + 1));
    };

    rootNodes.forEach((r) => assignLevels(r.id, 0));
    nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        levels.set(n.id, 1);
      }
    });

    const levelGroups: Record<number, FlowNode[]> = {};
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0;
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(n);
    });

    const updatedNodes = nodes.map((n) => {
      const lvl = levels.get(n.id) || 0;
      const group = levelGroups[lvl] || [];
      const indexInGroup = group.findIndex((g) => g.id === n.id);
      const groupCount = group.length;

      const startX = Math.max(100, 480 - (groupCount * 300) / 2);
      const x = startX + indexInGroup * 310;
      const y = 60 + lvl * 210;

      return { ...n, x, y };
    });

    setNodes(updatedNodes);
    onSaveFlow(division.id, {
      nodes: updatedNodes,
      edges,
    });
    setJustSavedNotice(true);
    setTimeout(() => setJustSavedNotice(false), 2000);
  };

  // Manual Save Trigger
  const handleManualSave = () => {
    onSaveFlow(division.id, {
      nodes,
      edges,
    });
    setJustSavedNotice(true);
    setTimeout(() => setJustSavedNotice(false), 2000);
  };

  // Available users to add
  const availableUsersToAdd = useMemo(() => {
    return allUsers.filter((u) => !nodes.some((n) => n.id === u.id));
  }, [allUsers, nodes]);

  // Compute Bezier Curves for Edges
  const renderedEdges = useMemo(() => {
    return edges.map((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);

      if (!fromNode || !toNode) return null;

      // Source: Bottom center port of fromNode
      const x1 = fromNode.x + NODE_WIDTH / 2;
      const y1 = fromNode.y + NODE_HEIGHT;

      // Target: Top center port of toNode
      const x2 = toNode.x + NODE_WIDTH / 2;
      const y2 = toNode.y;

      const dy = Math.max(Math.abs(y2 - y1) * 0.5, 45);
      const pathData = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      return {
        id: edge.id,
        pathData,
        midX,
        midY,
        from: edge.from,
        to: edge.to,
      };
    }).filter(Boolean);
  }, [edges, nodes]);

  return (
    <div className="relative w-full h-[620px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col select-none">
      
      {/* Top Floating Control Bar (n8n Style) */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Info Badges */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-lg text-white">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black tracking-wide flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            Flow Hierárquico Editável
          </span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
            {nodes.length} integrantes &bull; {edges.length} conexões
          </span>
        </div>

        {/* Right Tools Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
          
          {/* Add Member Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={!isSuperAdmin}
              onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Integrante</span>
            </button>

            {isAddMemberOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-slate-800">
                <div className="p-2 text-[10px] font-bold uppercase text-slate-400">
                  Selecione para incluir no Flow:
                </div>
                {availableUsersToAdd.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    Todos os colaboradores já estão no painel.
                  </div>
                ) : (
                  availableUsersToAdd.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAddMemberToFlow(u)}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer"
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-7 h-7 rounded-lg object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-bold truncate block">{u.name}</span>
                        <span className="text-[10px] text-slate-400 truncate block">{u.position || u.role}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Auto Layout Button */}
          <button
            type="button"
            disabled={!isSuperAdmin}
            onClick={handleAutoLayout}
            title="Auto-organizar em cascata hierárquica"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Cascata</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-900 rounded-xl border border-slate-700/80 p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Diminuir Zoom"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-300 px-1.5 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Aumentar Zoom"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }); }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Resetar Visão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save Status & Button */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleManualSave}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                justSavedNotice 
                  ? 'bg-emerald-500 text-white font-black' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {justSavedNotice ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{justSavedNotice ? 'Salvo!' : 'Salvar'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Bottom Help / Instructions Banner */}
      <div className="absolute bottom-3 left-4 right-4 z-30 pointer-events-none flex items-center justify-between">
        <div className="bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 text-xs text-slate-200 flex items-center gap-2.5 pointer-events-auto shadow-lg">
          <Move className="w-4 h-4 text-orange-400 shrink-0" />
          <span>
            {isSuperAdmin 
              ? 'Arraste os cards livremente com o mouse. Para ligar a hierarquia, clique na bolinha inferior (saída) e depois na bolinha superior (entrada).'
              : 'Modo visualização ativo. Somente o Super Administrador pode mover e ligar os nós.'}
          </span>
        </div>

        {!isSuperAdmin && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Edição restrita ao Superadmin
          </div>
        )}
      </div>

      {/* Main Flow Canvas Area */}
      <div
        ref={containerRef}
        id="flow-canvas-bg"
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        className={`w-full h-full relative cursor-${isPanning ? 'grabbing' : 'grab'} overflow-hidden`}
        style={{
          backgroundColor: '#0b0f19',
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px),
            radial-gradient(circle, rgba(59,130,246,0.05) 2px, transparent 2px)
          `,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px, ${150 * zoom}px ${150 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* World Container transformed by zoom and pan */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {/* SVG Layer for Edges and Active Connection Line */}
          <svg
            className="absolute top-0 left-0 overflow-visible pointer-events-none"
            style={{ width: '1px', height: '1px' }}
          >
            <defs>
              <marker
                id="arrowhead"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#60a5fa" />
              </marker>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Rendered Existing Edges */}
            {renderedEdges.map((edge) => {
              if (!edge) return null;
              const isHovered = hoveredEdgeId === edge.id;

              return (
                <g key={edge.id} className="pointer-events-auto">
                  {/* Invisible thick path for easier hovering */}
                  <path
                    d={edge.pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={24}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                  />

                  {/* Visual Glow Line */}
                  <path
                    d={edge.pathData}
                    fill="none"
                    stroke={isHovered ? '#f59e0b' : '#3b82f6'}
                    strokeWidth={isHovered ? 4.5 : 3}
                    strokeDasharray={isHovered ? '6 4' : 'none'}
                    markerEnd="url(#arrowhead)"
                    filter="url(#glow)"
                    opacity={0.9}
                  />

                  {/* Disconnect / Delete button on Hover */}
                  {isHovered && isSuperAdmin && (
                    <foreignObject
                      x={edge.midX - 14}
                      y={edge.midY - 14}
                      width={28}
                      height={28}
                      className="overflow-visible"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEdge(edge.id);
                        }}
                        title="Remover Conexão"
                        className="w-7 h-7 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg border border-white/40 cursor-pointer hover:scale-110 transition-transform"
                      >
                        <X className="w-3.5 h-3.5 font-bold" />
                      </button>
                    </foreignObject>
                  )}
                </g>
              );
            })}

            {/* Active Drawing Line from Port to Cursor */}
            {connectingFromId && (() => {
              const fromNode = nodes.find((n) => n.id === connectingFromId);
              if (!fromNode) return null;

              const x1 = fromNode.x + NODE_WIDTH / 2;
              const y1 = fromNode.y + NODE_HEIGHT;
              const x2 = mouseCanvasPos.x;
              const y2 = mouseCanvasPos.y;

              const dy = Math.max(Math.abs(y2 - y1) * 0.5, 30);
              const pathData = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

              return (
                <path
                  d={pathData}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={3.5}
                  strokeDasharray="6 4"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
              );
            })()}
          </svg>

          {/* Render Flow Nodes (Movable with mouse anywhere on card) */}
          {nodes.map((node) => {
            const user = allUsers.find((u) => u.id === node.id);
            if (!user) return null;

            const isLeader = user.id === division.leaderId || user.role === 'superadmin';
            const isTargetOfConnecting = connectingFromId !== null && connectingFromId !== node.id;
            const isBeingDragged = draggingNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: `${NODE_WIDTH}px`,
                  minHeight: `${NODE_HEIGHT}px`,
                }}
                className={`absolute rounded-2xl bg-slate-900/95 border-2 shadow-2xl backdrop-blur-md select-none group/node transition-shadow ${
                  isBeingDragged
                    ? 'cursor-grabbing scale-105 z-50 ring-4 ring-orange-500/40 shadow-orange-500/30'
                    : 'cursor-grab z-10 hover:shadow-2xl'
                } ${
                  isLeader 
                    ? 'border-amber-400/90 shadow-amber-500/20' 
                    : user.role === 'admin'
                    ? 'border-blue-500/80 shadow-blue-500/20'
                    : 'border-slate-700 hover:border-slate-500 shadow-black/60'
                }`}
              >
                {/* Top Input Connection Port (Incoming Flow) */}
                <div
                  onClick={(e) => handleEndConnect(e, node.id)}
                  title="Conectar aqui (Porta de Entrada)"
                  className={`flow-port absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all z-30 ${
                    isTargetOfConnecting 
                      ? 'bg-amber-400 ring-4 ring-amber-400/60 scale-125 animate-bounce shadow-lg' 
                      : 'bg-blue-500 border-2 border-white hover:scale-125 hover:bg-blue-400 shadow-md'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                </div>

                {/* Node Top Color Accent Bar */}
                <div
                  className={`h-2.5 rounded-t-2xl flex items-center justify-between px-3 ${
                    isLeader ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                  }`}
                />

                {/* Node Main Content */}
                <div className="p-3.5 space-y-2.5">
                  
                  {/* Avatar & Header Info */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0 pointer-events-none">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-sm">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {isLeader && (
                          <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pointer-events-none">
                        <h4 className="font-black text-xs text-white truncate group-hover/node:text-blue-400 transition-colors">
                          {user.name}
                        </h4>
                        <p className="text-[11px] text-orange-400 font-bold truncate">
                          {user.position || user.role}
                        </p>
                        <span className="text-[9px] font-mono text-slate-400 block">
                          {user.registrationCode || 'COL-001'}
                        </span>
                      </div>
                    </div>

                    {/* Quick remove from flow button (Superadmin only) */}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveNode(node.id);
                        }}
                        title="Remover do Flow"
                        className="opacity-0 group-hover/node:opacity-100 p-1.5 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 rounded-lg transition-opacity cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Footer Action Links */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      isLeader ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isLeader ? 'Liderança' : user.role === 'admin' ? 'Gestão' : 'Operador'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUserDossier(user);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <span>Ver Dossiê &rarr;</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Output Connection Port (Outgoing Flow) */}
                <div
                  onClick={(e) => handleStartConnect(e, node.id)}
                  title="Clique aqui e ligue no próximo colaborador para traçar a linha hierárquica"
                  className={`flow-port absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all z-30 ${
                    connectingFromId === node.id
                      ? 'bg-amber-400 ring-4 ring-amber-400/60 scale-125 shadow-lg'
                      : 'bg-emerald-500 border-2 border-white hover:scale-125 hover:bg-emerald-400 shadow-md'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
