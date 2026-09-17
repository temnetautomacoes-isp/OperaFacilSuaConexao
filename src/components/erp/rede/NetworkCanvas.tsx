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
  RotateCw,
  Maximize2,
  Trash2,
  Edit3,
  Check,
  Undo2,
  X
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
  isDrawingPathMode?: boolean;
  onToggleDrawingPathMode?: () => void;
  selectedNodeId: string | null;
  selectedLinkId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onDoubleClickNode?: (nodeId: string) => void;
  onSelectLink: (linkId: string | null) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onAddLink: (
    sourceNodeId?: string, 
    targetNodeId?: string, 
    linkType?: LinkType, 
    customStyle?: LinkStyleConfig, 
    startPoint?: { x: number; y: number }, 
    endPoint?: { x: number; y: number },
    points?: Array<{ x: number; y: number }>
  ) => void;
  onDeleteLink?: (linkId: string) => void;
  isSimulationMode?: boolean;
  activePackets?: SimulationPacket[];
  zoom: number;
  panOffset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  onZoomChange?: (zoom: number) => void;
  selectedCableType?: string;
  isConnectingMode?: boolean;
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

// Generate SVG Path from multiple waypoints (Google Earth style)
export const generateSvgPathFromPoints = (
  points: Array<{ x: number; y: number }>,
  lineStyle: 'straight' | 'curved' | 'stepped' = 'straight'
): string => {
  if (!points || points.length < 2) return '';

  if (lineStyle === 'straight') {
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  if (lineStyle === 'stepped') {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const midX = (prev.x + cur.x) / 2;
      d += ` H ${midX} V ${cur.y} H ${cur.x}`;
    }
    return d;
  }

  if (lineStyle === 'curved') {
    if (points.length === 2) {
      const p0 = points[0];
      const p1 = points[1];
      const dx = p1.x - p0.x;
      const curvature = Math.max(30, Math.min(160, Math.abs(dx) * 0.5));
      return `M ${p0.x} ${p0.y} C ${p0.x + curvature} ${p0.y}, ${p1.x - curvature} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Multi-point smooth Catmull-Rom to Cubic Bezier curve
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
};

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  links,
  folders = [],
  shapes = [],
  onUpdateShape,
  onDeleteShape,
  activeLineConfig,
  isDrawingPathMode = false,
  onToggleDrawingPathMode,
  selectedNodeId,
  selectedLinkId,
  onSelectNode,
  onDoubleClickNode,
  onSelectLink,
  onMoveNode,
  onAddLink,
  onDeleteLink,
  isSimulationMode = false,
  zoom,
  panOffset,
  onPanChange,
  onZoomChange,
  selectedCableType = 'fiber_sm',
  isConnectingMode = false,
  onOpenRackElevation,
}) => {
  // Folder visibility map
  const hiddenFolderIds = new Set(
    folders.filter(f => f.visible === false).map(f => f.id)
  );

  const visibleNodes = nodes.filter(n => !n.folderId || !hiddenFolderIds.has(n.folderId));
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleLinks = links.filter(l => {
    if (l.points && l.points.length >= 2) return true;
    if (l.sourceNodeId && l.targetNodeId) {
      return visibleNodeIds.has(l.sourceNodeId) && visibleNodeIds.has(l.targetNodeId);
    }
    return true;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag & Pan states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Shape transform states (Move, Resize, Rotate & Scale)
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [editingShapeText, setEditingShapeText] = useState('');
  const [transformingShapeId, setTransformingShapeId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'move' | 'resize' | 'rotate_scale' | null>(null);
  const [transformStart, setTransformStart] = useState<{
    mouseX: number;
    mouseY: number;
    shapeX: number;
    shapeY: number;
    width: number;
    height: number;
    rotation: number;
    centerX: number;
    centerY: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    shapeX: 0,
    shapeY: 0,
    width: 0,
    height: 0,
    rotation: 0,
    centerX: 0,
    centerY: 0,
  });

  // Connecting cable state (Drag dot to Connect)
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Google Earth Multi-Point Drawing Path State
  const [drawingPathPoints, setDrawingPathPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [drawingSourceNodeId, setDrawingSourceNodeId] = useState<string | null>(null);
  const [drawingTargetNodeId, setDrawingTargetNodeId] = useState<string | null>(null);

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

  // Finish Path Drawing (Create Polyline NetworkLink)
  const handleFinishDrawingPath = () => {
    if (drawingPathPoints.length >= 2) {
      onAddLink(
        drawingSourceNodeId || undefined,
        drawingTargetNodeId || undefined,
        (selectedCableType || 'fiber_sm') as LinkType,
        activeLineConfig,
        drawingPathPoints[0],
        drawingPathPoints[drawingPathPoints.length - 1],
        drawingPathPoints
      );
    }
    setDrawingPathPoints([]);
    setDrawingSourceNodeId(null);
    setDrawingTargetNodeId(null);
    if (onToggleDrawingPathMode) {
      onToggleDrawingPathMode();
    }
  };

  // Undo last drawn point
  const handleUndoDrawPoint = () => {
    setDrawingPathPoints(prev => prev.slice(0, -1));
  };

  // Cancel Drawing Path
  const handleCancelDrawingPath = () => {
    setDrawingPathPoints([]);
    setDrawingSourceNodeId(null);
    setDrawingTargetNodeId(null);
    if (onToggleDrawingPathMode) {
      onToggleDrawingPathMode();
    }
  };

  // Mouse move on canvas container
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const curX = (e.clientX - rect.left - panOffset.x) / zoom;
    const curY = (e.clientY - rect.top - panOffset.y) / zoom;
    setMousePos({ x: Math.round(curX), y: Math.round(curY) });
  };

  // Global window listeners for dragging nodes, transforming shapes & pan
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const curX = (e.clientX - rect.left - panOffset.x) / zoom;
      const curY = (e.clientY - rect.top - panOffset.y) / zoom;
      setMousePos({ x: Math.round(curX), y: Math.round(curY) });

      if (connectingSourceId) {
        // Target node detection
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
        let newX = curX - dragOffset.x;
        let newY = curY - dragOffset.y;

        // Snap to 20px grid
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;

        onMoveNode(draggingNodeId, newX, newY);
      }

      // Shape Transformation: Move
      if (transformingShapeId && transformMode === 'move' && onUpdateShape) {
        let newX = curX - dragOffset.x;
        let newY = curY - dragOffset.y;

        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;

        onUpdateShape(transformingShapeId, { x: newX, y: newY });
      }

      // Shape Transformation: Resize Corner Handle
      if (transformingShapeId && transformMode === 'resize' && onUpdateShape) {
        const deltaX = curX - transformStart.mouseX;
        const deltaY = curY - transformStart.mouseY;

        const currentShape = shapes.find(s => s.id === transformingShapeId);
        const isCircle = currentShape?.type === 'circle';

        let newW = Math.max(50, Math.round(transformStart.width + deltaX));
        let newH = isCircle ? newW : Math.max(35, Math.round(transformStart.height + deltaY));

        onUpdateShape(transformingShapeId, {
          width: newW,
          height: newH,
        });
      }

      // Shape Transformation: Rotate & Scale Handle
      if (transformingShapeId && transformMode === 'rotate_scale' && onUpdateShape) {
        const dx = curX - transformStart.centerX;
        const dy = curY - transformStart.centerY;

        // 1. Calculate rotation in degrees
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = Math.round((angleRad * 180 / Math.PI) + 90);
        const normalizedAngle = (angleDeg % 360 + 360) % 360;

        // 2. Calculate radial distance to scale size proportionally
        const dist = Math.hypot(dx, dy);
        const initialDist = Math.hypot(transformStart.width / 2, transformStart.height / 2) || 80;
        const scaleFactor = Math.max(0.3, dist / initialDist);

        const currentShape = shapes.find(s => s.id === transformingShapeId);
        const isCircle = currentShape?.type === 'circle';

        let newW = Math.max(50, Math.round(transformStart.width * scaleFactor));
        let newH = isCircle ? newW : Math.max(35, Math.round(transformStart.height * scaleFactor));

        onUpdateShape(transformingShapeId, {
          rotation: normalizedAngle,
          width: newW,
          height: newH,
        });
      }
    };

    const onWindowMouseUp = () => {
      setIsPanning(false);
      setDraggingNodeId(null);
      setTransformingShapeId(null);
      setTransformMode(null);

      if (connectingSourceId) {
        const curX = mousePos.x;
        const curY = mousePos.y;

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
        setConnectingSourceId(null);
        setHoveredTargetNodeId(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawingPathPoints.length > 0 || isDrawingPathMode) {
          handleCancelDrawingPath();
        }
        setConnectingSourceId(null);
        setHoveredTargetNodeId(null);
        setEditingShapeId(null);
      } else if (e.key === 'Enter') {
        if (isDrawingPathMode && drawingPathPoints.length >= 2) {
          handleFinishDrawingPath();
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (isDrawingPathMode && drawingPathPoints.length > 0) {
          handleUndoDrawPoint();
        }
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
    transformingShapeId,
    transformMode,
    transformStart,
    isPanning, 
    connectingSourceId, 
    hoveredTargetNodeId, 
    visibleNodes, 
    shapes,
    selectedCableType, 
    activeLineConfig, 
    isDrawingPathMode,
    drawingPathPoints,
    drawingSourceNodeId,
    drawingTargetNodeId,
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
    if (isDrawingPathMode) return;

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

  // Start Shape Move (Click border or body)
  const handleStartShapeMove = (e: React.MouseEvent, shape: CanvasShape) => {
    if (isDrawingPathMode) return;
    e.stopPropagation();
    setSelectedShapeId(shape.id);
    onSelectNode(null);
    onSelectLink(null);

    setTransformingShapeId(shape.id);
    setTransformMode('move');

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

  // Start Shape Resize (Corner Handle)
  const handleStartShapeResize = (e: React.MouseEvent, shape: CanvasShape) => {
    if (isDrawingPathMode) return;
    e.stopPropagation();
    setSelectedShapeId(shape.id);
    setTransformingShapeId(shape.id);
    setTransformMode('resize');

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const curX = (e.clientX - rect.left - panOffset.x) / zoom;
      const curY = (e.clientY - rect.top - panOffset.y) / zoom;

      setTransformStart({
        mouseX: curX,
        mouseY: curY,
        shapeX: shape.x,
        shapeY: shape.y,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2,
      });
    }
  };

  // Start Shape Rotate & Scale (Top Rotation Handle)
  const handleStartShapeRotateScale = (e: React.MouseEvent, shape: CanvasShape) => {
    if (isDrawingPathMode) return;
    e.stopPropagation();
    setSelectedShapeId(shape.id);
    setTransformingShapeId(shape.id);
    setTransformMode('rotate_scale');

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const curX = (e.clientX - rect.left - panOffset.x) / zoom;
      const curY = (e.clientY - rect.top - panOffset.y) / zoom;

      setTransformStart({
        mouseX: curX,
        mouseY: curY,
        shapeX: shape.x,
        shapeY: shape.y,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2,
      });
    }
  };

  // Handle click in drawing mode
  const handleDrawingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = Math.round((e.clientX - rect.left - panOffset.x) / zoom);
    const clickY = Math.round((e.clientY - rect.top - panOffset.y) / zoom);

    // Check if clicked near an equipment node to snap
    const nearbyNode = visibleNodes.find(n => {
      const withinBox = clickX >= n.x - 10 && clickX <= n.x + 100 && clickY >= n.y - 10 && clickY <= n.y + 100;
      const withinRadius = Math.hypot(clickX - (n.x + 45), clickY - (n.y + 28)) <= 65;
      return withinBox || withinRadius;
    });

    let pointToAdd = { x: clickX, y: clickY };
    if (nearbyNode) {
      pointToAdd = { x: nearbyNode.x + 64, y: nearbyNode.y + 28 };
      if (drawingPathPoints.length === 0) {
        setDrawingSourceNodeId(nearbyNode.id);
      } else {
        setDrawingTargetNodeId(nearbyNode.id);
      }
    }

    setDrawingPathPoints(prev => [...prev, pointToAdd]);
    setMousePos(pointToAdd);
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

  // Handle Node Mouse Down (Single click for select & drag)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (isDrawingPathMode) return;
    e.stopPropagation();

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !containerRef.current) return;

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

  // Handle Node Mouse Up
  const handleNodeMouseUp = (e: React.MouseEvent, targetNodeId: string) => {
    if (isDrawingPathMode) return;
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

  // Handle Node Double Click
  const handleNodeDoubleClick = (e: React.MouseEvent, nodeId: string) => {
    if (isDrawingPathMode) return;
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

  // Save Shape Text
  const handleSaveShapeText = (shapeId: string) => {
    if (onUpdateShape) {
      onUpdateShape(shapeId, { label: editingShapeText });
    }
    setEditingShapeId(null);
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
    const arrowType = style?.arrowType !== undefined ? style.arrowType : (style?.hasArrow === false ? 'none' : 'end');
    const lineStyle = style?.lineStyle || 'straight';

    return { color, strokeDash, width, arrowType, lineStyle, label: link.label || (link.points ? 'Traçado' : baseConfig.label) };
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
      onMouseMove={handleContainerMouseMove}
      className={`flex-1 h-full min-h-0 relative overflow-hidden bg-[#0a101d] ${
        isDrawingPathMode ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'
      } select-none`}
      style={{
        backgroundImage: `radial-gradient(circle, #1e293b 1.2px, transparent 1.2px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* ======================================================== */}
      {/* 1. LAYER DE FORMAS (Z-INDEX 5: Renderizadas atrás dos nós) */}
      {/* ======================================================== */}
      <div
        className="absolute inset-0 pointer-events-none z-5"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {shapes.map((shape) => {
          const isSelected = selectedShapeId === shape.id;
          const isEditing = editingShapeId === shape.id;
          const isTransformingThis = transformingShapeId === shape.id;

          const borderDash = shape.borderStyle === 'dashed' ? 'dashed' : shape.borderStyle === 'dotted' ? 'dotted' : 'solid';

          return (
            <div
              key={shape.id}
              onMouseDown={(e) => handleStartShapeMove(e, shape)}
              style={{
                left: `${shape.x}px`,
                top: `${shape.y}px`,
                width: `${shape.width}px`,
                height: shape.type === 'text_label' ? 'auto' : `${shape.height}px`,
                backgroundColor: shape.color || 'rgba(30, 41, 59, 0.35)',
                borderColor: isSelected ? '#facc15' : (shape.borderColor || '#facc15'),
                borderWidth: `${shape.borderWidth || 2.5}px`,
                borderStyle: borderDash,
                color: shape.textColor || '#f8fafc',
                fontSize: `${shape.fontSize || 13}px`,
                transform: `rotate(${shape.rotation || 0}deg)`,
                transformOrigin: 'center center',
              }}
              className={`absolute pointer-events-auto rounded-2xl p-3 flex flex-col justify-between group transition-shadow select-none ${
                isDrawingPathMode ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'
              } ${
                shape.type === 'circle' ? 'rounded-full text-center flex items-center justify-center' : ''
              } ${
                shape.type === 'sticky_note' ? 'shadow-xl text-slate-900 font-medium' : 'backdrop-blur-2xs'
              } ${
                isSelected ? 'ring-2 ring-amber-400 shadow-2xl' : 'hover:ring-1 hover:ring-amber-300/70'
              }`}
            >
              {/* Top Rotate & Scale Handle Stem and Button (Girar e Aumentar Tamanho) */}
              {!isDrawingPathMode && (
                <div 
                  className={`absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-30 transition-opacity duration-150 ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  onMouseDown={(e) => handleStartShapeRotateScale(e, shape)}
                >
                  <div
                    className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl cursor-crosshair ring-2 ring-white transition-transform hover:scale-125 active:scale-110"
                    title="Arraste para GIRAR e AUMENTAR/DIMINUIR a forma"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-0.5 h-4 bg-amber-400 shadow-xs" />

                  {/* Floating Rotation & Size Tooltip */}
                  {isTransformingThis && transformMode === 'rotate_scale' && (
                    <div className="absolute -top-6 whitespace-nowrap bg-slate-950/95 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-400/80 shadow-2xl pointer-events-none">
                      ↻ {shape.rotation || 0}° | {shape.width}×{shape.height}px
                    </div>
                  )}
                </div>
              )}

              {/* Bottom-Right Corner Resize Handle */}
              {!isDrawingPathMode && (
                <div
                  onMouseDown={(e) => handleStartShapeResize(e, shape)}
                  className={`absolute -bottom-2 -right-2 w-5 h-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full flex items-center justify-center cursor-nwse-resize ring-2 ring-white shadow-xl z-30 transition-all hover:scale-125 ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Arraste para redimensionar tamanho da forma"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                </div>
              )}

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
                    className="p-1 rounded bg-black/50 hover:bg-black/80 text-white cursor-pointer"
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
                      className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded hover:bg-amber-400 cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingShapeId(null)}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-700 cursor-pointer"
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
                  className="flex-1 flex items-center justify-center text-center font-bold break-words px-1 overflow-hidden pointer-events-none"
                >
                  {shape.label || 'Clique 2x para editar'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 2. LAYER DE EQUIPAMENTOS (Z-INDEX 10: PNG Icons + Labels) */}
      {/* ======================================================== */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
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
                isDrawingPathMode ? 'pointer-events-none' : isConnectTarget ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
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

                {/* Right Port Connector Dot */}
                {!isDrawingPathMode && (
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
                )}
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

      {/* ======================================================== */}
      {/* 3. SVG CANVAS LAYER (Z-INDEX 15: SOBREPÕE O MAPA E NÓS)   */}
      {/* ======================================================== */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-15"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
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
                  markerWidth="7"
                  markerHeight="7"
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
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill={color} />
                </marker>
              </React.Fragment>
            );
          })}
        </defs>

        {/* Saved Cable Links with Customizable Visual Mindmap Styles & Polyline Paths */}
        {visibleLinks.map((link) => {
          const isSelected = selectedLinkId === link.id;
          const stroke = getLinkStroke(link);
          const cleanColorId = stroke.color.replace(/[^a-zA-Z0-9]/g, '');

          let pathD = '';
          let midX = 0;
          let midY = 0;
          let startPt = { x: 0, y: 0 };

          // Case A: Link has custom polyline points (Google Earth multi-point path)
          if (link.points && link.points.length >= 2) {
            pathD = generateSvgPathFromPoints(link.points, stroke.lineStyle);
            startPt = link.points[0];
            const middleIdx = Math.floor(link.points.length / 2);
            midX = link.points[middleIdx].x;
            midY = link.points[middleIdx].y;
          } else {
            // Case B: Link connects two node equipment cards
            const src = visibleNodes.find((n) => n.id === link.sourceNodeId);
            const tgt = visibleNodes.find((n) => n.id === link.targetNodeId);
            if (!src || !tgt) return null;

            const srcX = src.x + 64;
            const srcY = src.y + 28;
            const tgtX = tgt.x >= src.x ? tgt.x + 12 : tgt.x + 64;
            const tgtY = tgt.y + 28;

            startPt = { x: srcX, y: srcY };
            pathD = generateSvgPathFromPoints([{ x: srcX, y: srcY }, { x: tgtX, y: tgtY }], stroke.lineStyle);
            midX = (srcX + tgtX) / 2;
            midY = (srcY + tgtY) / 2;
          }

          const hasEndArrow = stroke.arrowType === 'end' || stroke.arrowType === 'both';
          const hasStartArrow = stroke.arrowType === 'both';

          return (
            <g key={link.id} className="cursor-pointer pointer-events-auto group" onClick={(e) => { e.stopPropagation(); onSelectLink(link.id); }}>
              {/* Invisible wide click hitbox */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={28}
              />

              {/* Selection / Hover Glow */}
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

              {/* Dark outline for crisp contrast on dark theme */}
              <path
                d={pathD}
                fill="none"
                stroke="#020617"
                strokeWidth={stroke.width + 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Main Arrow Line */}
              <path
                d={pathD}
                fill="none"
                stroke={stroke.color}
                strokeWidth={isSelected ? stroke.width + 1.2 : stroke.width}
                strokeDasharray={stroke.strokeDash}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={hasEndArrow ? `url(#arrow-end-${cleanColorId})` : undefined}
                markerStart={hasStartArrow ? `url(#arrow-start-${cleanColorId})` : undefined}
                className={`transition-all duration-100 ${isSimulationMode ? 'animate-pulse' : ''} group-hover:brightness-125`}
              />

              {/* Start Dot on Source Port or first waypoint */}
              <circle
                cx={startPt.x}
                cy={startPt.y}
                r={4.5}
                fill={stroke.color}
                stroke="#ffffff"
                strokeWidth={1.5}
              />

              {/* Render waypoints circles when link is selected */}
              {isSelected && link.points && link.points.map((pt, pIdx) => (
                <circle
                  key={pIdx}
                  cx={pt.x}
                  cy={pt.y}
                  r={5}
                  fill="#facc15"
                  stroke="#020617"
                  strokeWidth={2}
                />
              ))}

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

        {/* Temporary connecting line when dragging a new link between nodes */}
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

              const dragPathD = generateSvgPathFromPoints([{ x: startX, y: startY }, { x: endX, y: endY }], lineStyle);

              return (
                <g>
                  {/* Dark backdrop */}
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

        {/* 3. GOOGLE EARTH LIVE DRAWING PATH PREVIEW (Traçado multi-pontos em tempo real) */}
        {isDrawingPathMode && drawingPathPoints.length > 0 && (
          <g className="pointer-events-none">
            {(() => {
              const lineColor = activeLineConfig?.strokeColor || '#facc15';
              const cleanColorId = lineColor.replace(/[^a-zA-Z0-9]/g, '');
              const strokeDash = activeLineConfig?.strokeDash === 'dashed' ? '6,5' : activeLineConfig?.strokeDash === 'dotted' ? '2,4' : undefined;
              const strokeWidth = activeLineConfig?.strokeWidth || 3;
              const lineStyle = activeLineConfig?.lineStyle || 'straight';

              // 1. Fixed Path of all clicked vertices so far
              const fixedPathD = drawingPathPoints.length >= 2 
                ? generateSvgPathFromPoints(drawingPathPoints, lineStyle) 
                : '';

              // 2. Rubberband dynamic line connecting last clicked point to current moving cursor
              const lastPt = drawingPathPoints[drawingPathPoints.length - 1];
              const rubberbandPoints = [lastPt, mousePos];
              const rubberbandPathD = generateSvgPathFromPoints(rubberbandPoints, lineStyle);

              return (
                <g>
                  {/* Fixed Clicked Path (Guaranteed visible once 2+ points are clicked) */}
                  {fixedPathD && (
                    <>
                      <path
                        d={fixedPathD}
                        fill="none"
                        stroke="#020617"
                        strokeWidth={strokeWidth + 4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={fixedPathD}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={strokeWidth + 1}
                        strokeDasharray={strokeDash}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {/* Dynamic Rubberband to moving cursor */}
                  <path
                    d={rubberbandPathD}
                    fill="none"
                    stroke="#020617"
                    strokeWidth={strokeWidth + 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={rubberbandPathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray="4,4"
                    opacity={0.85}
                    markerEnd={activeLineConfig?.arrowType !== 'none' ? `url(#arrow-end-${cleanColorId})` : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Clicked Vertices Dots with High-Contrast Number Badges */}
                  {drawingPathPoints.map((pt, idx) => (
                    <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
                      <circle r={11} fill="#020617" opacity={0.7} />
                      <circle r={8.5} fill="#f97316" stroke="#ffffff" strokeWidth={2.5} />
                      <text x={0} y={3.5} fill="#ffffff" fontSize={10} fontWeight="900" textAnchor="middle">
                        {idx + 1}
                      </text>
                    </g>
                  ))}

                  {/* Current Moving Cursor Target Dot */}
                  <g transform={`translate(${mousePos.x}, ${mousePos.y})`}>
                    <circle r={6} fill={lineColor} stroke="#ffffff" strokeWidth={2} />
                    <circle r={14} fill="none" stroke={lineColor} strokeWidth={1.5} opacity={0.8} className="animate-ping" />
                  </g>
                </g>
              );
            })()}
          </g>
        )}
      </svg>

      {/* ======================================================== */}
      {/* 4. ACTIVE DRAWING TRANSPARENT CLICK CAPTURE OVERLAY (Z-25) */}
      {/* ======================================================== */}
      {isDrawingPathMode && (
        <div
          onMouseDown={handleDrawingClick}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (drawingPathPoints.length >= 2) handleFinishDrawingPath();
          }}
          className="absolute inset-0 z-25 cursor-crosshair"
        />
      )}

      {/* ======================================================== */}
      {/* 5. FLOATING TOP BANNERS & CONTROLS (Z-INDEX 30)          */}
      {/* ======================================================== */}
      {/* Floating Notification Banner for Google Earth Path Drawing Mode */}
      {isDrawingPathMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/98 backdrop-blur-md border border-amber-400/90 shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 text-white text-xs select-none pointer-events-auto animate-in slide-in-from-top-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-extrabold text-amber-300">
              ✏️ Modo Traçado (Google Earth):
            </span>
            <span className="text-slate-200">
              {drawingPathPoints.length === 0
                ? 'Clique no mapa para marcar o 1º ponto'
                : `${drawingPathPoints.length} ponto(s) marcado(s). Clique para continuar ou duplo clique para concluir.`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {drawingPathPoints.length >= 2 && (
              <button
                type="button"
                onClick={handleFinishDrawingPath}
                className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md"
                title="Concluir e Salvar Traçado (Enter)"
              >
                <Check className="w-3.5 h-3.5" />
                Concluir (Enter)
              </button>
            )}

            {drawingPathPoints.length > 0 && (
              <button
                type="button"
                onClick={handleUndoDrawPoint}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer border border-slate-700 transition-colors"
                title="Desfazer último ponto (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3 text-amber-400" />
                Desfazer
              </button>
            )}

            <button
              type="button"
              onClick={handleCancelDrawingPath}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer border border-slate-700 transition-colors"
              title="Cancelar Traçado (ESC)"
            >
              <X className="w-3 h-3" />
              Sair (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Connection Mode Helper Notification Banner (Drag from Dot) */}
      {connectingSourceNode && !isDrawingPathMode && (
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

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset 100%, Center) */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-2xl select-none">
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
