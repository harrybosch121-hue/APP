import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

// "MattyGloss" kept for backward-compat with existing DB records; UI always shows "Carving"
export type TileType = "Gloss" | "Matt" | "MattyGloss" | "Carving";
export type QuantityUnit = "Sq Ft" | "Box";
export type TileSize = "2x2" | "2x4" | "12x18";

/** Normalises legacy "MattyGloss" to the display label "Carving" */
export function displayType(type: string): string {
  return type === "MattyGloss" ? "Carving" : type;
}

/** Returns the canonical storage key for a display-label type */
export function storageType(type: string): TileType {
  return type === "MattyGloss" ? "Carving" : (type as TileType);
}

export interface Tile {
  id: string;
  name: string;
  type: TileType;
  size: TileSize;
  quantity: number;
  quantityUnit: QuantityUnit;
  location: string;
  image: string;
}

export interface AuditEntry {
  id: string;
  staffName: string;
  action: "Added" | "Removed";
  tileName: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  location: string;
  timestamp: Date;
}

interface InventoryContextType {
  tiles: Tile[];
  logs: AuditEntry[];
  loading: boolean;
  addTile: (tile: Omit<Tile, "id">) => Promise<void>;
  updateStock: (id: string, quantity: number) => Promise<void>;
  removeStock: (id: string, quantity: number) => Promise<void>;
  getTile: (id: string) => Tile | undefined;
  refresh: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function parseLogs(raw: any[]): AuditEntry[] {
  return raw.map((l) => ({ ...l, timestamp: new Date(l.timestamp) }));
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [tilesData, logsData] = await Promise.all([api.getTiles(), api.getLogs()]);
      setTiles(tilesData);
      setLogs(parseLogs(logsData));
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const addTile = async (tile: Omit<Tile, "id">) => {
    const newTile = await api.addTile(tile as Record<string, unknown>);
    setTiles((prev) => [newTile, ...prev]);
    const updatedLogs = await api.getLogs();
    setLogs(parseLogs(updatedLogs));
  };

  const updateStock = async (id: string, quantity: number) => {
    const updated = await api.updateStock(id, quantity);
    setTiles((prev) => prev.map((t) => (t.id === id ? updated : t)));
    const updatedLogs = await api.getLogs();
    setLogs(parseLogs(updatedLogs));
  };

  const removeStock = async (id: string, quantity: number) => {
    const updated = await api.removeStock(id, quantity);
    setTiles((prev) => prev.map((t) => (t.id === id ? updated : t)));
    const updatedLogs = await api.getLogs();
    setLogs(parseLogs(updatedLogs));
  };

  const getTile = (id: string) => tiles.find((t) => t.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen premium-bg">
        <p className="font-body text-sm text-muted-foreground animate-pulse">Loading inventory…</p>
      </div>
    );
  }

  return (
    <InventoryContext.Provider value={{ tiles, logs, loading, addTile, updateStock, removeStock, getTile, refresh }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
