import { ArrowUp, ArrowDown, BarChart3, TrendingUp, TrendingDown, Layers, Package } from "lucide-react";
  import { useInventory, displayType } from "@/context/InventoryContext";

  const normalizeType = (t: string) => t === "MattyGloss" ? "Carving" : t;
  const TYPE_GROUPS = ["Gloss", "Matt", "Carving"] as const;

  export default function AnalyticsScreen() {
    const { tiles } = useInventory();

    // Only work with tiles that have stock
    const withStock = tiles.filter((t) => t.quantity > 0).sort((a, b) => b.quantity - a.quantity);
    const top5      = withStock.slice(0, 5);
    const bottom5   = [...withStock].sort((a, b) => a.quantity - b.quantity).slice(0, 5);

    // Summary totals (in-stock only)
    const totalSqFt = withStock.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
    const totalBox  = withStock.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);

    // Type breakdown — count & quantities from in-stock tiles only
    const typeBreakdown = TYPE_GROUPS.map((label) => {
      const typeTiles = withStock.filter((t) => normalizeType(t.type) === label);
      const sqFt = typeTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
      const box  = typeTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
      return { label, count: typeTiles.length, sqFt, box };
    }).filter((x) => x.count > 0);

    const maxSqFt = Math.max(...typeBreakdown.map((x) => x.sqFt), 1);
    const maxBox  = Math.max(...typeBreakdown.map((x) => x.box), 1);

    // Size breakdown — in-stock tiles only
    const allSizes = Array.from(new Set(withStock.map((t) => t.size))).sort();
    const sizeBreakdown = allSizes.map((sz) => {
      const szTiles = withStock.filter((t) => t.size === sz);
      const sqFt = szTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
      const box  = szTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
      return { sz, count: szTiles.length, sqFt, box };
    }).filter((x) => x.count > 0);

    // Godown breakdown — in-stock tiles only
    const allGodowns = Array.from(new Set(withStock.map((t) => t.location))).sort();
    const godownBreakdown = allGodowns.map((g) => {
      const gTiles = withStock.filter((t) => t.location === g);
      const sqFt = gTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
      const box  = gTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
      return { g, count: gTiles.length, sqFt, box };
    }).sort((a, b) => (b.sqFt + b.box) - (a.sqFt + a.box));
    const maxGodownBox = Math.max(...godownBreakdown.map((x) => x.box), 1);
    const maxGodownSqFt = Math.max(...godownBreakdown.map((x) => x.sqFt), 1);

    return (
      <div className="min-h-screen premium-bg marble-noise pb-24 pt-4">
        <div className="px-5">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl font-light text-foreground">Analytics</h2>
          </div>

          {/* Summary cards — all in-stock only */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-2xl premium-card text-center">
              <p className="font-display text-2xl font-semibold text-foreground">{withStock.length}</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">Designs</p>
            </div>
            <div className="p-3 rounded-2xl premium-card text-center">
              <div className="flex items-center justify-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <p className="font-display text-2xl font-semibold text-foreground">{totalSqFt.toLocaleString()}</p>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-0.5">Sq Ft</p>
            </div>
            <div className="p-3 rounded-2xl premium-card text-center">
              <div className="flex items-center justify-center gap-1">
                <Package className="w-3.5 h-3.5 text-primary" />
                <p className="font-display text-2xl font-semibold text-foreground">{totalBox.toLocaleString()}</p>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-0.5">Boxes</p>
            </div>
          </div>

          {/* Stock by Type */}
          <div className="p-4 rounded-2xl premium-card mb-5">
            <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Stock by Type</p>
            {typeBreakdown.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">No stock data yet</p>
            ) : (
              <div className="space-y-5">
                {typeBreakdown.map((tp) => (
                  <div key={tp.label}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-sm font-semibold text-foreground">{tp.label}</span>
                      <span className="font-body text-xs text-muted-foreground">{tp.count} design{tp.count !== 1 ? "s" : ""}</span>
                    </div>
                    {tp.sqFt > 0 && (
                      <div className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="font-body text-xs text-muted-foreground">Sq Ft</span>
                          <span className="font-body text-xs text-foreground">{tp.sqFt.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(tp.sqFt / maxSqFt) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {tp.box > 0 && (
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="font-body text-xs text-muted-foreground">Box</span>
                          <span className="font-body text-xs text-foreground">{tp.box.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${(tp.box / maxBox) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock by Size */}
          <div className="p-4 rounded-2xl premium-card mb-5">
            <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Stock by Size</p>
            {sizeBreakdown.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">No stock data yet</p>
            ) : (
              <div className="space-y-4">
                {sizeBreakdown.map((s) => (
                  <div key={s.sz}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-sm font-semibold text-foreground">{s.sz}</span>
                      <span className="font-body text-xs text-muted-foreground">{s.count} design{s.count !== 1 ? "s" : ""}</span>
                    </div>
                    {s.sqFt > 0 && <p className="font-body text-xs text-muted-foreground">{s.sqFt.toLocaleString()} Sq Ft</p>}
                    {s.box  > 0 && <p className="font-body text-xs text-muted-foreground">{s.box.toLocaleString()} Box</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock by Godown */}
          <div className="p-4 rounded-2xl premium-card mb-5">
            <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Stock by Godown</p>
            {godownBreakdown.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">No stock data yet</p>
            ) : (
              <div className="space-y-5">
                {godownBreakdown.map((g) => (
                  <div key={g.g}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-sm font-semibold text-foreground">{g.g}</span>
                      <span className="font-body text-xs text-muted-foreground">{g.count} design{g.count !== 1 ? "s" : ""}</span>
                    </div>
                    {g.sqFt > 0 && (
                      <div className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="font-body text-xs text-muted-foreground">Sq Ft</span>
                          <span className="font-body text-xs text-foreground">{g.sqFt.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(g.sqFt / maxGodownSqFt) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {g.box > 0 && (
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="font-body text-xs text-muted-foreground">Box</span>
                          <span className="font-body text-xs text-foreground">{g.box.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${(g.box / maxGodownBox) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Highest Stock */}
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Highest Stock</h3>
          </div>
          <div className="space-y-2 mb-6">
            {top5.length === 0 && <p className="font-body text-sm text-muted-foreground px-1">No stock data yet</p>}
            {top5.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl premium-card">
                <span className="font-display text-sm font-bold text-primary w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{displayType(t.type)} · {t.size} · {t.location}</p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-primary" />
                  <div>
                    <p className="font-display text-base font-semibold text-foreground">{t.quantity.toLocaleString()}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{t.quantityUnit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lowest Stock */}
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">Lowest Stock</h3>
          </div>
          <div className="space-y-2 mb-6">
            {bottom5.length === 0 && <p className="font-body text-sm text-muted-foreground px-1">No stock data yet</p>}
            {bottom5.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl premium-card border border-destructive/15">
                <span className="font-display text-sm font-bold text-destructive w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{displayType(t.type)} · {t.size} · {t.location}</p>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-destructive" />
                  <div>
                    <p className="font-display text-base font-semibold text-destructive">{t.quantity.toLocaleString()}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{t.quantityUnit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  