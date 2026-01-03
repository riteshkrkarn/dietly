import { Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import IngredientScanner from "../pages/IngredientScanner";
import Chat from "../pages/Chat";

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <div className="pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<IngredientScanner />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </>
  );
};

export default AppRoutes;
