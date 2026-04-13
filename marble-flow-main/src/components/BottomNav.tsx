import { Home, Search, Package, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: string;
  onNavigate: (screen: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "stock", label: "Stock", icon: Package },
  { id: "logs", label: "Logs", icon: ClipboardList },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 btn-press",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn("text-[10px] font-body tracking-wide", isActive ? "font-semibold" : "font-normal")}>
                {tab.label}
              </span>
              {isActive && <div className="w-4 h-0.5 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
