import { useState, useEffect, useCallback } from "react";
  import { Shield, Plus, Trash2, LogOut, RefreshCw, Send, Eye, EyeOff, Pencil, PackageSearch, Check, X, Users, Layers, Ruler, Warehouse, Database } from "lucide-react";
  import { api } from "@/lib/api";
  import { toast } from "sonner";
  import { Toaster } from "@/components/ui/sonner";

  type Tab = "products" | "types" | "sizes" | "godowns" | "users" | "backup";
  type Item = { id: string; value?: string; username?: string };
  type Product = { id: string; name: string; type: string; size: string; quantity: number; quantityUnit: string; location: string };

  const TILE_TYPES = ["Gloss", "Matt", "Carving", "Satin", "Stone"];
  const TILE_SIZES = ["2x2", "2x4", "12x18"];
  const QTY_UNITS = ["Sq Ft", "Box"];

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        {children}
      </div>
    );
  }

  function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  function ProductForm({ initial, onSave, onCancel, saving }: {
    initial: Partial<Product>; onSave: (p: Omit<Product, "id">) => Promise<void>; onCancel: () => void; saving: boolean;
  }) {
    const [form, setForm] = useState<Omit<Product, "id">>({
      name: initial.name ?? "", type: initial.type ?? "",
      size: initial.size ?? "", quantity: initial.quantity ?? 0,
      quantityUnit: initial.quantityUnit ?? "Sq Ft", location: initial.location ?? "",
    });
    const set = (k: keyof typeof form) => (v: any) => setForm(p => ({ ...p, [k]: v }));
    const valid = form.name.trim() && form.type && form.size && form.location.trim() && form.quantity >= 0;

    return (
      <div className="space-y-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
        <Field label="Product Name">
          <input value={form.name} onChange={e => set("name")(e.target.value)}
            placeholder="e.g. Italian White Marble"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><SelectField value={form.type} onChange={set("type")} options={TILE_TYPES} /></Field>
          <Field label="Size"><SelectField value={form.size} onChange={set("size")} options={TILE_SIZES} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input type="number" min="0" value={form.quantity} onChange={e => set("quantity")(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </Field>
          <Field label="Unit"><SelectField value={form.quantityUnit} onChange={set("quantityUnit")} options={QTY_UNITS} /></Field>
        </div>
        <Field label="Location (Godown)">
          <input value={form.location} onChange={e => set("location")(e.target.value)}
            placeholder="e.g. A Godown"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </Field>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave(form)} disabled={!valid || saving}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />{saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium flex items-center gap-1.5">
            <X className="w-4 h-4" />Cancel
          </button>
        </div>
      </div>
    );
  }

  function ProductPanel({ prefetched, prefetchLoading }: { prefetched: Product[]; prefetchLoading: boolean }) {
    const [products, setProducts] = useState<Product[]>(prefetched);
    const [fetched, setFetched] = useState(prefetched.length > 0);
    const [refreshing, setRefreshing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "billing">("all");

    // Sync when parent's prefetch resolves
    useEffect(() => {
      if (prefetched.length > 0 && !fetched) {
        setProducts(prefetched);
        setFetched(true);
      }
    }, [prefetched, fetched]);

    const refresh = useCallback(async () => {
      setRefreshing(true);
      try { const data = await api.admin.getProducts(); setProducts(data); setFetched(true); }
      catch (e: any) { toast.error(e.message); }
      setRefreshing(false);
    }, []);

    // Only fetch ourselves if parent didn't (e.g. navigated directly with token)
    useEffect(() => {
      if (!fetched && !prefetchLoading) refresh();
    }, [fetched, prefetchLoading, refresh]);

    const filtered = products.filter(p => {
      const q = search.toLowerCase();
      const matchesSearch = [p.name, p.type, p.size, p.location].some(v => (v ?? "").toLowerCase().includes(q));
      const matchesSource = sourceFilter === "all" || (p.source ?? "manual") === sourceFilter;
      return matchesSearch && matchesSource;
    });

    const handleAdd = async (form: Omit<Product, "id">) => {
      setSaving(true);
      try {
        const newP = await api.admin.addProduct(form);
        setProducts(prev => [...prev, newP].sort((a, b) => a.name.localeCompare(b.name)));
        setAdding(false);
        toast.success(`"${newP.name}" added`);
      } catch (e: any) { toast.error(e.message); }
      setSaving(false);
    };

    const handleEdit = async (form: Omit<Product, "id">) => {
      if (!editingId) return;
      setSaving(true);
      try {
        const updated = await api.admin.updateProduct(editingId, form);
        setProducts(prev => prev.map(p => p.id === editingId ? updated : p).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingId(null);
        toast.success("Product updated");
      } catch (e: any) { toast.error(e.message); }
      setSaving(false);
    };

    const handleDelete = async (id: string, name: string) => {
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
      setDeletingId(id);
      try {
        await api.admin.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success("Product deleted");
      } catch (e: any) { toast.error(e.message); }
      setDeletingId(null);
    };

    const isLoading = prefetchLoading && !fetched;

    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PackageSearch className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-gray-800">Products</h2>
          <span className="ml-auto text-xs text-gray-400">{products.length} product{products.length !== 1 ? "s" : ""}</span>
          {(isLoading || refreshing) && <span className="text-[10px] text-indigo-500 animate-pulse">loading…</span>}
          <button onClick={refresh} disabled={refreshing} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">Add, edit, or remove inventory tiles directly.</p>

        <div className="flex gap-1 mb-3 p-1 bg-gray-100 rounded-xl">
          {(["all","manual","billing"] as const).map((val) => (
            <button key={val} onClick={() => setSourceFilter(val)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sourceFilter === val ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {val === "all" ? "All" : val === "manual" ? "New Products" : "From Billing"}
            </button>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />

        {adding ? (
          <ProductForm initial={{}} onSave={handleAdd} onCancel={() => setAdding(false)} saving={saving} />
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-2 rounded-lg border border-dashed border-indigo-300 text-indigo-600 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition-colors mb-3">
            <Plus className="w-4 h-4" />Add New Product
          </button>
        )}

        {filtered.length === 0 && !isLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">{search ? "No matches" : "No products yet"}</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p.id} className="rounded-xl border border-gray-100 overflow-hidden">
                {editingId === p.id ? (
                  <div className="p-2">
                    <ProductForm initial={p} onSave={handleEdit} onCancel={() => setEditingId(null)} saving={saving} />
                  </div>
                ) : (
                  <div className="flex items-start px-4 py-3 bg-gray-50 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{p.type}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">{p.size}</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{p.quantity} {p.quantityUnit}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">{p.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingId(p.id); setAdding(false); }}
                        className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} disabled={deletingId === p.id}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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

  function TabPanel({ title, icon: Icon, items, label, placeholder, onAdd, onDelete }: any) {
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
    const [tab, setTab] = useState<Tab>("products");
    const [types, setTypes] = useState<Item[]>([]);
    const [sizes, setSizes] = useState<Item[]>([]);
    const [godowns, setGodowns] = useState<Item[]>([]);
    const [users, setUsers] = useState<Item[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [backupStatus, setBackupStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

    // ── Warm-up: fire the moment this page loads, before login ──────────────────
    // Gives Railway time to wake up while the user types credentials.
    useEffect(() => {
      fetch("/api/health").catch(() => {});
    }, []);

    const load = useCallback(async () => {
      if (!token) return;
      setLoadingAll(true);
      try {
        // Fetch ALL data in parallel — products included — so everything is
        // ready before the user clicks any tab.
        const [t, s, g, u, p] = await Promise.all([
          api.admin.getTypes(), api.admin.getSizes(), api.admin.getGodowns(),
          api.admin.getUsers(), api.admin.getProducts(),
        ]);
        setTypes(t); setSizes(s); setGodowns(g); setUsers(u); setProducts(p);
      } catch (e: any) {
        if (e.message.includes("401") || e.message.includes("403")) {
          setToken(null); localStorage.removeItem("admin_token");
        }
      }
      setLoadingAll(false);
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
                  onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="admin"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••"
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
      { id: "products", label: "Products", icon: PackageSearch },
      { id: "types",   label: "Types",    icon: Layers },
      { id: "sizes",   label: "Sizes",    icon: Ruler },
      { id: "godowns", label: "Godowns",  icon: Warehouse },
      { id: "users",   label: "Users",    icon: Users },
      { id: "backup",  label: "Backup",   icon: Database },
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-sm">Admin Panel</h1>
            <p className="text-[10px] text-gray-400">Inventory Management</p>
          </div>
          <button onClick={load} disabled={loadingAll} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
            <RefreshCw className={`w-4 h-4 ${loadingAll ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => { api.admin.logout(); setToken(null); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white border-b border-gray-100 px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 max-w-lg mx-auto">
          {tab === "products" && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <ProductPanel
                prefetched={products}
                prefetchLoading={loadingAll}
              />
            </div>
          )}
          {tab === "types" && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <TabPanel title="Tile Types" icon={Layers} items={types} label={(i: Item) => i.value!}
                placeholder="e.g. Satin, Stone"
                onAdd={async (v: string) => { const r = await api.admin.addType(v); setTypes(p => [...p, r]); toast.success(`"${v}" added`); }}
                onDelete={async (id: string) => { await api.admin.deleteType(id); setTypes(p => p.filter(x => x.id !== id)); toast.success("Removed"); }} />
            </div>
          )}
          {tab === "sizes" && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <TabPanel title="Tile Sizes" icon={Ruler} items={sizes} label={(i: Item) => i.value!}
                placeholder="e.g. 3x3, 4x4"
                onAdd={async (v: string) => { const r = await api.admin.addSize(v); setSizes(p => [...p, r]); toast.success(`"${v}" added`); }}
                onDelete={async (id: string) => { await api.admin.deleteSize(id); setSizes(p => p.filter(x => x.id !== id)); toast.success("Removed"); }} />
            </div>
          )}
          {tab === "godowns" && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <TabPanel title="Godowns" icon={Warehouse} items={godowns} label={(i: Item) => i.value!}
                placeholder="e.g. C Godown, New Store"
                onAdd={async (v: string) => { const r = await api.admin.addGodown(v); setGodowns(p => [...p, r]); toast.success(`"${v}" added`); }}
                onDelete={async (id: string) => { await api.admin.deleteGodown(id); setGodowns(p => p.filter(x => x.id !== id)); toast.success("Removed"); }} />
            </div>
          )}
          {tab === "users" && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <UserPanel users={users}
                onAdd={async (u: string, pw: string) => { const r = await api.admin.addUser(u, pw); setUsers(p => [...p, r]); toast.success(`User "${u}" created`); }}
                onDelete={async (id: string) => { await api.admin.deleteUser(id); setUsers(p => p.filter(x => x.id !== id)); toast.success("User removed"); }}
                onChangePassword={async (id: string, pw: string) => { await api.admin.changePassword(id, pw); toast.success("Password updated"); }} />
            </div>
          )}
          {tab === "backup" && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-indigo-600" />
                <h2 className="font-semibold text-gray-800">Telegram Backup</h2>
              </div>
              <p className="text-xs text-gray-400 mb-6">Send a full database backup to the configured Telegram users right now. Automatic hourly backups run every hour.</p>
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
                  try { await api.admin.triggerBackup(); setBackupStatus("done"); toast.success("Backup sent to Telegram!"); }
                  catch (e: any) { setBackupStatus("error"); toast.error("Backup failed: " + e.message); }
                }}
                disabled={backupStatus === "sending"}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                {backupStatus === "sending" ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>)
                  : backupStatus === "done" ? (<><Send className="w-4 h-4" /> Sent Successfully</>)
                  : (<><Send className="w-4 h-4" /> Send Backup Now</>)}
              </button>
              {backupStatus === "done" && <p className="text-xs text-green-600 text-center mt-2">✓ Backup delivered to Telegram</p>}
            </div>
          )}
        </div>
      </div>
    );
  }
  