import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Upload, ArrowLeft, Warehouse, RefreshCw } from "lucide-react";
import { useInventory, displayType, TileType, QuantityUnit, TileSize } from "@/context/InventoryContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import marbleTile from "@/assets/marble-tile.jpeg";
import { toast } from "sonner";
import { api } from "@/lib/api";

type BillingProduct = { id: string; name: string };

function AddStockForm({ onBack }: { onBack: () => void }) {
  const { addTile } = useInventory();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>("Box");
  const [type, setType] = useState<TileType>("Gloss");
  const [size, setSize] = useState<TileSize>("2x2");
  const [location, setLocation] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [billingProducts, setBillingProducts] = useState<BillingProduct[]>([]);
  const [billingProductsError, setBillingProductsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const activeRef = useRef(true);

  const loadBillingProducts = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const products = await api.getBillingProducts();
      if (!activeRef.current) return;
      setBillingProducts(products || []);
      setBillingProductsError(null);
      if (isManual) toast.success(`Loaded ${(products || []).length} products`);
    } catch {
      if (!activeRef.current) return;
      setBillingProductsError("Unable to load product names from billing");
      if (isManual) toast.error("Could not reach billing service");
    } finally {
      if (activeRef.current) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    loadBillingProducts(false);
    return () => { activeRef.current = false; };
  }, [loadBillingProducts]);

  const filteredProductSuggestions = billingProducts
    .filter((p) => p.name.toLowerCase().includes(name.toLowerCase()))
    .slice(0, 8);

  const handleSave = async () => {
    if (!name.trim() || !location.trim()) { toast.error("Please fill in all fields"); return; }
    try {
      await addTile({ name, quantity: Number(quantity) || 0, quantityUnit, type, size, location, image: preview || marbleTile });
      toast.success(`${name} added successfully`);
      onBack();
    } catch {
      toast.error("Failed to add tile. Check your connection.");
    }
  };

  return (
    <div className="min-h-screen premium-bg marble-noise pb-20 pt-4">
      <div className="px-5">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h2 className="font-display text-2xl font-light text-foreground">Add Stock</h2>
        </div>
        <div className="space-y-5">
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Name</label>
              <button type="button" onClick={() => loadBillingProducts(true)} disabled={isRefreshing}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing…" : "Refresh products"}
              </button>
            </div>
            <input value={name}
              onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Start typing product name"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
            {billingProductsError && <p className="mt-2 text-xs text-destructive">{billingProductsError}</p>}
            {showSuggestions && name.trim() !== "" && filteredProductSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-10 mt-2 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                {filteredProductSuggestions.map((product) => (
                  <button key={product.id} type="button"
                    onMouseDown={() => { setName(product.name); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-primary/10">
                    {product.name}
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && name.trim() !== "" && filteredProductSuggestions.length === 0 && billingProducts.length > 0 && (
              <div className="absolute left-0 right-0 z-10 mt-2 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                <div className="px-4 py-3 text-sm text-muted-foreground">No matching products found</div>
              </div>
            )}
          </div>
          <div>
            <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Quantity</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity((q) => Math.max(0, (Number(q) || 0) - 1))} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center btn-press text-foreground"><Minus className="w-4 h-4" /></button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-20 text-center py-2 rounded-xl bg-card border border-border text-foreground font-body text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={() => setQuantity((q) => (Number(q) || 0) + 1)} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center btn-press shadow-md"><Plus className="w-4 h-4" /></button>
              <Select value={quantityUnit} onValueChange={(v) => setQuantityUnit(v as QuantityUnit)}>
                <SelectTrigger className="rounded-xl bg-card border-border h-10 min-w-[90px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sq Ft">Sq Ft</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as TileType)}>
              <SelectTrigger className="rounded-xl bg-card border-border h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Gloss">Gloss</SelectItem>
                <SelectItem value="Matt">Matt</SelectItem>
                <SelectItem value="Carving">Carving</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Size</label>
            <Select value={size} onValueChange={(v) => setSize(v as TileSize)}>
              <SelectTrigger className="rounded-xl bg-card border-border h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2x2">2x2</SelectItem>
                <SelectItem value="2x4">2x4</SelectItem>
                <SelectItem value="12x18">12x18</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Location (Godown)</label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="rounded-xl bg-card border-border h-12"><SelectValue placeholder="Select godown" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="D Godown">D Godown</SelectItem>
                <SelectItem value="A Godown">A Godown</SelectItem>
                <SelectItem value="B1 Godown">B1 Godown</SelectItem>
                <SelectItem value="B2 Godown">B2 Godown</SelectItem>
                <SelectItem value="Main Godown">Main Godown</SelectItem>
                <SelectItem value="Side Godown">Side Godown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Tile Image</label>
            <label className="flex items-center gap-3 p-4 rounded-xl bg-card border border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="font-body text-sm text-muted-foreground">Upload image</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPreview(r.result as string); r.readAsDataURL(f); }}} />
            </label>
            {preview && <div className="mt-3"><img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" /></div>}
          </div>
          <Button onClick={handleSave} className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg btn-press hover:shadow-xl transition-shadow mt-4">Save Tile</Button>
        </div>
      </div>
    </div>
  );
}

export default function StockScreen() {
  const { tiles } = useInventory();
  const [view, setView] = useState<"overview" | "add">("overview");
  const [designSizeFilter, setDesignSizeFilter] = useState<TileSize | "all">("all");

  if (view === "add") return <AddStockForm onBack={() => setView("overview")} />;

  const totalSqFt = tiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
  const totalBox  = tiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
  const filteredDesigns = designSizeFilter === "all" ? tiles : tiles.filter((t) => t.size === designSizeFilter);
  const allSizes = Array.from(new Set(tiles.map((t) => t.size))).sort();

  // Merge MattyGloss + Carving into one "Carving" group
  const normalizeType = (t: string) => t === "MattyGloss" ? "Carving" : t;
  const typeGroups = ["Gloss", "Matt", "Carving"] as const;
  const godowns = Array.from(new Set(tiles.map((t) => t.location))).sort();

  return (
    <div className="min-h-screen premium-bg marble-noise pb-20 pt-4">
      <div className="px-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-light text-foreground">Stock</h2>
          <Button onClick={() => setView("add")} className="rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm px-4 h-9 shadow-md btn-press">
            <Plus className="w-4 h-4 mr-1" /> Add Stock
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl premium-card">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Sq Ft</p>
            <p className="font-display text-2xl font-semibold text-foreground">{totalSqFt.toLocaleString()}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="p-4 rounded-2xl premium-card">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Boxes</p>
            <p className="font-display text-2xl font-semibold text-foreground">{totalBox.toLocaleString()}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="p-4 rounded-2xl premium-card flex flex-col">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-1">Designs</p>
            <p className="font-display text-2xl font-semibold text-foreground">{filteredDesigns.length}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(["all", ...allSizes] as Array<TileSize | "all">).map((s) => (
                <button key={s} onClick={() => setDesignSizeFilter(s)}
                  className={`font-body text-[10px] px-1.5 py-0.5 rounded-md border transition-colors ${designSizeFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border"}`}>
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">By Type</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {typeGroups.map((label) => {
            const typeTiles = tiles.filter((t) => normalizeType(t.type) === label);
            if (typeTiles.length === 0) return null;
            const sqFt = typeTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
            const box  = typeTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
            return (
              <div key={label} className="p-3 rounded-2xl premium-card">
                <p className="font-body text-xs font-semibold text-primary mb-1 truncate">{label}</p>
                <p className="font-body text-xs text-muted-foreground mb-1">{typeTiles.length} designs</p>
                {sqFt > 0 && <p className="font-body text-xs text-foreground">{sqFt.toLocaleString()} <span className="text-muted-foreground">Sq Ft</span></p>}
                {box  > 0 && <p className="font-body text-xs text-foreground">{box.toLocaleString()} <span className="text-muted-foreground">Box</span></p>}
                {sqFt === 0 && box === 0 && <p className="font-body text-xs text-muted-foreground">—</p>}
              </div>
            );
          })}
        </div>

        <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">By Size</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {allSizes.map((sz) => {
            const sizeTiles = tiles.filter((t) => t.size === sz);
            const sqFt = sizeTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
            const box  = sizeTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
            return (
              <div key={sz} className="p-3 rounded-2xl premium-card">
                <p className="font-body text-xs font-semibold text-primary mb-2">{sz}</p>
                {sqFt > 0 && <p className="font-body text-xs text-foreground">{sqFt.toLocaleString()} <span className="text-muted-foreground">Sq Ft</span></p>}
                {box  > 0 && <p className="font-body text-xs text-foreground">{box.toLocaleString()} <span className="text-muted-foreground">Box</span></p>}
                {sqFt === 0 && box === 0 && <p className="font-body text-xs text-muted-foreground">—</p>}
              </div>
            );
          })}
        </div>

        <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Godown Wise</h3>
        <div className="space-y-3">
          {godowns.map((godown) => {
            const godownTiles = tiles.filter((t) => t.location === godown);
            const sqFt = godownTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
            const box  = godownTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
            return (
              <div key={godown} className="p-4 rounded-2xl premium-card">
                <div className="flex items-center gap-2 mb-3">
                  <Warehouse className="w-4 h-4 text-primary" />
                  <p className="font-body text-sm font-semibold text-foreground">{godown}</p>
                  <span className="ml-auto font-body text-xs text-muted-foreground">{godownTiles.length} tile{godownTiles.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex gap-4">
                  {sqFt > 0 && <div><p className="font-display text-xl font-semibold text-foreground">{sqFt.toLocaleString()}</p><p className="font-body text-xs text-muted-foreground">Sq Ft</p></div>}
                  {box  > 0 && <div><p className="font-display text-xl font-semibold text-foreground">{box.toLocaleString()}</p><p className="font-body text-xs text-muted-foreground">Box</p></div>}
                  {sqFt === 0 && box === 0 && <p className="font-body text-xs text-muted-foreground">No stock</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
