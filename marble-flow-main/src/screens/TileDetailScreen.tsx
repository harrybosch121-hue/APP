import { useState } from "react";
  import { ArrowLeft, Minus, Plus, MapPin, ClipboardList } from "lucide-react";
  import { useInventory, displayType } from "@/context/InventoryContext";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
  } from "@/components/ui/dialog";
  import { toast } from "sonner";

  interface TileDetailScreenProps {
    tileId: string;
    onBack: () => void;
  }

  function formatDate(date: Date): string {
    return date.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  }

  export default function TileDetailScreen({ tileId, onBack }: TileDetailScreenProps) {
    const { getTile, removeStock, updateStock, logs } = useInventory();
    const tile = getTile(tileId);
    const [removeQty, setRemoveQty] = useState<number | "">(1);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [newQty, setNewQty] = useState<number | "">(tile?.quantity || 0);

    if (!tile) return <p className="p-6 text-muted-foreground">Tile not found</p>;

    // Filter logs for this specific tile (by name, case-insensitive), newest first
    const tileLogs = logs
      .filter((l) => l.tileName.toLowerCase().trim() === tile.name.toLowerCase().trim())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const handleRemove = async () => {
      const qty = Number(removeQty) || 0;
      if (qty <= 0) { toast.error("Enter a quantity greater than 0"); return; }
      await removeStock(tile.id, qty);
      setShowRemoveDialog(false);
      toast.success(`Removed ${qty} units from ${tile.name}`);
    };

    const handleUpdate = async () => {
      const qty = Number(newQty);
      if (isNaN(qty) || qty < 0) { toast.error("Enter a valid quantity"); return; }
      await updateStock(tile.id, qty);
      setShowUpdateDialog(false);
      toast.success(`Updated stock for ${tile.name}`);
    };

    return (
      <div className="min-h-screen premium-bg marble-noise pb-20">
        {/* Hero: tile image as full-bleed background */}
        <div className="relative w-full overflow-hidden" style={{ height: "60vh", minHeight: "280px" }}>
          {tile.image ? (
            <img src={tile.image} alt={tile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />

          <button onClick={onBack} className="absolute top-5 left-4 flex items-center gap-2 text-white btn-press z-10">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-body text-sm">Back</span>
          </button>

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 animate-fade-in">
            <h2 className="font-display text-3xl font-semibold text-white leading-tight">{tile.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-primary/80 text-white border-0 font-body backdrop-blur-sm px-3 py-1">
                {displayType(tile.type)}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-white/80">
                <MapPin className="w-3.5 h-3.5" /> {tile.location}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 mt-5 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Stock card */}
          <div className="p-4 rounded-2xl premium-card">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Available Stock</p>
            <p className="font-display text-4xl font-semibold text-foreground mt-1">{tile.quantity}</p>
            <p className="font-body text-xs text-muted-foreground mt-2">
              Update the available stock for this tile at the selected godown.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={() => { setRemoveQty(1); setShowRemoveDialog(true); }} variant="outline"
              className="flex-1 h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 font-body btn-press">
              <Minus className="w-4 h-4 mr-1" /> Remove Stock
            </Button>
            <Button onClick={() => { setNewQty(tile.quantity); setShowUpdateDialog(true); }}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-body btn-press shadow-md">
              <Plus className="w-4 h-4 mr-1" /> Update Stock
            </Button>
          </div>

          {/* ── Logs section ── */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-body text-sm font-semibold text-foreground uppercase tracking-wider">Logs</h3>
              {tileLogs.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{tileLogs.length} entr{tileLogs.length === 1 ? "y" : "ies"}</span>
              )}
            </div>

            {tileLogs.length === 0 ? (
              <div className="p-4 rounded-2xl premium-card text-center">
                <p className="font-body text-xs text-muted-foreground">No activity logged for this tile yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tileLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3.5 rounded-2xl premium-card animate-fade-in">
                    {/* Action dot */}
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${log.action === "Added" ? "bg-green-500" : "bg-destructive"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-body text-xs font-semibold ${log.action === "Added" ? "text-green-600" : "text-destructive"}`}>
                          {log.action}
                        </span>
                        <span className="font-body text-xs text-muted-foreground">by {log.staffName}</span>
                      </div>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{formatDate(new Date(log.timestamp))}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-body text-sm font-semibold text-foreground">{log.quantity}</p>
                      <p className="font-body text-[10px] text-muted-foreground">{log.quantityUnit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Remove Stock Dialog */}
        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogContent className="rounded-2xl max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-foreground">Remove Stock</DialogTitle>
              <DialogDescription className="font-body text-sm">
                Enter the quantity to remove from <strong>{tile.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center gap-4 py-4">
              <button onClick={() => setRemoveQty((q) => Math.max(1, (Number(q) || 1) - 1))}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center btn-press flex-shrink-0">
                <Minus className="w-4 h-4" />
              </button>
              <input type="number" min={1} max={tile.quantity} value={removeQty}
                onChange={(e) => { const v = e.target.value; if (v === "") { setRemoveQty(""); return; } const n = parseInt(v); if (!isNaN(n)) setRemoveQty(Math.min(tile.quantity, Math.max(1, n))); }}
                onBlur={() => { if (removeQty === "" || Number(removeQty) < 1) setRemoveQty(1); }}
                className="w-24 text-center py-2 rounded-xl bg-card border border-border text-foreground font-display text-3xl font-semibold focus:outline-none focus:ring-2 focus:ring-destructive/30" />
              <button onClick={() => setRemoveQty((q) => Math.min(tile.quantity, (Number(q) || 0) + 1))}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center btn-press flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center font-body text-xs text-muted-foreground -mt-2 mb-2">Available: {tile.quantity} {tile.quantityUnit}</p>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRemoveDialog(false)} className="flex-1 rounded-xl font-body">Cancel</Button>
              <Button onClick={handleRemove} className="flex-1 rounded-xl bg-destructive text-destructive-foreground font-body btn-press">Confirm Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Stock Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="rounded-2xl max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-foreground">Update Stock</DialogTitle>
              <DialogDescription className="font-body text-sm">
                Set the new total quantity for <strong>{tile.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center gap-4 py-4">
              <button onClick={() => setNewQty((q) => Math.max(0, (Number(q) || 0) - 1))}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center btn-press flex-shrink-0">
                <Minus className="w-4 h-4" />
              </button>
              <input type="number" min={0} value={newQty}
                onChange={(e) => { const v = e.target.value; if (v === "") { setNewQty(""); return; } const n = parseInt(v); if (!isNaN(n)) setNewQty(Math.max(0, n)); }}
                onBlur={() => { if (newQty === "") setNewQty(0); }}
                className="w-24 text-center py-2 rounded-xl bg-card border border-border text-foreground font-display text-3xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={() => setNewQty((q) => (Number(q) || 0) + 1)}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center btn-press flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)} className="flex-1 rounded-xl font-body">Cancel</Button>
              <Button onClick={handleUpdate} className="flex-1 rounded-xl bg-primary text-primary-foreground font-body btn-press">Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  