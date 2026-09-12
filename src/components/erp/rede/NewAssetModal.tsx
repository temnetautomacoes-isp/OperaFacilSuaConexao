import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Server, 
  Router, 
  Network, 
  Zap, 
  PhoneCall, 
  BatteryCharging, 
  Cpu, 
  Layers, 
  Radio, 
  Sliders, 
  Check, 
  Trash2, 
  Sparkles, 
  Layers2, 
  HardDrive, 
  Box,
  Cable,
  CheckCircle2,
  FolderOpen,
  Image as ImageIcon,
  Upload,
  Link2,
  ShieldCheck,
  Monitor,
  Wifi,
  SlidersHorizontal
} from 'lucide-react';
import { 
  NetworkNode, 
  NetworkPort, 
  NetworkFolder, 
  DeviceType, 
  DeviceCategory,
  PortMediaType,
  PortSpeedMode,
  PortDuplex,
  PortPoe
} from '../../../types/network';
import { DEVICE_CATALOG } from './initialNetworkData';

interface NewAssetModalProps {
  isOpen: boolean;
  folders: NetworkFolder[];
  defaultFolderId: string | null;
  allNodes?: NetworkNode[];
  onClose: () => void;
  onAddDevice: (node: Partial<NetworkNode>) => void;
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  folders,
  defaultFolderId,
  allNodes = [],
  onClose,
  onAddDevice,
}) => {
  if (!isOpen) return null;

  const existingRacks = allNodes.filter(n => n.type === 'rack_floor' || n.type === 'rack_wall' || n.type === 'rack_19');
  const existingPowerSources = allNodes.filter(n => n.type === 'ups_nobreak' || n.type === 'pdu_power_strip' || n.type === 'rectifier_power' || n.type === 'electrical_outlet');

  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('custom');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');
  const [catalogClassification, setCatalogClassification] = useState<'all' | 'ativo' | 'passivo'>('all');

  // Subdivisão Ativos vs Passivos (Custom Form)
  const [customClassification, setCustomClassification] = useState<'all' | 'ativo' | 'passivo'>('all');

  // Custom Asset Form States
  const [name, setName] = useState('');
  const [hostname, setHostname] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('switch_core');
  const [category, setCategory] = useState<DeviceCategory>('isp_core');
  const [vendor, setVendor] = useState('MikroTik');
  const [model, setModel] = useState('');
  const [folderId, setFolderId] = useState<string>(defaultFolderId || folders[0]?.id || '');
  const [location, setLocation] = useState('POP Central - Rack 01');
  const [parentRackId, setParentRackId] = useState<string>('');
  const [powerSourceNodeId, setPowerSourceNodeId] = useState<string>('');
  const [rackUnits, setRackUnits] = useState<number>(1);
  const [rackPosition, setRackPosition] = useState('U38');
  const [totalRackCapacityU, setTotalRackCapacityU] = useState<number>(44);
  const [capacityVa, setCapacityVa] = useState<number>(3000);
  const [totalOutlets, setTotalOutlets] = useState<number>(8);
  const [serialNumber, setSerialNumber] = useState('');
  const [managementIp, setManagementIp] = useState('');
  const [mac, setMac] = useState('');
  const [powerSupply, setPowerSupply] = useState<NetworkNode['powerSupply']>('AC 110/220V Bivolt');
  const [powerConsumptionWatts, setPowerConsumptionWatts] = useState<number>(45);
  const [osType, setOsType] = useState<NetworkNode['osType']>('mikrotik_routeros');
  const [notes, setNotes] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, SVG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Ports State
  const [ports, setPorts] = useState<NetworkPort[]>([
    { id: 'p-1', name: 'ether1', type: 'copper_1g', mediaType: 'ethernet', speedMode: '1000M', duplex: 'full', status: 'up' },
    { id: 'p-2', name: 'ether2', type: 'copper_1g', mediaType: 'ethernet', speedMode: '1000M', duplex: 'full', status: 'up' },
    { id: 'p-3', name: 'sfp-sfpplus1', type: 'sfp_10g', mediaType: 'fiber', speedMode: '10000M', duplex: 'full', status: 'up' },
    { id: 'p-4', name: 'sfp-sfpplus2', type: 'sfp_10g', mediaType: 'fiber', speedMode: '10000M', duplex: 'full', status: 'up' },
  ]);

  // Batch Port Adder State
  const [batchCount, setBatchCount] = useState<number>(8);
  const [batchPrefix, setBatchPrefix] = useState('ether');
  const [batchMediaType, setBatchMediaType] = useState<PortMediaType>('ethernet');
  const [batchSpeedMode, setBatchSpeedMode] = useState<PortSpeedMode>('1000M');
  const [batchDuplex, setBatchDuplex] = useState<PortDuplex>('full');
  const [batchPoe, setBatchPoe] = useState<PortPoe>('none');
  const [batchOpticalPower, setBatchOpticalPower] = useState<number>(4.5);

  // 1. ATIVOS DE REDE (Equipamentos Energizados / Eletrônicos - Que ligam na tomada)
  const activeDeviceOptions: Array<{ type: DeviceType; category: DeviceCategory; label: string; icon: any; defaultVendor: string; os: NetworkNode['osType']; isPassive?: boolean; badge: string; description: string }> = [
    { type: 'router_bgp', category: 'isp_core', label: 'Roteador BGP Core / Borda', icon: Router, defaultVendor: 'MikroTik', os: 'mikrotik_routeros', isPassive: false, badge: 'Energizado (AC/DC)', description: 'Roteamento dinâmico, BGP e OSPF' },
    { type: 'router_cgnat', category: 'isp_core', label: 'Concentrador PPPoE / CGNAT', icon: Router, defaultVendor: 'MikroTik', os: 'mikrotik_routeros', isPassive: false, badge: 'Energizado (AC/DC)', description: 'Autenticação de clientes e NAT' },
    { type: 'switch_core', category: 'isp_core', label: 'Switch Core L3 / Agregação', icon: Network, defaultVendor: 'Huawei', os: 'huawei_vrp', isPassive: false, badge: 'Energizado (AC/DC)', description: 'Backbone e portas 10G/40G/100G' },
    { type: 'switch_access', category: 'isp_core', label: 'Switch Acesso L2 / PoE', icon: Network, defaultVendor: 'Datacom', os: 'generic', isPassive: false, badge: 'Energizado (PoE/AC)', description: 'Distribuição e alimentação PoE' },
    { type: 'olt_gpon', category: 'access_ftth', label: 'OLT GPON / EPON / XGS-PON', icon: Zap, defaultVendor: 'Huawei', os: 'huawei_vrp', isPassive: false, badge: 'Energizado (DC -48V/AC)', description: 'Concentrador óptico FTTH' },
    { type: 'telephony_pabx', category: 'telephony_voip', label: 'Central Telefônica / PABX IP', icon: PhoneCall, defaultVendor: 'Intelbras', os: 'linux', isPassive: false, badge: 'Energizado (AC/VoIP)', description: 'Troncos SIP, E1, FXS e FXO' },
    { type: 'server_datacenter', category: 'isp_core', label: 'Servidor / Cache / DNS', icon: Server, defaultVendor: 'Dell', os: 'linux', isPassive: false, badge: 'Energizado (AC Bivolt)', description: 'DNS, Speedtest e Virtualização' },
    { type: 'radio_ptp', category: 'wireless', label: 'Rádio Enlace PTP Torre', icon: Radio, defaultVendor: 'Ubiquiti', os: 'generic', isPassive: false, badge: 'Energizado (PoE 24/48V)', description: 'Transmissão de alta capacidade sem fio' },
    { type: 'ups_nobreak', category: 'rack_power', label: 'Nobreak Senoidal Online (UPS)', icon: BatteryCharging, defaultVendor: 'APC by Schneider', os: 'generic', isPassive: false, badge: 'Energizado (Baterias/UPS)', description: 'Autonomia ininterrupta' },
    { type: 'rectifier_power', category: 'rack_power', label: 'Fonte Retificadora -48V DC', icon: BatteryCharging, defaultVendor: 'Delta', os: 'generic', isPassive: false, badge: 'Energizado (-48V Telecom)', description: 'Alimentação DC com gerência' },
    { type: 'pdu_power_strip', category: 'rack_power', label: 'Régua PDU 8/12 Tomadas 1U', icon: Zap, defaultVendor: 'Max Eletron', os: 'generic', isPassive: false, badge: 'Energizado (Distribuição)', description: 'Tomadas C13/C19/NBR para rack' },
    { type: 'electrical_outlet', category: 'rack_power', label: 'Tomada de Parede / Ponto 20A', icon: Zap, defaultVendor: 'Schneider', os: 'generic', isPassive: false, badge: 'Energizado (Rede AC)', description: 'Ponto elétrico 110V/220V' },
    { type: 'firewall', category: 'enterprise', label: 'Firewall de Borda / UTM', icon: ShieldCheck, defaultVendor: 'Fortinet', os: 'generic', isPassive: false, badge: 'Energizado (AC Bivolt)', description: 'Segurança, VPN e regras de tráfego' },
    { type: 'onu_ont', category: 'access_ftth', label: 'ONU / ONT Wi-Fi 6', icon: Wifi, defaultVendor: 'Huawei', os: 'generic', isPassive: false, badge: 'Energizado (12V DC)', description: 'Terminal óptico residencial' },
    { type: 'pc_workstation', category: 'enterprise', label: 'PC / Estação de Trabalho', icon: Monitor, defaultVendor: 'Dell', os: 'generic', isPassive: false, badge: 'Energizado (AC Bivolt)', description: 'Computador para testes e monitoramento' },
  ];

  // 2. PASSIVOS DE REDE (Estrutura, Acomodação, Caixas & Guardar Coisas - Não energizados)
  const passiveDeviceOptions: Array<{ type: DeviceType; category: DeviceCategory; label: string; icon: any; defaultVendor: string; os: NetworkNode['osType']; isPassive?: boolean; badge: string; description: string }> = [
    { type: 'rack_floor', category: 'passive', label: 'Rack 19" de Chão (44U/24U)', icon: Box, defaultVendor: 'Totem', os: 'generic', isPassive: true, badge: 'Acomodação de Piso', description: 'Gabinete para abrigar e guardar ativos' },
    { type: 'rack_wall', category: 'passive', label: 'Rack de Parede (6U/9U/12U)', icon: Box, defaultVendor: 'Intelbras', os: 'generic', isPassive: true, badge: 'Acomodação de Parede', description: 'Mini rack para acomodar switches e PDUs' },
    { type: 'dio_fiber', category: 'passive', label: 'DIO Óptico 24/48 FO 1U', icon: Layers, defaultVendor: 'Fibracem', os: 'generic', isPassive: true, badge: 'Acomodação Óptica', description: 'Terminação e distribuição de fibras' },
    { type: 'front_panel_blank', category: 'passive', label: 'Frente Falsa 1U/2U (Painel Cego)', icon: SlidersHorizontal, defaultVendor: 'Totem', os: 'generic', isPassive: true, badge: 'Fechamento / Acabamento', description: 'Ocupa e fecha espaços vazios no rack' },
    { type: 'cable_organizer', category: 'passive', label: 'Guia de Cabos Horizontal 1U', icon: Cable, defaultVendor: 'Max Eletron', os: 'generic', isPassive: true, badge: 'Organização de Cabos', description: 'Organizador com tampa para cordões' },
    { type: 'rack_tray', category: 'passive', label: 'Bandeja Fixa / Deslizante 1U', icon: Layers2, defaultVendor: 'Totem', os: 'generic', isPassive: true, badge: 'Apoio / Suporte', description: 'Suporte para modems, fontes e itens soltos' },
    { type: 'patch_panel_rj45', category: 'passive', label: 'Patch Panel 24/48P Cat6 1U', icon: Layers, defaultVendor: 'Furukawa', os: 'generic', isPassive: true, badge: 'Cabeamento Metálico', description: 'Painel de manobras RJ45 Cat6/Cat6A' },
    { type: 'cto', category: 'passive', label: 'CTO Atendimento FTTH (Poste)', icon: Layers, defaultVendor: 'Fibracem', os: 'generic', isPassive: true, badge: 'Caixa Externa (Poste)', description: 'Caixa para acomodar splitters e drops' },
    { type: 'ceo', category: 'passive', label: 'Caixa de Emenda CEO (Fusão)', icon: Layers, defaultVendor: 'Overtek', os: 'generic', isPassive: true, badge: 'Caixa de Emenda (Domo)', description: 'Acomoda fusões subterrâneas/aéreas' },
    { type: 'splitter', category: 'passive', label: 'Splitter Óptico PLC (1x8/1x16)', icon: Network, defaultVendor: 'Fibracem', os: 'generic', isPassive: true, badge: 'Divisor Óptico', description: 'Divisor óptico passivo para redes PON' },
  ];

  const deviceTypeOptions = [...activeDeviceOptions, ...passiveDeviceOptions];

  const handleSelectDeviceType = (opt: typeof deviceTypeOptions[0]) => {
    setDeviceType(opt.type);
    setCategory(opt.category);
    if (!vendor) setVendor(opt.defaultVendor);
    if (opt.os) setOsType(opt.os);

    // Auto setup default ports / configs
    if (opt.type === 'telephony_pabx') {
      setBatchPrefix('ramal-');
      setBatchMediaType('voice');
      setBatchSpeedMode('auto');
    } else if (opt.type === 'olt_gpon') {
      setBatchPrefix('gpon 0/1/');
      setBatchMediaType('pon');
      setBatchSpeedMode('2.5G');
    } else if (opt.type === 'ups_nobreak' || opt.type === 'pdu_power_strip') {
      setBatchPrefix('Tomada ');
      setBatchMediaType('power_ac');
      setBatchSpeedMode('auto');
      const pduPorts: NetworkPort[] = [];
      for (let i = 1; i <= 8; i++) {
        pduPorts.push({
          id: `p-pdu-${i}-${Date.now()}`,
          name: `Tomada 0${i} (20A 220V)`,
          type: 'power_outlet',
          mediaType: 'power_ac',
          status: 'up',
        });
      }
      setPorts(pduPorts);
    } else if (opt.type === 'patch_panel_rj45') {
      setBatchPrefix('Porta ');
      setBatchMediaType('ethernet');
      setBatchSpeedMode('1000M');
      const ppPorts: NetworkPort[] = [];
      for (let i = 1; i <= 24; i++) {
        ppPorts.push({
          id: `p-pp-${i}-${Date.now()}`,
          name: `Porta ${i < 10 ? '0' + i : i}`,
          type: 'copper_1g',
          mediaType: 'ethernet',
          speedMode: '1000M',
          status: 'up',
        });
      }
      setPorts(ppPorts);
    } else if (opt.type === 'dio_fiber') {
      setBatchPrefix('Fibra ');
      setBatchMediaType('fiber');
      setBatchSpeedMode('auto');
      const dioPorts: NetworkPort[] = [];
      for (let i = 1; i <= 24; i++) {
        dioPorts.push({
          id: `p-dio-${i}-${Date.now()}`,
          name: `Fibra ${i < 10 ? '0' + i : i} (SC/APC)`,
          type: 'pon_gpon',
          mediaType: 'fiber',
          status: 'up',
        });
      }
      setPorts(dioPorts);
    } else if (opt.type === 'rack_floor') {
      setRackUnits(44);
      setTotalRackCapacityU(44);
      setPorts([]);
    } else if (opt.type === 'rack_wall') {
      setRackUnits(9);
      setTotalRackCapacityU(9);
      setPorts([]);
    } else if (opt.type === 'front_panel_blank' || opt.type === 'rack_tray' || opt.type === 'cable_organizer') {
      setRackUnits(1);
      setPorts([]);
    }
  };

  const handleAddPortBatch = () => {
    const newPorts: NetworkPort[] = [];
    const startIndex = ports.length + 1;

    for (let i = 0; i < batchCount; i++) {
      const portNum = startIndex + i;
      let portName = '';
      
      if (batchMediaType === 'pon') {
        portName = `${batchPrefix}${portNum}`;
      } else if (batchMediaType === 'voice') {
        portName = `${batchPrefix}${100 + portNum}`;
      } else {
        portName = `${batchPrefix}${portNum}`;
      }

      newPorts.push({
        id: `p-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name: portName,
        type: batchMediaType === 'fiber' ? (batchSpeedMode === '10000M' ? 'sfp_10g' : 'sfp_1g') :
              batchMediaType === 'pon' ? 'pon_gpon' :
              batchMediaType === 'voice' ? 'voice_fxs' :
              batchSpeedMode === '10000M' ? 'copper_10g' :
              batchSpeedMode === '100M' ? 'copper_100m' : 'copper_1g',
        mediaType: batchMediaType,
        speedMode: batchSpeedMode,
        duplex: batchDuplex,
        poe: batchPoe,
        opticalPowerDbm: batchMediaType === 'pon' ? batchOpticalPower : undefined,
        status: 'up',
      });
    }

    setPorts([...ports, ...newPorts]);
  };

  const handleAddPreset = (presetName: string) => {
    if (presetName === 'switch_24g_4sfp') {
      const p: NetworkPort[] = [];
      for (let i = 1; i <= 24; i++) {
        p.push({
          id: `p-ge-${i}-${Date.now()}`,
          name: `GigabitEthernet0/0/${i}`,
          type: 'copper_1g',
          mediaType: 'ethernet',
          speedMode: '1000M',
          duplex: 'full',
          status: 'up',
        });
      }
      for (let i = 1; i <= 4; i++) {
        p.push({
          id: `p-xge-${i}-${Date.now()}`,
          name: `XGigabitEthernet0/0/${i} (10G)`,
          type: 'sfp_10g',
          mediaType: 'fiber',
          speedMode: '10000M',
          duplex: 'full',
          status: 'up',
        });
      }
      setPorts([...ports, ...p]);
    } else if (presetName === 'switch_48g_4sfp') {
      const p: NetworkPort[] = [];
      for (let i = 1; i <= 48; i++) {
        p.push({
          id: `p-ge-${i}-${Date.now()}`,
          name: `GigabitEthernet0/0/${i}`,
          type: 'copper_1g',
          mediaType: 'ethernet',
          speedMode: '1000M',
          duplex: 'full',
          status: 'up',
        });
      }
      for (let i = 1; i <= 4; i++) {
        p.push({
          id: `p-xge-${i}-${Date.now()}`,
          name: `XGigabitEthernet0/0/${i} (10G)`,
          type: 'sfp_10g',
          mediaType: 'fiber',
          speedMode: '10000M',
          duplex: 'full',
          status: 'up',
        });
      }
      setPorts([...ports, ...p]);
    } else if (presetName === 'olt_8pon_4sfp') {
      const p: NetworkPort[] = [];
      for (let i = 1; i <= 8; i++) {
        p.push({
          id: `p-pon-${i}-${Date.now()}`,
          name: `GPON 0/1/${i - 1} (Class C+)`,
          type: 'pon_gpon',
          mediaType: 'pon',
          speedMode: '2.5G',
          opticalPowerDbm: 4.8,
          status: 'up',
        });
      }
      for (let i = 1; i <= 4; i++) {
        p.push({
          id: `p-uplink-${i}-${Date.now()}`,
          name: `10GE SFP+ Uplink ${i}`,
          type: 'sfp_10g',
          mediaType: 'fiber',
          speedMode: '10000M',
          status: 'up',
        });
      }
      setPorts([...ports, ...p]);
    } else if (presetName === 'pabx_8fxs_4fxo_e1') {
      const p: NetworkPort[] = [
        { id: `p-sip-1-${Date.now()}`, name: 'LAN (SIP Trunk 1G)', type: 'copper_1g', mediaType: 'ethernet', speedMode: '1000M', status: 'up' },
        { id: `p-sip-2-${Date.now()}`, name: 'WAN (VoIP Provider)', type: 'copper_1g', mediaType: 'ethernet', speedMode: '1000M', status: 'up' },
        { id: `p-e1-${Date.now()}`, name: 'E1 Link (R2 / ISDN-PRI)', type: 'voice_e1', mediaType: 'voice', speedMode: 'auto', status: 'up' },
      ];
      for (let i = 1; i <= 4; i++) {
        p.push({
          id: `p-fxo-${i}-${Date.now()}`,
          name: `Linha FXO ${i}`,
          type: 'voice_fxo',
          mediaType: 'voice',
          speedMode: 'auto',
          status: 'up',
        });
      }
      for (let i = 1; i <= 8; i++) {
        p.push({
          id: `p-fxs-${i}-${Date.now()}`,
          name: `Ramal FXS ${100 + i}`,
          type: 'voice_fxs',
          mediaType: 'voice',
          speedMode: 'auto',
          status: 'up',
        });
      }
      setPorts([...ports, ...p]);
    }
  };

  const handleRemovePort = (portId: string) => {
    setPorts(ports.filter(p => p.id !== portId));
  };

  const handleUpdatePort = (index: number, updated: Partial<NetworkPort>) => {
    const copy = [...ports];
    copy[index] = { ...copy[index], ...updated };
    setPorts(copy);
  };

  const handleSaveCustomDevice = () => {
    if (!name.trim()) {
      alert('Por favor, informe o nome do ativo.');
      return;
    }

    const isPassiveType = deviceType.includes('rack') || deviceType.includes('patch') || deviceType.includes('dio') || deviceType.includes('cto') || deviceType.includes('ceo') || deviceType.includes('organizer');

    const newNode: Partial<NetworkNode> = {
      name: name.trim(),
      hostname: hostname.trim() || `${name.toLowerCase().replace(/\s+/g, '-')}.local`,
      type: deviceType,
      category,
      vendor: vendor.trim() || 'Genérico',
      model: model.trim() || name.trim(),
      folderId: folderId || undefined,
      location: parentRackId ? `${allNodes.find(n => n.id === parentRackId)?.name || 'Rack'} (${rackPosition})` : location,
      parentRackId: parentRackId || undefined,
      powerSourceNodeId: powerSourceNodeId || undefined,
      rackUnits,
      rackPosition: rackPosition || 'U1',
      totalRackCapacityU: deviceType.includes('rack') ? totalRackCapacityU : undefined,
      capacityVa: deviceType === 'ups_nobreak' ? capacityVa : undefined,
      totalOutlets: (deviceType === 'ups_nobreak' || deviceType === 'pdu_power_strip') ? totalOutlets : undefined,
      serialNumber,
      managementIp: managementIp.trim() || undefined,
      ip: managementIp.trim() || '192.168.1.1',
      mac: mac.trim() || undefined,
      powerSupply,
      powerConsumptionWatts,
      osType,
      notes,
      ports,
      status: 'online',
      isCustomAsset: true,
      isPassive: isPassiveType,
      customImageUrl: customImageUrl.trim() || undefined,
      imageUrl: customImageUrl.trim() || undefined,
    };

    onAddDevice(newNode);
    onClose();
  };

  const handleSelectFromCatalog = (item: typeof DEVICE_CATALOG[0]) => {
    const isPassiveType = item.category === 'passive' || item.category === 'cabling_structure' || item.type.includes('rack') || item.type.includes('patch') || item.type.includes('dio') || item.type.includes('cto') || item.type.includes('ceo') || item.type.includes('organizer') || item.type.includes('blank') || item.type.includes('tray') || item.type.includes('splitter');

    const newNode: Partial<NetworkNode> = {
      name: item.name,
      hostname: `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`,
      type: item.type,
      category: item.category,
      vendor: item.vendor,
      model: item.model,
      folderId: folderId || defaultFolderId || folders[0]?.id || undefined,
      location: 'POP Central - Rack 01',
      rackUnits: item.rackUnits || 1,
      totalRackCapacityU: (item as any).totalRackCapacityU,
      capacityVa: (item as any).capacityVa,
      totalOutlets: (item as any).totalOutlets,
      powerSupply: item.powerSupply || 'AC 110/220V Bivolt',
      osType: item.osType || 'generic',
      ports: JSON.parse(JSON.stringify(item.defaultPorts)),
      status: 'online',
      notes: item.description,
      isPassive: isPassiveType,
    };

    onAddDevice(newNode);
    onClose();
  };

  const filteredCatalog = DEVICE_CATALOG.filter(c => {
    const isPassive = c.category === 'passive' || c.category === 'cabling_structure' || c.type.includes('rack') || c.type.includes('dio') || c.type.includes('cto') || c.type.includes('ceo') || c.type.includes('organizer') || c.type.includes('blank') || c.type.includes('tray') || c.type.includes('splitter');
    if (catalogClassification === 'ativo' && isPassive) return false;
    if (catalogClassification === 'passivo' && !isPassive) return false;
    const matchesCat = selectedCatalogCategory === 'all' || c.category === selectedCatalogCategory;
    const matchesSearch = c.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          c.model.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          c.vendor.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getSpeedBadge = (speed?: PortSpeedMode) => {
    switch (speed) {
      case '10M':
        return <span className="px-1.5 py-0.5 rounded-sm bg-yellow-100 text-yellow-800 text-[9px] font-bold">10M</span>;
      case '100M':
        return <span className="px-1.5 py-0.5 rounded-sm bg-lime-100 text-lime-800 text-[9px] font-bold">100M</span>;
      case '1000M':
        return <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 text-[9px] font-bold">1000M (1G)</span>;
      case '2.5G':
        return <span className="px-1.5 py-0.5 rounded-sm bg-teal-100 text-teal-800 text-[9px] font-bold">2.5G PON</span>;
      case '10000M':
        return <span className="px-1.5 py-0.5 rounded-sm bg-cyan-100 text-cyan-800 text-[9px] font-bold">10000M (10G)</span>;
      case '25G':
        return <span className="px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 text-[9px] font-bold">25G</span>;
      case '40G':
        return <span className="px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-800 text-[9px] font-bold">40G</span>;
      case '100G':
        return <span className="px-1.5 py-0.5 rounded-sm bg-pink-100 text-pink-800 text-[9px] font-bold">100G</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[9px] font-bold">Auto</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                Ativos de Rede & Equipamentos de Rack
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-200">
                  Telecom NOC
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cadastre ou selecione roteadores BGP, switches, OLTs, centrais telefônicas PABX e servidores com especificação detalhada de portas e velocidades.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'custom'
                  ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-400/50'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              Criar Novo Ativo Personalizado (Customizado)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-400/50'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Layers2 className="w-4 h-4" />
              Biblioteca de Modelos Pré-Cadastrados ({DEVICE_CATALOG.length})
            </button>
          </div>

          {/* Folder Target Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Destino:</span>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-orange-200 bg-orange-50 text-orange-950 focus:bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  📁 {f.parentId ? ' └─ ' : ''}{f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'custom' ? (
            <div className="space-y-6">
              {/* 1. Tipo do Ativo / Passivo com Subdivisão Clara */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                      1. Selecione a Categoria do Equipamento (Ativo vs Passivo)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      <strong>Ativos:</strong> Equipamentos que ligam na energia. <strong>Passivos:</strong> Racks, caixas, DIOs e itens de acomodação.
                    </p>
                  </div>

                  {/* Subdivisão Segment Switcher */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setCustomClassification('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        customClassification === 'all'
                          ? 'bg-white text-orange-600 shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos ({deviceTypeOptions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomClassification('ativo')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        customClassification === 'ativo'
                          ? 'bg-orange-600 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      ⚡ Ativos ({activeDeviceOptions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomClassification('passivo')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        customClassification === 'passivo'
                          ? 'bg-slate-900 text-emerald-400 shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5 text-emerald-400" />
                      📦 Passivos ({passiveDeviceOptions.length})
                    </button>
                  </div>
                </div>

                {/* Section A: ATIVOS DE REDE */}
                {(customClassification === 'all' || customClassification === 'ativo') && (
                  <div className="p-3.5 rounded-2xl bg-orange-50/40 border border-orange-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                          ⚡
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-orange-950 uppercase tracking-wider">
                            Ativos de Rede (Equipamentos Energizados / Eletrônicos)
                          </h3>
                          <p className="text-[10px] text-orange-800/80">
                            Dispositivos que ligam na tomada ou fornecem energia elétrica e realizam processamento.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-200/80 text-orange-900">
                        {activeDeviceOptions.length} Modelos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {activeDeviceOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = deviceType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => handleSelectDeviceType(opt)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                              isSelected
                                ? 'bg-orange-500 text-white border-orange-600 shadow-md ring-2 ring-orange-400 scale-[1.02]'
                                : 'bg-white hover:bg-orange-50/60 border-orange-200/70 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ativo / Energizado" />
                              )}
                            </div>
                            <div>
                              <span className={`text-[11px] font-extrabold leading-tight block line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {opt.label}
                              </span>
                              <span className={`text-[9px] font-bold mt-0.5 block truncate ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                                {opt.badge}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section B: PASSIVOS DE REDE */}
                {(customClassification === 'all' || customClassification === 'passivo') && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/5 border border-slate-300 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black shadow-xs">
                          📦
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Passivos de Rede (Estrutura, Acomodação, Caixas & Guardar Coisas)
                          </h3>
                          <p className="text-[10px] text-slate-600">
                            Racks, caixas CEO/CTO, DIOs, frentes falsas, bandejas e organizadores sem consumo elétrico.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {passiveDeviceOptions.length} Modelos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {passiveDeviceOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = deviceType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => handleSelectDeviceType(opt)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-700 scale-[1.02]'
                                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                  Passivo
                                </span>
                              )}
                            </div>
                            <div>
                              <span className={`text-[11px] font-extrabold leading-tight block line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {opt.label}
                              </span>
                              <span className={`text-[9px] font-bold mt-0.5 block truncate ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                                {opt.badge}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Imagem PNG / Ícone Personalizado no Mapa */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/70 to-amber-50/70 border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-950 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    2. Imagem PNG do Item no Mapa (Personalizado / Passivo)
                  </span>
                  {customImageUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomImageUrl('')}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover Imagem
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-600">
                  Adicione uma imagem PNG (fundo transparente recomendado) para este item aparecer personalizado no mapa da topologia.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-orange-400/80 flex flex-col items-center justify-center p-2 relative shrink-0 shadow-sm overflow-hidden group">
                    {customImageUrl ? (
                      <img
                        src={customImageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 text-center">
                        <ImageIcon className="w-6 h-6 text-orange-400 mb-1" />
                        <span className="text-[9px] font-bold">Sem PNG</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls & URL input */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Escolher Arquivo PNG...
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml, image/webp"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* URL input */}
                      <div className="flex-1 min-w-[200px] flex items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs">
                        <Link2 className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        <input
                          type="text"
                          value={customImageUrl}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                          placeholder="Ou cole a URL direta da imagem PNG..."
                          className="w-full bg-transparent font-medium focus:outline-hidden text-slate-700 placeholder:text-slate-400 text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>💡 Formatos recomendados: PNG transparente, SVG, WebP ou JPG.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Informações Gerais do Ativo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-600" />
                  3. Especificações do Equipamento
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Nome / Identificação *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Switch Core POP 01, PABX Matriz, OLT Huawei 1"
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Fabricante / Marca
                    </label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="MikroTik, Huawei, Cisco, Intelbras, Datacom..."
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Modelo Comercial
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: CIP 800, CCR2004-1G-12S+, MA5608T, S5735"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Rack & Power Relationship Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-200">
                  <div>
                    <label className="block text-[11px] font-bold text-orange-950 uppercase tracking-wider mb-1">
                      📦 Instalar Dentro do Rack (Passivo):
                    </label>
                    <select
                      value={parentRackId}
                      onChange={(e) => setParentRackId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-orange-200 bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="">Nenhum (Dispositivo Avulso / Não montado em Rack)</option>
                      {existingRacks.map(r => (
                        <option key={r.id} value={r.id}>
                          🏢 {r.name} ({r.totalRackCapacityU || r.rackUnits || 44}U) - {r.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-orange-950 uppercase tracking-wider mb-1">
                      ⚡ Alimentado por (Nobreak / PDU / Tomada):
                    </label>
                    <select
                      value={powerSourceNodeId}
                      onChange={(e) => setPowerSourceNodeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-orange-200 bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="">Alimentação Direta / Sem Nobreak</option>
                      {existingPowerSources.map(p => (
                        <option key={p.id} value={p.id}>
                          🔌 {p.name} ({p.model})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional fields for Racks and UPS */}
                {deviceType.includes('rack') && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">Capacidade Total do Rack (U)</label>
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={totalRackCapacityU}
                        onChange={(e) => setTotalRackCapacityU(parseInt(e.target.value) || 44)}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-950 uppercase mb-1">Tipo de Gabinete</label>
                      <select
                        value={deviceType === 'rack_wall' ? 'wall' : 'floor'}
                        onChange={(e) => setDeviceType(e.target.value === 'wall' ? 'rack_wall' : 'rack_floor')}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 bg-white cursor-pointer"
                      >
                        <option value="floor">Rack de Chão (Servidores / NOC)</option>
                        <option value="wall">Rack de Parede (Mini Rack)</option>
                      </select>
                    </div>
                  </div>
                )}

                {deviceType === 'ups_nobreak' && (
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">Capacidade de Carga (VA)</label>
                      <input
                        type="number"
                        step={100}
                        value={capacityVa}
                        onChange={(e) => setCapacityVa(parseInt(e.target.value) || 3000)}
                        placeholder="Ex: 3000"
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">Total de Tomadas de Saída</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={totalOutlets}
                        onChange={(e) => setTotalOutlets(parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Tamanho no Rack (U)
                    </label>
                    <select
                      value={rackUnits}
                      onChange={(e) => setRackUnits(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white cursor-pointer"
                    >
                      <option value={1}>1U (Padrão 19")</option>
                      <option value={2}>2U</option>
                      <option value={3}>3U</option>
                      <option value={4}>4U</option>
                      <option value={6}>6U (Chassi OLT)</option>
                      <option value={8}>8U</option>
                      <option value={44}>44U (Rack Inteiro)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Posição no Rack
                    </label>
                    <input
                      type="text"
                      value={rackPosition}
                      onChange={(e) => setRackPosition(e.target.value)}
                      placeholder="Ex: U42, U20, U1"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      IP de Gerência / Acesso
                    </label>
                    <input
                      type="text"
                      value={managementIp}
                      onChange={(e) => setManagementIp(e.target.value)}
                      placeholder="192.168.88.1"
                      className="w-full px-3 py-2 text-xs font-mono text-blue-600 font-bold rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Alimentação Elétrica
                    </label>
                    <select
                      value={powerSupply}
                      onChange={(e) => setPowerSupply(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white cursor-pointer"
                    >
                      <option value="AC 110/220V Bivolt">AC 110/220V Bivolt</option>
                      <option value="DC -48V Telecom">DC -48V Telecom</option>
                      <option value="Redundante AC/DC">Redundante AC + DC</option>
                      <option value="DC 24V">DC 24V</option>
                      <option value="DC 12V">DC 12V</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Construtor e Gerenciador de Portas */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Network className="w-4 h-4 text-indigo-600" />
                      3. Portas do Ativo ({ports.length} Portas Configuradas)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Configure as interfaces ópticas, elétricas, PON e de telefonia e defina as velocidades de negociação (/10, /100, /1000, /10000 Mbps).
                    </p>
                  </div>

                  {/* Presets rápidos */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Lotes Rápidos:</span>
                    <button
                      type="button"
                      onClick={() => handleAddPreset('switch_24g_4sfp')}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                    >
                      + 24 GbE + 4x 10G SFP+
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPreset('switch_48g_4sfp')}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                    >
                      + 48 GbE + 4x 10G SFP+
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPreset('olt_8pon_4sfp')}
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold cursor-pointer"
                    >
                      + 8 PON GPON + 4x 10G
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPreset('pabx_8fxs_4fxo_e1')}
                      className="px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-[10px] font-bold cursor-pointer"
                    >
                      + PABX (8 FXS / 4 FXO / E1)
                    </button>
                  </div>
                </div>

                {/* Batch Port Adder Box */}
                <div className="p-3 bg-gradient-to-r from-orange-50/60 to-amber-50/60 rounded-xl border border-orange-200 flex flex-wrap items-end gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-orange-950 uppercase mb-1">Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      max={96}
                      value={batchCount}
                      onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-orange-950 uppercase mb-1">Prefixo do Nome</label>
                    <input
                      type="text"
                      value={batchPrefix}
                      onChange={(e) => setBatchPrefix(e.target.value)}
                      placeholder="ether, ge0/0/, sfp, pon"
                      className="w-24 px-2 py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-orange-950 uppercase mb-1">Tipo de Mídia</label>
                    <select
                      value={batchMediaType}
                      onChange={(e) => setBatchMediaType(e.target.value as any)}
                      className="px-2 py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-white cursor-pointer"
                    >
                      <option value="ethernet">🔌 Ethernet RJ45 (Cobre)</option>
                      <option value="fiber">💎 Fibra Óptica (SFP / SFP+)</option>
                      <option value="pon">⚡ GPON / EPON Óptica</option>
                      <option value="voice">📞 Telefonia (FXS / FXO / E1)</option>
                      <option value="serial">⚙️ Console / Gerência</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-orange-950 uppercase mb-1">Velocidade / Modo</label>
                    <select
                      value={batchSpeedMode}
                      onChange={(e) => setBatchSpeedMode(e.target.value as any)}
                      className="px-2 py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-white cursor-pointer"
                    >
                      <option value="10M">10 Mbps (/10 - 10Base-T)</option>
                      <option value="100M">100 Mbps (/100 - Fast Ethernet)</option>
                      <option value="1000M">1000 Mbps (/1000 - Gigabit 1G)</option>
                      <option value="2.5G">2.5 Gbps (2.5G / GPON)</option>
                      <option value="10000M">10000 Mbps (/10000 - 10G SFP+)</option>
                      <option value="25G">25 Gbps (25G SFP28)</option>
                      <option value="40G">40 Gbps (40G QSFP+)</option>
                      <option value="100G">100 Gbps (100G QSFP28)</option>
                      <option value="auto">Auto / Negociação Automática</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPortBatch}
                    className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Bloco de Portas
                  </button>
                </div>

                {/* Faceplate do Equipamento (Visualizador Frontal) */}
                <div className="p-3 bg-slate-900 rounded-2xl text-white space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>PAINEL FRONTAL: {vendor} {model || name || 'ATIVO'} ({rackUnits}U)</span>
                    <span>{ports.length} PORTAS</span>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap gap-1.5 items-center min-h-[50px]">
                    {ports.length === 0 ? (
                      <span className="text-xs text-slate-500 italic p-2">Nenhuma porta adicionada ainda. Adicione acima.</span>
                    ) : (
                      ports.map((p, idx) => (
                        <div
                          key={p.id}
                          className={`p-1.5 rounded-lg border text-center text-[10px] font-mono flex flex-col items-center justify-center min-w-[54px] ${
                            p.mediaType === 'fiber'
                              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                              : p.mediaType === 'pon'
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                              : p.mediaType === 'voice'
                              ? 'bg-pink-950/60 border-pink-500/40 text-pink-300'
                              : 'bg-slate-800 border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'up' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            <span className="font-bold truncate max-w-[45px]">{p.name}</span>
                          </div>
                          <span className="text-[8px] opacity-75 font-sans">
                            {p.speedMode === '10000M' ? '10G' : p.speedMode === '1000M' ? '1G' : p.speedMode || '1G'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Ports Table List */}
                {ports.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Nome Interface</th>
                          <th className="p-2">Mídia</th>
                          <th className="p-2">Velocidade / Modo</th>
                          <th className="p-2">Duplex</th>
                          <th className="p-2 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ports.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => handleUpdatePort(idx, { name: e.target.value })}
                                className="px-2 py-1 font-bold text-slate-800 bg-slate-50 rounded-lg border border-slate-200 w-36 text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={p.mediaType || 'ethernet'}
                                onChange={(e) => handleUpdatePort(idx, { mediaType: e.target.value as any })}
                                className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white cursor-pointer"
                              >
                                <option value="ethernet">Ethernet RJ45</option>
                                <option value="fiber">Fibra SFP/SFP+</option>
                                <option value="pon">GPON / EPON</option>
                                <option value="voice">Telefonia VoIP</option>
                                <option value="serial">Console / Serial</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={p.speedMode || '1000M'}
                                onChange={(e) => handleUpdatePort(idx, { speedMode: e.target.value as any })}
                                className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white cursor-pointer"
                              >
                                <option value="10M">10 Mbps (/10)</option>
                                <option value="100M">100 Mbps (/100)</option>
                                <option value="1000M">1000 Mbps (/1000 - 1G)</option>
                                <option value="2.5G">2.5 Gbps (PON)</option>
                                <option value="10000M">10000 Mbps (/10000 - 10G)</option>
                                <option value="25G">25 Gbps</option>
                                <option value="40G">40 Gbps</option>
                                <option value="100G">100 Gbps</option>
                                <option value="auto">Auto-negociação</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={p.duplex || 'full'}
                                onChange={(e) => handleUpdatePort(idx, { duplex: e.target.value as any })}
                                className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white cursor-pointer"
                              >
                                <option value="full">Full Duplex</option>
                                <option value="half">Half Duplex</option>
                                <option value="auto">Auto</option>
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemovePort(p.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab: Biblioteca de Modelos Pré-Cadastrados */
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {/* Search */}
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Pesquisar modelo (MikroTik CCR, Huawei OLT, Intelbras PABX, Cisco, DIO, Rack...)"
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden w-full md:w-80 font-medium"
                />

                {/* Classification Primary Pills */}
                <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCatalogClassification('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      catalogClassification === 'all'
                        ? 'bg-orange-600 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({DEVICE_CATALOG.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogClassification('ativo')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      catalogClassification === 'ativo'
                        ? 'bg-orange-500 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    ⚡ Ativos
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogClassification('passivo')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      catalogClassification === 'passivo'
                        ? 'bg-slate-900 text-emerald-400 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    📦 Passivos
                  </button>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'Todas Categorias' },
                    { id: 'isp_core', label: 'Core / BGP / Switch' },
                    { id: 'access_ftth', label: 'OLTs & FTTH' },
                    { id: 'telephony_voip', label: 'PABX / Telefonia' },
                    { id: 'rack_power', label: 'Energia' },
                    { id: 'passive', label: 'Racks & Passivos' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCatalogCategory(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCatalogCategory === c.id
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Catalog items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCatalog.map((item, idx) => {
                  const isPassive = item.category === 'passive' || item.category === 'cabling_structure' || item.type.includes('rack') || item.type.includes('dio') || item.type.includes('cto') || item.type.includes('ceo') || item.type.includes('organizer') || item.type.includes('blank') || item.type.includes('tray') || item.type.includes('splitter');
                  return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {item.vendor}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isPassive ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              📦 Passivo
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              ⚡ Ativo
                            </span>
                          )}
                          {item.rackUnits && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {item.rackUnits}U Rack
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-slate-500">
                        {item.model}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Ports Badges */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {item.defaultPorts.slice(0, 4).map((p, pIdx) => (
                          <span key={pIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                            {p.name} ({p.speedMode || p.type})
                          </span>
                        ))}
                        {item.defaultPorts.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold">
                            +{item.defaultPorts.length - 4} portas
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectFromCatalog(item)}
                      className="w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Instanciar neste POP / Pasta
                    </button>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>

          {activeTab === 'custom' && (
            <button
              type="button"
              onClick={handleSaveCustomDevice}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar & Adicionar Ativo ao Rack / POP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
