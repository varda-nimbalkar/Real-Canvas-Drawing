// src/App.jsx

import React from "react";
console.log("✅ App.jsx loaded successfully");

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Optional: import a 404 page
// import NotFoundPage from "./pages/NotFoundPage";

const App = () => {
  // You can later get this from AuthContext or localStorage
  const token = localStorage.getItem("token");
  console.log("🧠 Token value:", token);
  


  return (
    
    <Router>
      <Routes>
        {/* ✅ Redirect to /login by default */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* ✅ Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ✅ Protected routes */}
        {token ? (
          <>
            <Route path="/home" element={<HomePage />} />
            <Route path="/room/:id" element={<RoomPage />} />
          </>
        ) : (
          <>
            {/* Redirect unauthenticated users to login */}
            <Route path="/home" element={<Navigate to="/login" />} />
            <Route path="/room/:id" element={<Navigate to="/login" />} />
          </>
        )}

        {/* ✅ Optional 404 fallback */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  );
};

export default App;
