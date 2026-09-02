import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { 
  Camera, 
  X, 
  Upload, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  AlertCircle, 
  CheckCircle2, 
  ScanLine,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  description?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Leitor de Código de Barras',
  description = 'Aponte a câmera para o código de barras ou envie uma foto para ler automaticamente.',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState<boolean>(false);

  // Play audio beep upon successful scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not supported or blocked
    }
  };

  const handleSuccessfulScan = (code: string) => {
    if (!code || detectedCode) return;
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setDetectedCode(cleanCode);
    playBeep();
    if (navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {}
    }

    // Stop scanner and notify parent
    setTimeout(() => {
      stopCamera();
      onScan(cleanCode);
      onClose();
    }, 600);
  };

  const startCamera = async () => {
    setCameraError(null);
    setDetectedCode(null);
    setIsScanning(true);

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      // Stop any existing stream first
      stopCamera();

      codeReaderRef.current = new BrowserMultiFormatReader();

      const videoElement = videoRef.current;
      if (!videoElement) return;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      await videoElement.play();

      // Check torch support
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as any;
        if (capabilities.torch) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
      }

      // Start decoding loop
      codeReaderRef.current.decodeFromVideoDevice(undefined, videoElement, (result, error) => {
        if (result) {
          handleSuccessfulScan(result.getText());
        }
        if (error && !(error instanceof NotFoundException)) {
          // Log other errors quietly
        }
      });
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasCamera(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permissão de acesso à câmera negada. Permita o uso da câmera nas permissões do navegador ou carregue uma imagem.'
          : 'Não foi possível acessar a câmera do dispositivo. Você pode tirar uma foto ou carregar uma imagem com código de barras.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    } catch {}

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        const nextTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      }
    } catch (err) {
      console.warn('Torch not supported or failed to toggle', err);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch camera when facingMode changes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Decode barcode from an uploaded image or captured photo file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingImage(true);
    setCameraError(null);

    try {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Try with native BarcodeDetector if available for super fast recognition
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf'],
          });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleSuccessfulScan(barcodes[0].rawValue);
            setProcessingImage(false);
            URL.revokeObjectURL(imageUrl);
            return;
          }
        } catch (err) {
          console.warn('BarcodeDetector fallback to ZXing:', err);
        }
      }

      // Use ZXing reader on the image element
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageElement(img);
      if (result) {
        handleSuccessfulScan(result.getText());
      } else {
        setCameraError('Nenhum código de barras nítido foi detectado nesta imagem. Tente uma foto mais aproximada e focada.');
      }
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error('Failed to decode image:', err);
      setCameraError('Não foi possível ler o código de barras da imagem enviada. Certifique-se de que o código está nítido e bem iluminado.');
    } finally {
      setProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Capture frame directly from the current video feed
  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setProcessingImage(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Native BarcodeDetector try
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
            });
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              handleSuccessfulScan(barcodes[0].rawValue);
              setProcessingImage(false);
              return;
            }
          } catch {}
        }

        const reader = new BrowserMultiFormatReader();
        const result = await reader.decodeFromImageUrl(canvas.toDataURL());
        if (result) {
          handleSuccessfulScan(result.getText());
        } else {
          setCameraError('Não foi possível reconhecer o código no quadro capturado. Tente aproximar ou focar melhor a câmera.');
        }
      }
    } catch (err) {
      console.warn('Snapshot decode error:', err);
      setCameraError('Não foi possível ler o código na captura. Tente novamente.');
    } finally {
      setProcessingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal-backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                {title}
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Leitura óptica de códigos de barras (EAN-13, Code 128, etc.)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video & Scanner Area */}
        <div className="relative bg-black flex-1 min-h-[260px] sm:min-h-[320px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover max-h-[380px]"
          />

          {/* Scanner Overlay Visual Guide */}
          {!cameraError && !detectedCode && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              {/* Dimmed surrounding */}
              <div className="relative w-full max-w-[280px] sm:max-w-[340px] aspect-[4/3] rounded-xl border-2 border-orange-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-orange-400 rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-orange-400 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-orange-400 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-orange-400 rounded-br-md" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_8px_#fb923c] animate-[bounce_2s_infinite]" />

                <div className="absolute -bottom-7 left-0 right-0 text-center">
                  <span className="text-[11px] font-semibold text-orange-300 bg-black/70 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    Centralize o código de barras aqui
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Success Overlay when detected */}
          {detectedCode && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-16 h-16 text-orange-400 animate-bounce mb-2" />
              <span className="text-xs uppercase font-bold tracking-wider text-orange-400">
                Código Detectado com Sucesso!
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-white bg-slate-950 px-4 py-2 rounded-xl border border-orange-500/50 mt-2 shadow-lg">
                {detectedCode}
              </span>
              <span className="text-xs text-slate-300 mt-2">
                Preenchendo pesquisa...
              </span>
            </div>
          )}

          {/* Processing Spinner */}
          {processingImage && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20">
              <RefreshCw className="w-10 h-10 text-orange-400 animate-spin mb-3" />
              <span className="text-sm font-bold text-white">Analisando imagem...</span>
              <span className="text-xs text-slate-300 mt-1">Decodificando código de barras</span>
            </div>
          )}

          {/* Camera Error / Fallback message */}
          {cameraError && !detectedCode && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-6 z-10">
              <AlertCircle className="w-12 h-12 text-orange-400 mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Câmera Indisponível</h4>
              <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                {cameraError}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tentar Câmera Novamente
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Carregar Imagem / Foto
                </button>
              </div>
            </div>
          )}

          {/* Camera Controls Bar (Top Float) */}
          {!cameraError && isScanning && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  title={torchOn ? 'Desligar Lanterna' : 'Ligar Lanterna'}
                  className={`p-2 rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                    torchOn 
                      ? 'bg-orange-500 text-white border-orange-400' 
                      : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                  }`}
                >
                  {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Alternar Câmera Frontal / Traseira"
                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions & Instructions */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 space-y-3">
          <p className="text-[11px] text-slate-300 text-center leading-relaxed">
            {description}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Capture current frame */}
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              disabled={!isScanning || processingImage}
              className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <ScanLine className="w-4 h-4" />
              <span>Capturar Foto</span>
            </button>

            {/* Upload image file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processingImage}
              className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-600 shadow-sm"
            >
              <Upload className="w-4 h-4 text-orange-400" />
              <span>Carregar Foto</span>
            </button>
          </div>

          {/* Hidden File Input with camera capture attribute for mobile */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
};
