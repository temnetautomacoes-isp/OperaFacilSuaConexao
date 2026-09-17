import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Layers, 
  Box, 
  Sliders, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon,
  Save,
  Tag,
  Info,
  ShieldCheck,
  Building2,
  HardDrive,
  Cpu,
  Zap,
  Sparkles,
  Check,
  Plus
} from 'lucide-react';
import { NetworkNode, DeviceType, NetworkFolder } from '../../../types/network';
import { supabaseService } from '../../../services/supabaseService';
import { safeSetItem } from '../../../utils/safeStorage';

export interface NewRackModalProps {
  isOpen: boolean;
  folders: NetworkFolder[];
  defaultFolderId?: string | null;
  onClose: () => void;
  onAddRack: (rackNode: Partial<NetworkNode>) => void;
}

const RACK_PRESET_UNITS = [6, 8, 12, 16, 20, 24, 32, 36, 40, 42, 44, 48];

export const NewRackModal: React.FC<NewRackModalProps> = ({
  isOpen,
  folders,
  defaultFolderId,
  onClose,
  onAddRack,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState<string>('RAQUE DE CHAO POP PRINCIPAL');
  const [rackType, setRackType] = useState<DeviceType>('rack_floor');
  const [totalUnits, setTotalUnits] = useState<number>(44);
  const [customUnitsInput, setCustomUnitsInput] = useState<string>('44');
  const [folderId, setFolderId] = useState<string>(defaultFolderId || folders[0]?.id || '');
  const [vendor, setVendor] = useState<string>('Padrão Telecom 19"');
  const [model, setModel] = useState<string>('Gabinete Fechado 19" EIA-310');
  const [depthMm, setDepthMm] = useState<string>('1000mm');
  const [maxWeightKg, setMaxWeightKg] = useState<string>('800');
  const [voltage, setVoltage] = useState<string>('220V AC');
  const [locationRoom, setLocationRoom] = useState<string>('Sala de Equipamentos / POP');
  const [notes, setNotes] = useState<string>('Rack padrão 19 polegadas para concentradores, switches, OLTs, DIOs e servidores.');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const handleUnitSelect = (u: number) => {
    setTotalUnits(u);
    setCustomUnitsInput(String(u));
  };

  const handleCustomUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomUnitsInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 60) {
      setTotalUnits(parsed);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, SVG, JPG, WebP).');
        return;
      }
      setIsUploadingImage(true);
      try {
        const publicUrl = await supabaseService.uploadFile(file, 'network/devices');
        setCustomImageUrl(publicUrl);
      } catch (uploadErr) {
        console.warn('Falha no upload para o Supabase Storage, utilizando fallback local base64:', uploadErr);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setCustomImageUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingImage(false);
      }
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, digite o nome do Raque.');
      return;
    }

    const finalUnits = Math.max(1, Math.min(60, totalUnits || 44));
    const targetFolder = folders.find(f => f.id === folderId);

    const newRackNode: Partial<NetworkNode> = {
      name: name.trim(),
      hostname: `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`,
      type: rackType,
      category: 'rack_power',
      rackUnits: finalUnits,
      totalRackCapacityU: finalUnits,
      folderId: folderId || undefined,
      location: `${targetFolder?.name || 'POP'} - ${locationRoom || 'Rack Central'}`,
      vendor: vendor.trim() || 'Padrão 19"',
      model: model.trim() || `${finalUnits}U Rack`,
      notes: notes.trim(),
      status: 'online',
      powerSupply: voltage,
      customImageUrl: customImageUrl.trim() || undefined,
      imageUrl: customImageUrl.trim() || undefined,
    };

    onAddRack(newRackNode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-orange-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-md">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Adicionar Novo Raque de Telecom
                </h3>
                <span className="text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  {totalUnits}U • 19" EIA-310
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure a capacidade de Us, POP e dimensões do gabinete vertical de infraestrutura.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Nome do Rack */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-orange-400" />
              Nome de Identificação do Raque <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: RAQUE DE CHAO POP PRINCIPAL, RACK 44U CORE..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
            />
          </div>

          {/* QUANTIDADE DE US (PRESETS + INPUT CUSTOMIZADO) */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-orange-400" />
                Quantidade de Us do Raque (Capacidade Total) <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs font-mono font-black text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-lg border border-orange-800">
                {totalUnits} Unidades de Rack (U)
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {RACK_PRESET_UNITS.map((u) => {
                const isSelected = totalUnits === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleUnitSelect(u)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-black transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/30 ring-2 ring-orange-400/50 scale-102'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{u}U</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Numeric Input */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-400 font-medium">Ou digite uma quantidade personalizada:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customUnitsInput}
                  onChange={handleCustomUnitsChange}
                  className="w-20 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-black text-orange-400 text-center focus:outline-hidden focus:border-orange-500"
                />
                <span className="text-xs font-mono font-bold text-slate-400">Us</span>
              </div>
            </div>
          </div>

          {/* Tipo de Rack e Pasta Pertencente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de Gabinete */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-orange-400" />
                Tipo de Gabinete / Instalação
              </label>
              <select
                value={rackType}
                onChange={(e) => setRackType(e.target.value as DeviceType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500 font-medium cursor-pointer"
              >
                <option value="rack_floor">Rack de Chão 19" Fechado (Padrão Server)</option>
                <option value="rack_wall">Rack de Parede 19" (Mini Rack)</option>
                <option value="rack_19">Bastidor Aberto 19" (2 ou 4 Colunas)</option>
              </select>
            </div>

            {/* Pasta / POP Pertencente */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                Pasta / POP Pertencente (SGP TSMX)
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500 font-medium cursor-pointer"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
                {folders.length === 0 && (
                  <option value="">Nenhuma pasta (Geral)</option>
                )}
              </select>
            </div>
          </div>

          {/* Especificações Técnicas (Profundidade, Carga, Tensão) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Profundidade</label>
              <select
                value={depthMm}
                onChange={(e) => setDepthMm(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="600mm">600 mm (Telecom)</option>
                <option value="800mm">800 mm (Padrão)</option>
                <option value="1000mm">1000 mm (Servidores)</option>
                <option value="1200mm">1200 mm (Data Center)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Carga Máxima (kg)</label>
              <input
                type="text"
                value={maxWeightKg}
                onChange={(e) => setMaxWeightKg(e.target.value)}
                placeholder="Ex: 800"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Tensão / Alimentação</label>
              <select
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="220V AC">220V AC Monofásico</option>
                <option value="380V Trifásico">380V AC Trifásico</option>
                <option value="110V AC">110V AC</option>
                <option value="-48V DC">-48V DC Telecom</option>
              </select>
            </div>
          </div>

          {/* Imagem PNG Customizada para o Mapa (Supabase File Storage) */}
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                Ícone / Imagem PNG do Raque no Mapa
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Supabase File Storage</span>
            </label>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden p-1 shrink-0">
                {customImageUrl ? (
                  <img src={customImageUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <Server className="w-6 h-6 text-orange-400" />
                )}
              </div>

              <div className="flex-1 flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingImage ? 'Enviando...' : 'Carregar Imagem PNG...'}</span>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    onChange={handleImageFileUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>

                {customImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomImageUrl('')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Observações / Descrição */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">Observações Técnicas / Localização da Sala</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Localizado no POP Ouriçangas, lado esquerdo da sala técnica..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 font-medium"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Raque ({totalUnits}U)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
