import { Product, Sale, CustomerDebt, CashRegister, FinancialEntry, StoreSettings, UserAccount, Supplier, TimeClockRecord, EmployeeDocument, CompanyDivision } from '../types';

const _d = (s: string) => typeof atob !== 'undefined' ? atob(s) : Buffer.from(s, 'base64').toString('utf-8');

export const INITIAL_DIVISIONS: CompanyDivision[] = [
  {
    id: 'div-1',
    name: 'Diretoria & Operações',
    description: 'Gestão executiva, governança corporativa e planejamento estratégico do provedor.',
    leaderId: _d('dXNlci1zdXBlcmFkbWlu'),
    color: 'amber',
    createdAt: '2023-01-01'
  },
  {
    id: 'div-2',
    name: 'NOC / Infraestrutura de Redes',
    description: 'Monitoramento 24/7 de tráfego, roteamento BGP, servidores e backbone de fibra óptica.',
    leaderId: 'user-admin',
    color: 'blue',
    createdAt: '2023-01-01'
  },
  {
    id: 'div-3',
    name: 'Operações de Campo / Fibra Óptica',
    description: 'Instalação de assinantes, reparos emergenciais em postes, fusão e certificação OTDR.',
    leaderId: 'user-caixa2',
    color: 'emerald',
    createdAt: '2023-01-01'
  },
  {
    id: 'div-4',
    name: 'Suporte Técnico & Atendimento',
    description: 'Atendimento ao cliente, abertura de chamados, suporte N1/N2 e configuração de roteadores.',
    leaderId: 'user-caixa1',
    color: 'purple',
    createdAt: '2023-01-01'
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: _d('dXNlci1zdXBlcmFkbWlu'),
    name: _d('RWR1YXJkbyAoU3VwZXIgQWRtaW5pc3RyYWRvcik='),
    username: _d('ZWR1YXJkb3N1cGVyYWRtaW4='),
    password: _d('ODc5NDgzODQ='),
    role: _d('c3VwZXJhZG1pbg==') as 'superadmin',
    operatorNumber: '00',
    avatar: '👑',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '(11) 99999-8888',
    department: 'Diretoria & Operações',
    position: 'Administrador Geral ISP',
    registrationCode: 'COL-0001',
    admissionDate: '2023-01-10',
    workSchedule: 'Segunda a Sexta: 08:00 às 18:00 (Flexível)',
    hierarchyLevel: 'diretoria',
    cpf: '111.222.333-44',
    rg: '12.345.678-9',
    email: 'eduardo.diretoria@provedor.net',
    address: 'Av. das Telecomunicações, 1000 - Centro',
    cnh: 'AB - 12345678900',
    pixKey: 'eduardo.diretoria@provedor.net',
    bankInfo: 'Banco do Brasil - Ag 1234-5 C/C 98765-4',
    emergencyContact: 'Juliana (Esposa) - (11) 98888-7777',
    bloodType: 'O+',
    permissions: {
      canAccessPdv: true,
      canAccessEstoque: true,
      canAccessRh: true,
      canAccessPrevencaoPerdas: true,
      canAccessVendas: true,
      canAccessFinanceiro: true,
      canAccessRelatorios: true,
      canAccessConfiguracoes: true,
    }
  }
];

export const INITIAL_EMPLOYEE_DOCUMENTS: EmployeeDocument[] = [
  {
    id: 'doc-1',
    userId: 'user-caixa1',
    name: 'Contrato de Trabalho Individual - CLT',
    category: 'contrato',
    fileName: 'Contrato_Trabalho_Claudia_Souza.pdf',
    fileSize: '420 KB',
    uploadDate: '2024-03-01',
    notes: 'Contrato registrado de Analista de Suporte N1 com jornada 44h semanais.'
  },
  {
    id: 'doc-2',
    userId: 'user-caixa1',
    name: 'Atestado de Saúde Ocupacional (ASO Admissional)',
    category: 'aso_medico',
    fileName: 'ASO_Admissional_Claudia.pdf',
    fileSize: '280 KB',
    uploadDate: '2024-02-28',
    notes: 'Apto para função administrativa e suporte técnico.'
  },
  {
    id: 'doc-3',
    userId: 'user-caixa1',
    name: 'Documentos Pessoais (RG, CPF, Comprovante Residência)',
    category: 'pessoal',
    fileName: 'Documentacao_Pessoal_Claudia.pdf',
    fileSize: '1.2 MB',
    uploadDate: '2024-03-01',
    notes: 'Cópias autenticadas entregues no RH.'
  },
  {
    id: 'doc-4',
    userId: 'user-caixa2',
    name: 'Certificado de Treinamento NR-35 (Trabalho em Altura)',
    category: 'certificacao',
    fileName: 'Certificado_NR35_Marcos_Oliveira.pdf',
    fileSize: '850 KB',
    uploadDate: '2024-05-18',
    notes: 'Válido até Maio/2026. Obrigatório para escadas e postes de fibra óptica.'
  },
  {
    id: 'doc-5',
    userId: 'user-caixa2',
    name: 'Certificado de Treinamento NR-10 (Segurança em Instalações)',
    category: 'certificacao',
    fileName: 'Certificado_NR10_Marcos.pdf',
    fileSize: '650 KB',
    uploadDate: '2024-05-18',
    notes: 'Válido até Maio/2026.'
  },
  {
    id: 'doc-6',
    userId: 'user-caixa2',
    name: 'Contrato de Trabalho & Termo de EPI / Ferramentas',
    category: 'contrato',
    fileName: 'Contrato_EPI_Veiculo_Marcos.pdf',
    fileSize: '510 KB',
    uploadDate: '2024-05-20',
    notes: 'Termo de cautela da máquina de fusão, OTDR, escada e veículo.'
  },
  {
    id: 'doc-7',
    userId: 'user-admin',
    name: 'Certificação MikroTik MTCNA / MTCRE & NOC',
    category: 'certificacao',
    fileName: 'Certificacoes_MikroTik_Carlos.pdf',
    fileSize: '1.8 MB',
    uploadDate: '2023-06-15',
    notes: 'Certificações internacionais de roteamento avançado e BGP.'
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  name: 'OperaFácil',
  slogan: 'Gestão Completa. Conexão que Impulsiona.',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 98765-4321',
  address: 'Av. das Telecomunicações, 1000 - Polo Tecnológico',
  receiptFooter: 'OperaFácil ERP - Tecnologia e Gestão para Provedores de Internet.',
};

// Histórico de pontos mockados para o mês atual
const generateMockTimeRecords = (): TimeClockRecord[] => {
  const records: TimeClockRecord[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  for (let d = 1; d <= currentDay; d++) {
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Dom, 6 = Sab
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (dayOfWeek === 0) {
      // Domingo
      records.push({
        id: `time-${d}`,
        userId: 'user-caixa1',
        userName: 'Cláudia Souza',
        date: dateStr,
        status: 'folga',
        notes: 'Descanso Semanal Remunerado (DSR)',
      });
    } else if (dayOfWeek === 6) {
      // Sábado
      records.push({
        id: `time-${d}`,
        userId: 'user-caixa1',
        userName: 'Cláudia Souza',
        date: dateStr,
        entry1: '08:00',
        exit1: '12:00',
        totalHours: 4.0,
        extraHours: 0.0,
        status: 'normal',
        location: 'Sede Central ISP',
        notes: 'Plantão de Sábado',
      });
    } else if (d === currentDay) {
      // Hoje: Aberto
      records.push({
        id: `time-${d}`,
        userId: 'user-caixa1',
        userName: 'Cláudia Souza',
        date: dateStr,
        entry1: '08:02',
        exit1: '12:01',
        entry2: '13:02',
        totalHours: 5.0,
        extraHours: 0.0,
        status: 'normal',
        location: 'Central de Atendimento ISP',
      });
    } else {
      // Dia de semana regular
      const randomExtra = d % 5 === 0 ? 0.5 : 0;
      records.push({
        id: `time-${d}`,
        userId: 'user-caixa1',
        userName: 'Cláudia Souza',
        date: dateStr,
        entry1: '08:00',
        exit1: '12:00',
        entry2: '13:00',
        exit2: randomExtra > 0 ? '17:30' : '17:00',
        totalHours: 8.0 + randomExtra,
        extraHours: randomExtra,
        status: randomExtra > 0 ? 'extra' : 'normal',
        location: 'Central de Atendimento ISP',
      });
    }
  }

  return records;
};

export const INITIAL_TIME_RECORDS: TimeClockRecord[] = generateMockTimeRecords();

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: CustomerDebt[] = [];

export const INITIAL_CASH_REGISTER: CashRegister = {
  isOpen: false,
  openedAt: '',
  operator: '',
  initialAmount: 0,
  movements: []
};

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_FINANCIAL: FinancialEntry[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

