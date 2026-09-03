import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TimeClockPunchType, TimeClockRecord, EmployeeDocument } from '../../types';
import { 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Building2, 
  Radio, 
  Sparkles, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Send, 
  Coffee, 
  LogIn, 
  LogOut, 
  UtensilsCrossed, 
  CreditCard, 
  Mail, 
  Phone, 
  Briefcase, 
  ShieldCheck, 
  QrCode, 
  Edit3, 
  X, 
  Save, 
  HelpCircle,
  Wifi,
  Activity,
  Layers,
  Award,
  Camera,
  FolderLock,
  Eye,
  Check,
  Zap,
  Fingerprint,
  FileCheck,
  CalendarClock,
  Menu
} from 'lucide-react';
import { BiometricSelfieModal } from '../common/BiometricSelfieModal';
import { JustifyAbsenceModal } from './JustifyAbsenceModal';

type ColaboradorTab = 'ponto' | 'folha' | 'documentos' | 'perfil';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  contrato: { label: 'Contrato & Termos', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  pessoal: { label: 'Documentos Pessoais', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  aso_medico: { label: 'ASO / Saúde Ocupacional', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  folha_ponto: { label: 'Folha de Ponto Assinada', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  certificacao: { label: 'Certificação & NRs', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  outros: { label: 'Outros Anexos', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

export const ColaboradorView: React.FC = () => {
  const { 
    currentUser, 
    timeRecords, 
    employeeDocuments,
    punchClock, 
    updateEmployeeProfile, 
    settings, 
    showNotification,
    logout 
  } = useApp();

  const [activeTab, setActiveTab] = useState<ColaboradorTab>('ponto');
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  
  // Ponto Form State
  const [selectedLocation, setSelectedLocation] = useState<string>('Sede Central NOC / Matriz');
  const [punchNotes, setPunchNotes] = useState<string>('');
  const [isSubmittingPunch, setIsSubmittingPunch] = useState<boolean>(false);
  const [recentPunchSuccess, setRecentPunchSuccess] = useState<string | null>(null);

  // Modals
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [targetPunchType, setTargetPunchType] = useState<TimeClockPunchType>('entry1');
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState<boolean>(false);
  const [selectedDateForJustify, setSelectedDateForJustify] = useState<string | undefined>(undefined);
  
  // Preview Modals
  const [previewSelfie, setPreviewSelfie] = useState<{ url: string; title: string; time?: string; location?: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

  // Folha de Ponto Filter State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Perfil Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    pixKey: currentUser?.pixKey || '',
    emergencyContact: currentUser?.emergencyContact || '',
    cnh: currentUser?.cnh || ''
  });

  // Ticking Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update edit form if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditForm({
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        address: currentUser.address || '',
        pixKey: currentUser.pixKey || '',
        emergencyContact: currentUser.emergencyContact || '',
        cnh: currentUser.cnh || ''
      });
    }
  }, [currentUser]);

  // Today's Time Record
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayRecord = useMemo(() => {
    if (!currentUser) return undefined;
    return timeRecords.find((r) => r.userId === currentUser.id && r.date === todayStr);
  }, [timeRecords, currentUser, todayStr]);

  // User's own documents
  const myDocuments = useMemo(() => {
    if (!currentUser) return [];
    return employeeDocuments
      .filter((d) => d.userId === currentUser.id)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [employeeDocuments, currentUser]);

  // Determine the next intelligent punch step
  const nextPunchInfo = useMemo(() => {
    if (!todayRecord?.entry1) {
      return {
        type: 'entry1' as TimeClockPunchType,
        label: 'Bater Entrada',
        sublabel: '1º Turno (Início do Expediente)',
        icon: LogIn,
        color: 'from-orange-500 to-amber-500',
        textColor: 'text-orange-500',
        ringColor: 'ring-orange-500/30'
      };
    }
    if (!todayRecord?.exit1) {
      return {
        type: 'exit1' as TimeClockPunchType,
        label: 'Saída para Almoço',
        sublabel: 'Pausa para Intervalo / Refeição',
        icon: Coffee,
        color: 'from-amber-500 to-yellow-500',
        textColor: 'text-amber-500',
        ringColor: 'ring-amber-500/30'
      };
    }
    if (!todayRecord?.entry2) {
      return {
        type: 'entry2' as TimeClockPunchType,
        label: 'Retorno do Almoço',
        sublabel: '2º Turno (Fim do Intervalo)',
        icon: UtensilsCrossed,
        color: 'from-blue-600 to-indigo-600',
        textColor: 'text-blue-500',
        ringColor: 'ring-blue-500/30'
      };
    }
    if (!todayRecord?.exit2) {
      return {
        type: 'exit2' as TimeClockPunchType,
        label: 'Saída Final',
        sublabel: 'Encerramento do Expediente Diário',
        icon: LogOut,
        color: 'from-emerald-600 to-teal-600',
        textColor: 'text-emerald-500',
        ringColor: 'ring-emerald-500/30'
      };
    }
    return {
      type: 'exit2' as TimeClockPunchType,
      label: 'Jornada Concluída',
      sublabel: 'Todas as 4 batidas de hoje foram registradas',
      icon: CheckCircle2,
      color: 'from-slate-700 to-slate-800',
      textColor: 'text-slate-400',
      ringColor: 'ring-slate-700/30',
      isCompleted: true
    };
  }, [todayRecord]);

  // Handle Opening Biometric Selfie modal for punch
  const handleOpenPunchBiometric = (type: TimeClockPunchType) => {
    setTargetPunchType(type);
    setIsBiometricModalOpen(true);
  };

  // On Selfie Captured -> Submit Punch
  const handleCaptureSelfieAndPunch = (selfieBase64: string) => {
    setIsSubmittingPunch(true);
    setRecentPunchSuccess(null);

    setTimeout(() => {
      const res = punchClock(targetPunchType, selectedLocation, punchNotes, selfieBase64);
      setIsSubmittingPunch(false);
      if (res.success) {
        setPunchNotes('');
        setRecentPunchSuccess(res.message);
        setTimeout(() => setRecentPunchSuccess(null), 6000);
      }
    }, 300);
  };

  // Month Names in Portuguese
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Filtered Timesheet for Selected Month/Year
  const monthRecords = useMemo(() => {
    if (!currentUser) return [];
    
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const result: { dateStr: string; dayNum: number; dayOfWeek: number; dayName: string; record?: TimeClockRecord }[] = [];
    const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = timeRecords.find((r) => r.userId === currentUser.id && r.date === dateStr);
      
      result.push({
        dateStr,
        dayNum: d,
        dayOfWeek: dateObj.getDay(),
        dayName: dayNamesShort[dateObj.getDay()],
        record: rec
      });
    }

    return result;
  }, [timeRecords, currentUser, selectedMonth, selectedYear]);

  // Timesheet KPIs
  const monthlyStats = useMemo(() => {
    let totalWorkedMinutes = 0;
    let daysWorked = 0;
    let extraMinutes = 0;
    let absences = 0;
    let justifiedCount = 0;

    monthRecords.forEach((item) => {
      if (item.record) {
        if (item.record.totalHours) {
          totalWorkedMinutes += Math.round(item.record.totalHours * 60);
          daysWorked += 1;
        }
        if (item.record.extraHours) {
          extraMinutes += Math.round(item.record.extraHours * 60);
        }
        if (item.record.status === 'falta') {
          absences += 1;
        }
        if (item.record.status === 'justificado') {
          justifiedCount += 1;
        }
      }
    });

    const totalHours = Math.round((totalWorkedMinutes / 60) * 10) / 10;
    const totalExtraHours = Math.round((extraMinutes / 60) * 10) / 10;

    return {
      totalHours,
      totalExtraHours,
      daysWorked,
      absences,
      justifiedCount,
      bankBalance: totalExtraHours > 0 ? `+${totalExtraHours}h` : `${totalExtraHours}h`
    };
  }, [monthRecords]);

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateEmployeeProfile(currentUser.id, editForm);
    setIsEditProfileOpen(false);
  };

  // Clock string formatters
  const formattedTime = currentDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentDateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#F8F9FF] text-slate-800 antialiased overflow-hidden select-none">
      
      {/* ========================================================================= */}
      {/* 1. ABA LATERAL ESQUERDA DO COLABORADOR COM BOTÃO DESLOGAR NA PARTE INFERIOR */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        
        {/* Top Section / Navigation Tabs */}
        <div className="p-4 space-y-3">
          
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                CL
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-slate-900 leading-none">Portal do Colaborador</h3>
                <span className="text-[10px] text-slate-400 font-medium">Autoatendimento ISP</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Buttons */}
          <nav className={`space-y-1 ${isMobileNavOpen ? 'block' : 'hidden lg:block'}`}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ponto');
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ponto'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${activeTab === 'ponto' ? 'text-orange-500' : 'text-slate-400'}`} />
                <span>Bater Ponto</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('folha');
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'folha'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className={`w-4 h-4 ${activeTab === 'folha' ? 'text-orange-500' : 'text-slate-400'}`} />
                <span>Folha de Ponto</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('documentos');
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'documentos'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck className={`w-4 h-4 ${activeTab === 'documentos' ? 'text-orange-500' : 'text-slate-400'}`} />
                <span>Meus Documentos</span>
              </div>
              {myDocuments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-300">
                  {myDocuments.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('perfil');
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${activeTab === 'perfil' ? 'text-orange-500' : 'text-slate-400'}`} />
                <span>Meus Dados</span>
              </div>
            </button>
          </nav>

        </div>

        {/* Bottom Area: Collaborator Card & Deslogar Button at the very bottom */}
        <div className={`p-4 border-t border-slate-100 bg-slate-50/80 space-y-2.5 text-xs ${isMobileNavOpen ? 'block' : 'hidden lg:block'}`}>
          {currentUser && (
            <div className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-full overflow-hidden p-0.5 bg-white border border-orange-400 shrink-0">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-700">{currentUser.avatar || '👤'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-black text-slate-900 text-xs block truncate">{currentUser.name}</span>
                <span className="text-[10px] text-orange-600 font-bold block truncate">{currentUser.position || 'Colaborador'}</span>
              </div>
            </div>
          )}

          {/* Deslogar Button */}
          <button
            type="button"
            id="btn-colaborador-logout"
            onClick={() => {
              logout();
            }}
            title="Deslogar do Sistema"
            className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer shadow-2xs group"
          >
            <LogOut className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
            <span className="tracking-wide uppercase">Deslogar</span>
          </button>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 2. ÁREA DE CONTEÚDO PRINCIPAL (CLARA & ELEGANTE) */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ======================================================================= */}
        {/* TAB 1: BATER PONTO ELETRÔNICO COM BIOMETRIA & DESIGN LÚDICO */}
        {/* ======================================================================= */}
        {activeTab === 'ponto' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto">
            
            {/* Top Clock Display Card with Action Buttons */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-orange-400 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-extrabold shadow-xs">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-white" />
                  <span>Relógio Oficial Sincronizado (Horário de Brasília)</span>
                </div>

                <div className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
                  {formattedTime}
                </div>

                <p className="text-xs sm:text-sm text-orange-100 font-bold capitalize">
                  {formattedDate}
                </p>
              </div>

              {/* Status Indicator & Justify CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col justify-between min-w-[220px] text-white">
                  <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider">Status Hoje</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3 h-3 rounded-full ${
                      todayRecord?.exit2 
                        ? 'bg-slate-300' 
                        : todayRecord?.entry1 
                        ? 'bg-emerald-300 animate-pulse' 
                        : 'bg-white'
                    }`} />
                    <span className="font-black text-sm sm:text-base text-white">
                      {todayRecord?.exit2
                        ? 'Jornada Encerrada'
                        : todayRecord?.entry2
                        ? 'Trabalhando (2º Turno)'
                        : todayRecord?.exit1
                        ? 'Intervalo de Almoço'
                        : todayRecord?.entry1
                        ? 'Trabalhando (1º Turno)'
                        : 'Aguardando Entrada'}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-orange-100">
                    <span>Horas Hoje:</span>
                    <span className="font-mono font-black text-white">{todayRecord?.totalHours ? `${todayRecord.totalHours}h` : '0.0h'}</span>
                  </div>
                </div>

                {/* Justify Absence Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateForJustify(todayStr);
                    setIsJustifyModalOpen(true);
                  }}
                  className="px-5 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-md group cursor-pointer text-white"
                >
                  <CalendarClock className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black text-white">Justificar Falta</span>
                  <span className="text-[10px] text-orange-100 font-medium">Anexar atestado / horas</span>
                </button>
              </div>
            </div>

            {/* Notification Banner when punch succeeded */}
            {recentPunchSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm animate-in slide-in-from-top duration-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">{recentPunchSuccess}</span>
              </div>
            )}

            {/* ================================================================= */}
            {/* PLAYFUL 3D BIOMETRIC SUPER BUTTON */}
            {/* ================================================================= */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden space-y-6">
              
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
                  <Fingerprint className="w-4 h-4 text-orange-600 animate-pulse" />
                  <span>Assinatura Biométrica Inteligente por Selfie</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {nextPunchInfo.isCompleted ? 'Parabéns! Jornada de Hoje Concluída' : `Pronto para ${nextPunchInfo.label}?`}
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {nextPunchInfo.sublabel}. Ao clicar, a câmera frontal registrará sua foto biométrica com timestamp oficial.
                </p>
              </div>

              {/* The Big Glowing 3D Button */}
              <div className="relative flex items-center justify-center py-4">
                {/* Outer pulsing ring */}
                {!nextPunchInfo.isCompleted && (
                  <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-orange-500/15 animate-ping pointer-events-none" />
                )}
                
                <button
                  type="button"
                  disabled={isSubmittingPunch || nextPunchInfo.isCompleted}
                  onClick={() => handleOpenPunchBiometric(nextPunchInfo.type)}
                  className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr ${nextPunchInfo.color} p-2 shadow-2xl transition-all transform active:scale-95 hover:scale-105 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group border-4 border-white`}
                >
                  <div className="w-full h-full rounded-full bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1">
                    <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md group-hover:scale-110 transition-transform animate-bounce" />
                    <span className="font-black text-xs sm:text-sm tracking-tight drop-shadow-md">
                      {nextPunchInfo.isCompleted ? 'Concluído' : 'BATER PONTO'}
                    </span>
                    <span className="text-[10px] font-mono text-orange-200 font-bold">
                      📸 Selfie
                    </span>
                  </div>
                </button>
              </div>

              {/* Progress Tracker / Journey Steps */}
              <div className="w-full max-w-3xl pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Step 1: Entrada */}
                  <div 
                    onClick={() => !todayRecord?.entry1 && handleOpenPunchBiometric('entry1')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      todayRecord?.entry1 
                        ? 'bg-emerald-50 border-emerald-200 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <LogIn className={`w-4 h-4 ${todayRecord?.entry1 ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">1º Turno</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 block">Entrada</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {todayRecord?.entry1 || '--:--'}
                      </span>
                      {todayRecord?.selfies?.entry1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSelfie({
                              url: todayRecord.selfies!.entry1!,
                              title: 'Selfie Biométrica — Entrada',
                              time: todayRecord.entry1,
                              location: todayRecord.location
                            });
                          }}
                          className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" /> Foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Saída Almoço */}
                  <div 
                    onClick={() => todayRecord?.entry1 && !todayRecord?.exit1 && handleOpenPunchBiometric('exit1')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      todayRecord?.exit1 
                        ? 'bg-emerald-50 border-emerald-200 shadow-xs' 
                        : todayRecord?.entry1
                        ? 'bg-slate-50 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Coffee className={`w-4 h-4 ${todayRecord?.exit1 ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Pausa</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 block">Saída Almoço</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {todayRecord?.exit1 || '--:--'}
                      </span>
                      {todayRecord?.selfies?.exit1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSelfie({
                              url: todayRecord.selfies!.exit1!,
                              title: 'Selfie Biométrica — Saída Almoço',
                              time: todayRecord.exit1,
                              location: todayRecord.location
                            });
                          }}
                          className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" /> Foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Retorno Almoço */}
                  <div 
                    onClick={() => todayRecord?.exit1 && !todayRecord?.entry2 && handleOpenPunchBiometric('entry2')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      todayRecord?.entry2 
                        ? 'bg-emerald-50 border-emerald-200 shadow-xs' 
                        : todayRecord?.exit1
                        ? 'bg-slate-50 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <UtensilsCrossed className={`w-4 h-4 ${todayRecord?.entry2 ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">2º Turno</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 block">Retorno Almoço</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {todayRecord?.entry2 || '--:--'}
                      </span>
                      {todayRecord?.selfies?.entry2 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSelfie({
                              url: todayRecord.selfies!.entry2!,
                              title: 'Selfie Biométrica — Retorno Almoço',
                              time: todayRecord.entry2,
                              location: todayRecord.location
                            });
                          }}
                          className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" /> Foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Saída Final */}
                  <div 
                    onClick={() => todayRecord?.entry2 && !todayRecord?.exit2 && handleOpenPunchBiometric('exit2')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      todayRecord?.exit2 
                        ? 'bg-emerald-50 border-emerald-200 shadow-xs' 
                        : todayRecord?.entry2
                        ? 'bg-slate-50 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <LogOut className={`w-4 h-4 ${todayRecord?.exit2 ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Encerramento</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 block">Saída Final</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {todayRecord?.exit2 || '--:--'}
                      </span>
                      {todayRecord?.selfies?.exit2 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSelfie({
                              url: todayRecord.selfies!.exit2!,
                              title: 'Selfie Biométrica — Saída Final',
                              time: todayRecord.exit2,
                              location: todayRecord.location
                            });
                          }}
                          className="text-[10px] text-orange-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" /> Foto
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Location & Notes Configuration Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>Localização do Ponto & Informações Adicionais</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Posto / Local da Batida:
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Sede Central NOC / Matriz">🏢 Sede Central NOC / Matriz</option>
                    <option value="Trabalho Externo / Campo (Fibra Óptica)">🚗 Trabalho Externo / Campo (Fibra Óptica)</option>
                    <option value="POP Central de Distribuição">📡 POP Central de Distribuição</option>
                    <option value="Home Office / Suporte Remoto">🏠 Home Office / Suporte Remoto</option>
                    <option value="Atendimento em Cliente Corporativo">🤝 Atendimento em Cliente Corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Observação ou Justificativa da Batida (Opcional):
                  </label>
                  <input
                    type="text"
                    value={punchNotes}
                    onChange={(e) => setPunchNotes(e.target.value)}
                    placeholder="Ex: Troca de rota no POP Central, retorno de OS de fibra..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Autenticação digital biométrica com foto • Registro criptografado nos termos da Portaria MTE</span>
                </div>
                <span className="font-mono text-slate-400">IP: 187.94.120.45 • OperaFácil Conexão ISP</span>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: FOLHA DE PONTO / ESPELHO MENSAL */}
        {/* ======================================================================= */}
        {activeTab === 'folha' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto">
            
            {/* Header Controls */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <span>Espelho de Ponto Mensal</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulte os registros diários, fotos biométricas e justificativas aprovadas pelo RH.
                </p>
              </div>

              {/* Month / Year Selectors + Print CTA */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsJustifyModalOpen(true)}
                  className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarClock className="w-4 h-4 text-orange-600" />
                  <span>Justificar Falta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span>Imprimir Folha</span>
                </button>
              </div>
            </div>

            {/* Monthly KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Horas Trabalhadas</span>
                <div className="font-mono text-2xl font-black text-slate-900 mt-1">
                  {monthlyStats.totalHours}h
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">No mês selecionado</span>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Horas Extras</span>
                <div className="font-mono text-2xl font-black text-orange-600 mt-1">
                  +{monthlyStats.totalExtraHours}h
                </div>
                <span className="text-[11px] text-orange-700/80 mt-0.5 block">Adicional 50%/100%</span>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Banco de Horas</span>
                <div className="font-mono text-2xl font-black text-emerald-600 mt-1">
                  {monthlyStats.bankBalance}
                </div>
                <span className="text-[11px] text-emerald-700/80 mt-0.5 block">Saldo positivo</span>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dias Trabalhados</span>
                <div className="font-mono text-2xl font-black text-slate-900 mt-1">
                  {monthlyStats.daysWorked} dias
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {monthlyStats.justifiedCount > 0 ? `${monthlyStats.justifiedCount} justificada(s)` : `${monthlyStats.absences} falta(s)`}
                </span>
              </div>
            </div>

            {/* Timesheet Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Registros Detalhados — {monthNames[selectedMonth]} de {selectedYear}
                </h3>
                <span className="text-xs text-slate-500">Escala: 08:00 às 17:00 (1h Almoço)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Data / Dia</th>
                      <th className="py-3 px-3 text-center">Entrada 1</th>
                      <th className="py-3 px-3 text-center">Saída 1</th>
                      <th className="py-3 px-3 text-center">Entrada 2</th>
                      <th className="py-3 px-3 text-center">Saída 2</th>
                      <th className="py-3 px-4 text-center">Total</th>
                      <th className="py-3 px-3 text-center">Saldo</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Biometria</th>
                      <th className="py-3 px-4">Ocorrência / Justificativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthRecords.map((item) => {
                      const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6;
                      const isToday = item.dateStr === todayStr;
                      const hasSelfies = item.record?.selfies && Object.keys(item.record.selfies).length > 0;
                      const hasJustification = Boolean(item.record?.justification);

                      return (
                        <tr 
                          key={item.dateStr}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isToday ? 'bg-orange-50/40 font-semibold' : isWeekend ? 'bg-slate-50/40 text-slate-500' : ''
                          }`}
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                                isToday ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {item.dayNum}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900">{item.dayName}</span>
                                <span className="text-[10px] text-slate-400 block">{item.dateStr}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {item.record?.entry1 || '--:--'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {item.record?.exit1 || '--:--'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {item.record?.entry2 || '--:--'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {item.record?.exit2 || '--:--'}
                          </td>

                          <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                            {item.record?.totalHours ? `${item.record.totalHours}h` : '--'}
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {item.record?.extraHours && item.record.extraHours > 0 ? (
                              <span className="text-orange-600">+{item.record.extraHours}h</span>
                            ) : item.record?.extraHours && item.record.extraHours < 0 ? (
                              <span className="text-rose-600">{item.record.extraHours}h</span>
                            ) : (
                              <span className="text-slate-400">0.0h</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-center">
                            {item.record?.status === 'justificado' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Justificado
                              </span>
                            ) : item.record?.status === 'folga' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Folga / DSR
                              </span>
                            ) : item.record?.status === 'extra' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                Hora Extra
                              </span>
                            ) : item.record?.entry1 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Regular
                              </span>
                            ) : isWeekend ? (
                              <span className="text-slate-400 text-[10px]">Fim de Semana</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Sem Registro</span>
                            )}
                          </td>

                          {/* Biometria Snapshot Icon */}
                          <td className="py-2.5 px-3 text-center">
                            {hasSelfies ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const sUrl = item.record?.selfies?.entry1 || item.record?.selfies?.justification || Object.values(item.record?.selfies || {})[0];
                                  if (sUrl) {
                                    setPreviewSelfie({
                                      url: sUrl,
                                      title: `Selfie Biométrica — ${item.dateStr}`,
                                      time: item.record?.entry1 || 'Registrado',
                                      location: item.record?.location
                                    });
                                  }
                                }}
                                className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer"
                                title="Visualizar Foto da Batida"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-slate-600">
                            <span className="truncate block max-w-xs text-[11px]" title={item.record?.notes || item.record?.location}>
                              {item.record?.notes || item.record?.location || (
                                !isWeekend && !item.record?.entry1 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDateForJustify(item.dateStr);
                                      setIsJustifyModalOpen(true);
                                    }}
                                    className="text-[10px] text-orange-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    + Justificar este dia
                                  </button>
                                ) : '—'
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: MEUS DOCUMENTOS (CONTRATOS, ASO, TERMOS, CERTIFICADOS) */}
        {/* ======================================================================= */}
        {activeTab === 'documentos' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto">
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-orange-500" />
                  <span>Meus Documentos Oficiais</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulte e baixe seus contratos de trabalho, atestados ocupacionais (ASO), termos de EPI e certificados.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                Total Arquivado: <strong className="text-orange-600 font-mono">{myDocuments.length}</strong> documento(s)
              </div>
            </div>

            {/* Documents Grid */}
            {myDocuments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
                <FolderLock className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-800">
                  Nenhum documento arquivado na sua pasta ainda
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Os documentos de admissão, termos de cautela, certificados NR e atestados médicos cadastrados pelo RH ficarão disponíveis aqui para download e visualização.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDocuments.map((doc) => {
                  const catCfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.outros;

                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100">
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
                            {doc.notes || 'Documento oficial arquivado na pasta digital do colaborador.'}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 space-y-1 text-[11px] text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Arquivo:</span>
                            <span className="font-mono text-slate-700 font-bold truncate max-w-[150px]">{doc.fileName || 'documento.pdf'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Tamanho:</span>
                            <span className="font-mono text-slate-500">{doc.fileSize || '350 KB'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Data de Envio:</span>
                            <span>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
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
                          title="Baixar Documento"
                          onClick={() => {
                            if (doc.fileUrl) {
                              const a = document.createElement('a');
                              a.href = doc.fileUrl;
                              a.download = doc.fileName || `${doc.name}.pdf`;
                              a.click();
                            } else {
                              showNotification(`Download do documento "${doc.name}" iniciado.`);
                            }
                          }}
                          className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl transition-colors cursor-pointer border border-orange-200"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: MEUS DADOS & CADASTRO DO COLABORADOR */}
        {/* ======================================================================= */}
        {activeTab === 'perfil' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto">
            
            {/* Header with edit trigger */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <span>Ficha Cadastral do Colaborador</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dados de contrato, benefícios, escala e informações pessoais registradas no provedor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Atualizar Meus Contatos</span>
              </button>
            </div>

            {/* Digital Badge + Dossier Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Crachá Digital */}
              <div className="lg:col-span-4">
                <div className="bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-1.5 bg-orange-500 rounded-full mb-1" />
                  
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    CRACHÁ DE IDENTIFICAÇÃO DIGITAL
                  </span>

                  <div className="w-24 h-24 rounded-3xl bg-slate-800 border-4 border-orange-500/40 p-1 shadow-2xl relative overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {currentUser?.avatar || '👤'}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-white">{currentUser?.name}</h3>
                    <p className="text-xs text-orange-400 font-bold">{currentUser?.position || 'Técnico de Redes'}</p>
                    <p className="text-[11px] text-slate-400">{currentUser?.department || 'Operações ISP'}</p>
                  </div>

                  <div className="w-full bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 space-y-1.5 text-xs text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Matrícula:</span>
                      <span className="font-mono font-bold text-white">{currentUser?.registrationCode || 'COL-0428'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Admissão:</span>
                      <span className="font-bold text-white">{currentUser?.admissionDate || '01/03/2024'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipo Sanguíneo:</span>
                      <span className="font-bold text-orange-400">{currentUser?.bloodType || 'O+'}</span>
                    </div>
                  </div>

                  {/* QR Code / Barcode simulation */}
                  <div className="w-full bg-white p-3 rounded-2xl flex items-center justify-center gap-3">
                    <QrCode className="w-12 h-12 text-slate-900 shrink-0" />
                    <div className="text-left text-[10px] text-slate-800 leading-tight">
                      <p className="font-bold uppercase tracking-wider">{settings.name || 'OperaFácil'}</p>
                      <p className="text-slate-500 font-mono">ID: {currentUser?.id}</p>
                      <p className="text-emerald-700 font-bold">VÍNCULO ATIVO</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Information Cards */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* 1. Dados Pessoais & Documentos */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <ShieldCheck className="w-4 h-4 text-orange-500" />
                    <span>Dados Pessoais & Documentação</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Nome Completo</span>
                      <span className="font-bold text-slate-800 text-sm">{currentUser?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">CPF</span>
                      <span className="font-mono font-bold text-slate-800">{currentUser?.cpf || '333.444.555-66'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">RG</span>
                      <span className="font-mono font-bold text-slate-800">{currentUser?.rg || '34.567.890-1'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">CNH (Habilitação para Campo)</span>
                      <span className="font-mono font-bold text-slate-800">{currentUser?.cnh || 'Cat. B - 55443322110'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Contrato & Escala */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                    <span>Dados Profissionais & Escala de Trabalho</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Departamento</span>
                      <span className="font-bold text-slate-800">{currentUser?.department || 'Suporte Técnico & Redes'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Cargo</span>
                      <span className="font-bold text-slate-800">{currentUser?.position || 'Analista N1'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Jornada & Escala</span>
                      <span className="font-bold text-slate-800">{currentUser?.workSchedule || 'Segunda a Sexta: 08:00 às 17:00 (12:00 às 13:00 Almoço)'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Contatos & Dados Bancários */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span>Contatos, Endereço & Pagamento</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">E-mail Corporativo</span>
                      <span className="font-bold text-slate-800">{currentUser?.email || 'colaborador@provedor.net'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Telefone / WhatsApp</span>
                      <span className="font-bold text-slate-800">{currentUser?.phone || '(11) 98765-2002'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Chave PIX para Depósito</span>
                      <span className="font-mono font-bold text-slate-800">{currentUser?.pixKey || '333.444.555-66'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Conta Bancária</span>
                      <span className="font-mono font-bold text-slate-800">{currentUser?.bankInfo || 'Nubank - Ag 0001 Conta 12345678-9'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Endereço Residencial</span>
                      <span className="font-bold text-slate-800">{currentUser?.address || 'Rua das Flores, 88 - Bairro Central'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px] font-bold uppercase">Contato de Emergência</span>
                      <span className="font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 inline-block">
                        {currentUser?.emergencyContact || 'Marcos (Mãe) - (11) 96666-5555'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL: BIOMETRIC SELFIE CAMERA */}
      {/* ========================================================================= */}
      {isBiometricModalOpen && currentUser && (
        <BiometricSelfieModal
          isOpen={isBiometricModalOpen}
          onClose={() => setIsBiometricModalOpen(false)}
          onCapture={handleCaptureSelfieAndPunch}
          title="Assinatura Biométrica por Selfie"
          subtitle="Posicione seu rosto dentro do enquadramento e tire a selfie para validar sua identidade na batida de ponto."
          employeeName={currentUser.name}
          employeeCode={currentUser.registrationCode || 'COL-001'}
          locationName={selectedLocation}
          actionTypeLabel={
            targetPunchType === 'entry1' ? 'Entrada (1º Turno)' :
            targetPunchType === 'exit1' ? 'Saída Almoço' :
            targetPunchType === 'entry2' ? 'Retorno Almoço' : 'Saída Final'
          }
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: JUSTIFY ABSENCE */}
      {/* ========================================================================= */}
      {isJustifyModalOpen && (
        <JustifyAbsenceModal
          isOpen={isJustifyModalOpen}
          onClose={() => {
            setIsJustifyModalOpen(false);
            setSelectedDateForJustify(undefined);
          }}
          initialDate={selectedDateForJustify}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW SELFIE SNAPSHOT */}
      {/* ========================================================================= */}
      {previewSelfie && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-white">{previewSelfie.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSelfie(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
                <img
                  src={previewSelfie.url}
                  alt="Selfie Biométrica"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Horário:</span>
                  <span className="font-mono font-bold text-white">{previewSelfie.time || '—'}</span>
                </div>
                {previewSelfie.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local:</span>
                    <span className="font-semibold text-orange-300 truncate max-w-[200px]">{previewSelfie.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Biometria verificada e vinculada ao espelho de ponto</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewSelfie(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW DOCUMENT */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-sm truncate max-w-md">{previewDoc.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Categoria:</span>
                  <span className="font-bold text-orange-600 uppercase">{CATEGORY_CONFIG[previewDoc.category]?.label || previewDoc.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Arquivo:</span>
                  <span className="font-mono text-slate-800">{previewDoc.fileName || 'documento.pdf'} ({previewDoc.fileSize || '350 KB'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Data de Envio:</span>
                  <span>{new Date(previewDoc.uploadDate).toLocaleDateString('pt-BR')}</span>
                </div>
                {previewDoc.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-500 block mb-0.5">Observações:</span>
                    <p className="text-slate-700 italic">{previewDoc.notes}</p>
                  </div>
                )}
              </div>

              {previewDoc.fileUrl ? (
                previewDoc.fileUrl.startsWith('data:image/') ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 flex items-center justify-center bg-slate-900">
                    <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-h-96 object-contain" />
                  </div>
                ) : (
                  <iframe src={previewDoc.fileUrl} title={previewDoc.name} className="w-full h-80 border border-slate-200 rounded-2xl" />
                )
              ) : (
                <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-400 border border-dashed border-slate-300">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-600">Documento Oficial Arquivado no RH</p>
                  <p className="text-[11px] mt-1">O arquivo físico e digital está autenticado nos registros internos da empresa.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>

              {previewDoc.fileUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewDoc.fileUrl!;
                    a.download = previewDoc.fileName || `${previewDoc.name}.pdf`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ATUALIZAR CONTATOS DO PERFIL */}
      {/* ========================================================================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-base">Atualizar Meus Contatos</h3>
                  <p className="text-xs text-slate-400">Mantenha seus dados sempre atualizados no sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail de Contato:</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço Residencial:</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chave PIX:</label>
                  <input
                    type="text"
                    value={editForm.pixKey}
                    onChange={(e) => setEditForm({ ...editForm, pixKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNH (Se houver):</label>
                  <input
                    type="text"
                    value={editForm.cnh}
                    onChange={(e) => setEditForm({ ...editForm, cnh: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contato de Emergência:</label>
                <input
                  type="text"
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                  placeholder="Nome do parente e telefone..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IMPRESSÃO DA FOLHA DE PONTO / ESPELHO OFICIAL */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-orange-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Folha de Ponto Mensal — Impressão Oficial</h3>
                  <p className="text-xs text-slate-400">{currentUser?.name} • {monthNames[selectedMonth]}/{selectedYear}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-900 text-xs font-sans">
              
              {/* Header Document */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">{settings.name || 'OperaFácil ERP'}</h2>
                  <p className="text-[11px] text-slate-600">CNPJ: {settings.cnpj} • {settings.address}</p>
                  <p className="text-[11px] text-slate-600 font-bold mt-1">ESPELHO DE PONTO ELETRÔNICO — PORTARIA MTE</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm block">{monthNames[selectedMonth]} / {selectedYear}</span>
                  <span className="text-[11px] text-slate-500">Emitido em: {new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Employee Summary Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Colaborador:</span>
                  <span className="font-bold text-slate-900">{currentUser?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Matrícula:</span>
                  <span className="font-mono font-bold text-slate-900">{currentUser?.registrationCode || 'COL-0428'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cargo:</span>
                  <span className="font-bold text-slate-900">{currentUser?.position}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Departamento:</span>
                  <span className="font-bold text-slate-900">{currentUser?.department}</span>
                </div>
              </div>

              {/* Printable Table */}
              <table className="w-full border border-slate-300 text-center text-[11px]">
                <thead>
                  <tr className="bg-slate-200 font-bold text-slate-800">
                    <th className="border border-slate-300 py-1.5 px-2">Dia</th>
                    <th className="border border-slate-300 py-1.5 px-2">Sem</th>
                    <th className="border border-slate-300 py-1.5 px-2">Entrada 1</th>
                    <th className="border border-slate-300 py-1.5 px-2">Saída 1</th>
                    <th className="border border-slate-300 py-1.5 px-2">Entrada 2</th>
                    <th className="border border-slate-300 py-1.5 px-2">Saída 2</th>
                    <th className="border border-slate-300 py-1.5 px-2">Total</th>
                    <th className="border border-slate-300 py-1.5 px-2">Saldo Extra</th>
                    <th className="border border-slate-300 py-1.5 px-2">Ocorrência / Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRecords.map((m) => (
                    <tr key={m.dateStr} className={m.dayOfWeek === 0 || m.dayOfWeek === 6 ? 'bg-slate-50 text-slate-500' : ''}>
                      <td className="border border-slate-300 py-1 font-bold">{m.dayNum}</td>
                      <td className="border border-slate-300 py-1">{m.dayName}</td>
                      <td className="border border-slate-300 py-1 font-mono">{m.record?.entry1 || '—'}</td>
                      <td className="border border-slate-300 py-1 font-mono">{m.record?.exit1 || '—'}</td>
                      <td className="border border-slate-300 py-1 font-mono">{m.record?.entry2 || '—'}</td>
                      <td className="border border-slate-300 py-1 font-mono">{m.record?.exit2 || '—'}</td>
                      <td className="border border-slate-300 py-1 font-mono font-bold">{m.record?.totalHours ? `${m.record.totalHours}h` : '—'}</td>
                      <td className="border border-slate-300 py-1 font-mono">{m.record?.extraHours ? `+${m.record.extraHours}h` : '—'}</td>
                      <td className="border border-slate-300 py-1 text-left px-2 text-[10px]">{m.record?.notes || m.record?.status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-200">
                <div className="space-y-1 text-xs">
                  <p><strong>Total Horas Trabalhadas:</strong> {monthlyStats.totalHours}h</p>
                  <p><strong>Total Horas Extras:</strong> +{monthlyStats.totalExtraHours}h</p>
                  <p><strong>Dias Efetivos:</strong> {monthlyStats.daysWorked} dias</p>
                </div>
                
                <div className="pt-8 text-center border-t border-slate-400 mt-6">
                  <p className="font-bold text-xs">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500">Assinatura do Colaborador</p>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Agora</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
