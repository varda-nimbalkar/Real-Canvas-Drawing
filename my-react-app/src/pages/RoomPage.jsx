// src/pages/RoomPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Toolbar from "../components/Toolbar";

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
      canvas.width = window.innerWidth * 0.9;
      canvas.height = window.innerHeight * 0.8;
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

    // Send drawing data via WebSocket
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

  // --- Clear Canvas ---
  const handleClear = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Broadcast clear event
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "CLEAR" }));
    }
  };

  return (
    <div className="room-page">
      <h2 className="text-center text-xl font-semibold mb-2">
        🖌 Room ID: {id}
      </h2>

      {/* Toolbar with brush/eraser/color/size/clear */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        onClear={handleClear}
      />

      {/* Canvas Board */}
      <div className="flex justify-center mt-3">
        <canvas
          ref={canvasRef}
          className="canvas-board"
          style={{
            border: "2px solid #ccc",
            borderRadius: "10px",
            backgroundColor: "#fff",
            cursor: tool === "eraser" ? "not-allowed" : "crosshair",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default RoomPage;
