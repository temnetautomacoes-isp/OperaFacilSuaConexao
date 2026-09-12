import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Terminal, 
  Play, 
  Pause, 
  RotateCcw, 
  Radio, 
  Send, 
  Activity, 
  Server, 
  CheckCircle2, 
  AlertCircle,
  Network,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { NetworkNode, NetworkLink, SimulationPacket, PingResult } from '../../../types/network';

interface PacketTracerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: NetworkNode | null;
  nodes: NetworkNode[];
  links: NetworkLink[];
  onStartPingSimulation: (sourceId: string, targetId: string) => void;
}

export const PacketTracerModal: React.FC<PacketTracerModalProps> = ({
  isOpen,
  onClose,
  selectedNode,
  nodes,
  links,
  onStartPingSimulation
}) => {
  const [activeTab, setActiveTab] = useState<'cli' | 'ping' | 'interfaces'>('cli');
  const [cliNodeId, setCliNodeId] = useState<string>(selectedNode?.id || nodes[0]?.id || '');
  const [commandInput, setCommandInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Ping Tool state
  const [pingSourceId, setPingSourceId] = useState<string>(selectedNode?.id || nodes[nodes.length - 1]?.id || '');
  const [pingTargetId, setPingTargetId] = useState<string>(nodes[0]?.id || '');
  const [pingRunning, setPingRunning] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  const activeCliNode = nodes.find(n => n.id === cliNodeId) || nodes[0];

  useEffect(() => {
    if (selectedNode) {
      setCliNodeId(selectedNode.id);
      setPingSourceId(selectedNode.id);
    }
  }, [selectedNode]);

  // Terminal boot prompt
  useEffect(() => {
    if (activeCliNode) {
      const banner = activeCliNode.osType === 'mikrotik_routeros'
        ? [
            `MikroTik RouterOS 7.14.3 (c) 1999-2026 http://www.mikrotik.com/`,
            `Host: ${activeCliNode.hostname} [IP: ${activeCliNode.ip}]`,
            `Type /help or ? for available commands.`,
            `[admin@${activeCliNode.hostname}] > `
          ]
        : activeCliNode.osType === 'huawei_vrp'
        ? [
            `VRP (R) Software, Version 5.170 (MA5800 V100R019C00)`,
            `Copyright (C) 2000-2026 HUAWEI TECH CO., LTD.`,
            `<${activeCliNode.hostname}>`
          ]
        : [
            `Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4`,
            `Technical Support: http://www.cisco.com/techsupport`,
            `${activeCliNode.hostname}#`
          ];
      setTerminalLogs(banner);
    }
  }, [cliNodeId]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  if (!isOpen) return null;

  const handleExecuteCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    const isMikrotik = activeCliNode?.osType === 'mikrotik_routeros';
    const prompt = isMikrotik ? `[admin@${activeCliNode.hostname}] > ` : `${activeCliNode.hostname}# `;

    const newLogs = [...terminalLogs, `${prompt}${cmd}`];

    // Command parser simulation
    const lower = cmd.toLowerCase();

    if (lower === 'clear' || lower === 'cls') {
      setTerminalLogs([]);
      setCommandInput('');
      return;
    }

    if (lower.startsWith('ping')) {
      const target = cmd.split(' ')[1] || '8.8.8.8';
      newLogs.push(`  SEQ HOST                                     SIZE  TTL TIME  STATUS`);
      newLogs.push(`    0 ${target}                                   56   64  3ms   echo reply`);
      newLogs.push(`    1 ${target}                                   56   64  4ms   echo reply`);
      newLogs.push(`    2 ${target}                                   56   64  2ms   echo reply`);
      newLogs.push(`    3 ${target}                                   56   64  3ms   echo reply`);
      newLogs.push(`    sent=4 received=4 packet-loss=0% min-rtt=2ms avg-rtt=3ms max-rtt=4ms`);
    } else if (lower.includes('ip address') || lower.includes('show ip int') || lower.includes('display ip int')) {
      newLogs.push(` #   ADDRESS            NETWORK         INTERFACE`);
      activeCliNode.ports.forEach((p, idx) => {
        newLogs.push(` ${idx}   ${p.ip || 'dinâmico/dhcp'}     ${p.subnet || '255.255.255.0'}   ${p.name} [${p.status.toUpperCase()}]`);
      });
    } else if (lower.includes('interface print') || lower.includes('show interfaces') || lower.includes('display interface')) {
      newLogs.push(`Flags: D - DYNAMIC; X - DISABLED, R - RUNNING`);
      activeCliNode.ports.forEach((p, idx) => {
        const pwr = p.opticalPowerDbm ? ` TX/RX: ${p.opticalPowerDbm} dBm` : '';
        newLogs.push(` ${idx}  R  name="${p.name}" type="${p.type}" mtu=1500 speed=10Gbps${pwr}`);
      });
    } else if (lower.includes('traceroute') || lower.includes('tracert')) {
      newLogs.push(`traceroute to 8.8.8.8, 30 hops max:`);
      newLogs.push(` 1  10.254.0.1 (BGP Core) 0.4 ms`);
      newLogs.push(` 2  200.160.0.1 (IX.br Metro SP) 1.8 ms`);
      newLogs.push(` 3  8.8.8.8 (dns.google) 3.2 ms`);
    } else if (lower === '/help' || lower === '?' || lower === 'help') {
      newLogs.push(`Comandos disponíveis no simulador:`);
      newLogs.push(`  ping <ip>                 - Teste de conectividade ICMP`);
      newLogs.push(`  traceroute <ip>           - Rastreamento de rota`);
      newLogs.push(`  /ip address print         - Exibe endereços IP atribuídos`);
      newLogs.push(`  /interface print          - Lista interfaces e status de link`);
      newLogs.push(`  show ip int brief         - Sintaxe Cisco para interfaces`);
      newLogs.push(`  clear                     - Limpar terminal`);
    } else {
      newLogs.push(`syntax error (unknown command: ${cmd})`);
    }

    setTerminalLogs(newLogs);
    setCommandInput('');
  };

  const handleRunPingTest = () => {
    const src = nodes.find(n => n.id === pingSourceId);
    const tgt = nodes.find(n => n.id === pingTargetId);
    if (!src || !tgt) return;

    setPingRunning(true);
    setPingResult(null);

    // Trigger visual packet animation on canvas
    onStartPingSimulation(src.id, tgt.id);

    setTimeout(() => {
      setPingRunning(false);
      setPingResult({
        host: src.name,
        target: tgt.name,
        packetsSent: 4,
        packetsReceived: 4,
        packetLossPercent: 0,
        rttMinMs: 1.2,
        rttAvgMs: 2.8,
        rttMaxMs: 4.1,
        logs: [
          `Enviando 4 pacotes ICMP Echo para ${tgt.name} (${tgt.ip})...`,
          `Resposta de ${tgt.ip}: bytes=32 tempo=2.8ms TTL=64`,
          `Resposta de ${tgt.ip}: bytes=32 tempo=1.2ms TTL=64`,
          `Resposta de ${tgt.ip}: bytes=32 tempo=3.1ms TTL=64`,
          `Resposta de ${tgt.ip}: bytes=32 tempo=4.1ms TTL=64`,
          `Estatísticas de Ping para ${tgt.ip}:`,
          `    Pacotes: Enviados = 4, Recebidos = 4, Perdidos = 0 (0% de perda),`,
          `Tempo aproximado de ida e volta em milissegundos:`,
          `    Mínimo = 1.2ms, Máximo = 4.1ms, Média = 2.8ms`
        ]
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">Cisco & MikroTik Packet Tracer Simulator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sim
                </span>
              </div>
              <p className="text-xs text-slate-400">Terminal CLI, Ping ICMP e Diagnóstico de Portas em Tempo Real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Selector */}
            <select
              value={cliNodeId}
              onChange={(e) => setCliNodeId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.ip})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'cli'
                ? 'text-orange-400 border-orange-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Terminal Console (CLI)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ping')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ping'
                ? 'text-orange-400 border-orange-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            Simulador de Ping (ICMP Test)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('interfaces')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'interfaces'
                ? 'text-orange-400 border-orange-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            Status das Portas & Potência Óptica
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-900/90 flex flex-col">
          {/* TAB 1: CLI Terminal */}
          {activeTab === 'cli' && (
            <div className="flex-1 flex flex-col rounded-2xl bg-black border border-slate-800 p-4 font-mono text-xs overflow-hidden shadow-inner">
              <div className="flex-1 overflow-y-auto space-y-1 text-emerald-400 font-mono select-text">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {log}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Command Input Form */}
              <form onSubmit={handleExecuteCommand} className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                <span className="text-orange-400 font-bold shrink-0">
                  {activeCliNode?.osType === 'mikrotik_routeros' ? `[admin@${activeCliNode.hostname}] >` : `${activeCliNode.hostname}#`}
                </span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Digite um comando (ex: ping 8.8.8.8, /ip address print, /interface print, /help)..."
                  className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Executar
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Ping Simulation */}
          {activeTab === 'ping' && (
            <div className="flex-1 overflow-y-auto space-y-6 max-w-3xl mx-auto w-full py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dispositivo de Origem</label>
                  <select
                    value={pingSourceId}
                    onChange={(e) => setPingSourceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm cursor-pointer"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} [{n.ip}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dispositivo de Destino</label>
                  <select
                    value={pingTargetId}
                    onChange={(e) => setPingTargetId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold text-sm cursor-pointer"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} [{n.ip}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRunPingTest}
                    disabled={pingRunning}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Play className={`w-4 h-4 ${pingRunning ? 'animate-spin' : ''}`} />
                    {pingRunning ? 'Enviando Pacotes ICMP...' : 'Iniciar Teste de Ping & Simulação'}
                  </button>
                </div>
              </div>

              {/* Ping Output Box */}
              {pingResult && (
                <div className="p-5 rounded-3xl bg-black border border-emerald-500/30 font-mono text-xs text-emerald-400 space-y-2 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <span className="font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Resultado do Teste ICMP (Sucesso)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black">
                      RTT Médio: {pingResult.rttAvgMs}ms
                    </span>
                  </div>
                  {pingResult.logs.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Interfaces & Port Inspector */}
          {activeTab === 'interfaces' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{activeCliNode.name}</h4>
                  <p className="text-xs text-slate-400">{activeCliNode.model} • Fabricante: {activeCliNode.vendor}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeCliNode.status.toUpperCase()}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Interface</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">IP / Subnet</th>
                      <th className="p-3">Sinal Óptico (dBm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {activeCliNode.ports.map((port) => (
                      <tr key={port.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3 font-bold text-white">{port.name}</td>
                        <td className="p-3 text-slate-400">{port.type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            port.status === 'up'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {port.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{port.ip || '---'}</td>
                        <td className="p-3">
                          {port.opticalPowerDbm !== undefined ? (
                            <span className={`font-bold ${
                              port.opticalPowerDbm > -24 && port.opticalPowerDbm < -10
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}>
                              {port.opticalPowerDbm > 0 ? `+${port.opticalPowerDbm}` : port.opticalPowerDbm} dBm
                            </span>
                          ) : (
                            <span className="text-slate-600">N/A (Cobre)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Dispositivo: <strong className="text-white">{activeCliNode.hostname}</strong></span>
            <span>IP: <strong className="text-orange-400">{activeCliNode.ip}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
