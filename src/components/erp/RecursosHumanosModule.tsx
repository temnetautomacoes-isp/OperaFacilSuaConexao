import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UserAccount, 
  TimeClockRecord, 
  TimeClockAdjustmentLog,
  EmployeeDocument, 
  DocumentCategory,
  TimeClockPunchType,
  TimeClockGeolocation,
  CompanyDivision,
  HierarchyLevel,
  DivisionFlow,
  UserPermissions
} from '../../types';
import { DivisionFlowCanvas } from './DivisionFlowCanvas';
import { AvatarCropModal } from '../common/AvatarCropModal';
import { 
  Users, 
  Clock, 
  FolderLock, 
  Folder, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Eye, 
  Upload, 
  ShieldCheck, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Building2, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Save, 
  Sparkles, 
  FileUp, 
  Layers, 
  UserPlus, 
  ArrowUpRight, 
  FileCode, 
  CalendarDays,
  CreditCard,
  Heart,
  Check,
  ChevronDown,
  UserCheck,
  Camera,
  History,
  AlertTriangle,
  FileSignature,
  Crown,
  Network,
  GitFork,
  ArrowDown,
  Lock,
  Workflow,
  Sparkle,
  Move,
  Navigation
} from 'lucide-react';

type RhTab = 'colaboradores' | 'folha_ponto' | 'documentos' | 'visao_geral';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string; bg: string }> = {
  contrato: { label: 'Contrato & Termos', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  pessoal: { label: 'Documentos Pessoais', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  aso_medico: { label: 'ASO / Saúde Ocupacional', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  folha_ponto: { label: 'Folha de Ponto Assinada', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  certificacao: { label: 'Certificação & NRs', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  outros: { label: 'Outros Anexos', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

const PUNCH_LABELS: Record<TimeClockPunchType, string> = {
  entry1: 'Entrada 1 (Início Expediente)',
  exit1: 'Saída 1 (Intervalo Almoço)',
  entry2: 'Retorno 2 (Fim do Intervalo)',
  exit2: 'Saída 2 (Fim Expediente)'
};

const HIERARCHY_CONFIG: Record<HierarchyLevel, { label: string; badge: string; color: string; order: number }> = {
  diretoria: { label: 'Diretoria Executiva', badge: 'bg-amber-50 text-amber-800 border-amber-200', color: 'text-amber-600', order: 1 },
  gestao: { label: 'Gestão & Coordenação', badge: 'bg-blue-50 text-blue-800 border-blue-200', color: 'text-blue-600', order: 2 },
  supervisao: { label: 'Supervisão & Especialistas', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', color: 'text-emerald-600', order: 3 },
  operacional: { label: 'Operacional & Técnicos', badge: 'bg-slate-50 text-slate-700 border-slate-200', color: 'text-slate-600', order: 4 },
};

const DIVISION_COLOR_THEMES: Record<string, { bg: string; border: string; badge: string; text: string; lightBg: string }> = {
  amber: { bg: 'bg-amber-500', border: 'border-amber-400', badge: 'bg-amber-100 text-amber-900 border-amber-200', text: 'text-amber-700', lightBg: 'bg-amber-50' },
  blue: { bg: 'bg-blue-600', border: 'border-blue-400', badge: 'bg-blue-100 text-blue-900 border-blue-200', text: 'text-blue-700', lightBg: 'bg-blue-50' },
  emerald: { bg: 'bg-emerald-600', border: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-900 border-emerald-200', text: 'text-emerald-700', lightBg: 'bg-emerald-50' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-400', badge: 'bg-purple-100 text-purple-900 border-purple-200', text: 'text-purple-700', lightBg: 'bg-purple-50' },
  rose: { bg: 'bg-rose-600', border: 'border-rose-400', badge: 'bg-rose-100 text-rose-900 border-rose-200', text: 'text-rose-700', lightBg: 'bg-rose-50' },
  cyan: { bg: 'bg-cyan-600', border: 'border-cyan-400', badge: 'bg-cyan-100 text-cyan-900 border-cyan-200', text: 'text-cyan-700', lightBg: 'bg-cyan-50' },
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const RecursosHumanosModule: React.FC = () => {
  const { 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    divisions,
    addDivision,
    updateDivision,
    deleteDivision,
    timeRecords, 
    addTimeRecordManual,
    adjustTimePunch,
    updateTimeRecord, 
    deleteTimeRecord,
    employeeDocuments, 
    addEmployeeDocument, 
    deleteEmployeeDocument, 
    settings,
    currentUser,
    showNotification 
  } = useApp();

  const [activeTab, setActiveTab] = useState<RhTab>('colaboradores');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('todos');

  // Selected Employee for Dossier / Detail Modal
  const [selectedUserForDossier, setSelectedUserForDossier] = useState<UserAccount | null>(null);

  // Selected Division for Cascade View & Modal
  const [selectedDivisionForCascade, setSelectedDivisionForCascade] = useState<CompanyDivision | null>(null);
  const [isAddDivisionModalOpen, setIsAddDivisionModalOpen] = useState<boolean>(false);
  const [isEditDivisionModalOpen, setIsEditDivisionModalOpen] = useState<boolean>(false);
  const [editingDivision, setEditingDivision] = useState<CompanyDivision | null>(null);

  // Folha de Ponto Filters
  const [pontoUserId, setPontoUserId] = useState<string>('todos');
  const [pontoMonth, setPontoMonth] = useState<number>(new Date().getMonth());
  const [pontoYear, setPontoYear] = useState<number>(new Date().getFullYear());
  const [pontoStatusFilter, setPontoStatusFilter] = useState<string>('todos');

  // Documents Filters
  const [docUserId, setDocUserId] = useState<string>('todos');
  const [docCategory, setDocCategory] = useState<string>('todos');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [isManualPontoModalOpen, setIsManualPontoModalOpen] = useState<boolean>(false);
  const [editingPontoRecord, setEditingPontoRecord] = useState<TimeClockRecord | null>(null);

  // Individual Punch Adjustment Modal (with observation & audit trail)
  const [isAdjustPunchModalOpen, setIsAdjustPunchModalOpen] = useState<boolean>(false);
  const [targetRecordForAdjustment, setTargetRecordForAdjustment] = useState<TimeClockRecord | null>(null);
  const [targetPunchField, setTargetPunchField] = useState<TimeClockPunchType>('entry1');
  const [punchNewTime, setPunchNewTime] = useState<string>('');
  const [punchAdjustReason, setPunchAdjustReason] = useState<string>('');
  const [isDeletePunchAction, setIsDeletePunchAction] = useState<boolean>(false);

  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

  const [isPrintMirrorModalOpen, setIsPrintMirrorModalOpen] = useState<boolean>(false);
  const [printUserId, setPrintUserId] = useState<string>('');

  // Form states
  const [userFormData, setUserFormData] = useState<Partial<UserAccount>>({
    name: '',
    username: '',
    password: '123',
    role: 'operador',
    department: 'Suporte Técnico & Atendimento',
    position: 'Analista de Suporte N1',
    registrationCode: `COL-0${users.length + 100}`,
    admissionDate: new Date().toISOString().slice(0, 10),
    workSchedule: 'Segunda a Sexta: 08:00 às 17:00 (Intervalo 1h)',
    hierarchyLevel: 'operacional',
    phone: '',
    email: '',
    cpf: '',
    rg: '',
    address: '',
    cnh: '',
    pixKey: '',
    bankInfo: '',
    emergencyContact: '',
    bloodType: 'A+'
  });

  const [divisionFormData, setDivisionFormData] = useState({
    name: '',
    description: '',
    leaderId: '',
    color: 'blue'
  });

  const [manualPontoForm, setManualPontoForm] = useState({
    userId: users[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    entry1: '08:00',
    exit1: '12:00',
    entry2: '13:00',
    exit2: '17:00',
    location: 'Sede Central ISP',
    notes: 'Lançamento efetuado pela Gerência de RH',
    status: 'normal' as TimeClockRecord['status']
  });

  const [uploadDocForm, setUploadDocForm] = useState({
    userId: users[0]?.id || '',
    name: '',
    category: 'contrato' as DocumentCategory,
    notes: '',
    fileName: '',
    fileSize: '',
    fileUrl: ''
  });

  const [previewSelfie, setPreviewSelfie] = useState<{
    url: string;
    title: string;
    userName: string;
    date: string;
    location?: string;
    time?: string;
    justification?: any;
    geo?: TimeClockGeolocation;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editUserPhotoInputRef = useRef<HTMLInputElement>(null);
  const newUserPhotoInputRef = useRef<HTMLInputElement>(null);

  // Security checks: Original Superadmin & Superadmin role
  const isOriginalSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.username.toLowerCase() === 'eduardosuperadmin' || currentUser.id === 'user-superadmin';
  }, [currentUser]);

  const isSuperAdmin = useMemo(() => {
    return currentUser?.role === 'superadmin' || isOriginalSuperAdmin;
  }, [currentUser, isOriginalSuperAdmin]);

  // Can assign panel permissions (Only Superadmin and Gestor/Admin)
  const canAssignPermissions = useMemo(() => {
    return isSuperAdmin || currentUser?.role === 'admin';
  }, [isSuperAdmin, currentUser]);

  // Photo crop & framing modal state (social media style)
  const [rawAvatarToCrop, setRawAvatarToCrop] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropTargetIsEdit, setCropTargetIsEdit] = useState<boolean>(true);

  // Handle Photo File Upload (Convert to Data URL and open framing modal)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setRawAvatarToCrop(dataUrl);
      setCropTargetIsEdit(isEdit);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    divisions.forEach((d) => set.add(d.name));
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [divisions, users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.position && u.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.registrationCode && u.registrationCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchDept = selectedDepartment === 'todos' || u.department === selectedDepartment;
      return matchSearch && matchDept;
    });
  }, [users, searchTerm, selectedDepartment]);

  // Filtered Time Records
  const filteredTimeRecords = useMemo(() => {
    return timeRecords.filter((r) => {
      const rDate = new Date(r.date + 'T00:00:00');
      const matchUser = pontoUserId === 'todos' || r.userId === pontoUserId;
      const matchMonth = rDate.getMonth() === pontoMonth;
      const matchYear = rDate.getFullYear() === pontoYear;
      const matchStatus = pontoStatusFilter === 'todos' || r.status === pontoStatusFilter;
      return matchUser && matchMonth && matchYear && matchStatus;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [timeRecords, pontoUserId, pontoMonth, pontoYear, pontoStatusFilter]);

  // Totals for the selected month/user in Folha de Ponto
  const monthStats = useMemo(() => {
    let totalHours = 0;
    let totalExtra = 0;
    let daysWorked = filteredTimeRecords.length;

    filteredTimeRecords.forEach((r) => {
      totalHours += r.totalHours || 0;
      totalExtra += r.extraHours || 0;
    });

    return {
      totalHours: Number(totalHours.toFixed(2)),
      totalExtra: Number(totalExtra.toFixed(2)),
      daysWorked
    };
  }, [filteredTimeRecords]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return employeeDocuments.filter((d) => {
      const matchUser = docUserId === 'todos' || d.userId === docUserId;
      const matchCat = docCategory === 'todos' || d.category === docCategory;
      const matchSearch = searchTerm ? d.name.toLowerCase().includes(searchTerm.toLowerCase()) || (d.fileName && d.fileName.toLowerCase().includes(searchTerm.toLowerCase())) : true;
      return matchUser && matchCat && matchSearch;
    }).sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [employeeDocuments, docUserId, docCategory, searchTerm]);

  // Handle File Input for Document Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setUploadDocForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeStr,
        name: prev.name || file.name.replace(/\.[^/.]+$/, "")
      }));

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setUploadDocForm((prev) => ({
          ...prev,
          fileUrl: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New User
  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.username) {
      showNotification('Preencha o nome completo e o usuário de login.');
      return;
    }
    if (!userFormData.email || !userFormData.email.includes('@')) {
      showNotification('Informe um e-mail válido para vincular ao Supabase Auth.');
      return;
    }
    if (!userFormData.password || userFormData.password.length < 6) {
      showNotification('A senha para acesso ao Supabase Auth deve conter pelo menos 6 caracteres.');
      return;
    }

    addUser(userFormData as Omit<UserAccount, 'id'>);
    setIsAddUserModalOpen(false);
  };

  // Submit Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, editingUser);
    if (selectedUserForDossier?.id === editingUser.id) {
      setSelectedUserForDossier(editingUser);
    }
    setIsEditUserModalOpen(false);
  };

  // Submit New Division
  const handleSaveNewDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisionFormData.name.trim()) {
      showNotification('Informe o nome da divisão.');
      return;
    }

    addDivision({
      name: divisionFormData.name.trim(),
      description: divisionFormData.description.trim(),
      leaderId: divisionFormData.leaderId || undefined,
      color: divisionFormData.color || 'blue'
    });

    setIsAddDivisionModalOpen(false);
    setDivisionFormData({ name: '', description: '', leaderId: '', color: 'blue' });
  };

  // Submit Edit Division (Superadmin only)
  const handleSaveEditDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDivision) return;

    if (!isSuperAdmin) {
      showNotification('Acesso Restrito: Somente o Super Administrador pode alterar a hierarquia e dados estruturais.');
      return;
    }

    updateDivision(editingDivision.id, editingDivision);
    if (selectedDivisionForCascade?.id === editingDivision.id) {
      setSelectedDivisionForCascade(editingDivision);
    }
    setIsEditDivisionModalOpen(false);
  };

  // Save Flow Connections & Positions (n8n Style)
  const handleSaveDivisionFlow = (divisionId: string, flow: DivisionFlow) => {
    updateDivision(divisionId, { flowData: flow });
    if (selectedDivisionForCascade && selectedDivisionForCascade.id === divisionId) {
      setSelectedDivisionForCascade((prev) => prev ? { ...prev, flowData: flow } : null);
    }
    showNotification('Organograma em Flow salvo com sucesso!');
  };

  // Open Punch Adjustment Modal for a specific punch slot
  const handleOpenAdjustPunch = (record: TimeClockRecord, field: TimeClockPunchType) => {
    setTargetRecordForAdjustment(record);
    setTargetPunchField(field);
    setPunchNewTime(record[field] || '');
    setPunchAdjustReason('');
    setIsDeletePunchAction(false);
    setIsAdjustPunchModalOpen(true);
  };

  // Submit Punch Adjustment with audit log & mandatory reason
  const handleSavePunchAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRecordForAdjustment) return;

    if (!punchAdjustReason.trim()) {
      showNotification('Por favor, informe a observação/motivo do ajuste para documentação.');
      return;
    }

    const valueToSet = isDeletePunchAction ? undefined : punchNewTime.trim();

    adjustTimePunch(
      targetRecordForAdjustment.id,
      targetPunchField,
      valueToSet,
      punchAdjustReason.trim()
    );

    setIsAdjustPunchModalOpen(false);
  };

  // Submit Manual Ponto Full Form
  const handleSaveManualPonto = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find((u) => u.id === manualPontoForm.userId);
    if (!targetUser) return;

    if (editingPontoRecord) {
      updateTimeRecord(editingPontoRecord.id, {
        date: manualPontoForm.date,
        entry1: manualPontoForm.entry1,
        exit1: manualPontoForm.exit1,
        entry2: manualPontoForm.entry2,
        exit2: manualPontoForm.exit2,
        location: manualPontoForm.location,
        notes: manualPontoForm.notes,
        status: manualPontoForm.status
      });
      setEditingPontoRecord(null);
    } else {
      addTimeRecordManual({
        userId: targetUser.id,
        userName: targetUser.name,
        date: manualPontoForm.date,
        entry1: manualPontoForm.entry1,
        exit1: manualPontoForm.exit1,
        entry2: manualPontoForm.entry2,
        exit2: manualPontoForm.exit2,
        location: manualPontoForm.location,
        notes: manualPontoForm.notes,
        status: manualPontoForm.status
      });
    }

    setIsManualPontoModalOpen(false);
  };

  // Submit Upload Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocForm.name.trim()) {
      showNotification('Informe o título do documento.');
      return;
    }

    addEmployeeDocument({
      userId: uploadDocForm.userId,
      name: uploadDocForm.name,
      category: uploadDocForm.category,
      fileName: uploadDocForm.fileName || `${uploadDocForm.name.replace(/\s+/g, '_')}.pdf`,
      fileSize: uploadDocForm.fileSize || '350 KB',
      fileUrl: uploadDocForm.fileUrl,
      notes: uploadDocForm.notes
    });

    setIsUploadDocModalOpen(false);
    setUploadDocForm({
      userId: users[0]?.id || '',
      name: '',
      category: 'contrato',
      notes: '',
      fileName: '',
      fileSize: '',
      fileUrl: ''
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & QUICK STATS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Recursos Humanos & Gestão de Pessoas
                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2.5 py-0.5 rounded-full border border-orange-200">
                  ISP Corporativo
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Central de colaboradores, divisões operacionais com organograma em cascata, controle de ponto auditável e documentos.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setUserFormData({
                name: '',
                username: '',
                password: '123',
                role: 'operador',
                department: divisions[0]?.name || 'Suporte Técnico & Atendimento',
                position: 'Analista de Suporte N1',
                registrationCode: `COL-0${users.length + 100}`,
                admissionDate: new Date().toISOString().slice(0, 10),
                workSchedule: 'Segunda a Sexta: 08:00 às 17:00 (Intervalo 1h)',
                hierarchyLevel: 'operacional',
                phone: '',
                email: '',
                cpf: '',
                rg: '',
                address: '',
                cnh: '',
                pixKey: '',
                bankInfo: '',
                emergencyContact: '',
                bloodType: 'A+'
              });
              setIsAddUserModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-orange-400" />
            <span>Novo Colaborador</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDivisionFormData({
                name: '',
                description: '',
                leaderId: users[0]?.id || '',
                color: 'blue'
              });
              setIsAddDivisionModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Nova Divisão / Setor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingPontoRecord(null);
              setManualPontoForm({
                userId: users[0]?.id || '',
                date: new Date().toISOString().slice(0, 10),
                entry1: '08:00',
                exit1: '12:00',
                entry2: '13:00',
                exit2: '17:00',
                location: 'Sede Central ISP',
                notes: 'Lançamento efetuado pela Gerência de RH',
                status: 'normal'
              });
              setIsManualPontoModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Lançar Ponto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadDocForm({
                userId: users[0]?.id || '',
                name: '',
                category: 'contrato',
                notes: '',
                fileName: '',
                fileSize: '',
                fileUrl: ''
              });
              setIsUploadDocModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs shadow-orange-500/20"
          >
            <FileUp className="w-4 h-4" />
            <span>Anexar Documento</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total Colaboradores
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {users.length}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Em {divisions.length} divisões estruturadas
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Pontos Registrados
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {timeRecords.length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Com auditoria de ajustes
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Documentos Arquivados
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {employeeDocuments.length}
            </div>
            <span className="text-[11px] text-purple-600 font-medium">
              Pastas digitais individuais
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Divisões & Organograma
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {divisions.length} setores
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Estrutura hierárquica em cascata
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('colaboradores')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'colaboradores'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-orange-400" />
          <span>Colaboradores & Perfis</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 text-white font-bold">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('folha_ponto')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'folha_ponto'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Folhas de Ponto (Espelhos)</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 text-white font-bold">
            {filteredTimeRecords.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documentos')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'documentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FolderLock className="w-4 h-4 text-purple-400" />
          <span>Pastas de Documentos</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 text-white font-bold">
            {employeeDocuments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visao_geral')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'visao_geral'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Estrutura & Setores ISP</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 text-white font-bold">
            {divisions.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: COLABORADORES & PERFIS */}
      {/* ========================================================================= */}
      {activeTab === 'colaboradores' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, matrícula, cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-orange-500"
              >
                <option value="todos">Todos os Departamentos</option>
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Collaborator Grid Cards (Clicking anywhere opens the Dossier) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const userDocs = employeeDocuments.filter((d) => d.userId === user.id);
              const userRecords = timeRecords.filter((r) => r.userId === user.id);
              const userAdjustmentsCount = userRecords.reduce((acc, r) => acc + (r.adjustments?.length || 0), 0);
              const hLevel = user.hierarchyLevel || (user.role === 'superadmin' ? 'diretoria' : user.role === 'admin' ? 'gestao' : 'operacional');
              const hConfig = HIERARCHY_CONFIG[hLevel] || HIERARCHY_CONFIG.operacional;

              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserForDossier(user)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-xl hover:border-orange-300 hover:scale-[1.01] transition-all flex flex-col justify-between group cursor-pointer relative"
                >
                  <div className="space-y-4">
                    {/* Header with Avatar & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-100 shadow-xs group-hover:border-orange-300 transition-colors"
                            />
                          ) : (
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            user.role === 'superadmin' ? 'bg-amber-500' : user.role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'
                          }`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                            {user.name}
                          </h3>
                          <p className="text-xs text-orange-600 font-bold truncate">
                            {user.position || 'Colaborador ISP'}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {user.registrationCode || `COL-${user.operatorNumber || '00'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-2xs ${
                          user.role === 'superadmin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : user.role === 'admin' ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {user.role === 'superadmin' ? '👑 Super Admin' : user.role === 'admin' ? 'Administrador' : 'Operador'}
                        </span>
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap shadow-2xs ${hConfig.badge}`}>
                          {hConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Department & Info Tags */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-semibold text-slate-700">
                          {user.department || 'Operações Gerais'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Admissão: {user.admissionDate ? new Date(user.admissionDate).toLocaleDateString('pt-BR') : 'Não informada'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.phone || '(Não cadastrado)'}</span>
                      </div>
                    </div>

                    {/* Folder & Time Record Stats Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                        <span className="text-[10px] font-bold text-purple-700 block uppercase">
                          Documentos
                        </span>
                        <span className="text-sm font-black text-purple-900">
                          {userDocs.length} arquivos
                        </span>
                      </div>
                      <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center relative">
                        <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                          Registros Ponto
                        </span>
                        <span className="text-sm font-black text-emerald-900">
                          {userRecords.length} batidas
                        </span>
                        {userAdjustmentsCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs" title={`${userAdjustmentsCount} ajustes de ponto documentados`}>
                            {userAdjustmentsCount} ajustados
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs">
                      <FolderLock className="w-3.5 h-3.5 text-orange-400" />
                      <span>Abrir Dossiê & Ponto</span>
                    </div>

                    <button
                      type="button"
                      title="Editar Colaborador"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingUser({ ...user });
                        setIsEditUserModalOpen(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {user.role !== 'superadmin' && (
                      <button
                        type="button"
                        title="Remover Colaborador"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja remover o colaborador "${user.name}"?`)) {
                            deleteUser(user.id);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: FOLHAS DE PONTO (ESPELHOS GERAIS COM AJUSTES AUDITÁVEIS) */}
      {/* ========================================================================= */}
      {activeTab === 'folha_ponto' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Colaborador Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Colaborador:
                </label>
                <select
                  value={pontoUserId}
                  onChange={(e) => setPontoUserId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  <option value="todos">Todos os Colaboradores</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.position || u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mês Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Mês de Referência:
                </label>
                <select
                  value={pontoMonth}
                  onChange={(e) => setPontoMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Ano Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Ano:
                </label>
                <select
                  value={pontoYear}
                  onChange={(e) => setPontoYear(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Status:
                </label>
                <select
                  value={pontoStatusFilter}
                  onChange={(e) => setPontoStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="normal">Normal</option>
                  <option value="extra">Horas Extras</option>
                  <option value="atraso">Atraso / Saída Antecipada</option>
                  <option value="falta">Falta</option>
                  <option value="folga">Folga / DSR</option>
                  <option value="justificado">Justificado</option>
                </select>
              </div>
            </div>

            {/* Print Mirror Button */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => {
                  setPrintUserId(pontoUserId !== 'todos' ? pontoUserId : users[0]?.id || '');
                  setIsPrintMirrorModalOpen(true);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Imprimir Espelho de Ponto Oficial</span>
              </button>
            </div>
          </div>

          {/* Month Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dias Registrados</span>
                <div className="text-xl font-black text-slate-900">{monthStats.daysWorked} dias</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Horas Trabalhadas</span>
                <div className="text-xl font-black text-emerald-700">{monthStats.totalHours} hrs</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Horas Extras / Banco</span>
                <div className={`text-xl font-black ${monthStats.totalExtra >= 0 ? 'text-orange-600' : 'text-rose-600'}`}>
                  {monthStats.totalExtra > 0 ? `+${monthStats.totalExtra}` : monthStats.totalExtra} hrs
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Ponto Records Table with Punch Adjustment Triggers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  Batidas e Apuração de Ponto &bull; {MONTH_NAMES[pontoMonth]} de {pontoYear}
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    Clique em qualquer horário para ajustar ou excluir com observação
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Registros eletrônicos auditáveis com notas de alterações e justificativas legais documentadas pelo RH.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-3 text-center">Entrada 1</th>
                    <th className="py-3 px-3 text-center">Saída 1 (Almoço)</th>
                    <th className="py-3 px-3 text-center">Retorno 2</th>
                    <th className="py-3 px-3 text-center">Saída 2</th>
                    <th className="py-3 px-4 text-center">Total Horas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Biometria</th>
                    <th className="py-3 px-4 text-center">Auditoria</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTimeRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        Nenhum registro de ponto localizado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTimeRecords.map((r) => {
                      const dateObj = new Date(r.date + 'T00:00:00');
                      const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
                      const adjustmentsCount = r.adjustments?.length || 0;
                      const hasSelfies = r.selfies && Object.keys(r.selfies).length > 0;
                      const hasJustification = Boolean(r.justification);

                      // Helper to render interactive individual punch slot
                      const renderPunchSlot = (field: TimeClockPunchType, val?: string) => {
                        const hasFieldAdjustment = r.adjustments?.some((a) => a.field === field);
                        const latestFieldLog = r.adjustments?.find((a) => a.field === field);

                        return (
                          <div
                            onClick={() => handleOpenAdjustPunch(r, field)}
                            className={`group/slot relative px-2 py-1 rounded-lg font-mono font-bold text-center cursor-pointer transition-all border ${
                              hasFieldAdjustment 
                                ? 'bg-amber-50/90 text-amber-900 border-amber-300 hover:bg-amber-100' 
                                : val 
                                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-900' 
                                : 'bg-slate-50/40 text-slate-400 border-dashed border-slate-200 hover:bg-slate-100'
                            }`}
                            title={hasFieldAdjustment && latestFieldLog ? `Ajustado por ${latestFieldLog.adjustedBy}: "${latestFieldLog.reason}". Clique para reajustar.` : 'Clique para editar ou excluir este horário com observação'}
                          >
                            <span>{val || '--:--'}</span>
                            {hasFieldAdjustment && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                            )}
                          </div>
                        );
                      };

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{dayOfWeek}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 block">{r.userName}</span>
                            <span className="text-[10px] text-slate-400">{r.location || 'Sede Central'}</span>
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {renderPunchSlot('entry1', r.entry1)}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {renderPunchSlot('exit1', r.exit1)}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {renderPunchSlot('entry2', r.entry2)}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {renderPunchSlot('exit2', r.exit2)}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800">
                              {r.totalHours ? `${r.totalHours}h` : '--'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                              r.status === 'justificado'
                                ? 'bg-purple-100 text-purple-700'
                                : r.status === 'extra'
                                ? 'bg-orange-100 text-orange-700'
                                : r.status === 'atraso'
                                ? 'bg-rose-100 text-rose-700'
                                : r.status === 'folga'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {r.status}
                            </span>
                          </td>

                          {/* Biometria & Justificativas Visualizer */}
                          <td className="py-3 px-3 text-center">
                            {hasSelfies || hasJustification || r.geolocations ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const selfieUrl = r.selfies?.entry1 || r.selfies?.justification || Object.values(r.selfies || {})[0];
                                  const gObj = r.geolocations?.entry1 || r.geolocations?.justification || Object.values(r.geolocations || {})[0];
                                  setPreviewSelfie({
                                    url: selfieUrl || '',
                                    title: `Assinatura Biométrica & GPS — ${r.userName}`,
                                    userName: r.userName,
                                    date: r.date,
                                    location: r.location,
                                    time: r.entry1,
                                    justification: r.justification,
                                    geo: gObj
                                  });
                                }}
                                className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                                title="Visualizar Selfie Biométrica, Localização GPS e Atestados"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                {r.geolocations && (
                                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-1 rounded flex items-center gap-0.5">
                                    <Navigation className="w-2.5 h-2.5" /> GPS
                                  </span>
                                )}
                                {hasJustification && <span className="text-[10px] text-purple-700 font-extrabold bg-purple-100 px-1 rounded">Atestado</span>}
                              </button>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {adjustmentsCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200" title={`${adjustmentsCount} alteração(ões) documentada(s)`}>
                                <FileSignature className="w-3 h-3 text-amber-700" />
                                {adjustmentsCount} obs
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300 font-mono">Original</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Ajustar / Excluir Horários com Observação"
                                onClick={() => handleOpenAdjustPunch(r, 'entry1')}
                                className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Ajustar</span>
                              </button>

                              <button
                                type="button"
                                title="Remover Dia de Ponto"
                                onClick={() => {
                                  if (confirm(`Remover todo o registro de ponto do dia ${r.date}?`)) {
                                    deleteTimeRecord(r.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: PASTAS DE DOCUMENTOS DE COLABORADORES */}
      {/* ========================================================================= */}
      {activeTab === 'documentos' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              {/* Colaborador Filter */}
              <div>
                <select
                  value={docUserId}
                  onChange={(e) => setDocUserId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  <option value="todos">Todas as Pastas (Todos Colaboradores)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>Pasta: {u.name}</option>
                  ))}
                </select>
              </div>

              {/* Categoria Filter */}
              <div>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-orange-500"
                >
                  <option value="todos">Todas as Categorias</option>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setUploadDocForm({
                  userId: docUserId !== 'todos' ? docUserId : users[0]?.id || '',
                  name: '',
                  category: 'contrato',
                  notes: '',
                  fileName: '',
                  fileSize: '',
                  fileUrl: ''
                });
                setIsUploadDocModalOpen(true);
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs shadow-orange-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>Anexar Arquivo</span>
            </button>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                <FolderLock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">Nenhum documento encontrado na pasta.</p>
                <p className="text-xs text-slate-400 mt-1">Clique em "Anexar Arquivo" para fazer o upload de contratos, ASOs ou certificados.</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const owner = users.find((u) => u.id === doc.userId);
                const catCfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.outros;

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${catCfg.bg} ${catCfg.color}`}>
                          {catCfg.label}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {doc.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {doc.notes || 'Documento oficial arquivado na pasta digital de RH.'}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">Colaborador:</span>
                          <span className="truncate max-w-[150px] font-semibold">{owner?.name || 'Não identificado'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Arquivo / Tamanho:</span>
                          <span className="font-mono text-slate-500">{doc.fileName || 'documento.pdf'} ({doc.fileSize || '350 KB'})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Data de Envio:</span>
                          <span>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Visualizar</span>
                      </button>

                      <button
                        type="button"
                        title="Baixar Arquivo"
                        onClick={() => {
                          if (doc.fileUrl) {
                            const a = document.createElement('a');
                            a.href = doc.fileUrl;
                            a.download = doc.fileName || 'documento.pdf';
                            a.click();
                          } else {
                            showNotification(`Download do arquivo "${doc.name}" iniciado.`);
                          }
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        title="Excluir Documento"
                        onClick={() => {
                          if (confirm(`Deseja excluir o documento "${doc.name}"?`)) {
                            deleteEmployeeDocument(doc.id);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: VISÃO GERAL & ESTRUTURA ISP (DIVISÕES & ORGANOGRAMA EM CASCATA) */}
      {/* ========================================================================= */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6">
          
          {/* Header with New Division action button */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                Organograma & Estrutura Operacional ISP
              </h2>
              <p className="text-xs text-slate-500">
                Divisões de equipes, hierarquia em cascata e organograma dos setores técnicos do provedor.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDivisionFormData({
                  name: '',
                  description: '',
                  leaderId: users[0]?.id || '',
                  color: 'blue'
                });
                setIsAddDivisionModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Divisão / Setor</span>
            </button>
          </div>

          {/* Divisions Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {divisions.map((div) => {
              const divUsers = users.filter((u) => u.department === div.name);
              const leader = users.find((u) => u.id === div.leaderId) || divUsers.find((u) => u.role === 'superadmin' || u.role === 'admin') || divUsers[0];
              const theme = DIVISION_COLOR_THEMES[div.color || 'blue'] || DIVISION_COLOR_THEMES.blue;

              return (
                <div 
                  key={div.id}
                  onClick={() => setSelectedDivisionForCascade(div)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-xl hover:border-blue-400 hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  {/* Top Color Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.bg}`} />

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                          {div.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {div.description || 'Setor e divisão operacional do provedor de internet.'}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 border ${theme.badge}`}>
                        {divUsers.length} integrantes
                      </span>
                    </div>

                    {/* Division Leader Card */}
                    {leader && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="relative">
                          {leader.avatarUrl ? (
                            <img 
                              src={leader.avatarUrl} 
                              alt={leader.name} 
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                              {leader.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Líder / Responsável:</span>
                          <span className="font-extrabold text-xs text-slate-900 truncate block">{leader.name}</span>
                          <span className="text-[11px] text-slate-500 truncate block">{leader.position || 'Gestão'}</span>
                        </div>
                      </div>
                    )}

                    {/* Members preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Equipe Integrante:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {divUsers.slice(0, 4).map((u) => (
                          <span key={u.id} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                            {u.name.split(' ')[0]} ({u.position?.split(' ')[0] || 'Técnico'})
                          </span>
                        ))}
                        {divUsers.length > 4 && (
                          <span className="text-[11px] font-bold text-blue-600 px-2 py-0.5">
                            +{divUsers.length - 4} mais
                          </span>
                        )}
                        {divUsers.length === 0 && (
                          <span className="text-xs text-slate-400 italic">Nenhum colaborador alocado neste setor ainda.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-blue-600 font-extrabold group-hover:translate-x-1 transition-transform">
                      <GitFork className="w-4 h-4" />
                      <span>Ver Mapa em Cascata & Hierarquia</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSuperAdmin && (
                        <button
                          type="button"
                          title="Editar Divisão (Exclusivo Super Admin)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDivision(div);
                            setIsEditDivisionModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: FLOW CANVAS DA DIVISÃO (ESTILO N8N / LIGAÇÃO DE PONTOS) */}
      {/* ========================================================================= */}
      {selectedDivisionForCascade && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in">
          <div className="bg-slate-950 rounded-3xl w-full max-w-6xl max-h-[96vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-black text-white">
                      {selectedDivisionForCascade.name}
                    </h2>
                    <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Flow Hierárquico Interativo (n8n Style)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDivisionForCascade.description || 'Arraste os nós e conecte os pontos para desenhar a hierarquia do setor.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSuperAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDivision(selectedDivisionForCascade);
                      setIsEditDivisionModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Dados da Divisão</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 bg-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Visualização Apenas
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedDivisionForCascade(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Interactive n8n-style DivisionFlowCanvas */}
            <div className="p-3 sm:p-4 bg-slate-950 flex-1 overflow-hidden">
              <DivisionFlowCanvas
                division={selectedDivisionForCascade}
                allUsers={users}
                isSuperAdmin={isSuperAdmin}
                onSaveFlow={handleSaveDivisionFlow}
                onOpenUserDossier={(user) => {
                  setSelectedUserForDossier(user);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-blue-400" />
                Conexões entre colaboradores representam linhas de comando e subordinação técnica no provedor.
              </span>
              <button
                type="button"
                onClick={() => setSelectedDivisionForCascade(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-slate-700"
              >
                Fechar Painel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: CADASTRAR NOVA DIVISÃO / SETOR */}
      {/* ========================================================================= */}
      {isAddDivisionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-base">Cadastrar Nova Divisão / Setor ISP</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDivisionModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDivision} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Divisão / Setor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Comercial & Vendas B2B, Engenharia de Rede, Financeiro"
                  value={divisionFormData.name}
                  onChange={(e) => setDivisionFormData({ ...divisionFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição / Finalidade</label>
                <textarea
                  rows={2}
                  placeholder="Responsabilidades principais e atribuições técnicas desta divisão..."
                  value={divisionFormData.description}
                  onChange={(e) => setDivisionFormData({ ...divisionFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Líder / Responsável do Setor</label>
                <select
                  value={divisionFormData.leaderId}
                  onChange={(e) => setDivisionFormData({ ...divisionFormData, leaderId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Selecione um colaborador líder</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.position || u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cor Temática no Organograma</label>
                <div className="flex items-center gap-3">
                  {Object.entries(DIVISION_COLOR_THEMES).map(([colorKey, cfg]) => (
                    <label key={colorKey} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="divColor"
                        value={colorKey}
                        checked={divisionFormData.color === colorKey}
                        onChange={() => setDivisionFormData({ ...divisionFormData, color: colorKey })}
                        className="sr-only"
                      />
                      <span className={`w-7 h-7 rounded-xl ${cfg.bg} flex items-center justify-center transition-all ${
                        divisionFormData.color === colorKey ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}>
                        {divisionFormData.color === colorKey && <Check className="w-4 h-4 text-white font-bold" />}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDivisionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Cadastrar Divisão</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: EDITAR HIERARQUIA & DIVISÃO (EXCLUSIVO SUPERADMIN) */}
      {/* ========================================================================= */}
      {isEditDivisionModalOpen && editingDivision && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-base">Editar Divisão & Hierarquia &bull; Super Admin</h3>
                  <p className="text-xs text-slate-300">Apenas o Super Administrador possui privilégio de alterar a estrutura.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditDivisionModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDivision} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Divisão *</label>
                  <input
                    type="text"
                    required
                    value={editingDivision.name}
                    onChange={(e) => setEditingDivision({ ...editingDivision, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Setor</label>
                  <textarea
                    rows={2}
                    value={editingDivision.description || ''}
                    onChange={(e) => setEditingDivision({ ...editingDivision, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Líder da Divisão</label>
                  <select
                    value={editingDivision.leaderId || ''}
                    onChange={(e) => setEditingDivision({ ...editingDivision, leaderId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Selecione o Líder</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.position || u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cor Temática</label>
                  <select
                    value={editingDivision.color || 'blue'}
                    onChange={(e) => setEditingDivision({ ...editingDivision, color: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="blue">Azul Corporativo</option>
                    <option value="amber">Âmbar / Dourado</option>
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="purple">Roxo / Violeta</option>
                    <option value="rose">Rosa / Magenta</option>
                    <option value="cyan">Ciano / Turquesa</option>
                  </select>
                </div>
              </div>

              {/* Members Hierarchy Assignment Table */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Definição de Níveis Hierárquicos na Cascata:
                </label>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                  {users.filter((u) => u.department === editingDivision.name).length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">Nenhum colaborador alocado neste setor ainda.</p>
                  ) : (
                    users.filter((u) => u.department === editingDivision.name).map((u) => (
                      <div key={u.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[11px] text-slate-400">{u.position || 'Colaborador'}</span>
                        </div>
                        <select
                          value={u.hierarchyLevel || 'operacional'}
                          onChange={(e) => {
                            const newLevel = e.target.value as HierarchyLevel;
                            updateUser(u.id, { hierarchyLevel: newLevel });
                          }}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="diretoria">Nível 1 &bull; Diretoria / Líder</option>
                          <option value="gestao">Nível 2 &bull; Gestão / Coordenação</option>
                          <option value="supervisao">Nível 2 &bull; Supervisão / Especialista</option>
                          <option value="operacional">Nível 3 &bull; Técnico / Operacional</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Deseja remover a divisão "${editingDivision.name}"?`)) {
                      deleteDivision(editingDivision.id);
                      setIsEditDivisionModalOpen(false);
                      if (selectedDivisionForCascade?.id === editingDivision.id) {
                        setSelectedDivisionForCascade(null);
                      }
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Divisão</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditDivisionModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Hierarquia</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: DOSSIÊ INDIVIDUAL COMPLETO DO COLABORADOR */}
      {/* ========================================================================= */}
      {selectedUserForDossier && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  {selectedUserForDossier.avatarUrl ? (
                    <img 
                      src={selectedUserForDossier.avatarUrl} 
                      alt={selectedUserForDossier.name} 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-400 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      {selectedUserForDossier.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                    selectedUserForDossier.role === 'superadmin' ? 'bg-amber-500' : selectedUserForDossier.role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-white">
                      {selectedUserForDossier.name}
                    </h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {selectedUserForDossier.role === 'superadmin' ? '👑 Super Admin' : selectedUserForDossier.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Matrícula: <strong className="font-mono text-orange-400">{selectedUserForDossier.registrationCode || 'COL-001'}</strong> &bull; {selectedUserForDossier.position || 'Função ISP'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser({ ...selectedUserForDossier });
                    setIsEditUserModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-500/20"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Informações</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUserForDossier(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Profile Overview Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-500" />
                    Ficha Cadastral & Contratual
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser({ ...selectedUserForDossier });
                      setIsEditUserModalOpen(true);
                    }}
                    className="text-orange-600 hover:text-orange-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Alterar Dados</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Departamento / Divisão:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.department || 'Operações'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cargo / Função:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.position || 'Não especificado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nível no Organograma:</span>
                    <span className="font-bold text-slate-800 capitalize">{selectedUserForDossier.hierarchyLevel || 'Operacional'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Data de Admissão:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.admissionDate ? new Date(selectedUserForDossier.admissionDate).toLocaleDateString('pt-BR') : 'Não informada'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Escala de Trabalho:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.workSchedule || 'Padrão 44h'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">CPF / RG:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.cpf || '--'} / {selectedUserForDossier.rg || '--'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">CNH (Trabalho de Campo):</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.cnh || 'Não cadastrada'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Telefone / WhatsApp:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.phone || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">E-mail:</span>
                    <span className="font-bold text-slate-800 truncate block">{selectedUserForDossier.email || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contato de Emergência:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.emergencyContact || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Chave PIX:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.pixKey || 'Não cadastrada'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Dados Bancários:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.bankInfo || 'Não cadastrados'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo Sanguíneo:</span>
                    <span className="font-bold text-slate-800">{selectedUserForDossier.bloodType || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Sub-section: Histórico de Batidas de Ponto com Auditoria Individual */}
              {(() => {
                const userPontoRecords = timeRecords.filter((r) => r.userId === selectedUserForDossier.id).sort((a, b) => b.date.localeCompare(a.date));
                const allUserAdjustments: Array<{ recordDate: string; log: TimeClockAdjustmentLog }> = [];

                userPontoRecords.forEach((r) => {
                  if (r.adjustments && r.adjustments.length > 0) {
                    r.adjustments.forEach((l) => {
                      allUserAdjustments.push({ recordDate: r.date, log: l });
                    });
                  }
                });

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          Folha de Ponto do Colaborador (Ajustes & Exclusões Individuais)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Clique em qualquer horário para editar ou excluir individualmente com observação de auditoria documentada.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPrintUserId(selectedUserForDossier.id);
                            setIsPrintMirrorModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-400" />
                          <span>Imprimir Espelho</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <th className="py-2.5 px-3">Data</th>
                            <th className="py-2.5 px-2 text-center">Entrada 1</th>
                            <th className="py-2.5 px-2 text-center">Saída 1</th>
                            <th className="py-2.5 px-2 text-center">Entrada 2</th>
                            <th className="py-2.5 px-2 text-center">Saída 2</th>
                            <th className="py-2.5 px-3 text-center">Total</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userPontoRecords.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-slate-400">
                                Nenhuma batida de ponto registrada para este colaborador.
                              </td>
                            </tr>
                          ) : (
                            userPontoRecords.slice(0, 15).map((r) => {
                              const renderDossierSlot = (field: TimeClockPunchType, val?: string) => {
                                const hasAdj = r.adjustments?.some((a) => a.field === field);
                                return (
                                  <div
                                    onClick={() => handleOpenAdjustPunch(r, field)}
                                    className={`px-2 py-1 rounded-lg font-mono font-bold text-center cursor-pointer transition-all border ${
                                      hasAdj
                                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                        : val
                                        ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-orange-50 hover:border-orange-300'
                                        : 'bg-slate-50/40 text-slate-400 border-dashed border-slate-200 hover:bg-slate-100'
                                    }`}
                                    title="Clique para editar ou excluir este horário individualmente com observação"
                                  >
                                    <span>{val || '--:--'}</span>
                                  </div>
                                );
                              };

                              return (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                  <td className="py-2 px-3 font-bold text-slate-900">{r.date}</td>
                                  <td className="py-2 px-2 text-center">{renderDossierSlot('entry1', r.entry1)}</td>
                                  <td className="py-2 px-2 text-center">{renderDossierSlot('exit1', r.exit1)}</td>
                                  <td className="py-2 px-2 text-center">{renderDossierSlot('entry2', r.entry2)}</td>
                                  <td className="py-2 px-2 text-center">{renderDossierSlot('exit2', r.exit2)}</td>
                                  <td className="py-2 px-3 text-center font-bold">{r.totalHours ? `${r.totalHours}h` : '--'}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAdjustPunch(r, 'entry1')}
                                      className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                    >
                                      Ajustar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Sub-section: Auditoria & Observações Documentadas dos Horários de Ponto */}
                    <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-4 h-4 text-amber-600" />
                          Documentação de Ajustes & Observações de Ponto ({allUserAdjustments.length})
                        </h4>
                        <span className="text-[10px] text-amber-800 font-bold">
                          Histórico de Auditoria Trabalhista
                        </span>
                      </div>

                      {allUserAdjustments.length === 0 ? (
                        <p className="text-xs text-amber-800/80">
                          Nenhum horário de ponto foi ajustado ou excluído manualmente para este colaborador até o momento. Todas as batidas registradas são originais.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {allUserAdjustments.map(({ recordDate, log }) => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900">
                                    {recordDate} &bull; {log.fieldLabel}
                                  </span>
                                  <span className={`px-2 py-0.2 rounded font-bold text-[10px] uppercase ${
                                    log.action === 'delete' 
                                      ? 'bg-rose-100 text-rose-800' 
                                      : log.action === 'edit'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {log.action === 'delete' ? 'Horário Excluído' : log.action === 'edit' ? 'Horário Alterado' : 'Horário Lançado'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.adjustedAt).toLocaleString('pt-BR')} por <strong className="text-slate-700">{log.adjustedBy}</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                                <span>Anterior: <strong>{log.previousValue || '--:--'}</strong></span>
                                <span>&rarr;</span>
                                <span>Novo: <strong className="text-orange-600">{log.newValue || '(Excluído)'}</strong></span>
                              </div>

                              <div className="bg-amber-50/70 p-2 rounded-lg text-[11px] text-amber-900 border border-amber-200/50">
                                <strong className="font-bold">Observação Registrada:</strong> {log.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Sub-section: Pasta de Documentos deste Colaborador */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-purple-600" />
                    Pasta Digital de Documentos ({employeeDocuments.filter((d) => d.userId === selectedUserForDossier.id).length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadDocForm({
                        userId: selectedUserForDossier.id,
                        name: '',
                        category: 'contrato',
                        notes: '',
                        fileName: '',
                        fileSize: '',
                        fileUrl: ''
                      });
                      setIsUploadDocModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar à Pasta</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employeeDocuments.filter((d) => d.userId === selectedUserForDossier.id).length === 0 ? (
                    <div className="col-span-full p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      Nenhum documento anexado nesta pasta ainda.
                    </div>
                  ) : (
                    employeeDocuments.filter((d) => d.userId === selectedUserForDossier.id).map((doc) => {
                      const catCfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.outros;
                      return (
                        <div key={doc.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-slate-900 block truncate">{doc.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${catCfg.bg} ${catCfg.color}`}>
                                {catCfg.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{doc.fileSize || 'PDF'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                              title="Visualizar"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (doc.fileUrl) {
                                  const a = document.createElement('a');
                                  a.href = doc.fileUrl;
                                  a.download = doc.fileName || 'documento.pdf';
                                  a.click();
                                } else {
                                  showNotification(`Download do arquivo "${doc.name}" iniciado.`);
                                }
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEmployeeDocument(doc.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setEditingUser({ ...selectedUserForDossier });
                  setIsEditUserModalOpen(true);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                <span>Editar Ficha do Colaborador</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserForDossier(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Fechar Dossiê
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL: AJUSTE / EXCLUSÃO INDIVIDUAL DE BATIDA DE PONTO COM OBSERVAÇÃO */}
      {/* ========================================================================= */}
      {isAdjustPunchModalOpen && targetRecordForAdjustment && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-extrabold text-base">Ajuste Individual de Ponto &bull; RH</h3>
                  <p className="text-xs text-slate-300">{targetRecordForAdjustment.userName} ({targetRecordForAdjustment.date})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustPunchModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePunchAdjustment} className="p-6 space-y-4">
              
              {/* Punch Slot Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qual horário deseja alterar ou excluir?</label>
                <select
                  value={targetPunchField}
                  onChange={(e) => {
                    const field = e.target.value as TimeClockPunchType;
                    setTargetPunchField(field);
                    setPunchNewTime(targetRecordForAdjustment[field] || '');
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="entry1">Entrada 1 (Início do Expediente) - Atual: {targetRecordForAdjustment.entry1 || '(Vazio)'}</option>
                  <option value="exit1">Saída 1 (Intervalo para Almoço) - Atual: {targetRecordForAdjustment.exit1 || '(Vazio)'}</option>
                  <option value="entry2">Retorno 2 (Fim do Intervalo) - Atual: {targetRecordForAdjustment.entry2 || '(Vazio)'}</option>
                  <option value="exit2">Saída 2 (Fim do Expediente) - Atual: {targetRecordForAdjustment.exit2 || '(Vazio)'}</option>
                </select>
              </div>

              {/* Action Choice: Edit Time or Delete Punch */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDeletePunchAction(false)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    !isDeletePunchAction ? 'bg-orange-500 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Substituir Horário</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeletePunchAction(true)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isDeletePunchAction ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir este Horário</span>
                </button>
              </div>

              {/* New Time Input (if not deleting) */}
              {!isDeletePunchAction ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Novo Horário da Batida (HH:mm) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 08:00"
                    value={punchNewTime}
                    onChange={(e) => setPunchNewTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold text-center text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Horário anterior registrado: <strong className="font-mono text-slate-700">{targetRecordForAdjustment[targetPunchField] || '(Nenhum)'}</strong>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 inline-block mr-1 text-rose-600" />
                  Você está solicitando a <strong>exclusão da batida de {PUNCH_LABELS[targetPunchField]}</strong>. Esta ação ficará documentada na auditoria da folha do colaborador.
                </div>
              )}

              {/* Mandatory Reason / Observation Field */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Observação / Justificativa Documentada (Obrigatório) *</span>
                  <span className="text-[10px] text-orange-600 font-semibold">Exigência Trabalhista</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Colaborador registrou a batida em horário incorreto ao retornar de atendimento em campo e solicitou a correção formal."
                  value={punchAdjustReason}
                  onChange={(e) => setPunchAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Registrado por: <strong>{currentUser?.name || 'Gestor de RH'}</strong> em {new Date().toLocaleDateString('pt-BR')}.
                </p>
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustPunchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md ${
                    isDeletePunchAction ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isDeletePunchAction ? 'Confirmar Exclusão com Observação' : 'Salvar Alteração com Observação'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. MODAL: EDITAR CADASTRO DO COLABORADOR */}
      {/* ========================================================================= */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl text-white">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Editar Cadastro: {editingUser.name}</h3>
                  <p className="text-xs text-slate-300">Atualize informações pessoais, foto de perfil, dados de RH e permissões de acesso.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 overflow-y-auto space-y-6">
              
              {/* Photo Upload & Preview Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {editingUser.avatarUrl ? (
                      <img
                        src={editingUser.avatarUrl}
                        alt={editingUser.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-400 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                        {editingUser.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => editUserPhotoInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/60 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      title="Clique para alterar a foto"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Foto de Perfil do Usuário</h4>
                    <p className="text-[11px] text-slate-500">Envie uma imagem do computador ou celular (PNG, JPG, WebP até 5MB).</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="file"
                        ref={editUserPhotoInputRef}
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, true)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editUserPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Enviar Foto do Computador</span>
                      </button>

                      {editingUser.avatarUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRawAvatarToCrop(editingUser.avatarUrl || '');
                              setCropTargetIsEdit(true);
                              setIsCropModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-slate-700"
                          >
                            <Move className="w-3.5 h-3.5 text-orange-400" />
                            <span>Ajustar Enquadramento</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, avatarUrl: '' })}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-64">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ou URL direta da foto:</label>
                  <input
                    type="text"
                    value={editingUser.avatarUrl || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, avatarUrl: e.target.value })}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuário de Login *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Senha de Acesso</label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Role with Strict Original Superadmin Protection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Perfil / Cargo de Acesso</span>
                    {!isOriginalSuperAdmin && (
                      <span className="text-[10px] text-amber-600 font-bold" title="Somente o Superadmin original pode alterar cargos de Superadmin">
                        🔒 Protegido
                      </span>
                    )}
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => {
                      const newRole = e.target.value as any;
                      if ((newRole === 'superadmin' || editingUser.role === 'superadmin') && !isOriginalSuperAdmin) {
                        showNotification('Acesso Restrito: Somente o usuário original Super Administrador pode atribuir ou remover o cargo de Super Administrador.');
                        return;
                      }
                      setEditingUser({ ...editingUser, role: newRole });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="operador">Operador / Técnico</option>
                    <option value="admin">Administrador / Gestor</option>
                    <option value="superadmin" disabled={!isOriginalSuperAdmin}>
                      👑 Super Administrador {!isOriginalSuperAdmin ? '(Restrito ao Superadmin Original)' : ''}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula</label>
                  <input
                    type="text"
                    value={editingUser.registrationCode || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, registrationCode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Divisão / Setor</label>
                  <select
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={editingUser.position || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Hierarchy Level in the Cascade Map (Superadmin only can edit) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Nível no Organograma</span>
                    {!isSuperAdmin && (
                      <span className="text-[10px] text-amber-600 font-bold">🔒 Superadmin</span>
                    )}
                  </label>
                  <select
                    disabled={!isSuperAdmin}
                    value={editingUser.hierarchyLevel || 'operacional'}
                    onChange={(e) => setEditingUser({ ...editingUser, hierarchyLevel: e.target.value as HierarchyLevel })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="diretoria">Nível 1 &bull; Diretoria / Liderança Executiva</option>
                    <option value="gestao">Nível 2 &bull; Gestão & Coordenação</option>
                    <option value="supervisao">Nível 2 &bull; Supervisão & Especialistas</option>
                    <option value="operacional">Nível 3 &bull; Operacional, Técnicos & Atendimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data de Admissão</label>
                  <input
                    type="date"
                    value={editingUser.admissionDate || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, admissionDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Escala de Trabalho</label>
                  <input
                    type="text"
                    value={editingUser.workSchedule || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, workSchedule: e.target.value })}
                    placeholder="Ex: Segunda a Sexta: 08:00 às 17:00 (Intervalo 1h)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={editingUser.cpf || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cpf: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RG</label>
                  <input
                    type="text"
                    value={editingUser.rg || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, rg: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNH (Trabalho de Campo)</label>
                  <input
                    type="text"
                    value={editingUser.cnh || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cnh: e.target.value })}
                    placeholder="Ex: AB - 12345678900"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={editingUser.pixKey || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, pixKey: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dados Bancários</label>
                  <input
                    type="text"
                    value={editingUser.bankInfo || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, bankInfo: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contato de Emergência</label>
                  <input
                    type="text"
                    value={editingUser.emergencyContact || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, emergencyContact: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Residencial</label>
                  <input
                    type="text"
                    value={editingUser.address || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissions Matrix: Quais painéis cada usuário pode usar */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      Designação de Permissões aos Painéis do Sistema
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Defina quais módulos o colaborador terá autorização para acessar e operar.
                    </p>
                  </div>

                  {canAssignPermissions ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue: UserPermissions = {
                            canAccessPdv: false,
                            canAccessEstoque: true,
                            canAccessRh: true,
                            canAccessPrevencaoPerdas: true,
                            canAccessVendas: false,
                            canAccessFinanceiro: true,
                            canAccessRelatorios: true,
                            canAccessConfiguracoes: true,
                          };
                          setEditingUser({ ...editingUser, permissions: allTrue });
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 cursor-pointer"
                      >
                        Acesso Total
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const opPerms: UserPermissions = {
                            canAccessPdv: false,
                            canAccessEstoque: true,
                            canAccessRh: false,
                            canAccessPrevencaoPerdas: false,
                            canAccessVendas: false,
                            canAccessFinanceiro: false,
                            canAccessRelatorios: false,
                            canAccessConfiguracoes: false,
                          };
                          setEditingUser({ ...editingUser, permissions: opPerms });
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 cursor-pointer"
                      >
                        Operacional / Estoque
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse: UserPermissions = {
                            canAccessPdv: false,
                            canAccessEstoque: false,
                            canAccessRh: false,
                            canAccessPrevencaoPerdas: false,
                            canAccessVendas: false,
                            canAccessFinanceiro: false,
                            canAccessRelatorios: false,
                            canAccessConfiguracoes: false,
                          };
                          setEditingUser({ ...editingUser, permissions: allFalse });
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Alteração Restrita a Superadmin e Gestores</span>
                    </div>
                  )}
                </div>

                {/* Grid of Permission Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { key: 'canAccessColaborador' as const, label: 'Portal do Colaborador', desc: 'Acesso a dados, documentos e ponto com biometria', icon: '📱' },
                    { key: 'canAccessEstoque' as const, label: 'Estoque & Produtos', desc: 'Entradas, saídas e controle', icon: '📦' },
                    { key: 'canAccessRh' as const, label: 'Recursos Humanos', desc: 'Gestão de equipe e ponto', icon: '👥' },
                    { key: 'canAccessFinanceiro' as const, label: 'Financeiro', desc: 'Contas, fluxo e caixa', icon: '💰' },
                    { key: 'canAccessRelatorios' as const, label: 'Relatórios & DRE', desc: 'Indicadores gerenciais', icon: '📈' },
                    { key: 'canAccessConfiguracoes' as const, label: 'Configurações', desc: 'Ajustes e acessos gerais', icon: '⚙️' },
                  ].map((perm) => {
                    const currentPerms = editingUser.permissions || {
                      canAccessPdv: true,
                      canAccessEstoque: true,
                      canAccessRh: true,
                      canAccessPrevencaoPerdas: false,
                      canAccessVendas: true,
                      canAccessFinanceiro: false,
                      canAccessRelatorios: false,
                      canAccessConfiguracoes: false,
                    };
                    const isChecked = !!currentPerms[perm.key];

                    return (
                      <label
                        key={perm.key}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                          canAssignPermissions ? 'cursor-pointer hover:border-orange-400' : 'opacity-70 cursor-not-allowed'
                        } ${
                          isChecked 
                            ? 'bg-orange-50/70 border-orange-300 shadow-2xs' 
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!canAssignPermissions}
                          checked={isChecked}
                          onChange={(e) => {
                            if (!canAssignPermissions) return;
                            setEditingUser({
                              ...editingUser,
                              permissions: {
                                ...currentPerms,
                                [perm.key]: e.target.checked,
                              },
                            });
                          }}
                          className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                            <span>{perm.icon}</span>
                            <span className="truncate">{perm.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. MODAL: NOVO COLABORADOR */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Cadastrar Novo Colaborador</h3>
                  <p className="text-xs text-slate-300">Preencha as informações, faça upload da foto e designe as permissões de acesso.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="p-6 overflow-y-auto space-y-6">
              
              {/* Photo Upload & Preview Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {userFormData.avatarUrl ? (
                      <img
                        src={userFormData.avatarUrl}
                        alt="Preview Foto"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-400 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                        {userFormData.name ? userFormData.name.slice(0, 2).toUpperCase() : 'NO'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => newUserPhotoInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/60 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      title="Clique para adicionar foto"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Foto de Perfil do Colaborador</h4>
                    <p className="text-[11px] text-slate-500">Envie uma imagem do seu dispositivo (PNG, JPG, WebP até 5MB).</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="file"
                        ref={newUserPhotoInputRef}
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, false)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => newUserPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Enviar Foto do Computador</span>
                      </button>

                      {userFormData.avatarUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRawAvatarToCrop(userFormData.avatarUrl || '');
                              setCropTargetIsEdit(false);
                              setIsCropModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-slate-700"
                          >
                            <Move className="w-3.5 h-3.5 text-orange-400" />
                            <span>Ajustar Enquadramento</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserFormData({ ...userFormData, avatarUrl: '' })}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-64">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ou URL direta da foto:</label>
                  <input
                    type="text"
                    value={userFormData.avatarUrl || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, avatarUrl: e.target.value })}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roberto Ferreira"
                    value={userFormData.name || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>E-mail de Acesso *</span>
                    <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      🛡️ Supabase Auth
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="roberto@provedor.com"
                    value={userFormData.email || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-blue-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuário de Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: roberto.fibra"
                    value={userFormData.username || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Senha de Acesso *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Mín. 6 dígitos</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Senha de acesso"
                    value={userFormData.password || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Role with Strict Superadmin Protection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Perfil / Cargo de Acesso</span>
                    {!isOriginalSuperAdmin && (
                      <span className="text-[10px] text-amber-600 font-bold">🔒 Protegido</span>
                    )}
                  </label>
                  <select
                    value={userFormData.role || 'operador'}
                    onChange={(e) => {
                      const newRole = e.target.value as any;
                      if (newRole === 'superadmin' && !isOriginalSuperAdmin) {
                        showNotification('Acesso Restrito: Somente o Super Administrador original pode criar outros Superadmins.');
                        return;
                      }
                      setUserFormData({ ...userFormData, role: newRole });
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="operador">Operador / Técnico</option>
                    <option value="admin">Administrador / Gestor</option>
                    <option value="superadmin" disabled={!isOriginalSuperAdmin}>
                      👑 Super Administrador {!isOriginalSuperAdmin ? '(Restrito ao Superadmin Original)' : ''}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Divisão / Setor</label>
                  <select
                    value={userFormData.department || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    placeholder="Ex: Técnico de Fusão e Instalação"
                    value={userFormData.position || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nível no Organograma</label>
                  <select
                    value={userFormData.hierarchyLevel || 'operacional'}
                    onChange={(e) => setUserFormData({ ...userFormData, hierarchyLevel: e.target.value as HierarchyLevel })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="diretoria">Nível 1 &bull; Diretoria / Liderança Executiva</option>
                    <option value="gestao">Nível 2 &bull; Gestão & Coordenação</option>
                    <option value="supervisao">Nível 2 &bull; Supervisão & Especialistas</option>
                    <option value="operacional">Nível 3 &bull; Operacional, Técnicos & Atendimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula</label>
                  <input
                    type="text"
                    placeholder="COL-010"
                    value={userFormData.registrationCode || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, registrationCode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data de Admissão</label>
                  <input
                    type="date"
                    value={userFormData.admissionDate || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, admissionDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={userFormData.phone || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF / Documento</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={userFormData.cpf || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, cpf: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissions Matrix: Quais painéis cada usuário pode usar */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      Designação de Permissões aos Painéis do Sistema
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Defina quais módulos o novo colaborador poderá acessar e operar.
                    </p>
                  </div>

                  {canAssignPermissions ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue: UserPermissions = {
                            canAccessPdv: false,
                            canAccessEstoque: true,
                            canAccessRh: true,
                            canAccessPrevencaoPerdas: true,
                            canAccessVendas: false,
                            canAccessFinanceiro: true,
                            canAccessRelatorios: true,
                            canAccessConfiguracoes: true,
                          };
                          setUserFormData({ ...userFormData, permissions: allTrue });
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 cursor-pointer"
                      >
                        Acesso Total
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const opPerms: UserPermissions = {
                            canAccessPdv: false,
                            canAccessEstoque: true,
                            canAccessRh: false,
                            canAccessPrevencaoPerdas: false,
                            canAccessVendas: false,
                            canAccessFinanceiro: false,
                            canAccessRelatorios: false,
                            canAccessConfiguracoes: false,
                          };
                          setUserFormData({ ...userFormData, permissions: opPerms });
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 cursor-pointer"
                      >
                        Operacional / Estoque
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse: UserPermissions = {
                            canAccessPdv: false,
                            canAccessEstoque: false,
                            canAccessRh: false,
                            canAccessPrevencaoPerdas: false,
                            canAccessVendas: false,
                            canAccessFinanceiro: false,
                            canAccessRelatorios: false,
                            canAccessConfiguracoes: false,
                          };
                          setUserFormData({ ...userFormData, permissions: allFalse });
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Alteração Restrita a Superadmin e Gestores</span>
                    </div>
                  )}
                </div>

                {/* Grid of Permission Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { key: 'canAccessColaborador' as const, label: 'Portal do Colaborador', desc: 'Acesso a dados, documentos e ponto com biometria', icon: '📱' },
                    { key: 'canAccessEstoque' as const, label: 'Estoque & Produtos', desc: 'Entradas, saídas e controle', icon: '📦' },
                    { key: 'canAccessRh' as const, label: 'Recursos Humanos', desc: 'Gestão de equipe e ponto', icon: '👥' },
                    { key: 'canAccessFinanceiro' as const, label: 'Financeiro', desc: 'Contas, fluxo e caixa', icon: '💰' },
                    { key: 'canAccessRelatorios' as const, label: 'Relatórios & DRE', desc: 'Indicadores gerenciais', icon: '📈' },
                    { key: 'canAccessConfiguracoes' as const, label: 'Configurações', desc: 'Ajustes e acessos gerais', icon: '⚙️' },
                  ].map((perm) => {
                    const currentPerms = userFormData.permissions || {
                      canAccessPdv: true,
                      canAccessEstoque: true,
                      canAccessRh: true,
                      canAccessPrevencaoPerdas: false,
                      canAccessVendas: true,
                      canAccessFinanceiro: false,
                      canAccessRelatorios: false,
                      canAccessConfiguracoes: false,
                    };
                    const isChecked = !!currentPerms[perm.key];

                    return (
                      <label
                        key={perm.key}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                          canAssignPermissions ? 'cursor-pointer hover:border-orange-400' : 'opacity-70 cursor-not-allowed'
                        } ${
                          isChecked 
                            ? 'bg-orange-50/70 border-orange-300 shadow-2xs' 
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!canAssignPermissions}
                          checked={isChecked}
                          onChange={(e) => {
                            if (!canAssignPermissions) return;
                            setUserFormData({
                              ...userFormData,
                              permissions: {
                                ...currentPerms,
                                [perm.key]: e.target.checked,
                              },
                            });
                          }}
                          className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                            <span>{perm.icon}</span>
                            <span className="truncate">{perm.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Cadastrar Colaborador</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. MODAL: LANÇAMENTO MANUAL DE PONTO COMPLETO */}
      {/* ========================================================================= */}
      {isManualPontoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-base">
                  {editingPontoRecord ? 'Editar Registro de Ponto' : 'Lançamento de Ponto Manual (RH)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualPontoModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualPonto} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Colaborador *</label>
                <select
                  disabled={!!editingPontoRecord}
                  value={manualPontoForm.userId}
                  onChange={(e) => setManualPontoForm({ ...manualPontoForm, userId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={manualPontoForm.date}
                    onChange={(e) => setManualPontoForm({ ...manualPontoForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status do Dia</label>
                  <select
                    value={manualPontoForm.status}
                    onChange={(e) => setManualPontoForm({ ...manualPontoForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="extra">Horas Extras</option>
                    <option value="atraso">Atraso</option>
                    <option value="folga">Folga / DSR</option>
                    <option value="falta">Falta</option>
                    <option value="justificado">Justificado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Entrada 1</label>
                  <input
                    type="text"
                    placeholder="08:00"
                    value={manualPontoForm.entry1}
                    onChange={(e) => setManualPontoForm({ ...manualPontoForm, entry1: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Saída 1</label>
                  <input
                    type="text"
                    placeholder="12:00"
                    value={manualPontoForm.exit1}
                    onChange={(e) => setManualPontoForm({ ...manualPontoForm, exit1: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Entrada 2</label>
                  <input
                    type="text"
                    placeholder="13:00"
                    value={manualPontoForm.entry2}
                    onChange={(e) => setManualPontoForm({ ...manualPontoForm, entry2: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Saída 2</label>
                  <input
                    type="text"
                    placeholder="17:00"
                    value={manualPontoForm.exit2}
                    onChange={(e) => setManualPontoForm({ ...manualPontoForm, exit2: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações / Motivo do Ajuste</label>
                <input
                  type="text"
                  placeholder="Ex: Esquecimento de batida / Ajuste autorizado"
                  value={manualPontoForm.notes}
                  onChange={(e) => setManualPontoForm({ ...manualPontoForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualPontoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4 text-orange-400" />
                  <span>Salvar Registro de Ponto</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. MODAL: UPLOAD / ANEXAR DOCUMENTO */}
      {/* ========================================================================= */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileUp className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-base">Anexar Documento ao Perfil</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadDocModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Colaborador Destinatário *</label>
                <select
                  value={uploadDocForm.userId}
                  onChange={(e) => setUploadDocForm({ ...uploadDocForm, userId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.position || 'Colaborador'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título do Documento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ASO Periódico 2026, Contrato de Trabalho, CNH"
                  value={uploadDocForm.name}
                  onChange={(e) => setUploadDocForm({ ...uploadDocForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                <select
                  value={uploadDocForm.category}
                  onChange={(e) => setUploadDocForm({ ...uploadDocForm, category: e.target.value as DocumentCategory })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              {/* Real File Input Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selecionar Arquivo (PDF, Imagem ou Documento)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/60 hover:bg-orange-50/30 transition-all"
                >
                  <Upload className="w-6 h-6 mx-auto text-orange-500 mb-1.5" />
                  <span className="text-xs font-bold text-slate-800 block">
                    {uploadDocForm.fileName ? `Arquivo selecionado: ${uploadDocForm.fileName}` : 'Clique para selecionar o arquivo do computador'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {uploadDocForm.fileSize ? `Tamanho: ${uploadDocForm.fileSize}` : 'Suporta PDF, JPG, PNG e DOC'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações do RH</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, validade do certificado ou notas de arquivamento..."
                  value={uploadDocForm.notes}
                  onChange={(e) => setUploadDocForm({ ...uploadDocForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar na Pasta</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 17. MODAL: PRÉ-VISUALIZAÇÃO DE DOCUMENTO */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-base">{previewDoc.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {previewDoc.fileUrl && previewDoc.fileUrl.startsWith('data:image') ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <img src={previewDoc.fileUrl} alt={previewDoc.name} className="w-full h-auto max-h-96 object-contain bg-slate-100" />
                </div>
              ) : (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-orange-500" />
                  <div className="text-sm font-bold text-slate-800">{previewDoc.fileName || 'documento.pdf'}</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {previewDoc.notes || 'Documento autenticado no repositório de Recursos Humanos.'}
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Categoria:</span>
                  <span className="font-bold text-slate-800">{CATEGORY_CONFIG[previewDoc.category]?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Data de Arquivamento:</span>
                  <span>{new Date(previewDoc.uploadDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Tamanho:</span>
                  <span className="font-mono">{previewDoc.fileSize || '350 KB'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 18. MODAL: IMPRESSÃO DO ESPELHO DE PONTO OFICIAL */}
      {/* ========================================================================= */}
      {isPrintMirrorModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-base">Espelho de Ponto Eletrônico &bull; Visualização Oficial</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintMirrorModalOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 bg-white font-sans text-slate-900 printable-area">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {settings.name || 'OperaFácil Provedor de Internet'}
                  </h1>
                  <p className="text-xs font-bold text-slate-600">
                    CNPJ: {settings.cnpj || '00.000.000/0001-00'} &bull; {settings.address || 'Sede Central'}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    ESPELHO DE PONTO ELETRÔNICO INDIVIDUAL &bull; PORTARIA 671 / MTP
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                    MÊS: {MONTH_NAMES[pontoMonth].toUpperCase()} / {pontoYear}
                  </span>
                </div>
              </div>

              {/* Employee Info Block */}
              {(() => {
                const targetEmp = users.find((u) => u.id === printUserId) || users[0];
                const empRecords = timeRecords.filter((r) => {
                  const d = new Date(r.date + 'T00:00:00');
                  return r.userId === targetEmp?.id && d.getMonth() === pontoMonth && d.getFullYear() === pontoYear;
                });

                let totalH = 0;
                empRecords.forEach((r) => { totalH += r.totalHours || 0; });

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Colaborador:</span>
                        <span className="font-extrabold text-slate-900">{targetEmp?.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Matrícula / Código:</span>
                        <span className="font-mono font-bold text-slate-800">{targetEmp?.registrationCode || 'COL-001'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Cargo / Função:</span>
                        <span className="font-bold text-slate-800">{targetEmp?.position || 'Colaborador'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Departamento:</span>
                        <span className="font-bold text-slate-800">{targetEmp?.department || 'Operações'}</span>
                      </div>
                    </div>

                    {/* Table of Punches */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase text-slate-700">
                            <th className="py-2 px-3 border-r border-slate-200">Data</th>
                            <th className="py-2 px-3 border-r border-slate-200">Dia</th>
                            <th className="py-2 px-3 border-r border-slate-200 text-center">Entrada 1</th>
                            <th className="py-2 px-3 border-r border-slate-200 text-center">Saída 1</th>
                            <th className="py-2 px-3 border-r border-slate-200 text-center">Entrada 2</th>
                            <th className="py-2 px-3 border-r border-slate-200 text-center">Saída 2</th>
                            <th className="py-2 px-3 border-r border-slate-200 text-center">Total Horas</th>
                            <th className="py-2 px-3 text-center">Ocorrência / Obs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {empRecords.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400">
                                Nenhum registro de ponto lançado para este colaborador no período.
                              </td>
                            </tr>
                          ) : (
                            empRecords.map((r) => {
                              const d = new Date(r.date + 'T00:00:00');
                              const hasAdj = r.adjustments && r.adjustments.length > 0;
                              return (
                                <tr key={r.id}>
                                  <td className="py-1.5 px-3 border-r border-slate-200 font-bold">{r.date}</td>
                                  <td className="py-1.5 px-3 border-r border-slate-200 uppercase text-[10px] font-semibold text-slate-500">
                                    {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                                  </td>
                                  <td className="py-1.5 px-3 border-r border-slate-200 text-center font-mono">{r.entry1 || '--:--'}</td>
                                  <td className="py-1.5 px-3 border-r border-slate-200 text-center font-mono">{r.exit1 || '--:--'}</td>
                                  <td className="py-1.5 px-3 border-r border-slate-200 text-center font-mono">{r.entry2 || '--:--'}</td>
                                  <td className="py-1.5 px-3 border-r border-slate-200 text-center font-mono">{r.exit2 || '--:--'}</td>
                                  <td className="py-1.5 px-3 border-r border-slate-200 text-center font-bold">{r.totalHours ? `${r.totalHours}h` : '--'}</td>
                                  <td className="py-1.5 px-3 text-center font-semibold text-[10px] uppercase">
                                    {hasAdj ? `${r.status} (Ajustado RH)` : r.status}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures */}
                    <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
                      <div className="border-t border-slate-900 pt-2">
                        <span className="font-bold block">{targetEmp?.name}</span>
                        <span className="text-[10px] text-slate-500">Assinatura do Colaborador</span>
                      </div>
                      <div className="border-t border-slate-900 pt-2">
                        <span className="font-bold block">{settings.name || 'Gerência OperaFácil'}</span>
                        <span className="text-[10px] text-slate-500">Assinatura do Gestor / RH</span>
                      </div>
                    </div>
                  </>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. MODAL: ENQUADRAMENTO / CORTE DE FOTO (ESTILO REDES SOCIAIS) */}
      {/* ========================================================================= */}
      {isCropModalOpen && rawAvatarToCrop && (
        <AvatarCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawAvatarToCrop}
          onClose={() => {
            setIsCropModalOpen(false);
            setRawAvatarToCrop(null);
            if (editUserPhotoInputRef.current) editUserPhotoInputRef.current.value = '';
            if (newUserPhotoInputRef.current) newUserPhotoInputRef.current.value = '';
          }}
          onCropComplete={(croppedUrl) => {
            if (cropTargetIsEdit) {
              setEditingUser((prev) => prev ? { ...prev, avatarUrl: croppedUrl } : null);
            } else {
              setUserFormData((prev) => ({ ...prev, avatarUrl: croppedUrl }));
            }
            setIsCropModalOpen(false);
            setRawAvatarToCrop(null);
            showNotification('Enquadramento da foto aplicado com sucesso!');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 17. MODAL: VISUALIZAR FOTO BIOMÉTRICA & JUSTIFICATIVA (RH) */}
      {/* ========================================================================= */}
      {previewSelfie && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-400" />
                <div>
                  <span className="text-sm font-bold text-white block">{previewSelfie.title}</span>
                  <span className="text-[10px] text-slate-400">Assinatura Biométrica do Colaborador</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSelfie(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Photo */}
              {previewSelfie.url ? (
                <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-slate-800 relative max-w-sm mx-auto shadow-inner">
                  <img
                    src={previewSelfie.url}
                    alt="Selfie Biométrica"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs p-2 rounded-xl text-[10px] border border-white/10 flex justify-between items-center">
                    <span className="font-bold text-white">{previewSelfie.userName}</span>
                    <span className="font-mono text-orange-400">{previewSelfie.date}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-950 rounded-2xl text-center text-slate-400 border border-slate-800">
                  <Camera className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                  <p className="text-xs font-bold text-slate-300">Sem foto selfie anexada</p>
                </div>
              )}

              {/* Justification details if present */}
              {previewSelfie.justification && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-purple-900/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-black text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" /> Justificativa de Falta / Ausência
                    </span>
                    <span className="bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-800">
                      {previewSelfie.justification.isFullDay ? 'Dia Inteiro' : `${previewSelfie.justification.startTime} às ${previewSelfie.justification.endTime}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">Motivo / Descrição:</span>
                    <p className="text-slate-200 bg-slate-900 p-2 rounded-xl border border-slate-800 font-medium">
                      {previewSelfie.justification.reason}
                    </p>
                  </div>

                  {previewSelfie.justification.documentUrl && (
                    <div className="pt-2 flex items-center justify-between bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="font-bold text-slate-200 text-xs truncate">
                          {previewSelfie.justification.documentName || 'Atestado_Medico.pdf'}
                        </span>
                      </div>
                      <a
                        href={previewSelfie.justification.documentUrl}
                        download={previewSelfie.justification.documentName || 'atestado.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* GPS Geolocation details if present */}
              {previewSelfie.geo && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-900/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-black text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Navigation className="w-4 h-4" /> Coordenadas GPS da Batida
                    </span>
                    <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-emerald-800">
                      ±{previewSelfie.geo.accuracy}m Precisão
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="font-mono text-slate-300 text-xs">
                      Lat: <span className="text-white font-bold">{previewSelfie.geo.latitude}</span> | Lng: <span className="text-white font-bold">{previewSelfie.geo.longitude}</span>
                    </div>
                    <a
                      href={previewSelfie.geo.mapUrl || `https://www.google.com/maps?q=${previewSelfie.geo.latitude},${previewSelfie.geo.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Abrir no Google Maps</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Audit Badge */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Assinatura biométrica e geolocalização registradas e auditadas nos termos da Portaria MTE.</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewSelfie(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
