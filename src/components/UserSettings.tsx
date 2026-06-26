import React, { useState } from "react";
import { 
  User, Key, ShieldCheck, Sun, Moon, Check, AlertTriangle, Eye, RefreshCw
} from "lucide-react";

interface UserSettingsProps {
  user: any;
  onUpdateUser: (updatedUser: any) => void;
  token: string;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export default function UserSettings({ user, onUpdateUser, token, theme, setTheme }: UserSettingsProps) {
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isDark = theme === "dark";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    setMessage("");
    setSavingProfile(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar perfil");

      onUpdateUser(data.user);
      setMessage("Seu perfil foi atualizado com sucesso!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setError("");
    setMessage("");
    setSavingPassword(true);

    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar senha");

      setCurrentPassword("");
      setNewPassword("");
      setMessage("Senha de acesso alterada com sucesso!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Profile & Appearance (Bento card 1) */}
      <div className={`lg:col-span-6 p-6 rounded-3xl border space-y-5 ${
        isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        
        <div>
          <h2 className="text-md font-bold flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-blue-500" />
            Configurações do Perfil
          </h2>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Edite seus dados cadastrais e configure o visual da plataforma.
          </p>
        </div>

        {message && (
          <div className="p-4 text-xs font-semibold text-green-500 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 text-xs font-semibold text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase block">E-mail (Não editável)</label>
            <input
              type="text"
              disabled
              value={email}
              className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none opacity-60 ${
                isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase block">Nome Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          {/* Theme Switcher Toggle */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold tracking-wider uppercase block">Aparência do Tema</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  theme === "light"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Modo Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  theme === "dark"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Modo Escuro</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
          >
            {savingProfile ? "Salvando..." : "Salvar Configurações"}
          </button>
        </form>

      </div>

      {/* Security settings: Password changes (Bento card 2) */}
      <div className={`lg:col-span-6 p-6 rounded-3xl border space-y-5 ${
        isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div>
          <h2 className="text-md font-bold flex items-center gap-2 mb-1">
            <Key className="w-5 h-5 text-purple-500" />
            Mudar Senha de Acesso
          </h2>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Altere seus dados de credencial para manter a biblioteca blindada.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase block">Senha Atual</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase block">Nova Senha</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha forte"
              className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
          >
            {savingPassword ? "Processando..." : "Mudar Senha"}
          </button>
        </form>

        <div className={`p-4 rounded-2xl border text-xs flex gap-2.5 ${isDark ? "bg-slate-900/40 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <p>
            Suas senhas são criptografadas com hash salted irreversível antes de serem persistidas na base de dados JSON.
          </p>
        </div>
      </div>

    </div>
  );
}
