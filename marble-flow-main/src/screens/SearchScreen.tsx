import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useInventory, displayType } from "@/context/InventoryContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchScreenProps {
  onSelectTile: (id: string) => void;
}

export default function SearchScreen({ onSelectTile }: SearchScreenProps) {
  const { tiles } = useInventory();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = tiles.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      displayType(t.type).toLowerCase().includes(query.toLowerCase()) ||
      t.type.toLowerCase().includes(query.toLowerCase()) ||
      t.location.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (val: string) => {
    setQuery(val);
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <div className="min-h-screen premium-bg marble-noise pb-20 pt-4">
      <div className="px-5">
        <h2 className="font-display text-2xl font-light text-foreground mb-4">Search Tiles</h2>

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
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl premium-card">
                  <div className="w-16 h-16 rounded-xl shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded shimmer" />
                    <div className="h-3 w-1/2 rounded shimmer" />
                  </div>
                </div>
              ))
            : filtered.map((tile, i) => (
                <button
                  key={tile.id}
                  onClick={() => onSelectTile(tile.id)}
                  className={cn(
                    "w-full flex gap-4 p-4 rounded-2xl premium-card text-left btn-press hover:shadow-md transition-all animate-fade-in"
                  )}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {tile.image ? <img src={tile.image} alt={tile.name} className="w-16 h-16 rounded-xl object-cover" /> : <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-foreground truncate">{tile.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border-0">
                        {displayType(tile.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{tile.quantity} {tile.quantityUnit}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" /> {tile.location}
                    </div>
                  </div>
                </button>
              ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">No tiles found</p>
          )}
        </div>
      </div>
    </div>
  );
}
