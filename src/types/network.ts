export type DeviceCategory = 
  | 'isp_core' 
  | 'access_ftth' 
  | 'telephony_voip'
  | 'wireless' 
  | 'enterprise' 
  | 'rack_power'
  | 'passive' 
  | 'cabling_structure'
  | 'cloud';

export type DeviceType = 
  | 'router_bgp'
  | 'router_cgnat'
  | 'olt_gpon'
  | 'switch_core'
  | 'switch_access'
  | 'telephony_pabx'
  | 'rectifier_power'
  | 'ups_nobreak'
  | 'pdu_power_strip'
  | 'electrical_outlet'
  | 'rack_floor'
  | 'rack_wall'
  | 'patch_panel_rj45'
  | 'dio_fiber'
  | 'cable_organizer'
  | 'patch_panel_dio'
  | 'front_panel_blank'
  | 'rack_tray'
  | 'onu_ont'
  | 'wifi_router'
  | 'radio_ptp'
  | 'server_datacenter'
  | 'firewall'
  | 'pc_workstation'
  | 'camera_cftv'
  | 'rack_19'
  | 'cto'
  | 'ceo'
  | 'splitter'
  | 'internet_cloud';

export type PortMediaType = 'ethernet' | 'fiber' | 'pon' | 'voice' | 'serial' | 'power_ac' | 'power_dc' | 'wireless';

export type PortSpeedMode = 
  | '10M'     // 10 Mbps (10Base-T)
  | '100M'    // 100 Mbps (Fast Ethernet)
  | '1000M'   // 1000 Mbps (1 Gbps / Gigabit Ethernet)
  | '2.5G'    // 2.5 Gbps (2.5GBase-T / GPON Downstream)
  | '10000M'  // 10000 Mbps (10 Gbps / 10G SFP+)
  | '25G'     // 25 Gbps (25G SFP28)
  | '40G'     // 40 Gbps (40G QSFP+)
  | '100G'    // 100 Gbps (100G QSFP28)
  | 'auto';   // Auto-Negociação

export type PortDuplex = 'full' | 'half' | 'auto';

export type PortPoe = 'none' | 'poe_af' | 'poe_plus_at' | 'poe_plus_plus_bt' | 'passive_24v' | 'passive_48v';

export type LinkType = 
  | 'fiber_sm'     // Fibra Monomodo (Amarela / Azul)
  | 'fiber_mm'     // Fibra Multimodo (Laranja / Aqua)
  | 'utp_cat6'     // Cabo UTP Par Trançado (Azul)
  | 'power_cable'  // Cabo de Força AC / DC (Preto / Vermelho)
  | 'wireless_ptp' // Enlace de Rádio PTP (Amarelo tracejado)
  | 'coaxial'      // Cabo Coaxial (Verde)
  | 'fiber_drop'   // Cabo Drop de Atendimento FTTH (Preto / Roxo);

export interface NetworkFolder {
  id: string;
  name: string;
  parentId: string | null; // null para pastas raiz (ex: ALAGOINHAS)
  icon?: string;
  color?: string;
  description?: string;
  createdAt: string; // Antiguidade / Data de criação
  visible?: boolean; // Controle de visibilidade em camadas estilo SGP
}

export interface NetworkPort {
  id: string;
  name: string; // Ex: sfp-sfpplus1, giga1, pon1, eth0, ramal 101, Tomada 1, Porta 24
  type: string; // 'copper_1g' | 'copper_10g' | 'copper_100m' | 'sfp_1g' | 'sfp_10g' | 'sfp_25g' | 'pon_gpon' | 'voice_fxs' | 'voice_fxo' | 'voice_e1' | 'power_outlet' | 'wireless' | 'console' | string
  mediaType?: PortMediaType; // ethernet, fiber, pon, voice, serial, power_ac, power_dc
  speedMode?: PortSpeedMode; // '10M' | '100M' | '1000M' | '2.5G' | '10000M' | '25G' | '40G' | '100G' | 'auto'
  duplex?: PortDuplex;
  poe?: PortPoe;
  connectorType?: string; // 'RJ45' | 'LC' | 'SC' | 'RJ11' | 'SFP+' | 'QSFP28' | 'DB9' | 'NBR_14136' | 'IEC_C13' | 'IEC_C19'
  ip?: string;
  subnet?: string;
  mac?: string;
  status: 'up' | 'down' | 'disabled';
  vlan?: number;
  opticalPowerDbm?: number; // Ex: -18.5 dBm para portas ópticas
  connectedToLinkId?: string;
}

export interface NetworkNode {
  id: string;
  folderId?: string; // Pasta / POP pertencente (ex: RAQUE NOC ALAGOINHAS)
  name: string;
  hostname: string;
  type: DeviceType;
  category: DeviceCategory;
  x: number;
  y: number;
  width?: number;
  height?: number;
  ip: string;
  managementIp?: string;
  mac?: string;
  model: string; // Ex: MikroTik CCR2004-16G-2S+, Nobreak APC Smart-UPS 3000VA, Rack 44U
  vendor: string; // Ex: MikroTik, Huawei, Cisco, APC, NHS, Furukawa, Totem, Intelbras
  location: string; // Ex: POP Central - Rack 01 (U42), Sala de Baterias
  
  // Relacionamentos físicos e elétricos entre Ativos e Passivos
  parentRackId?: string; // ID do Rack onde este equipamento está montado
  rackUnits?: number; // Altura em U (ex: 1U, 2U, 3U, 4U, 44U)
  rackPosition?: string; // Posição no Rack (ex: "U42", "U20", "U1")
  totalRackCapacityU?: number; // Capacidade total se este nó for um Rack (ex: 44U, 24U, 9U)
  rackType?: 'floor' | 'wall' | 'outdoor'; // Rack de Chão, de Parede ou Caixa Hermética
  
  // Energia & Alimentação
  powerSourceNodeId?: string; // ID do Nobreak, PDU ou Tomada que alimenta este ativo
  powerOutletNumber?: string; // Número/Nome da tomada onde está conectado
  powerSupply?: 'AC 110/220V Bivolt' | 'DC -48V Telecom' | 'DC 24V' | 'DC 12V' | 'Redundante AC/DC';
  powerConsumptionWatts?: number; // Consumo elétrico em Watts do equipamento
  capacityVa?: number; // Capacidade em VA se for Nobreak (ex: 3000 VA)
  totalOutlets?: number; // Quantidade de tomadas de saída se for PDU/Nobreak
  batteryAutonomyMin?: number; // Autonomia estimada em minutos
  
  serialNumber?: string;
  isCustomAsset?: boolean;
  isPassive?: boolean; // Flag para identificar se é passivo/infraestrutura
  status: 'online' | 'warning' | 'offline';
  osType?: 'mikrotik_routeros' | 'cisco_ios' | 'huawei_vrp' | 'linux' | 'generic';
  ports: NetworkPort[];
  notes?: string;
  customData?: Record<string, any>;
  vlanId?: number;
  fiberPowerDbm?: number;
  customImageUrl?: string; // URL ou Base64 da imagem PNG personalizada
  imageUrl?: string;
}

export interface LinkStyleConfig {
  strokeColor?: string;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  strokeWidth?: number;
  hasArrow?: boolean;
  arrowType?: 'end' | 'both' | 'none';
  lineStyle?: 'straight' | 'curved' | 'stepped';
}

export interface NetworkLink {
  id: string;
  sourceNodeId?: string;
  sourcePortId?: string;
  targetNodeId?: string;
  targetPortId?: string;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  points?: Array<{ x: number; y: number }>;
  type: LinkType;
  label?: string;
  speed?: string; // Ex: 10 Gbps, 1 Gbps, 2.5 Gbps PON
  distanceKm?: number;
  lossDb?: number; // Atenuação medida em dB
  status: 'active' | 'degraded' | 'down';
  notes?: string;
  style?: LinkStyleConfig;
}

export interface CanvasShape {
  id: string;
  type: 'rectangle' | 'circle' | 'sticky_note' | 'text_label';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  color?: string; // fill color
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  textColor?: string;
  fontSize?: number;
}

export interface TopologyData {
  id: string;
  name: string;
  description?: string;
  folders?: NetworkFolder[];
  nodes: NetworkNode[];
  links: NetworkLink[];
  shapes?: CanvasShape[];
  updatedAt: string;
  gridSnap?: boolean;
}

export interface SimulationPacket {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  currentNodeId: string;
  path: string[]; // List of node IDs
  currentPathIndex: number;
  progress: number; // 0 to 1 along current link
  type: 'icmp_ping' | 'traceroute' | 'arp' | 'data';
  status: 'in_transit' | 'success' | 'failed' | 'dropped';
  rttMs: number;
  ttl: number;
  message: string;
}

export interface PingResult {
  host: string;
  target: string;
  packetsSent: number;
  packetsReceived: number;
  packetLossPercent: number;
  rttMinMs: number;
  rttAvgMs: number;
  rttMaxMs: number;
  logs: string[];
}
