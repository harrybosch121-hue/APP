import { useState, useRef } from "react";
import { Plus, Search, Camera, LogOut } from "lucide-react";
import marbleTile from "@/assets/marble-tile.jpeg";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function HomeScreen({ onNavigate, onLogout }: HomeScreenProps) {
  const [rotation, setRotation] = useState({ x: 10, y: -10 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setRotation((r) => ({ x: r.x - dy * 0.3, y: r.y + dx * 0.3 }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen premium-bg marble-noise overflow-hidden px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent opacity-60" />

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="absolute top-5 right-5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-border text-muted-foreground font-body text-xs btn-press hover:text-destructive transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" /> Logout
      </button>

      {/* App title */}
      <div className="relative z-10 text-center mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-light tracking-wide text-foreground">
          Sri Balaji
        </h1>
        <p className="font-display text-lg font-light text-primary tracking-[0.3em] uppercase mt-1">
          Marble & Tiles
        </p>
      </div>

      {/* 3D Tile Preview */}
      <div className="relative z-10 animate-fade-in spotlight" style={{ perspective: "800px", animationDelay: "0.15s" }}>
        <div
          className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: dragging.current ? "none" : "transform 0.4s ease-out",
            transformStyle: "preserve-3d",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <img
            src={marbleTile}
            alt="Premium marble tile"
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>
        {/* Shadow reflection */}
        <div className="mx-auto mt-4 w-48 h-4 rounded-full bg-foreground/5 blur-md" />
      </div>

      {/* Floating action buttons */}
      <div className="relative z-10 flex gap-4 mt-10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <button
          onClick={() => onNavigate("stock")}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm font-medium shadow-lg btn-press hover:shadow-xl transition-shadow"
        >
          <Plus className="w-4 h-4" /> Add Stock
        </button>
        <button
          onClick={() => onNavigate("search")}
          className="flex items-center gap-2 px-5 py-3 rounded-full glass text-foreground font-body text-sm font-medium shadow-md btn-press hover:shadow-lg transition-shadow"
        >
          <Search className="w-4 h-4" /> Search
        </button>
        <button
          className="flex items-center justify-center w-12 h-12 rounded-full glass text-foreground shadow-md btn-press hover:shadow-lg transition-shadow"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Decorative gold line */}
      <div className="relative z-10 w-16 h-px bg-primary/40 mt-10 animate-fade-in" style={{ animationDelay: "0.45s" }} />
    </div>
  );
}
