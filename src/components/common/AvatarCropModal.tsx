import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Check, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset parameters when image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleApplyCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const outputSize = 320; // High resolution square avatar
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Radius of circular preview area in the modal (240px container)
    const previewSize = 240;
    const scaleFactor = outputSize / previewSize;

    ctx.save();
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Center and translate
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(position.x * scaleFactor / zoom, position.y * scaleFactor / zoom);

    // Calculate dimensions to match CSS object-contain / fill inside the box
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let drawWidth = outputSize;
    let drawHeight = outputSize;

    if (imgRatio > 1) {
      drawWidth = outputSize * imgRatio;
      drawHeight = outputSize;
    } else {
      drawWidth = outputSize;
      drawHeight = outputSize / imgRatio;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Export compressed JPEG data URL (~25KB)
    const croppedUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="avatar-crop-modal-backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-in fade-in duration-150 select-none"
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div className="bg-white rounded-2xl max-w-md w-full text-slate-800 shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-sm">Enquadrar Foto de Perfil</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors cursor-pointer p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Canvas / Viewport */}
        <div className="p-6 bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[11px] text-slate-300 mb-3 flex items-center gap-1.5 font-medium">
            <Move className="w-3.5 h-3.5 text-orange-400" />
            <span>Arraste para posicionar e use o zoom para enquadrar</span>
          </p>

          {/* Mask Frame (240x240px circular cutout) */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="w-[240px] h-[240px] rounded-full overflow-hidden relative cursor-grab active:cursor-grabbing border-4 border-orange-500 shadow-2xl bg-black flex items-center justify-center"
            style={{ touchAction: 'none' }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Foto para Enquadrar"
              draggable={false}
              className="max-w-none pointer-events-none transition-transform duration-75 ease-out"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />

            {/* Circular Guide overlay */}
            <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-5 bg-white space-y-4 text-xs">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-600 font-bold text-[11px]">
              <span className="flex items-center gap-1">
                <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
                Zoom ({zoom.toFixed(1)}x)
              </span>
              <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Action Buttons: Rotate, Reset, etc. */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Girar 90 graus"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Girar</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Centralizar e resetar zoom"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Centralizar</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleApplyCrop}
                className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Foto</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
