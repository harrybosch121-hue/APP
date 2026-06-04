import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
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
  price?: number | null;
  source?: string;
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
  addTile: (tile: Omit<Tile, "id">) => Promise<Tile>;
  updateStock: (id: string, quantity: number) => Promise<void>;
  updateImage: (id: string, image: string) => Promise<void>;
  updatePrice: (id: string, price: number) => Promise<void>;
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
  // Start as false — render the UI immediately with empty data while the
  // first fetch is in flight. Screens show empty/skeleton states instead
  // of a full-page loading block.
  const [loading, setLoading] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const refresh = async () => {
    if (!initialised) setLoading(true);
    try {
      const [tilesData, logsData] = await Promise.all([api.getTiles(), api.getLogs()]);
      setTiles(tilesData);
      setLogs(parseLogs(logsData));
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
      setInitialised(true);
    }
  };

  useEffect(() => { refresh(); }, []);

  // Keep inventory in sync with server-side changes (e.g. edits made from the
  // Admin panel on another device). After the first load, refresh() runs
  // silently — it only flips `loading` before the app is initialised — so
  // these background syncs never flash skeletons.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const POLL_MS = 15000;

    const syncNow = () => {
      // Don't poll a backgrounded tab; we refetch on the visibility/focus
      // events below the moment the user returns.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      refreshRef.current();
    };

    const onReturn = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        refreshRef.current();
      }
    };

    const timer = setInterval(syncNow, POLL_MS);
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, []);

  const addTile = async (tile: Omit<Tile, "id">) => {
    const newTile = await api.addTile(tile as Record<string, unknown>);
    setTiles((prev) => [newTile, ...prev]);
    const updatedLogs = await api.getLogs();
    setLogs(parseLogs(updatedLogs));
    return newTile as Tile;
  };

  const updateStock = async (id: string, quantity: number) => {
    await api.updateStock(id, quantity);
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, quantity } : t)));
    const updatedLogs = await api.getLogs();
    setLogs(parseLogs(updatedLogs));
  };

  const updateImage = async (id: string, image: string) => {
    await api.updateImage(id, image);
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, image } : t)));
  };

  const updatePrice = async (id: string, price: number) => {
    await api.updatePrice(id, price);
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, price } : t)));
  };

  const removeStock = async (id: string, quantity: number) => {
    const tile = tiles.find((t) => t.id === id);
    if (!tile) throw new Error("Tile not found");
    const newQty = Math.max(0, tile.quantity - quantity);
    await api.removeStock(id, quantity);
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, quantity: newQty } : t)));
    const updatedLogs = await api.getLogs();
    setLogs(parseLogs(updatedLogs));
  };

  const getTile = (id: string) => tiles.find((t) => t.id === id);

  return (
    <InventoryContext.Provider value={{ tiles, logs, loading, addTile, updateStock, updateImage, updatePrice, removeStock, getTile, refresh }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside InventoryProvider");
  return ctx;
}