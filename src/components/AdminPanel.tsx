import React, { useState, useEffect } from "react";
import { 
  Users, HardDrive, ShieldCheck, Activity, Trash2, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Key, Shield
} from "lucide-react";

interface AdminPanelProps {
  token: string;
  theme: "light" | "dark";
}

export default function AdminPanel({ token, theme }: AdminPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"users" | "logs">("users");

  const isDark = theme === "dark";

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/dashboard", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Erro de permissão");

      setData(resData);
    } catch (err: any) {
      setError(err.message || "Você não tem privilégios de administrador ou erro no servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleToggleAdmin = async (userId: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Atenção! Esta ação é definitiva. Deseja realmente excluir esta conta de usuário e todos os seus arquivos?")) return;

    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm">Carregando painel de controle do MediaHub...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`p-6 rounded-3xl border text-center max-w-lg mx-auto ${
        isDark ? "bg-[#111827] border-red-950 text-red-400" : "bg-red-50 border-red-100 text-red-800"
      }`}>
        <ShieldAlert className="w-12 h-12 mx-auto mb-3" />
        <h3 className="text-sm font-extrabold mb-1">Acesso Restrito do Administrador</h3>
        <p className="text-xs leading-relaxed">{error}</p>
      </div>
    );
  }

  const { stats, users, auditLogs } = data;

  return (
    <div className="space-y-6">
      
      {/* Admin Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Usuários Ativos", value: stats.totalUsers, icon: Users, color: "text-blue-500 bg-blue-500/10 border-blue-500/10" },
          { label: "Downloads Totais", value: stats.totalDownloads, icon: Activity, color: "text-purple-500 bg-purple-500/10 border-purple-500/10" },
          { label: "Mídias Armazenadas", value: stats.totalFiles, icon: HardDrive, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10" },
          { label: "Uso do Servidor", value: stats.totalSizeMB, icon: ShieldCheck, color: "text-amber-500 bg-amber-500/10 border-amber-500/10" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight mt-2">{item.value}</h3>
            </div>
          );
        })}
      </div>

      {success && (
        <div className="p-4 text-xs font-semibold text-green-500 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")}><RefreshCw className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="p-4 text-xs font-semibold text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")}><RefreshCw className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main administrative table controls (Bento Grid layout) */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        
        {/* Subtab selection */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-800/40 select-none">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab("users")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "users"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10"
                  : "text-slate-400 hover:bg-slate-850"
              }`}
            >
              Gerenciar Contas ({users.length})
            </button>
            <button
              onClick={() => setActiveSubTab("logs")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "logs"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10"
                  : "text-slate-400 hover:bg-slate-850"
              }`}
            >
              Logs de Auditoria ({auditLogs.length})
            </button>
          </div>

          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Modo Supervisor Ativo
          </span>
        </div>

        {/* Users tabulation list */}
        {activeSubTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b border-slate-800/60 font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  <th className="py-3 px-4">Nome de Cadastro</th>
                  <th className="py-3 px-4">Endereço de E-mail</th>
                  <th className="py-3 px-4">Nível de Permissão</th>
                  <th className="py-3 px-4">Total Arquivos</th>
                  <th className="py-3 px-4">Registrado Em</th>
                  <th className="py-3 px-4 text-right">Ações de Gerenciamento</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr 
                    key={u.id}
                    className={`border-b border-slate-800/30 hover:bg-slate-900/10 font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white uppercase shrink-0">
                          {u.name.slice(0, 2)}
                        </div>
                        <span className="font-bold">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      {u.isAdmin ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold uppercase text-[9px]">
                          Administrador
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase text-[9px]">
                          Plano Premium
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-500">{u.filesCount} mídias</td>
                    <td className="py-3 px-4">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleAdmin(u.id)}
                          className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                            u.isAdmin
                              ? "bg-slate-800 border-slate-700 text-slate-300"
                              : "bg-purple-600 text-white"
                          }`}
                          title="Alterar Admin"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                          title="Excluir Conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit logging system tab */}
        {activeSubTab === "logs" && (
          <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-2">
            {auditLogs.map((log: any) => (
              <div 
                key={log.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold font-mono text-[9px] uppercase">
                    {log.action}
                  </span>
                  <p className="font-semibold">{log.userEmail}</p>
                </div>

                <div className={`text-[10px] font-mono text-right flex flex-col gap-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  <span>IP: {log.ip}</span>
                  <span>Dispositivo: {log.userAgent.substring(0, 30)}...</span>
                  <span>Registrado em: {new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
