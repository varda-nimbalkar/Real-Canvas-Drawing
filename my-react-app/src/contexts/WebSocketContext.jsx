// src/contexts/WebSocketContext.jsx
import React, { createContext, useEffect, useState } from "react";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ roomId = 1, children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/room/${roomId}`);

    ws.onopen = () => {
      console.log("✅ Connected to WebSocket room:", roomId);
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("❌ Disconnected from WebSocket");
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
    };

    setSocket(ws);
    window.wsRef = ws;

    return () => ws.close();
  }, [roomId]);

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ WebSocket not connected!");
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
