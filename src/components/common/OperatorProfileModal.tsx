import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  Hash, 
  Mail, 
  MapPin, 
  Briefcase, 
  CreditCard, 
  Camera, 
  Edit3, 
  Save, 
  Sparkles,
  QrCode,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AvatarCropModal } from './AvatarCropModal';

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorProfileModal: React.FC<OperatorProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateEmployeeProfile, settings, showNotification } = useApp();
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  const [editData, setEditData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: currentUser?.address || '',
    pixKey: currentUser?.pixKey || '',
    emergencyContact: currentUser?.emergencyContact || ''
  });

  // Sync data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        address: currentUser.address || '',
        pixKey: currentUser.pixKey || '',
        emergencyContact: currentUser.emergencyContact || ''
      });
    }
  }, [currentUser]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCropModalOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isCropModalOpen]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setRawImageToCrop(result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBase64: string) => {
    if (currentUser) {
      updateEmployeeProfile(currentUser.id, { avatarUrl: croppedBase64 });
      showNotification('Foto de perfil atualizada com sucesso!');
    }
    setIsCropModalOpen(false);
    setRawImageToCrop(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateEmployeeProfile(currentUser.id, editData);
    setIsEditing(false);
    showNotification('Dados cadastrais salvos com sucesso!');
  };

  if (!isOpen || !currentUser) return null;

  return (
    <>
      {/* Invisible/Soft Backdrop for click-outside dismissal */}
      <div
        id="operator-profile-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-150"
      />

      {/* Pop-up Container anchored at Top-Right near the user avatar */}
      <div className="fixed top-14 right-3 sm:right-4 z-[9999] pointer-events-auto">
        <div
          ref={modalRef}
          id="operator-profile-card"
          className="w-[330px] sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[88vh] flex flex-col text-slate-800 origin-top-right animate-in fade-in-0 zoom-in-90 slide-in-from-top-2 duration-200 ease-out"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-4 sm:p-5 text-white relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white">Perfil do Usuário / Colaborador</h3>
                <p className="text-[10px] text-slate-400">Informações cadastrais e foto de perfil</p>
              </div>
            </div>

            <button
              id="btn-close-operator-modal"
              type="button"
              onClick={onClose}
              title="Fechar (ESC)"
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            
            {/* Avatar & Main Identification Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              
              {/* Profile Photo with Change Trigger */}
              <div className="relative group shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-0.5 bg-white shadow-md ring-4 ring-orange-500/30 overflow-hidden relative">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                      {currentUser.avatar || <User className="w-8 h-8 text-slate-400" />}
                    </div>
                  )}

                  {/* Hover Change Photo Button Overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
                    title="Clique para alterar ou cortar foto"
                  >
                    <Camera className="w-4 h-4 text-orange-400" />
                    <span className="text-[9px] font-bold">Alterar</span>
                  </button>
                </div>

                {/* Mobile Camera Icon Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md cursor-pointer border-2 border-white sm:hidden"
                  title="Alterar foto"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              {/* Name & Role Info */}
              <div className="flex-1 text-center sm:text-left space-y-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {currentUser.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500 text-white tracking-wider self-center sm:self-auto shadow-xs">
                    {currentUser.registrationCode || 'COL-0428'}
                  </span>
                </div>

                <p className="text-xs text-orange-600 font-bold">
                  {currentUser.position || 'Analista de Suporte & Redes'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {currentUser.department || 'Operações ISP'} • @{currentUser.username}
                </p>

                <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-1">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold text-[9px]">
                    {currentUser.role === 'superadmin' ? '👑 Super Administrador' : currentUser.role === 'admin' ? 'Gerente / Admin' : 'Colaborador / Operador'}
                  </span>
                  {currentUser.admissionDate && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[9px] flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> {currentUser.admissionDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action: Alterar Foto button */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-orange-600" />
                <span>Alterar Foto de Perfil</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>{isEditing ? 'Cancelar' : 'Editar Contatos'}</span>
              </button>
            </div>

            {/* Editing Form vs Display Information */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-2.5">
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                  Editar Meus Contatos:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Telefone / WhatsApp:</label>
                    <input
                      type="text"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">E-mail de Contato:</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Chave PIX:</label>
                  <input
                    type="text"
                    value={editData.pixKey}
                    onChange={(e) => setEditData({ ...editData, pixKey: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">Endereço Residencial:</label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Display Profile Details */
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentUser.email && (
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">E-mail Corporativo:</span>
                      <span className="font-bold text-slate-800 break-all text-[11px]">{currentUser.email}</span>
                    </div>
                  )}

                  {currentUser.phone && (
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Telefone / WhatsApp:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{currentUser.phone}</span>
                    </div>
                  )}

                  {currentUser.cpf && (
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">CPF:</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{currentUser.cpf}</span>
                    </div>
                  )}

                  {currentUser.pixKey && (
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Chave PIX:</span>
                      <span className="font-mono font-bold text-orange-600 text-[11px]">{currentUser.pixKey}</span>
                    </div>
                  )}

                  {currentUser.workSchedule && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Jornada de Trabalho:</span>
                      <span className="font-semibold text-slate-800 text-[11px]">{currentUser.workSchedule}</span>
                    </div>
                  )}

                  {currentUser.address && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-bold block text-[9px] uppercase">Endereço Residencial:</span>
                      <span className="font-medium text-slate-800 text-[11px]">{currentUser.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer Action */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Fechar
            </button>
          </div>

        </div>
      </div>

      {/* Avatar Crop Modal for resizing/cropping photo */}
      {isCropModalOpen && rawImageToCrop && (
        <AvatarCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawImageToCrop}
          onClose={() => {
            setIsCropModalOpen(false);
            setRawImageToCrop(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};
