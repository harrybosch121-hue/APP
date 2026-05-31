import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, Trash2, LogOut, RefreshCw, Send, Eye, EyeOff, ChevronRight, Users, Layers, Ruler, Warehouse, Database } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type Tab = "types" | "sizes" | "godowns" | "users" | "backup";
type Item = { id: string; value?: string; username?: string };

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => Promise<void> }) {
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const handle = async () => {
    if (!val.trim()) return;
    setSaving(true);
    try { await onAdd(val.trim()); setVal(""); } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };
  return (
    <div className="flex gap-2 mt-4">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handle()}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <button onClick={handle} disabled={saving || !val.trim()}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1">
        <Plus className="w-4 h-4" />{saving ? "Adding…" : "Add"}
      </button>
    </div>
  );
}

function ItemList({ items, label, onDelete }: { items: Item[]; label: (i: Item) => string; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const del = async (id: string) => {
    setDeleting(id);
    try { await onDelete(id); } catch (e: any) { toast.error(e.message); }
    setDeleting(null);
  };
  if (items.length === 0) return <p className="text-sm text-gray-400 py-4 text-center">Nothing added yet</p>;
  return (
    <div className="space-y-2 mt-3">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-sm font-medium text-gray-800">{label(item)}</span>
          <button onClick={() => del(item.id)} disabled={deleting === item.id}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function TabPanel({ title, icon: Icon, items, label, placeholder, onAdd, onDelete, extra }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-indigo-600" />
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span className="ml-auto text-xs text-gray-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>
      <p className="text-xs text-gray-400 mb-2">Add or remove {title.toLowerCase()} used in the app.</p>
      <ItemList items={items} label={label} onDelete={onDelete} />
      <AddRow placeholder={placeholder} onAdd={onAdd} />
      {extra}
    </div>
  );
}

function UserPanel({ users, onAdd, onDelete, onChangePassword }: any) {
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");

  const handleAdd = async () => {
    if (!newUser.username.trim() || !newUser.password) return;
    setSaving(true);
    try { await onAdd(newUser.username.trim(), newUser.password); setNewUser({ username: "", password: "" }); }
    catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-indigo-600" />
        <h2 className="font-semibold text-gray-800">Users</h2>
        <span className="ml-auto text-xs text-gray-400">{users.length} user{users.length !== 1 ? "s" : ""}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">Manage staff login accounts.</p>
      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
            <div className="flex items-center px-4 py-3">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">{u.username}</span>
                {u.username === "admin" && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">ADMIN</span>}
              </div>
              {u.username !== "admin" && (
                <div className="flex gap-1">
                  <button onClick={() => setChangingPw(changingPw === u.id ? null : u.id)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-200">
                    Change PW
                  </button>
                  <button onClick={() => onDelete(u.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            {changingPw === u.id && (
              <div className="px-4 pb-3 flex gap-2">
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="New password"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button onClick={async () => { await onChangePassword(u.id, newPw); setChangingPw(null); setNewPw(""); }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium">Save</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 rounded-xl border border-dashed border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">Add New Staff</p>
        <div className="space-y-2">
          <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
            placeholder="Username"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={newUser.password}
              onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10" />
            <button onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={handleAdd} disabled={saving || !newUser.username.trim() || !newUser.password}
            className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Adding…" : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [logging, setLogging] = useState(false);
  const [tab, setTab] = useState<Tab>("types");
  const [types, setTypes] = useState<Item[]>([]);
  const [sizes, setSizes] = useState<Item[]>([]);
  const [godowns, setGodowns] = useState<Item[]>([]);
  const [users, setUsers] = useState<Item[]>([]);
  const [backupStatus, setBackupStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [t, s, g, u] = await Promise.all([
        api.admin.getTypes(), api.admin.getSizes(), api.admin.getGodowns(), api.admin.getUsers()
      ]);
      setTypes(t); setSizes(s); setGodowns(g); setUsers(u);
    } catch (e: any) {
      if (e.message.includes("401") || e.message.includes("403")) { setToken(null); localStorage.removeItem("admin_token"); }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleLogin = async () => {
    setLogging(true); setLoginErr("");
    try {
      await api.admin.login(loginForm.username, loginForm.password);
      setToken(localStorage.getItem("admin_token"));
    } catch (e: any) { setLoginErr(e.message); }
    setLogging(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <Toaster />
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Inventory Management System</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Username</label>
              <input value={loginForm.username} onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="admin"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            {loginErr && <p className="text-xs text-red-500 text-center">{loginErr}</p>}
            <button onClick={handleLogin} disabled={logging}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md disabled:opacity-50 hover:bg-indigo-700 transition-colors">
              {logging ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "types",   label: "Types",   icon: Layers },
    { id: "sizes",   label: "Sizes",   icon: Ruler },
    { id: "godowns", label: "Godowns", icon: Warehouse },
    { id: "users",   label: "Users",   icon: Users },
    { id: "backup",  label: "Backup",  icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-sm">Admin Panel</h1>
          <p className="text-[10px] text-gray-400">Inventory Management</p>
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button onClick={() => { api.admin.logout(); setToken(null); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-w-lg mx-auto">
        {tab === "types" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <TabPanel
              title="Tile Types" icon={Layers}
              items={types} label={(i: Item) => i.value!}
              placeholder="e.g. Satin, Stone"
              onAdd={async (v: string) => { const r = await api.admin.addType(v); setTypes(p => [...p, r]); toast.success(`"${v}" added`); }}
              onDelete={async (id: string) => { await api.admin.deleteType(id); setTypes(p => p.filter(x => x.id !== id)); toast.success("Removed"); }}
            />
          </div>
        )}
        {tab === "sizes" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <TabPanel
              title="Tile Sizes" icon={Ruler}
              items={sizes} label={(i: Item) => i.value!}
              placeholder="e.g. 3x3, 4x4"
              onAdd={async (v: string) => { const r = await api.admin.addSize(v); setSizes(p => [...p, r]); toast.success(`"${v}" added`); }}
              onDelete={async (id: string) => { await api.admin.deleteSize(id); setSizes(p => p.filter(x => x.id !== id)); toast.success("Removed"); }}
            />
          </div>
        )}
        {tab === "godowns" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <TabPanel
              title="Godowns" icon={Warehouse}
              items={godowns} label={(i: Item) => i.value!}
              placeholder="e.g. C Godown, New Store"
              onAdd={async (v: string) => { const r = await api.admin.addGodown(v); setGodowns(p => [...p, r]); toast.success(`"${v}" added`); }}
              onDelete={async (id: string) => { await api.admin.deleteGodown(id); setGodowns(p => p.filter(x => x.id !== id)); toast.success("Removed"); }}
            />
          </div>
        )}
        {tab === "users" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <UserPanel
              users={users}
              onAdd={async (u: string, pw: string) => { const r = await api.admin.addUser(u, pw); setUsers(p => [...p, r]); toast.success(`User "${u}" created`); }}
              onDelete={async (id: string) => { await api.admin.deleteUser(id); setUsers(p => p.filter(x => x.id !== id)); toast.success("User removed"); }}
              onChangePassword={async (id: string, pw: string) => { await api.admin.changePassword(id, pw); toast.success("Password updated"); }}
            />
          </div>
        )}
        {tab === "backup" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-gray-800">Telegram Backup</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">Send a full database backup to the configured Telegram users right now. Automatic daily backups run at 2:00 AM.</p>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
              <p className="text-xs font-medium text-indigo-700 mb-1">What gets backed up</p>
              <ul className="text-xs text-indigo-600 space-y-0.5 list-disc list-inside">
                <li>All inventory tiles</li>
                <li>Audit logs</li>
                <li>Config (types, sizes, godowns)</li>
                <li>User accounts</li>
              </ul>
            </div>
            <button
              onClick={async () => {
                setBackupStatus("sending");
                try {
                  await api.admin.triggerBackup();
                  setBackupStatus("done");
                  toast.success("Backup sent to Telegram!");
                } catch (e: any) {
                  setBackupStatus("error");
                  toast.error("Backup failed: " + e.message);
                }
              }}
              disabled={backupStatus === "sending"}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
              {backupStatus === "sending" ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
              ) : backupStatus === "done" ? (
                <><Send className="w-4 h-4" /> Sent Successfully</>
              ) : (
                <><Send className="w-4 h-4" /> Send Backup Now</>
              )}
            </button>
            {backupStatus === "done" && (
              <p className="text-xs text-green-600 text-center mt-2">✓ Backup delivered to both Telegram accounts</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
