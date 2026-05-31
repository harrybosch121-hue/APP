import { useState, useEffect } from "react";
  import { Search, MapPin, Package } from "lucide-react";
  import { useInventory, displayType, Tile } from "@/context/InventoryContext";
  import { Badge } from "@/components/ui/badge";
  import { cn } from "@/lib/utils";
  import { api } from "@/lib/api";
  import { toast } from "sonner";

  interface SearchScreenProps {
    onSelectTile: (id: string) => void;
  }

  type CatalogItem = {
    id: string;
    name: string;
    catalogOnly: true;
  };

  export default function SearchScreen({ onSelectTile }: SearchScreenProps) {
    const { tiles } = useInventory();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);

    useEffect(() => {
      setCatalogLoading(true);
      api.getBillingProducts()
        .then((products) => {
          const tileNameSet = new Set(tiles.map((t) => t.name.toLowerCase().trim()));
          const catalogOnly = products
            .filter((p) => !tileNameSet.has(p.name.toLowerCase().trim()))
            .map((p) => ({ id: `billing-${p.id}`, name: p.name, catalogOnly: true as const }));
          setCatalogItems(catalogOnly);
        })
        .catch(() => {})
        .finally(() => setCatalogLoading(false));
    }, [tiles]);

    const allItems: (Tile | CatalogItem)[] = [...tiles, ...catalogItems];

    const filtered = allItems.filter((item) => {
      const q = query.toLowerCase();
      if ("catalogOnly" in item) {
        return item.name.toLowerCase().includes(q);
      }
      const t = item as Tile;
      return (
        t.name.toLowerCase().includes(q) ||
        displayType(t.type).toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q)
      );
    });

    const handleSearch = (val: string) => {
      setQuery(val);
      setLoading(true);
      setTimeout(() => setLoading(false), 300);
    };

    const handleSelectItem = (item: Tile | CatalogItem) => {
      if ("catalogOnly" in item) {
        toast.info(`"${item.name}" is in the product catalog but not yet added to inventory. Use "Add Stock" to track it.`);
        return;
      }
      onSelectTile((item as Tile).id);
    };

    const isLoading = loading || catalogLoading;

    return (
      <div className="min-h-screen premium-bg marble-noise pb-20 pt-4">
        <div className="px-5">
          <h2 className="font-display text-2xl font-light text-foreground mb-1">Search Tiles</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {catalogLoading ? "Loading catalog…" : `${tiles.length} in inventory · ${catalogItems.length} catalog products`}
          </p>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, type, or location..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow shadow-sm"
            />
          </div>

          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl premium-card">
                    <div className="w-16 h-16 rounded-xl shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded shimmer" />
                      <div className="h-3 w-1/2 rounded shimmer" />
                    </div>
                  </div>
                ))
              : filtered.map((item, i) => {
                  const isCatalog = "catalogOnly" in item;
                  const tile = isCatalog ? null : (item as Tile);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        "w-full flex gap-4 p-4 rounded-2xl premium-card text-left btn-press hover:shadow-md transition-all animate-fade-in",
                        isCatalog && "opacity-75"
                      )}
                      style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}
                    >
                      {tile?.image ? (
                        <img src={tile.image} alt={tile.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold text-foreground truncate">{item.name}</p>
                        {isCatalog ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] font-medium bg-muted text-muted-foreground border-0">
                              Catalog
                            </Badge>
                            <span className="text-xs text-muted-foreground">Not in inventory</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border-0">
                                {displayType(tile!.type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{tile!.quantity} {tile!.quantityUnit}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" /> {tile!.location}
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
            {!isLoading && filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">No tiles found</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  