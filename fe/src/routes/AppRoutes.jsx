import { Routes, Route } from "react-router-dom";
import IngredientScanner from "../pages/IngredientScanner";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<IngredientScanner />} />
      <Route path="/scan" element={<IngredientScanner />} />
    </Routes>
  );
};

export default AppRoutes;
