export type ProductCategory = 
  | 'Fibra Óptica'
  | 'Roteadores & Wi-Fi'
  | 'ONUs & Modems'
  | 'Cabos & Conectores'
  | 'Equipamentos de Rede'
  | 'Ferramentas & EPI'
  | 'Acessórios & Suprimentos'
  | 'Serviços & Planos'
  | (string & {});

export type ProductUnit = 'un' | 'm' | 'kg' | 'pct' | 'cx' | 'l' | 'g';

export interface ProductBatch {
  id: string;
  batchNumber?: string;
  quantity: number;
  entryDate: string;          // Data de lançamento/entrada (YYYY-MM-DD)
  manufacturingDate?: string; // Data de fabricação (YYYY-MM-DD)
  expirationDate?: string;    // Data de validade (YYYY-MM-DD)
  costPrice?: number;
  supplierName?: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  icon?: string;
  imageUrl?: string;
  supplierId?: string;
  supplierName?: string;
  manufacturingDate?: string; // YYYY-MM-DD (Validade/Fabricação consolidada ou do lote principal)
  expirationDate?: string; // YYYY-MM-DD
  batchNumber?: string;
  batches?: ProductBatch[]; // Divisão de lotes e validades por remessa de estoque
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export type PaymentMethod = 
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'fiado';

export interface Sale {
  id: string;
  code: string;
  date: string; // ISO
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  customerName?: string;
  customerId?: string;
  cashierName: string;
  status: 'concluida' | 'cancelada';
}

export interface CustomerDebt {
  id: string;
  name: string;
  phone: string;
  address?: string;
  imageUrl?: string;
  balance: number; // current debt
  creditLimit: number;
  lastPurchaseDate?: string;
  history: {
    id: string;
    date: string;
    type: 'compra' | 'pagamento';
    amount: number;
    description: string;
  }[];
}

export interface CashMovement {
  id: string;
  time: string;
  type: 'sangria' | 'suprimento' | 'venda';
  amount: number;
  reason: string;
  operator: string;
}

export interface CashRegister {
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  operator: string;
  initialAmount: number;
  movements: CashMovement[];
}

export interface FinancialEntry {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'pago' | 'pendente';
  paymentMethod?: string;
  supplierId?: string;
  invoiceNumber?: string;
  dueDate?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  category: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  pixKey?: string;
  paymentTerms?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
}

export type ProductLossReason = 
  | 'vencimento'
  | 'avaria_quebra'
  | 'devolucao_fornecedor'
  | 'extravio'
  | 'consumo_interno';

export interface ProductLossEntry {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  category: ProductCategory;
  quantity: number;
  unit: ProductUnit;
  costPrice: number;
  totalLoss: number;
  reason: ProductLossReason;
  date: string; // ISO / YYYY-MM-DD
  operatorName: string;
  notes?: string;
  batchNumber?: string;
  batchId?: string;
}

export interface UserPermissions {
  canAccessPdv?: boolean;
  canAccessEstoque: boolean;
  canAccessRh?: boolean;
  canAccessPrevencaoPerdas?: boolean;
  canAccessVendas?: boolean;
  canAccessFinanceiro: boolean;
  canAccessRelatorios: boolean;
  canAccessConfiguracoes: boolean;
  canAccessColaborador?: boolean;
}

export type DocumentCategory = 
  | 'contrato' 
  | 'pessoal' 
  | 'aso_medico' 
  | 'folha_ponto' 
  | 'certificacao' 
  | 'outros';

export interface EmployeeDocument {
  id: string;
  userId: string;
  name: string;
  category: DocumentCategory;
  fileUrl?: string;     // Data URL / Base64 para download/preview
  fileName?: string;
  fileSize?: string;
  uploadDate: string;   // YYYY-MM-DD
  notes?: string;
}

export type TimeClockPunchType = 'entry1' | 'exit1' | 'entry2' | 'exit2';

export interface TimeClockAdjustmentLog {
  id: string;
  field: TimeClockPunchType;
  fieldLabel: string; // Ex: 'Entrada 1', 'Saída 1 (Almoço)', 'Retorno 2', 'Saída 2'
  action: 'edit' | 'delete' | 'create';
  previousValue?: string;
  newValue?: string;
  reason: string; // Justificativa / Observação obrigatória
  adjustedBy: string; // Usuário do RH que realizou o ajuste
  adjustedAt: string; // Timestamp ISO do ajuste
}

export interface TimeClockJustification {
  id: string;
  date: string;          // Data da ausência/falta (YYYY-MM-DD)
  startTime: string;     // Horário início (HH:mm)
  endTime: string;       // Horário fim (HH:mm)
  isFullDay?: boolean;   // Falta de dia inteiro
  reason: string;        // Motivo / Justificativa detalhada
  documentUrl?: string;  // Atestado ou documento comprobatório em base64/URL
  documentName?: string; // Nome do arquivo anexo
  documentSize?: string;
  selfieUrl: string;     // Assinatura biométrica por selfie obrigatória
  submittedAt: string;   // Timestamp ISO
  status: 'pendente' | 'aprovado' | 'rejeitado';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface TimeClockRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  entry1?: string; // HH:mm (Entrada)
  exit1?: string;  // HH:mm (Saída Almoço)
  entry2?: string; // HH:mm (Retorno Almoço)
  exit2?: string;  // HH:mm (Saída)
  totalHours?: number; // Total horas trabalhadas decimais (ex: 8.0)
  extraHours?: number; // Saldo de horas extras ou negativas
  status: 'normal' | 'atraso' | 'extra' | 'falta' | 'folga' | 'justificado' | 'feriado';
  notes?: string;
  location?: string;
  deviceInfo?: string;
  ipAddress?: string;
  selfies?: {
    entry1?: string;
    exit1?: string;
    entry2?: string;
    exit2?: string;
    justification?: string;
  }; // Fotos biométricas registradas nas batidas
  justification?: TimeClockJustification; // Dados da justificativa de falta/ausência
  adjustments?: TimeClockAdjustmentLog[]; // Histórico de auditoria de edições/exclusões
}

export type HierarchyLevel = 'diretoria' | 'gestao' | 'supervisao' | 'operacional';

export interface FlowNode {
  id: string; // userId
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  from: string; // source userId
  to: string;   // target userId
  label?: string;
}

export interface DivisionFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface CompanyDivision {
  id: string;
  name: string;
  description?: string;
  leaderId?: string; // ID do Colaborador Líder da Divisão
  color?: string;    // 'blue' | 'orange' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'rose'
  flowData?: DivisionFlow; // Dados do Canvas Flow estilo n8n
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'superadmin' | 'admin' | 'operador';
  avatar?: string;
  operatorNumber?: string;
  avatarUrl?: string;
  phone?: string;
  permissions?: UserPermissions;
  
  // Informações do Colaborador (Provedor de Internet)
  department?: string;      // Ex: "Suporte Técnico N1/N2", "Técnico de Campo (Fibra)", "NOC / Redes", "Comercial"
  position?: string;        // Cargo - Ex: "Técnico de Instalação e Fusão", "Analista de Redes", "Atendente"
  registrationCode?: string; // Matrícula - Ex: "COL-0428"
  admissionDate?: string;   // Data de Admissão - YYYY-MM-DD
  workSchedule?: string;    // Escala - Ex: "Segunda a Sexta: 08:00 às 18:00 (Intervalo 1h)"
  hierarchyLevel?: HierarchyLevel; // Nível no Organograma em Cascata
  reportsToUserId?: string; // Subordinado ao líder de nível superior
  cpf?: string;
  rg?: string;
  email?: string;
  address?: string;
  cnh?: string;             // CNH para trabalho de campo
  pixKey?: string;
  bankInfo?: string;
  emergencyContact?: string;
  bloodType?: string;
}

export interface StoreSettings {
  name: string;
  slogan: string;
  cnpj: string;
  phone: string;
  address: string;
  receiptFooter: string;
  logoUrl?: string;
}

