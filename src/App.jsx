import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from "./pages/Layout";
import LoginPage from "./pages/Login";
import './App.css';

const App = () => {
  // Comprueba si hay un usuario en sessionStorage
  const isAuthenticated = !!sessionStorage.getItem('LoggedUser');

  return (
    <Router>
      <Routes>
        {/* Si no está autenticado, redirige cualquier ruta a /login */}
        {!isAuthenticated && <Route path="/*" element={<Navigate to="/login" />} />}
        <Route path="/login" element={<LoginPage />} />
        {isAuthenticated && <Route path="/*" element={<MainLayout />} />}
      </Routes>
    </Router>
  );
};

export default App;
