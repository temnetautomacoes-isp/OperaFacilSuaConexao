import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Clock, 
  AlertCircle,
  Upload,
  UserCheck,
  Eye
} from 'lucide-react';

interface BiometricSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (selfieBase64: string) => void;
  title: string;
  subtitle?: string;
  employeeName: string;
  employeeCode?: string;
  locationName?: string;
  actionTypeLabel?: string; // Ex: "Entrada 1", "Saída Almoço", "Justificativa de Falta"
}

export const BiometricSelfieModal: React.FC<BiometricSelfieModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  subtitle = 'Tire uma selfie em tempo real para comprovar sua identidade e registrar a assinatura biométrica.',
  employeeName,
  employeeCode = 'COL-001',
  locationName = 'Sede Central NOC / Matriz',
  actionTypeLabel = 'Registro de Ponto'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Clock tick for overlay
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCapturedImage(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada pelo navegador.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.warn('Erro ao acessar a câmera:', err);
      setCameraError(
        'Não foi possível inicializar a câmera frontal automaticamente. Permita o acesso à câmera ou anexe uma foto selfie.'
      );
    }
  }, [stream]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Handle Open/Close modal
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Snap photo from video stream with watermark overlay
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 640;
    canvas.width = width;
    canvas.height = height;

    // Draw mirrored video frame (for natural front camera feel)
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Add semi-transparent gradient watermark bar at bottom
    const gradient = ctx.createLinearGradient(0, height - 120, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
    gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.7)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - 120, width, 120);

    // Draw Watermark text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(`${employeeName} (${employeeCode})`, 24, height - 70);

    ctx.fillStyle = '#f97316'; // Orange
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`● BIOMETRIA: ${actionTypeLabel.toUpperCase()}`, 24, height - 42);

    ctx.fillStyle = '#cbd5e1'; // Slate-300
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`${currentTimeStr} • ${locationName}`, 24, height - 18);

    // Get Base64 JPEG data
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Fallback: Handle manual selfie upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setCapturedImage(result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirm capture
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-white">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] font-extrabold uppercase bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  Biometria
                </span>
              </h3>
              <p className="text-xs text-slate-400">{actionTypeLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {subtitle}
          </p>

          {/* Camera Viewfinder / Preview Container */}
          <div className="relative aspect-square w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center group">
            
            {/* Flash Effect */}
            {isFlashActive && (
              <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
            )}

            {/* Hidden Canvas for capture rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden File input for fallback */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* 1. Captured Photo Preview */}
            {capturedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Selfie Biométrica"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>Foto Capturada</span>
                </div>
              </div>
            ) : !cameraError ? (
              /* 2. Live Video Camera Stream */
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />

                {/* Facial Alignment Oval Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-64 sm:w-56 sm:h-72 rounded-[45%] border-2 border-dashed border-orange-400/80 shadow-[0_0_20px_rgba(249,115,22,0.3)] relative overflow-hidden">
                    {/* Animated Scanning Beam */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse" 
                         style={{ animation: 'bounce 2.5s infinite ease-in-out' }} />
                  </div>
                </div>

                {/* Overlay Tags */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <span>{currentTimeStr.split(' ')[1] || '00:00:00'}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{employeeName}</span>
                    <span className="text-orange-400 font-mono text-[10px]">{employeeCode}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-300 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{locationName}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* 3. Camera Error / Fallback State */
              <div className="p-6 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                <p className="text-xs text-amber-200 font-medium">
                  {cameraError}
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar Câmera Novamente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-orange-500/20"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Anexar Foto da Selfie</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Explanatory security badge */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-tight">
              A selfie biométrica é criptografada e vinculada à sua folha de ponto para proteção e auditoria do colaborador e da empresa.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tirar Outra Foto</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all cursor-pointer transform active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar & Assinar Ponto</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Caso a webcam não abra, você pode carregar uma foto"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Carregar Foto</span>
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                disabled={Boolean(cameraError)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all cursor-pointer transform active:scale-98"
              >
                <Camera className="w-4 h-4" />
                <span>📸 Tirar Selfie Agora</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
