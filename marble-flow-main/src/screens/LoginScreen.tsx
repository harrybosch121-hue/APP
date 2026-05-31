import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import marbleTile from "@/assets/marble-tile.jpeg";
import { api } from "@/lib/api";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fire a silent health ping the moment the login screen appears.
  // This wakes the Railway backend while the user types credentials,
  // so the server is already warm by the time they press Login.
  useEffect(() => {
    fetch("/api/health").catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.login(username.trim(), password);
      localStorage.setItem("auth_token", data.token);
      onLogin();
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen premium-bg marble-noise overflow-hidden px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent opacity-60" />

      <div className="relative z-10 text-center mb-10 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl mx-auto mb-4">
          <img src={marbleTile} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="font-display text-3xl font-light tracking-wide text-foreground">Sri Balaji</h1>
        <p className="font-display text-lg font-light text-primary tracking-[0.3em] uppercase mt-1">
          Marble & Tiles
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="p-6 rounded-2xl premium-card space-y-4">
          <h2 className="font-body text-base font-semibold text-foreground mb-2">Sign In</h2>

          <div>
            <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Enter username" autoCapitalize="none"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
          </div>

          <div>
            <label className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
          </div>

          {error && <p className="font-body text-xs text-destructive">{error}</p>}

          <Button onClick={handleLogin} disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm shadow-lg btn-press hover:shadow-xl transition-shadow">
            {loading ? "Signing in…" : "Login"}
          </Button>
        </div>
      </div>

      <div className="relative z-10 w-16 h-px bg-primary/40 mt-10 animate-fade-in" style={{ animationDelay: "0.3s" }} />
    </div>
  );
}