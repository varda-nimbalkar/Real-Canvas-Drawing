// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatBox from "./components/ChatBox";
import RoomPage from "./pages/RoomPage";

const App = () => {
  const token = localStorage.getItem("token");
  console.log("🧠 Token value:", token);

  return (
    <Router>
      <Routes>
        {/* ✅ Default redirect */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* ✅ Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ✅ Protected routes */}
        {token ? (
          <>
            <Route path="/home" element={<HomePage />} />
            <Route path="/chat" element={<ChatBox />} />
            
            {/* ✅ Added RoomPage route here */}
            <Route path="/room/:id" element={<RoomPage />} />
          </>
        ) : (
          <>
            <Route path="/home" element={<Navigate to="/login" />} />
            <Route path="/chat" element={<Navigate to="/login" />} />
            <Route path="/room/:id" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
