import { useState } from "react";
import { ArrowLeft, Minus, Plus, MapPin } from "lucide-react";
import { useInventory } from "@/context/InventoryContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TileDetailScreenProps {
  tileId: string;
  onBack: () => void;
}

export default function TileDetailScreen({ tileId, onBack }: TileDetailScreenProps) {
  const { getTile, removeStock, updateStock } = useInventory();
  const tile = getTile(tileId);
  const [removeQty, setRemoveQty] = useState<number | "">(1);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newQty, setNewQty] = useState<number | "">(tile?.quantity || 0);

  if (!tile) return <p className="p-6 text-muted-foreground">Tile not found</p>;

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
      <button onClick={onBack} className="flex items-center gap-2 px-5 pt-4 text-muted-foreground btn-press">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-body text-sm">Back</span>
      </button>

      <div className="px-5 mt-4 animate-fade-in">
        <img
          src={tile.image}
          alt={tile.name}
          className="w-full h-64 object-cover rounded-2xl shadow-lg"
        />
      </div>

      <div className="px-5 mt-6 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-display text-2xl font-semibold text-foreground">{tile.name}</h2>

        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-0 font-body">{tile.type}</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" /> {tile.location}
          </div>
        </div>

        <div className="p-4 rounded-2xl premium-card">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">Available Stock</p>
          <p className="font-display text-4xl font-semibold text-foreground mt-1">{tile.quantity}</p>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => { setRemoveQty(1); setShowRemoveDialog(true); }}
            variant="outline"
            className="flex-1 h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 font-body btn-press"
          >
            <Minus className="w-4 h-4 mr-1" /> Remove Stock
          </Button>
          <Button
            onClick={() => { setNewQty(tile.quantity); setShowUpdateDialog(true); }}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-body btn-press shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" /> Update Stock
          </Button>
        </div>
      </div>

      {/* Remove Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Remove Stock</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Enter the quantity to remove from <strong>{tile.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => setRemoveQty((q) => Math.max(1, (Number(q) || 1) - 1))}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center btn-press flex-shrink-0"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={1}
              max={tile.quantity}
              value={removeQty}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") { setRemoveQty(""); return; }
                const n = parseInt(v);
                if (!isNaN(n)) setRemoveQty(Math.min(tile.quantity, Math.max(1, n)));
              }}
              onBlur={() => { if (removeQty === "" || Number(removeQty) < 1) setRemoveQty(1); }}
              className="w-24 text-center py-2 rounded-xl bg-card border border-border text-foreground font-display text-3xl font-semibold focus:outline-none focus:ring-2 focus:ring-destructive/30"
            />
            <button
              onClick={() => setRemoveQty((q) => Math.min(tile.quantity, (Number(q) || 0) + 1))}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center btn-press flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center font-body text-xs text-muted-foreground -mt-2 mb-2">
            Available: {tile.quantity} {tile.quantityUnit}
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)} className="flex-1 rounded-xl font-body">
              Cancel
            </Button>
            <Button onClick={handleRemove} className="flex-1 rounded-xl bg-destructive text-destructive-foreground font-body btn-press">
              Confirm Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Update Stock</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Set the new total quantity for <strong>{tile.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={() => setNewQty((q) => Math.max(0, (Number(q) || 0) - 1))}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center btn-press flex-shrink-0"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={0}
              value={newQty}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") { setNewQty(""); return; }
                const n = parseInt(v);
                if (!isNaN(n)) setNewQty(Math.max(0, n));
              }}
              onBlur={() => { if (newQty === "") setNewQty(0); }}
              className="w-24 text-center py-2 rounded-xl bg-card border border-border text-foreground font-display text-3xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => setNewQty((q) => (Number(q) || 0) + 1)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center btn-press flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)} className="flex-1 rounded-xl font-body">
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="flex-1 rounded-xl bg-primary text-primary-foreground font-body btn-press">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
