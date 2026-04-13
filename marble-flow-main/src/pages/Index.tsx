import { useState } from "react";
import { InventoryProvider } from "@/context/InventoryContext";
import BottomNav from "@/components/BottomNav";
import HomeScreen from "@/screens/HomeScreen";
import SearchScreen from "@/screens/SearchScreen";
import StockScreen from "@/screens/StockScreen";
import LogsScreen from "@/screens/LogsScreen";
import TileDetailScreen from "@/screens/TileDetailScreen";
import LoginScreen from "@/screens/LoginScreen";

const Index = () => {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("auth_token"));
  const [screen, setScreen] = useState("home");
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

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
      case "home":
        return <HomeScreen onNavigate={setScreen} onLogout={handleLogout} />;
      case "search":
        return <SearchScreen onSelectTile={handleSelectTile} />;
      case "stock":
        return <StockScreen />;
      case "logs":
        return <LogsScreen />;
      default:
        return <HomeScreen onNavigate={setScreen} onLogout={handleLogout} />;
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
