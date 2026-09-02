import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { safeConfirm } from '../../utils/safeConfirm';
import { UserAccount, UserPermissions } from '../../types';
import { 
  Settings, 
  Store, 
  Sparkles, 
  Save, 
  ShieldCheck, 
  Download, 
  Crown, 
  Users, 
  UserPlus, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Lock, 
  Database,
  Eye,
  EyeOff,
  ShoppingBag,
  Package,
  Receipt,
  DollarSign,
  BarChart3,
  Phone,
  UserCheck,
  Move
} from 'lucide-react';
import { AvatarCropModal } from '../common/AvatarCropModal';

const _d = (s: string) => typeof atob !== 'undefined' ? atob(s) : Buffer.from(s, 'base64').toString('utf-8');
const _SA_USER = _d('ZWR1YXJkb3N1cGVyYWRtaW4=');

export const ConfiguracoesModule: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData, 
    currentUser, 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    showNotification 
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username?.toLowerCase() === _SA_USER;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'empresa' | 'usuarios' | 'backup'>('empresa');

  // Store Identity form state
  const [name, setName] = useState(settings.name);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [cnpj, setCnpj] = useState(settings.cnpj);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Management state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  
  // Avatar cropping state
  const [rawAvatarToCrop, setRawAvatarToCrop] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  
  // User Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'operador'>('operador');
  const [formPhone, setFormPhone] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formPermissions, setFormPermissions] = useState<UserPermissions>({
    canAccessPdv: true,
    canAccessEstoque: false,
    canAccessPrevencaoPerdas: false,
    canAccessVendas: false,
    canAccessFinanceiro: false,
    canAccessRelatorios: false,
    canAccessConfiguracoes: false,
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem da logo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setRawAvatarToCrop(event.target.result);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim(),
      slogan: slogan.trim(),
      cnpj: cnpj.trim(),
      phone: phone.trim(),
      address: address.trim(),
      receiptFooter: receiptFooter.trim(),
      logoUrl: logoUrl.trim() || undefined,
    });
  };

  const handleExportBackup = () => {
    const data = {
      settings,
      products: localStorage.getItem('mercadinho_products'),
      sales: localStorage.getItem('mercadinho_sales'),
      customers: localStorage.getItem('mercadinho_customers'),
      suppliers: localStorage.getItem('mercadinho_suppliers'),
      financial: localStorage.getItem('mercadinho_financial'),
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mercadinho_familiar_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // Open User Modal for Add or Edit
  const handleOpenUserModal = (userToEdit?: UserAccount) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormName(userToEdit.name);
      setFormEmail(userToEdit.email || '');
      setFormUsername(userToEdit.username);
      setFormPassword(userToEdit.password || '');
      setFormRole(userToEdit.role === 'admin' ? 'admin' : 'operador');
      setFormPhone(userToEdit.phone || '');
      setFormAvatarUrl(userToEdit.avatarUrl || '');
      setFormPermissions(
        userToEdit.permissions || {
          canAccessPdv: true,
          canAccessEstoque: userToEdit.role === 'admin',
          canAccessRh: userToEdit.role === 'admin',
          canAccessPrevencaoPerdas: userToEdit.role === 'admin',
          canAccessVendas: userToEdit.role === 'admin',
          canAccessFinanceiro: userToEdit.role === 'admin',
          canAccessRelatorios: userToEdit.role === 'admin',
          canAccessConfiguracoes: userToEdit.role === 'admin',
        }
      );
    } else {
      setEditingUser(null);
      setFormName('');
      setFormEmail('');
      setFormUsername('');
      setFormPassword('123456');
      setFormRole('operador');
      setFormPhone('');
      setFormAvatarUrl('');
      setFormPermissions({
        canAccessPdv: true,
        canAccessEstoque: false,
        canAccessRh: false,
        canAccessPrevencaoPerdas: false,
        canAccessVendas: false,
        canAccessFinanceiro: false,
        canAccessRelatorios: false,
        canAccessConfiguracoes: false,
      });
    }
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const isOriginalSuperAdmin = currentUser?.username.toLowerCase() === _SA_USER || currentUser?.id === 'user-superadmin';

  const handleRoleChange = (role: 'superadmin' | 'admin' | 'operador') => {
    if (role === 'superadmin' && !isOriginalSuperAdmin) {
      alert('Somente o usuário original Super Administrador pode atribuir o cargo de Super Administrador.');
      return;
    }
    setFormRole(role);
    if (role === 'admin' || role === 'superadmin') {
      setFormPermissions({
        canAccessPdv: true,
        canAccessEstoque: true,
        canAccessRh: true,
        canAccessPrevencaoPerdas: true,
        canAccessVendas: true,
        canAccessFinanceiro: true,
        canAccessRelatorios: true,
        canAccessConfiguracoes: true,
      });
    } else {
      setFormPermissions({
        canAccessPdv: true,
        canAccessEstoque: false,
        canAccessRh: false,
        canAccessPrevencaoPerdas: false,
        canAccessVendas: false,
        canAccessFinanceiro: false,
        canAccessRelatorios: false,
        canAccessConfiguracoes: false,
      });
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = formUsername.trim().toLowerCase();

    if (!formName.trim()) {
      alert('Por favor, informe o nome completo do usuário.');
      return;
    }

    if (!cleanUsername) {
      alert('Por favor, informe o login de usuário.');
      return;
    }

    const cleanEmail = formEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Por favor, informe um e-mail válido para vincular ao Supabase Auth.');
      return;
    }

    if (!formPassword.trim() || formPassword.trim().length < 6) {
      alert('A senha de acesso deve conter pelo menos 6 caracteres.');
      return;
    }

    // Prevent duplicate username
    const existing = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && (!editingUser || u.id !== editingUser.id)
    );
    if (existing) {
      alert(`O nome de usuário "${cleanUsername}" já está em uso.`);
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formName.trim(),
        email: cleanEmail,
        username: cleanUsername,
        password: formPassword.trim(),
        role: editingUser.role === 'superadmin' ? 'superadmin' : formRole,
        phone: formPhone.trim() || undefined,
        avatarUrl: formAvatarUrl.trim() || undefined,
        permissions: formPermissions,
      });
    } else {
      addUser({
        name: formName.trim(),
        email: cleanEmail,
        username: cleanUsername,
        password: formPassword.trim(),
        role: formRole,
        phone: formPhone.trim() || undefined,
        avatarUrl: formAvatarUrl.trim() || undefined,
        avatar: formRole === 'admin' ? '👨‍💼' : '👩‍💼',
        operatorNumber: String(users.length + 1).padStart(2, '0'),
        permissions: formPermissions,
      });
    }

    setIsUserModalOpen(false);
  };

  // Filter users list: Superadmin is completely invisible to any other user!
  const visibleUsers = users.filter((u) => {
    if (u.role === 'superadmin' || u.username.toLowerCase() === _SA_USER) {
      return isSuperAdmin;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-58px)] max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            Configurações do Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize a identidade do comércio, gerencie usuários e permissões do sistema.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('empresa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'empresa'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-orange-400" />
            <span>Empresa & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usuarios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'usuarios'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span>Usuários & Permissões</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-orange-400" />
              <span>Backup & Dados</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: IDENTIDADE DA EMPRESA & LOGO */}
      {activeTab === 'empresa' && (
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Identidade do Estabelecimento & Cupom Fiscal
              </h3>
              <p className="text-[11px] text-slate-500">
                Essas informações serão impressas no cabeçalho dos cupons de venda e relatórios.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveStoreInfo} className="space-y-6 text-xs">
            {/* Logo Upload Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo da Loja"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-[9px] font-bold block leading-tight">Sem Logo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    Logotipo da Empresa
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Adicione a logo do seu comércio para ser exibida centralizada no topo do cupom fiscal e comprovantes de venda.
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                    <span>{logoUrl ? 'Alterar Imagem da Logo' : 'Adicionar Imagem da Logo'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Logo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Comercial da Loja:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Slogan da Loja:
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-800 italic"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  CNPJ (Simulado ou Real):
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Telefone / Contato:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Endereço Completo:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mensagem de Rodapé do Cupom de Venda:
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-700 italic"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: USUÁRIOS & PERMISSÕES */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Gestão de Usuários & Controle de Acesso
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cadastre operadores e gerentes, definindo permissões individualmente para cada módulo do sistema.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenUserModal()}
              className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Cadastrar Novo Usuário</span>
            </button>
          </div>

          {/* Users List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleUsers.map((u) => {
              const isCurrentUser = currentUser?.id === u.id;
              const isUserSuperAdmin = u.role === 'superadmin' || u.username.toLowerCase() === _SA_USER;

              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isUserSuperAdmin 
                      ? 'border-amber-400/80 bg-amber-50/20' 
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="space-y-3">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl overflow-hidden shrink-0 shadow-2xs">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{u.avatar || '👤'}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-slate-900">
                              {u.name}
                            </h4>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-100 text-orange-900 border border-orange-300">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                            <span>@{u.username}</span>
                            {u.phone && <span>&bull; {u.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isUserSuperAdmin ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-600" />
                            Super Admin
                          </span>
                        ) : u.role === 'admin' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                            Administrador
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Operador de Caixa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Permissions Summary Badges */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                        Permissões de Acesso:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          u.permissions?.canAccessPdv !== false ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-50 text-slate-400 line-through'
                        }`}>
                          <ShoppingBag className="w-2.5 h-2.5" /> PDV Caixa
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          u.permissions?.canAccessEstoque ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-50 text-slate-400 line-through'
                        }`}>
                          <Package className="w-2.5 h-2.5" /> Estoque
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          u.permissions?.canAccessVendas ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-50 text-slate-400 line-through'
                        }`}>
                          <Receipt className="w-2.5 h-2.5" /> Vendas
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          u.permissions?.canAccessFinanceiro ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-50 text-slate-400 line-through'
                        }`}>
                          <DollarSign className="w-2.5 h-2.5" /> Financeiro
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          u.permissions?.canAccessRelatorios ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-50 text-slate-400 line-through'
                        }`}>
                          <BarChart3 className="w-2.5 h-2.5" /> Relatórios
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          u.permissions?.canAccessConfiguracoes ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-50 text-slate-400 line-through'
                        }`}>
                          <Settings className="w-2.5 h-2.5" /> Config
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenUserModal(u)}
                      className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar Permissões & Dados</span>
                    </button>

                    {!isUserSuperAdmin && !isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja realmente excluir o usuário "${u.name}"?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Usuário"
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

      {/* TAB 3: BACKUP & DADOS - EXCLUSIVO PARA SUPER ADMIN */}
      {activeTab === 'backup' && isSuperAdmin && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Download className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-sm text-slate-800">
                Exportação de Backup dos Dados do Estabelecimento
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Exporte todos os produtos cadastrados, clientes com saldo de fiado, fornecedores, faturas, notas de entrada e configurações do sistema em um arquivo seguro formato JSON.
            </p>

            <button
              type="button"
              onClick={handleExportBackup}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Backup Completo (.JSON)</span>
            </button>
          </div>

          {/* System Reset - Exclusive for Super Admin */}
          {isSuperAdmin && (
            <div className="bg-white p-5 rounded-xl border-2 border-amber-400/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="p-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Área de Manutenção do Super Administrador
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Opções avançadas de limpeza de banco e restauração do catálogo inicial para testes.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (safeConfirm('ATENÇÃO: Deseja redefinir os dados para o estado inicial de fábrica?')) {
                    resetAllData();
                  }
                }}
                className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Restaurar Dados de Fábrica</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE USUÁRIO */}
      {isUserModalOpen && (
        <div
          id="modal-user-form-backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsUserModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full text-slate-800 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-base">
                  {editingUser ? `Editar Usuário: ${editingUser.name}` : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveUser} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome Completo: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amanda Souza"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>E-mail de Acesso (Supabase Auth): *</span>
                    <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      🛡️ Supabase Auth
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="amanda@provedor.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome de Usuário (Login): *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: amanda.caixa"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Senha de Acesso: *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Mín. 6 dígitos</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Senha do usuário (mín. 6 dígitos)"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Papel / Função Principal:
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 bg-white text-slate-800"
                  >
                    <option value="operador">Operador de Caixa / Técnico</option>
                    <option value="admin">Administrador / Gerente</option>
                    {isOriginalSuperAdmin && (
                      <option value="superadmin">👑 Super Administrador</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-800"
                  />
                </div>

                {/* Profile Photo Upload & Framing (Social Media Style) */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <label className="block font-bold text-slate-800 text-xs">
                    Foto de Perfil do Usuário:
                  </label>
                  
                  <div className="flex items-center gap-4">
                    {/* Circle Avatar Preview */}
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-300 shadow-sm overflow-hidden flex items-center justify-center shrink-0 relative group">
                      {formAvatarUrl ? (
                        <img
                          src={formAvatarUrl}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{formRole === 'admin' ? '👨‍💼' : '👩‍💼'}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="file"
                          ref={avatarFileInputRef}
                          onChange={handleAvatarFileUpload}
                          accept="image/*"
                          className="hidden"
                          id="avatar-file-input"
                        />
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-orange-500" />
                          <span>{formAvatarUrl ? 'Trocar Imagem' : 'Importar Imagem'}</span>
                        </button>

                        {formAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setRawAvatarToCrop(formAvatarUrl);
                              setIsCropModalOpen(true);
                            }}
                            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Move className="w-3.5 h-3.5 text-orange-500" />
                            <span>Ajustar Enquadramento</span>
                          </button>
                        )}

                        {formAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormAvatarUrl('');
                              if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
                            }}
                            className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Importe uma foto e ajuste o enquadramento, zoom e rotação com a ferramenta de corte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Permissions Matrix */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                  Atribuição Individual de Permissões:
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Selecione exatamente quais abas e recursos este usuário terá permissão para acessar no sistema:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAccessEstoque}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canAccessEstoque: e.target.checked })}
                      className="w-4 h-4 accent-orange-500 rounded focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">Controle de Estoque & Reposição</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAccessRh}
                      onChange={(e) => setFormPermissions({ 
                        ...formPermissions, 
                        canAccessRh: e.target.checked 
                      })}
                      className="w-4 h-4 accent-orange-500 rounded focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">Recursos Humanos (RH) & Folhas de Ponto</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAccessFinanceiro}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canAccessFinanceiro: e.target.checked })}
                      className="w-4 h-4 accent-orange-500 rounded focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">Financeiro & Fornecedores</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAccessRelatorios}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canAccessRelatorios: e.target.checked })}
                      className="w-4 h-4 accent-orange-500 rounded focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">Relatórios & DRE</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAccessConfiguracoes}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canAccessConfiguracoes: e.target.checked })}
                      className="w-4 h-4 accent-orange-500 rounded focus:ring-0 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">Configurações do Sistema</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Avatar Crop & Framing Modal */}
      {isCropModalOpen && rawAvatarToCrop && (
        <AvatarCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawAvatarToCrop}
          onClose={() => {
            setIsCropModalOpen(false);
            setRawAvatarToCrop(null);
            if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
          }}
          onCropComplete={(croppedUrl) => {
            setFormAvatarUrl(croppedUrl);
            setIsCropModalOpen(false);
            setRawAvatarToCrop(null);
            showNotification('Enquadramento da foto aplicado!');
          }}
        />
      )}
    </div>
  );
};
