import { useInventory } from "@/context/InventoryContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function LogsScreen() {
  const { logs } = useInventory();

  return (
    <div className="min-h-screen premium-bg marble-noise pb-20 pt-4">
      <div className="px-5">
        <h2 className="font-display text-2xl font-light text-foreground mb-4">Audit Logs</h2>

        <div className="space-y-2">
          {logs.map((log, i) => {
            const isPrice = log.action === "Price Set" || log.action === "Price Updated";
            return (
            <div
              key={log.id}
              className="flex items-center gap-3 p-4 rounded-2xl premium-card animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Action indicator */}
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isPrice ? "bg-primary" : log.action === "Added" ? "bg-success" : "bg-destructive"
                )}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-foreground truncate">{log.tileName}</p>
                  <span
                    className={cn(
                      "text-xs font-body font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                      isPrice
                        ? "bg-primary/10 text-primary"
                        : log.action === "Added"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {isPrice
                      ? `₹${Number(log.quantity).toLocaleString("en-IN")}`
                      : `${log.action === "Added" ? "+" : "−"}${log.quantity} ${log.quantityUnit}`}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-body text-xs text-muted-foreground">
                    {log.staffName}{isPrice ? ` · ${log.action === "Price Set" ? "Rate added" : "Rate updated"}` : ""}
                  </span>
                  <span className="font-body text-xs text-muted-foreground">{log.location}</span>
                  <span className="font-body text-[10px] text-muted-foreground">
                    {format(log.timestamp, "dd MMM, hh:mm a")}
                  </span>
                </div>
              </div>
            </div>
            );
          })}
          {logs.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">No logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
