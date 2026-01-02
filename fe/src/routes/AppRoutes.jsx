import { Routes, Route } from "react-router-dom";
import IngredientScanner from "../pages/IngredientScanner";
import Chat from "../pages/Chat";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<IngredientScanner />} />
      <Route path="/scan" element={<IngredientScanner />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
};

export default AppRoutes;
