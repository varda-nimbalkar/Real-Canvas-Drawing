// src/components/CanvasBoard.jsx
import React, { useRef, useEffect, useState, useContext } from "react";
import { WebSocketContext } from "../contexts/WebSocketContext";
import "../styles/canvas.css";

const CanvasBoard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);
  const { sendMessage, isConnected } = useContext(WebSocketContext);

  // --- Initialize Canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.7;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctxRef.current = ctx;
  }, []);

  // --- Listen for incoming WebSocket messages ---
  useEffect(() => {
    if (!isConnected) return;

    const ws = window.wsRef;
    if (!ws) return;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "DRAW") {
          const { x, y, color, size, tool } = data;
          const ctx = ctxRef.current;
          ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
          ctx.lineWidth = size;
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }

        if (data.type === "CLEAR") {
          ctxRef.current.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };
  }, [isConnected]);

  // --- Local Drawing Logic ---
  const startDrawing = (e) => {
    ctxRef.current.isDrawing = true;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
  };

  const stopDrawing = () => {
    ctxRef.current.isDrawing = false;
    ctxRef.current.beginPath();
  };

  const draw = (e) => {
    if (!ctxRef.current.isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = ctxRef.current;

    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
    ctx.lineWidth = size;
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);

    // Send draw event to backend
    if (isConnected) {
      sendMessage({
        type: "DRAW",
        x: offsetX,
        y: offsetY,
        color,
        size,
        tool,
      });
    }
  };

  // --- Clear Canvas ---
  const clearCanvas = () => {
    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    if (isConnected) sendMessage({ type: "CLEAR" });
  };

  return (
    <div className="canvas-container">
      {/* Toolbar */}
      <div className="toolbar">
        <button
          onClick={() => setTool("brush")}
          className={tool === "brush" ? "active" : ""}
        >
          🖌 Brush
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={tool === "eraser" ? "active" : ""}
        >
          🧽 Eraser
        </button>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="range"
          min="1"
          max="30"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
        <button onClick={clearCanvas}>🧹 Clear</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="canvas-board"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onMouseMove={draw}
      ></canvas>
    </div>
  );
};

export default CanvasBoard;
