// src/pages/RoomPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Toolbar from "../components/Toolbar";
import ChatBox from "../components/ChatBox";

const RoomPage = () => {
  const { id } = useParams(); // Room ID from URL
  const canvasRef = useRef(null);
  const wsRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);

  // --- Initialize canvas + WebSocket ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    setCtx(context);

    // Resize canvas to fit window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * 0.65;
      canvas.height = window.innerHeight * 0.7;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // ✅ Connect WebSocket to backend
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/room/${id}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ Connected to WebSocket");
    ws.onclose = () => console.log("❌ WebSocket Disconnected");
    ws.onerror = (err) => console.error("⚠️ WebSocket Error:", err);

    // --- Listen for incoming drawing data ---
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "DRAW") {
        const { x, y, color, size, tool } = message.payload;
        if (!context) return;

        context.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
        context.lineWidth = size;
        context.lineTo(x, y);
        context.stroke();
      }

      if (message.type === "CLEAR") {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    return () => {
      ws.close();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [id]);

  // --- Drawing Handlers ---
  const handleMouseDown = (e) => {
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
    ctx.lineWidth = size;
    ctx.lineTo(x, y);
    ctx.stroke();

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "DRAW",
          payload: { x, y, color, size, tool },
        })
      );
    }
  };

  const handleMouseUp = () => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();
  };

  const handleClear = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "CLEAR" }));
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎨 Collaborative Canvas Room</h1>
        <p style={styles.subText}>Room ID: <strong>{id}</strong></p>
      </div>

      <div style={styles.layout}>
        {/* 🎨 Left - Canvas Section */}
        <div style={styles.canvasContainer}>
          <Toolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            onClear={handleClear}
          />
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* 💬 Right - Chat Section */}
        <div style={styles.chatContainer}>
          <ChatBox />
        </div>
      </div>
    </div>
  );
};

// 🎨 Inline Styling for Better Layout
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "linear-gradient(135deg, #f0f2ff, #fff8ff)",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#4f46e5",
  },
  subText: {
    color: "#6b7280",
    fontSize: "1rem",
  },
  layout: {
    display: "flex",
    gap: "30px",
    justifyContent: "center",
    alignItems: "flex-start",
    width: "95%",
  },
  canvasContainer: {
    flex: 2,
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 25px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  canvas: {
    border: "2px solid #d1d5db",
    borderRadius: "12px",
    backgroundColor: "#fff",
    cursor: "crosshair",
    marginTop: "10px",
  },
  chatContainer: {
    flex: 1,
    background: "#ffffff",
    borderRadius: "16px",
    padding: "15px",
    boxShadow: "0 4px 25px rgba(0,0,0,0.08)",
    maxHeight: "80vh",
    overflow: "hidden",
  },
};

export default RoomPage;
