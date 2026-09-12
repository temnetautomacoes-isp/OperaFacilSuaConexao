import React, { useState } from 'react';
import { X, Zap, Activity, Info, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface FiberPowerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FiberPowerModal: React.FC<FiberPowerModalProps> = ({ isOpen, onClose }) => {
  const [oltPowerDbm, setOltPowerDbm] = useState(4.5); // Class C+ OLT (+4.5 dBm)
  const [fiberDistanceKm, setFiberDistanceKm] = useState(4.5); // Distância em km
  const [fiberAttenuationPerKm, setFiberAttenuationPerKm] = useState(0.35); // 0.35 dB/km @ 1310/1490nm
  const [fusionSplicesCount, setFusionSplicesCount] = useState(4); // Quantidade de fusões (0.05 dB cada)
  const [connectorsCount, setConnectorsCount] = useState(3); // Conectores SC/APC (0.3 dB cada)
  const [level1Splitter, setLevel1Splitter] = useState<'none' | '1x2' | '1x4' | '1x8'>('1x2');
  const [level2Splitter, setLevel2Splitter] = useState<'none' | '1x4' | '1x8' | '1x16'>('1x8');
  const [safetyMarginDb, setSafetyMarginDb] = useState(2.0); // Margem de segurança

  if (!isOpen) return null;

  // Standard Splitter Insertion Loss (dB)
  const splitterLossMap: Record<string, number> = {
    'none': 0,
    '1x2': 3.7,
    '1x4': 7.3,
    '1x8': 10.5,
    '1x16': 13.8,
  };

  const lossFiber = fiberDistanceKm * fiberAttenuationPerKm;
  const lossSplices = fusionSplicesCount * 0.05;
  const lossConnectors = connectorsCount * 0.3;
  const lossSplitter1 = splitterLossMap[level1Splitter] || 0;
  const lossSplitter2 = splitterLossMap[level2Splitter] || 0;

  const totalLossDb = lossFiber + lossSplices + lossConnectors + lossSplitter1 + lossSplitter2 + safetyMarginDb;
  const calculatedRxPowerDbm = oltPowerDbm - totalLossDb;

  // Signal Evaluation for GPON ONT (-8 dBm to -27 dBm is acceptable, ideal is -15 to -23)
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-300';
  let statusTitle = 'Sinal Ótimo (Excelente Margem)';
  let statusDesc = 'Potência óptica dentro da faixa ideal de operação (-15 dBm a -23 dBm). Sem risco de saturação ou degradação de link.';
  let StatusIcon = CheckCircle2;

  if (calculatedRxPowerDbm > -8.0) {
    statusColor = 'text-amber-700 bg-amber-50 border-amber-300';
    statusTitle = 'Atenção: Risco de Saturação Óptica';
    statusDesc = 'Sinal muito forte (acima de -8 dBm). Pode danificar o fotodiodo da ONU. Recomenda-se adicionar atenuador ou splitter.';
    StatusIcon = AlertTriangle;
  } else if (calculatedRxPowerDbm < -27.0) {
    statusColor = 'text-rose-700 bg-rose-50 border-rose-300';
    statusTitle = 'Crítico: Link Degradado ou Fora do Ar';
    statusDesc = 'Potência óptica abaixo do limite de sensibilidade da ONU (-27 dBm). Ocorrerá perda de pacotes ou desconexão da ONT.';
    StatusIcon = ShieldAlert;
  } else if (calculatedRxPowerDbm < -24.0) {
    statusColor = 'text-amber-700 bg-amber-50 border-amber-300';
    statusTitle = 'Alerta: Sinal Limítrofe';
    statusDesc = 'Sinal operando perto da margem mínima (-24 dBm a -27 dBm). Sujeito a quedas em caso de dilatação térmica ou chuva.';
    StatusIcon = AlertTriangle;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Calculadora de Atenuação Óptica & Power Budget (PON)</h3>
              <p className="text-xs text-blue-100 font-medium">Dimensionamento de potência óptica RX para redes FTTH / GPON / EPON</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Output Banner */}
          <div className={`p-5 rounded-2xl border ${statusColor} flex items-start gap-4 transition-all shadow-xs`}>
            <StatusIcon className="w-8 h-8 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-black text-sm uppercase tracking-wider">{statusTitle}</span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-xs font-bold">Potência Estimada na ONU:</span>
                  <span className="text-2xl font-black">{calculatedRxPowerDbm.toFixed(2)} dBm</span>
                </div>
              </div>
              <p className="text-xs mt-1.5 opacity-90 leading-relaxed">{statusDesc}</p>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OLT Output & Distance */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Transmissor OLT & Cabo Tronco
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Potência TX da OLT (dBm)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={oltPowerDbm}
                    onChange={(e) => setOltPowerDbm(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm"
                  />
                  <div className="flex gap-1">
                    {['+3.0 (B+)', '+4.5 (C+)', '+7.0 (C++)'].map((label, idx) => {
                      const val = idx === 0 ? 3.0 : idx === 1 ? 4.5 : 7.0;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setOltPowerDbm(val)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            oltPowerDbm === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Distância Total do Cabo (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={fiberDistanceKm}
                  onChange={(e) => setFiberDistanceKm(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Atenuação da Fibra (dB/km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fiberAttenuationPerKm}
                  onChange={(e) => setFiberAttenuationPerKm(parseFloat(e.target.value) || 0.35)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm"
                />
              </div>
            </div>

            {/* Splitters & Passive Loss */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Splitters & Passivos (CEO / CTO)
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Splitter 1º Nível (CEO)
                  </label>
                  <select
                    value={level1Splitter}
                    onChange={(e) => setLevel1Splitter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold cursor-pointer"
                  >
                    <option value="none">Sem Splitter (0 dB)</option>
                    <option value="1x2">1x2 (~3.7 dB)</option>
                    <option value="1x4">1x4 (~7.3 dB)</option>
                    <option value="1x8">1x8 (~10.5 dB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Splitter 2º Nível (CTO)
                  </label>
                  <select
                    value={level2Splitter}
                    onChange={(e) => setLevel2Splitter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold cursor-pointer"
                  >
                    <option value="none">Sem Splitter (0 dB)</option>
                    <option value="1x4">1x4 (~7.3 dB)</option>
                    <option value="1x8">1x8 (~10.5 dB)</option>
                    <option value="1x16">1x16 (~13.8 dB)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Fusões Ópticas (0.05 dB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fusionSplicesCount}
                    onChange={(e) => setFusionSplicesCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Conectores SC/APC (0.3 dB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={connectorsCount}
                    onChange={(e) => setConnectorsCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Margem de Segurança (dB)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={safetyMarginDb}
                  onChange={(e) => setSafetyMarginDb(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>Detalhamento do Orçamento Óptico (Loss Breakdown)</span>
              <span className="font-mono text-blue-700 font-extrabold">Atenuação Total: {totalLossDb.toFixed(2)} dB</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between px-4 py-2 text-slate-600">
                <span>Perda na Fibra ({fiberDistanceKm} km × {fiberAttenuationPerKm} dB/km)</span>
                <span className="font-mono font-bold text-slate-900">{lossFiber.toFixed(2)} dB</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-slate-600">
                <span>Perda em Splitters ({level1Splitter} + {level2Splitter})</span>
                <span className="font-mono font-bold text-slate-900">{(lossSplitter1 + lossSplitter2).toFixed(2)} dB</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-slate-600">
                <span>Perda em Conectores ({connectorsCount} un × 0.3 dB) e Fusões ({fusionSplicesCount} un × 0.05 dB)</span>
                <span className="font-mono font-bold text-slate-900">{(lossConnectors + lossSplices).toFixed(2)} dB</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-slate-600">
                <span>Margem de Segurança (Aging / Curvaturas)</span>
                <span className="font-mono font-bold text-slate-900">{safetyMarginDb.toFixed(2)} dB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
