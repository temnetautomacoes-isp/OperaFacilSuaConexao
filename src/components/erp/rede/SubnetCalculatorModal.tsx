import React, { useState } from 'react';
import { X, Calculator, Copy, Check, Network, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface SubnetCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubnetCalculatorModal: React.FC<SubnetCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [ipAddress, setIpAddress] = useState('192.168.1.0');
  const [cidr, setCidr] = useState(24);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // IPv4 CIDR Calculations
  const calculateSubnet = (ip: string, maskBits: number) => {
    try {
      const parts = ip.split('.').map(p => parseInt(p, 10));
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        return null;
      }

      const ipNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      const maskNum = maskBits === 0 ? 0 : (~0 << (32 - maskBits));

      const netNum = (ipNum & maskNum) >>> 0;
      const bcastNum = (netNum | (~maskNum >>> 0)) >>> 0;

      const numHosts = maskBits >= 31 ? (maskBits === 31 ? 2 : 1) : Math.pow(2, 32 - maskBits) - 2;
      const totalIps = Math.pow(2, 32 - maskBits);

      const numToIp = (n: number) => [
        (n >>> 24) & 255,
        (n >>> 16) & 255,
        (n >>> 8) & 255,
        n & 255
      ].join('.');

      const maskIp = numToIp(maskNum >>> 0);
      const netIp = numToIp(netNum);
      const bcastIp = numToIp(bcastNum);
      const firstHost = maskBits >= 31 ? netIp : numToIp(netNum + 1);
      const lastHost = maskBits >= 31 ? bcastIp : numToIp(bcastNum - 1);

      // IP Class determination
      let ipClass = 'Classless / CIDR';
      if (parts[0] >= 1 && parts[0] <= 126) ipClass = 'Classe A';
      else if (parts[0] >= 128 && parts[0] <= 191) ipClass = 'Classe B';
      else if (parts[0] >= 192 && parts[0] <= 223) ipClass = 'Classe C';
      else if (parts[0] >= 224 && parts[0] <= 239) ipClass = 'Classe D (Multicast)';

      // RFC 1918 Private IP
      const isPrivate = 
        (parts[0] === 10) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127); // CGNAT RFC 6598

      return {
        networkIp: netIp,
        broadcastIp: bcastIp,
        subnetMask: maskIp,
        firstHost,
        lastHost,
        usableHosts: numHosts,
        totalIps,
        ipClass,
        isPrivate: isPrivate ? (parts[0] === 100 ? 'CGNAT (RFC 6598)' : 'Privado (RFC 1918)') : 'IP Público / Roteável',
        wildcardMask: numToIp((~maskNum) >>> 0)
      };
    } catch {
      return null;
    }
  };

  const result = calculateSubnet(ipAddress, cidr);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Calculadora de Sub-redes IPv4 / CIDR</h3>
              <p className="text-xs text-orange-100 font-medium">Planejamento e alocação de blocos IP para provedores e redes corporativas</p>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Endereço IP Base
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value.trim())}
                placeholder="Ex: 192.168.1.0 ou 100.64.0.0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Máscara CIDR (/{cidr})
              </label>
              <select
                value={cidr}
                onChange={(e) => setCidr(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((mask) => (
                  <option key={mask} value={mask}>
                    /{mask} ({Math.pow(2, 32 - mask)} IPs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-400 self-center mr-1">Atalhos Comuns:</span>
            {[
              { label: 'Ponto a Ponto (/30)', ip: '10.254.0.0', c: 30 },
              { label: 'CGNAT Bloco (/22)', ip: '100.64.0.0', c: 22 },
              { label: 'Rede LAN Padrão (/24)', ip: '192.168.1.0', c: 24 },
              { label: 'VLAN Corporativa (/28)', ip: '172.16.10.0', c: 28 },
              { label: 'Bloco Provedor (/20)', ip: '177.100.16.0', c: 20 },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIpAddress(preset.ip);
                  setCidr(preset.c);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Results Grid */}
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Network IP */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-orange-300 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Endereço de Rede</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.networkIp, 'network')}
                      className="text-slate-400 hover:text-orange-600 transition-colors p-1"
                      title="Copiar"
                    >
                      {copiedField === 'network' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="font-mono text-sm font-bold text-slate-900">{result.networkIp}/{cidr}</p>
                </div>

                {/* Subnet Mask */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-orange-300 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Máscara de Sub-rede</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.subnetMask, 'mask')}
                      className="text-slate-400 hover:text-orange-600 transition-colors p-1"
                    >
                      {copiedField === 'mask' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="font-mono text-sm font-bold text-slate-900">{result.subnetMask}</p>
                </div>

                {/* Host Range */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800">Faixa de Hosts Utilizáveis</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-orange-200 text-orange-900">
                      {result.usableHosts.toLocaleString()} Hosts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-slate-900">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{result.firstHost}</span>
                    <ArrowRight className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{result.lastHost}</span>
                  </div>
                </div>

                {/* Broadcast IP */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-orange-300 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Endereço de Broadcast</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.broadcastIp, 'bcast')}
                      className="text-slate-400 hover:text-orange-600 transition-colors p-1"
                    >
                      {copiedField === 'bcast' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="font-mono text-sm font-bold text-slate-900">{result.broadcastIp}</p>
                </div>

                {/* Wildcard / Class */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-orange-300 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Classificação / Tipo</span>
                    <span className="text-xs font-bold text-slate-600">{result.ipClass}</span>
                  </div>
                  <p className="text-xs font-extrabold text-blue-600">{result.isPrivate}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-700 font-semibold text-sm">
              Endereço IP inválido. Por favor, insira um formato válido (ex: 192.168.1.1).
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
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
