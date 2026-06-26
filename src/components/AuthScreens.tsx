import React, { useState } from "react";
import { Shield, Key, Mail, User as UserIcon, ArrowRight, Activity, Lock } from "lucide-react";

interface AuthScreensProps {
  onLoginSuccess: (token: string, user: any) => void;
  theme: "light" | "dark";
}

export default function AuthScreens({ onLoginSuccess, theme }: AuthScreensProps) {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar");

      setMessage("Conta criada com sucesso! Redirecionando...");
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro no registro");
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setTempPassword("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao recuperar");

      setMessage(data.message);
      if (data.tempPassword) {
        setTempPassword(data.tempPassword);
      }
    } catch (err: any) {
      setError(err.message || "E-mail não encontrado");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? "bg-[#0b0f19] text-slate-100" : "bg-[#f1f5f9] text-slate-800"}`}>
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Decorative Tech Banner / Bento Feature Cards */}
        <div className={`md:col-span-6 flex flex-col justify-between p-8 rounded-3xl border shadow-2xl transition-all relative overflow-hidden ${
          isDark 
            ? "bg-gradient-to-br from-[#020617] to-[#1e1b4b] border-slate-800" 
            : "bg-gradient-to-br from-blue-700 to-indigo-900 border-blue-100 text-white"
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">MediaHub</span>
              <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold uppercase tracking-wider">Download</span>
            </div>
          </div>

          <div className="my-12 space-y-6 relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Gerencie, Baixe e Converta em Alta Definição.
            </h2>
            <p className={isDark ? "text-slate-400 text-sm leading-relaxed" : "text-blue-100 text-sm leading-relaxed"}>
              A plataforma definitiva de mídia. Suporte a downloads de mais de 8K de qualidade, extrator de áudio via FFmpeg, biblioteca organizada com pastas e taggings inteligentes em um painel completo.
            </p>

            {/* Micro Bento Features */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/10 border-white/15"}`}>
                <span className="block text-xs font-semibold uppercase text-blue-400">Downloads</span>
                <span className="text-xs">Velocidades de download ilimitadas.</span>
              </div>
              <div className={`p-3 rounded-2xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-white/10 border-white/15"}`}>
                <span className="block text-xs font-semibold uppercase text-emerald-400">Conversor</span>
                <span className="text-xs">Mude formatos instantaneamente.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs relative z-10">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className={isDark ? "text-slate-500" : "text-blue-200"}>Ambiente Seguro: JWT Hashing • Proteção XSS/CSRF Ativa</span>
          </div>
        </div>

        {/* Form Interactive Card */}
        <div className={`md:col-span-6 flex flex-col justify-center p-8 rounded-3xl border shadow-xl ${
          isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200"
        }`}>
          {error && (
            <div className="p-4 mb-4 text-sm text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="p-4 mb-4 text-sm text-green-500 bg-green-500/10 rounded-2xl border border-green-500/20 font-medium">
              {message}
            </div>
          )}

          {tempPassword && (
            <div className={`p-4 mb-4 text-xs rounded-2xl border font-mono ${
              isDark ? "bg-slate-900 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              <p className="font-sans font-semibold mb-1">Acesso Temporário Gerado:</p>
              <div className="flex items-center justify-between">
                <span>E-mail: <strong className="underline">{email}</strong></span>
                <span>Senha: <strong className="underline">{tempPassword}</strong></span>
              </div>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-1">Bem-vindo de volta</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Acesse sua biblioteca pessoal do MediaHub
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu-email@mediahub.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark ? "bg-slate-900/60 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Admin de testes: <strong>admin@mediahub.com</strong></span>
                    <span>Senha: <strong>qualquer uma</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold tracking-wider uppercase block">Senha</label>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setMode("recover");
                      }}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark ? "bg-slate-900/60 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Autenticando..." : "Entrar no MediaHub"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setError("");
                  setMessage("");
                  setLoading(true);
                  try {
                    const res = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: "admin@mediahub.com", password: "admin" }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
                    onLoginSuccess(data.token, data.user);
                  } catch (err: any) {
                    setError(err.message || "Credenciais inválidas");
                  } finally {
                    setLoading(false);
                  }
                }}
                className={`w-full py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isDark 
                    ? "border-slate-700 hover:border-slate-600 hover:bg-slate-800/40 text-slate-300" 
                    : "border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Acesso Rápido (Entrar como Admin de Testes)
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Não possui conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setMode("register");
                    }}
                    className="text-blue-500 hover:underline font-semibold"
                  >
                    Cadastre-se grátis
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-1">Crie sua Conta</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Inscreva-se grátis e ganhe 2GB de armazenamento em nuvem
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase block">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark ? "bg-slate-900/60 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@mediahub.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark ? "bg-slate-900/60 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase block">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie uma senha forte"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark ? "bg-slate-900/60 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Cadastrando..." : "Registrar Conta"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Já possui conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setMode("login");
                    }}
                    className="text-blue-500 hover:underline font-semibold"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === "recover" && (
            <form onSubmit={handleRecover} className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-1">Recuperar Senha</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Digite seu e-mail cadastrado para obter uma senha provisória de testes
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase block">E-mail Cadastrado</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@mediahub.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        isDark ? "bg-slate-900/60 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Processando..." : "Enviar Senha Temporária"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Voltar para o{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setMode("login");
                    }}
                    className="text-blue-500 hover:underline font-semibold"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
