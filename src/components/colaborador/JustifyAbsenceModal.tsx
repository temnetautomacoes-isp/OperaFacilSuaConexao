import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  Camera, 
  X, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Paperclip, 
  Sparkles,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { BiometricSelfieModal } from '../common/BiometricSelfieModal';

interface JustifyAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const JustifyAbsenceModal: React.FC<JustifyAbsenceModalProps> = ({
  isOpen,
  onClose,
  initialDate
}) => {
  const { currentUser, justifyAbsence, showNotification } = useApp();

  const [absenceDate, setAbsenceDate] = useState<string>(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [isFullDay, setIsFullDay] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [reason, setReason] = useState<string>('');
  
  // Document state
  const [attachedDocName, setAttachedDocName] = useState<string>('');
  const [attachedDocSize, setAttachedDocSize] = useState<string>('');
  const [attachedDocUrl, setAttachedDocUrl] = useState<string>('');

  // Selfie biometric state
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !currentUser) return null;

  // Handle Document Attachment
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setAttachedDocName(file.name);
      setAttachedDocSize(sizeStr);

      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedDocUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDoc = () => {
    setAttachedDocName('');
    setAttachedDocSize('');
    setAttachedDocUrl('');
  };

  // Quick Preset Reasons
  const quickReasons = [
    'Atestado Médico / Consulta de Saúde',
    'Exames Laboratoriais / Odontológicos',
    'Declaração de Comparecimento Judicial / Escolar',
    'Imprevisto Familiar / Força Maior',
    'Problemas no Transporte / Clima'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      showNotification('Por favor, informe a justificativa ou motivo da falta/ausência.');
      return;
    }

    if (!selfieUrl) {
      showNotification('A selfie biométrica é obrigatória para validar e assinar sua justificativa.');
      setIsSelfieModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      justifyAbsence({
        userId: currentUser.id,
        userName: currentUser.name,
        date: absenceDate,
        startTime: isFullDay ? '08:00' : startTime,
        endTime: isFullDay ? '18:00' : endTime,
        isFullDay,
        reason: reason.trim(),
        documentName: attachedDocName || undefined,
        documentSize: attachedDocSize || undefined,
        documentUrl: attachedDocUrl || undefined,
        selfieUrl: selfieUrl
      });

      showNotification('Justificativa de ausência enviada com sucesso ao RH!');
      onClose();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao registrar justificativa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Justificar Falta / Ausência
                </h3>
                <p className="text-xs text-slate-400">
                  {currentUser.name} • {currentUser.registrationCode || 'COL-001'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            
            {/* 1. Date of Absence */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                Data da Falta / Ausência:
              </label>
              <input
                type="date"
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900"
                required
              />
            </div>

            {/* 2. Full Day vs Hourly Interval */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFullDay}
                    onChange={(e) => setIsFullDay(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <span>Falta de Dia Inteiro (Jornada Completa)</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isFullDay ? 'Dia Todo' : 'Horário Parcial'}
                </span>
              </div>

              {!isFullDay && (
                <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      Horário Início:
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-800"
                      required={!isFullDay}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      Horário Fim:
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-800"
                      required={!isFullDay}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Reason / Description */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Motivo / Justificativa Detalhada:
              </label>
              
              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickReasons.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => setReason((prev) => prev ? `${prev}. ${qr}` : qr)}
                    className="text-[10px] font-semibold bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + {qr}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Descreva detalhadamente o motivo da ausência ou atraso (ex: Consulta médica realizada no Hospital Regional, atestado em anexo)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900 placeholder:text-slate-400 resize-none font-medium"
                required
              />
            </div>

            {/* 4. Optional Document Attachment */}
            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-orange-600" />
                  Anexar Atestado / Documento (Opcional):
                </label>
                <span className="text-[10px] text-orange-800 font-semibold">PDF ou Foto</span>
              </div>

              {attachedDocName ? (
                <div className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{attachedDocName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({attachedDocSize})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeDoc}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remover anexo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-white/70 hover:bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group">
                  <Upload className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700">
                    Clique para selecionar atestado ou comprovante
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, PNG, JPG (máx. 5MB)</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleDocChange}
                  />
                </label>
              )}
            </div>

            {/* 5. Biometric Selfie Step (Mandatory) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              selfieUrl 
                ? 'bg-emerald-50/70 border-emerald-300' 
                : 'bg-slate-900 text-white border-slate-800 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className={`w-4 h-4 ${selfieUrl ? 'text-emerald-600' : 'text-orange-400 animate-pulse'}`} />
                  <span className={`text-xs font-extrabold ${selfieUrl ? 'text-emerald-950' : 'text-white'}`}>
                    Assinatura Biométrica por Selfie (Obrigatória):
                  </span>
                </div>
                {selfieUrl && (
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Assinada
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                {selfieUrl ? (
                  <div className="flex items-center justify-between w-full bg-white p-2.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={selfieUrl}
                        alt="Selfie Comprobatória"
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shadow-xs"
                      />
                      <div>
                        <span className="text-xs font-black text-slate-900 block">Selfie Capturada</span>
                        <span className="text-[10px] text-slate-500 font-mono block">Identidade confirmada com sucesso</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSelfieModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Refazer Foto
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSelfieModalOpen(true)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-orange-500/30 transition-all cursor-pointer transform active:scale-98"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📸 Tirar Selfie para Assinar a Justificativa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sua justificativa com horário e foto será enviada diretamente para a aprovação do RH.</span>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !selfieUrl}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando...' : 'Enviar Justificativa ao RH'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Biometric Camera Modal */}
      {isSelfieModalOpen && (
        <BiometricSelfieModal
          isOpen={isSelfieModalOpen}
          onClose={() => setIsSelfieModalOpen(false)}
          onCapture={(capturedBase64) => {
            setSelfieUrl(capturedBase64);
            setIsSelfieModalOpen(false);
          }}
          title="Assinatura Biométrica de Justificativa"
          subtitle="Tire uma selfie em tempo real para assinar e comprovar a solicitação de justificativa de falta."
          employeeName={currentUser.name}
          employeeCode={currentUser.registrationCode || 'COL-001'}
          actionTypeLabel={`Justificativa: ${isFullDay ? 'Dia Inteiro' : `${startTime} às ${endTime}`}`}
        />
      )}
    </>
  );
};
