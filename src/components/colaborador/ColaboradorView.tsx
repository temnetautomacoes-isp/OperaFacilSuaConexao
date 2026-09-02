import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TimeClockPunchType, TimeClockRecord } from '../../types';
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
  Award
} from 'lucide-react';

type ColaboradorTab = 'ponto' | 'folha' | 'perfil';

export const ColaboradorView: React.FC = () => {
  const { 
    currentUser, 
    timeRecords, 
    punchClock, 
    updateEmployeeProfile, 
    settings, 
    showNotification 
  } = useApp();

  const [activeTab, setActiveTab] = useState<ColaboradorTab>('ponto');
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  
  // Ponto Form State
  const [selectedLocation, setSelectedLocation] = useState<string>('Sede Central NOC / Matriz');
  const [punchNotes, setPunchNotes] = useState<string>('');
  const [isSubmittingPunch, setIsSubmittingPunch] = useState<boolean>(false);
  const [recentPunchSuccess, setRecentPunchSuccess] = useState<string | null>(null);

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

  // Handle Clock Punch
  const handlePunch = (type: TimeClockPunchType) => {
    setIsSubmittingPunch(true);
    setRecentPunchSuccess(null);

    setTimeout(() => {
      const res = punchClock(type, selectedLocation, punchNotes);
      setIsSubmittingPunch(false);
      if (res.success) {
        setPunchNotes('');
        setRecentPunchSuccess(res.message);
        setTimeout(() => setRecentPunchSuccess(null), 5000);
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
    
    // Generate all calendar days for the selected month
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
      }
    });

    const totalHours = Math.round((totalWorkedMinutes / 60) * 10) / 10;
    const totalExtraHours = Math.round((extraMinutes / 60) * 10) / 10;

    return {
      totalHours,
      totalExtraHours,
      daysWorked,
      absences,
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
    <div className="flex-1 flex flex-col bg-slate-100 overflow-y-auto antialiased">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER & TAB SWITCHER */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white px-4 sm:px-8 pt-6 pb-5 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Employee Welcome Card */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-orange-500 overflow-hidden shadow-md flex items-center justify-center shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{currentUser?.avatar || '👤'}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-xs" title="Online" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentUser?.name || 'Colaborador Provedor'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500 text-white tracking-wider shadow-xs">
                  {currentUser?.registrationCode || 'COL-0428'}
                </span>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                <span>{currentUser?.position || 'Analista de Suporte e Redes'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-orange-300 font-bold">{currentUser?.department || 'Operações ISP'}</span>
              </p>
            </div>
          </div>

          {/* Subheader Modern Tabs */}
          <div className="flex items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 shadow-inner self-start md:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('ponto')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'ponto'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Bater Ponto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('folha')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'folha'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Folha de Ponto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('perfil')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Meus Dados</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ======================================================================= */}
        {/* TAB 1: BATER PONTO ELETRÔNICO */}
        {/* ======================================================================= */}
        {activeTab === 'ponto' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Clock Display Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-1.5 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-orange-400 text-xs font-bold shadow-xs">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Relógio Oficial Sincronizado (Horário de Brasília)</span>
                </div>

                <div className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
                  {formattedTime}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-medium capitalize">
                  {formattedDate}
                </p>
              </div>

              {/* Status Indicator for Today */}
              <div className="bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-700 relative z-10 flex flex-col justify-between min-w-[240px]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status da Jornada Hoje</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-3 h-3 rounded-full ${
                    todayRecord?.exit2 
                      ? 'bg-slate-400' 
                      : todayRecord?.entry1 
                      ? 'bg-emerald-500 animate-pulse' 
                      : 'bg-orange-500'
                  }`} />
                  <span className="font-bold text-base text-white">
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

                <div className="mt-3 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
                  <span>Horas Hoje:</span>
                  <span className="font-mono font-bold text-orange-400">{todayRecord?.totalHours ? `${todayRecord.totalHours}h` : '0.0h'}</span>
                </div>
              </div>
            </div>

            {/* Notification Banner when punch succeeded */}
            {recentPunchSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-bold">{recentPunchSuccess}</span>
              </div>
            )}

            {/* 4 Clock-In Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Entrada (Início) */}
              <div className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                todayRecord?.entry1 
                  ? 'bg-slate-50 border-slate-200 shadow-sm' 
                  : 'bg-white border-orange-200 shadow-md ring-2 ring-orange-500/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-2xl ${
                    todayRecord?.entry1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    <LogIn className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">1º Período</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-slate-900">Entrada</h3>
                  <p className="text-xs text-slate-500">Início do expediente</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="font-mono font-bold text-sm text-slate-700">
                    {todayRecord?.entry1 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {todayRecord.entry1} ✅
                      </span>
                    ) : (
                      <span className="text-slate-400">--:--</span>
                    )}
                  </div>

                  {!todayRecord?.entry1 && (
                    <button
                      type="button"
                      disabled={isSubmittingPunch}
                      onClick={() => handlePunch('entry1')}
                      className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      Bater Entrada
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Saída Almoço */}
              <div className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                todayRecord?.exit1 
                  ? 'bg-slate-50 border-slate-200 shadow-sm' 
                  : todayRecord?.entry1
                  ? 'bg-white border-orange-200 shadow-md ring-2 ring-orange-500/20'
                  : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-2xl ${
                    todayRecord?.exit1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    <Coffee className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pausa</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-slate-900">Saída Almoço</h3>
                  <p className="text-xs text-slate-500">Início do intervalo</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="font-mono font-bold text-sm text-slate-700">
                    {todayRecord?.exit1 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {todayRecord.exit1} ✅
                      </span>
                    ) : (
                      <span className="text-slate-400">--:--</span>
                    )}
                  </div>

                  {todayRecord?.entry1 && !todayRecord?.exit1 && (
                    <button
                      type="button"
                      disabled={isSubmittingPunch}
                      onClick={() => handlePunch('exit1')}
                      className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      Bater Saída
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Retorno Almoço */}
              <div className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                todayRecord?.entry2 
                  ? 'bg-slate-50 border-slate-200 shadow-sm' 
                  : todayRecord?.exit1
                  ? 'bg-white border-orange-200 shadow-md ring-2 ring-orange-500/20'
                  : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-2xl ${
                    todayRecord?.entry2 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">2º Período</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-slate-900">Retorno Almoço</h3>
                  <p className="text-xs text-slate-500">Fim do intervalo</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="font-mono font-bold text-sm text-slate-700">
                    {todayRecord?.entry2 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {todayRecord.entry2} ✅
                      </span>
                    ) : (
                      <span className="text-slate-400">--:--</span>
                    )}
                  </div>

                  {todayRecord?.exit1 && !todayRecord?.entry2 && (
                    <button
                      type="button"
                      disabled={isSubmittingPunch}
                      onClick={() => handlePunch('entry2')}
                      className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      Bater Retorno
                    </button>
                  )}
                </div>
              </div>

              {/* Card 4: Saída (Fim) */}
              <div className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                todayRecord?.exit2 
                  ? 'bg-slate-50 border-slate-200 shadow-sm' 
                  : todayRecord?.entry2
                  ? 'bg-white border-orange-200 shadow-md ring-2 ring-orange-500/20'
                  : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-2xl ${
                    todayRecord?.exit2 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Encerramento</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-slate-900">Saída Final</h3>
                  <p className="text-xs text-slate-500">Fim do expediente diário</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="font-mono font-bold text-sm text-slate-700">
                    {todayRecord?.exit2 ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {todayRecord.exit2} ✅
                      </span>
                    ) : (
                      <span className="text-slate-400">--:--</span>
                    )}
                  </div>

                  {todayRecord?.entry2 && !todayRecord?.exit2 && (
                    <button
                      type="button"
                      disabled={isSubmittingPunch}
                      onClick={() => handlePunch('exit2')}
                      className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      Bater Saída
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Location & Justifications Card */}
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
                    Observação ou Justificativa (Opcional):
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
                  <span>Autenticação digital segura • Registro criptografado nos termos da Portaria MTE</span>
                </div>
                <span className="font-mono text-slate-400">IP: 187.94.120.45 • Provedor ISP Fibra</span>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: FOLHA DE PONTO / ESPELHO MENSAL */}
        {/* ======================================================================= */}
        {activeTab === 'folha' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header Controls */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <span>Espelho de Ponto Mensal</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulte os registros diários, saldo de horas e banco de horas acumulado.
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
                <span className="text-[11px] text-slate-400 mt-0.5 block">{monthlyStats.absences} falta(s)</span>
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
                      <th className="py-3 px-3 text-center">Total Horas</th>
                      <th className="py-3 px-3 text-center">Saldo</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Local / Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthRecords.map((item) => {
                      const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6;
                      const isToday = item.dateStr === todayStr;

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

                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
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
                            {item.record?.status === 'folga' ? (
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

                          <td className="py-2.5 px-4 text-slate-600">
                            <span className="truncate block max-w-xs text-[11px]" title={item.record?.notes || item.record?.location}>
                              {item.record?.notes || item.record?.location || '—'}
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
        {/* TAB 3: MEUS DADOS & CADASTRO DO COLABORADOR */}
        {/* ======================================================================= */}
        {activeTab === 'perfil' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
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

      </div>

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
