import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../api"; 

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(); 
      navigate("/login"); 
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <h1 className="text-lg font-bold">ArcTecFox</h1>
      <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
