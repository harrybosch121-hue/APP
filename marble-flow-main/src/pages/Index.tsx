import { useState, useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { InventoryProvider } from "@/context/InventoryContext";
import BottomNav from "@/components/BottomNav";
import HomeScreen from "@/screens/HomeScreen";
import SearchScreen from "@/screens/SearchScreen";
import StockScreen from "@/screens/StockScreen";
import LogsScreen from "@/screens/LogsScreen";
import AnalyticsScreen from "@/screens/AnalyticsScreen";
import TileDetailScreen from "@/screens/TileDetailScreen";
import LoginScreen from "@/screens/LoginScreen";

const Index = () => {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("auth_token"));
  const [screen, setScreen] = useState("home");
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  // Android hardware back button. In-app navigation is state-based (it pushes
  // no browser history), so Capacitor's default back behaviour exits the app —
  // e.g. pressing back on a tile's detail page. This routes back through our
  // own screen state instead, and only exits when already on Home.
  const handleBackRef = useRef<() => boolean>(() => false);
  handleBackRef.current = () => {
    if (!loggedIn) return false;
    if (screen === "detail") { setScreen("search"); setSelectedTile(null); return true; }
    if (screen !== "home") { setScreen("home"); return true; }
    return false; // already Home → let the app exit
  };

  useEffect(() => {
    let remove: (() => void) | undefined;
    CapacitorApp.addListener("backButton", () => {
      if (!handleBackRef.current()) CapacitorApp.exitApp();
    })
      .then((listener) => { remove = () => listener.remove(); })
      .catch(() => {}); // no-op outside a native (Capacitor) shell
    return () => { remove?.(); };
  }, []);

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  const handleSelectTile = (id: string) => {
    setSelectedTile(id);
    setScreen("detail");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setLoggedIn(false);
    setScreen("home");
    setSelectedTile(null);
  };

  const renderScreen = () => {
    if (screen === "detail" && selectedTile) {
      return <TileDetailScreen tileId={selectedTile} onBack={() => setScreen("search")} />;
    }
    switch (screen) {
      case "home":      return <HomeScreen onNavigate={setScreen} onLogout={handleLogout} />;
      case "search":    return <SearchScreen onSelectTile={handleSelectTile} />;
      case "stock":     return <StockScreen />;
      case "analytics": return <AnalyticsScreen />;
      case "logs":      return <LogsScreen />;
      default:          return <HomeScreen onNavigate={setScreen} onLogout={handleLogout} />;
    }
  };

  return (
    <InventoryProvider>
      <div className="max-w-lg mx-auto relative">
        {renderScreen()}
        {screen !== "detail" && <BottomNav active={screen} onNavigate={setScreen} />}
      </div>
    </InventoryProvider>
  );
};

export default Index;
