import { ArrowUp, ArrowDown, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { useInventory } from "@/context/InventoryContext";

export default function AnalyticsScreen() {
  const { tiles } = useInventory();

  const withStock  = tiles.filter((t) => t.quantity > 0).sort((a, b) => b.quantity - a.quantity);
  const top5       = withStock.slice(0, 5);
  const bottom5    = [...withStock].sort((a, b) => a.quantity - b.quantity).slice(0, 5);
  const zeroStock  = tiles.filter((t) => t.quantity === 0);

  const allTypes = Array.from(new Set(tiles.map((t) => t.type)));
  const typeBreakdown = allTypes.map((tp) => {
    const typeTiles = tiles.filter((t) => t.type === tp);
    const sqFt = typeTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
    const box  = typeTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
    const label = tp === "MattyGloss" ? "Carving" : tp;
    return { label, tp, count: typeTiles.length, sqFt, box };
  }).filter((x) => x.count > 0).sort((a, b) => (b.sqFt + b.box) - (a.sqFt + a.box));

  const maxSqFt = Math.max(...typeBreakdown.map((x) => x.sqFt), 1);
  const maxBox  = Math.max(...typeBreakdown.map((x) => x.box), 1);

  const allSizes = Array.from(new Set(tiles.map((t) => t.size)));
  const sizeBreakdown = allSizes.map((sz) => {
    const szTiles = tiles.filter((t) => t.size === sz);
    const sqFt = szTiles.filter((t) => t.quantityUnit === "Sq Ft").reduce((s, t) => s + t.quantity, 0);
    const box  = szTiles.filter((t) => t.quantityUnit === "Box").reduce((s, t) => s + t.quantity, 0);
    return { sz, count: szTiles.length, sqFt, box };
  }).filter((x) => x.count > 0).sort((a, b) => (b.sqFt + b.box) - (a.sqFt + a.box));

  return (
    <div className="min-h-screen premium-bg marble-noise pb-24 pt-4">
      <div className="px-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-light text-foreground">Analytics</h2>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-2xl premium-card text-center">
            <p className="font-display text-2xl font-semibold text-foreground">{tiles.length}</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Total Designs</p>
          </div>
          <div className="p-3 rounded-2xl premium-card text-center">
            <p className="font-display text-2xl font-semibold text-foreground">{withStock.length}</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">In Stock</p>
          </div>
          <div className="p-3 rounded-2xl premium-card text-center border border-destructive/20">
            <p className="font-display text-2xl font-semibold text-destructive">{zeroStock.length}</p>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Out of Stock</p>
          </div>
        </div>

        {/* Stock by Type */}
        <div className="p-4 rounded-2xl premium-card mb-5">
          <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Stock by Type</p>
          <div className="space-y-5">
            {typeBreakdown.map((tp) => (
              <div key={tp.tp}>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-sm font-semibold text-foreground">{tp.label}</span>
                  <span className="font-body text-xs text-muted-foreground">{tp.count} designs</span>
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
        </div>

        {/* Stock by Size */}
        <div className="p-4 rounded-2xl premium-card mb-5">
          <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Stock by Size</p>
          <div className="space-y-4">
            {sizeBreakdown.map((s) => (
              <div key={s.sz}>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-sm font-semibold text-foreground">{s.sz}</span>
                  <span className="font-body text-xs text-muted-foreground">{s.count} designs</span>
                </div>
                {s.sqFt > 0 && <p className="font-body text-xs text-muted-foreground">{s.sqFt.toLocaleString()} Sq Ft</p>}
                {s.box  > 0 && <p className="font-body text-xs text-muted-foreground">{s.box.toLocaleString()} Box</p>}
              </div>
            ))}
          </div>
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
                <p className="font-body text-xs text-muted-foreground">{t.type === "MattyGloss" ? "Carving" : t.type} · {t.size} · {t.location}</p>
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
                <p className="font-body text-xs text-muted-foreground">{t.type === "MattyGloss" ? "Carving" : t.type} · {t.size} · {t.location}</p>
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

        {/* Out of Stock */}
        {zeroStock.length > 0 && (
          <>
            <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Out of Stock ({zeroStock.length})
            </h3>
            <div className="space-y-2">
              {zeroStock.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl bg-destructive/5 border border-destructive/20">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{t.type === "MattyGloss" ? "Carving" : t.type} · {t.size} · {t.location}</p>
                  </div>
                  <span className="font-body text-xs text-destructive font-bold">EMPTY</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
