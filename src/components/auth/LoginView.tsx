import React, { useState, useEffect } from 'react';
import { useApp, Environment } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  User, 
  ArrowRight, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Clock
} from 'lucide-react';
import operafacilLogoImg from '../../assets/operafacil_logo.png';
import ispVehicleImg from '../../assets/provedor_internet_carro.jpg';

export const LoginView: React.FC = () => {
  const { login, settings } = useApp();

  const [selectedEnv, setSelectedEnv] = useState<Environment>('colaborador');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Auto-focus username on mount
  useEffect(() => {
    const input = document.getElementById('input-login-username');
    if (input) input.focus();
  }, [selectedEnv]);

  const handleSelectEnvironment = (env: Environment) => {
    setSelectedEnv(env);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Informe seu e-mail ou usuário e senha para acessar.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login(username, password, selectedEnv);
      setIsLoading(false);
      if (!result.success && result.message) {
        setErrorMessage(result.message);
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Ocorreu um erro ao validar seu acesso. Verifique suas credenciais.');
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen max-w-full overflow-hidden bg-[#071322] flex items-center justify-center font-sans antialiased text-slate-800 selection:bg-orange-500 selection:text-white relative select-none p-4 sm:p-6 lg:p-8">

      {/* ========================================================================= */}
      {/* 1. BACKGROUND FULL-COVER: CARRO DE PROVEDOR COM ESCADA & DEGRADÊ */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <img
          src={ispVehicleImg}
          alt="Carro de Provedor de Internet com Escada"
          className="w-full h-full object-cover object-center opacity-45 sm:opacity-55"
        />
        {/* Camadas de gradiente para contraste e realce dos elementos em primeiro plano */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071322]/95 via-[#0a192f]/85 to-[#0b1b36]/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071322] via-transparent to-[#071322]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.18),transparent_55%)]" />
      </div>

      {/* Top-Left Official OperaFácil Logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 lg:top-8 lg:left-12 z-30">
        <div className="relative inline-flex items-center justify-start group">
          {/* Gradiente luminoso e suave para realçar as cores da logo no fundo escuro */}
          <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/35 via-blue-600/30 to-orange-400/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -inset-2 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl blur-lg pointer-events-none opacity-80" />
          
          <img
            src={operafacilLogoImg}
            alt="OperaFácil Logo"
            className="relative h-12 sm:h-14 md:h-16 lg:h-18 w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.75)] transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTEÚDO CENTRAL PRINCIPAL (SEM ROLAGEM) */}
      {/* ========================================================================= */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-20 py-2 sm:py-4">
        
        {/* ------------------------------------------------------------- */}
        {/* HERO TEXT ESQUERDA */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-6 text-white space-y-4 sm:space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistema Integrado de Gestão ISP & Operações
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-white drop-shadow-md">
              <span className="block mb-1.5 sm:mb-2">
                <span className="text-orange-500">O</span><span className="text-white">pera</span><span className="text-[#2563eb]">F</span><span className="text-white">ácil.</span>
              </span>
              <span>Para toda operação, uma solução.</span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-medium max-w-lg">
              A tecnologia ágil, moderna e descomplicada para você gerenciar clientes, planos, chamados e operações de campo do seu provedor de internet.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CARD DE LOGIN E ACESSO À DIREITA */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-6">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/40 space-y-5">
            
            {/* Header do Card */}
            <div className="border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Identificação de Acesso
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione o ambiente desejado e acesse seu posto de trabalho.
                </p>
              </div>
            </div>

            {/* SELEÇÃO DE AMBIENTE: COLABORADOR vs ERP */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Ambiente de Acesso:
              </label>

              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                {/* Option 1: Colaborador */}
                <button
                  type="button"
                  id="btn-login-select-colaborador"
                  onClick={() => handleSelectEnvironment('colaborador')}
                  className={`p-2.5 sm:p-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer text-left relative ${
                    selectedEnv === 'colaborador' || selectedEnv === 'pdv'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedEnv === 'colaborador' || selectedEnv === 'pdv' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 shadow-2xs'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs block truncate">
                      Colaborador
                    </span>
                    <span className={`text-[10px] block ${selectedEnv === 'colaborador' || selectedEnv === 'pdv' ? 'text-orange-200' : 'text-slate-500'}`}>
                      Ponto & Dados
                    </span>
                  </div>
                </button>

                {/* Option 2: ERP */}
                <button
                  type="button"
                  id="btn-login-select-erp"
                  onClick={() => handleSelectEnvironment('erp')}
                  className={`p-2.5 sm:p-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer text-left relative ${
                    selectedEnv === 'erp'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedEnv === 'erp' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 shadow-2xs'
                  }`}>
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs block truncate">
                      Gerência (ERP)
                    </span>
                    <span className={`text-[10px] block ${selectedEnv === 'erp' ? 'text-orange-200' : 'text-slate-500'}`}>
                      Administração ISP
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* FORMULÁRIO DE LOGIN */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Error Banner */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Campo Usuário */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail ou Login de Usuário:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="seu-email@provedor.com ou usuário"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha de Acesso:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Entrada Principal */}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer text-white active:scale-[0.99] bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 mt-1"
              >
                {isLoading ? (
                  <span>Validando Acesso...</span>
                ) : (
                  <>
                    <span>
                      {selectedEnv === 'colaborador' || selectedEnv === 'pdv' ? 'Acessar Posto de Trabalho' : 'Acessar Painel da Gerência (ERP)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Informações de Rodapé do Card */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-600">
                {settings.name} &bull; v2.5 Pro
              </span>
              <span>Dados persistidos localmente</span>
            </div>

          </div>
        </div>

      </main>

    </div>
  );
};
