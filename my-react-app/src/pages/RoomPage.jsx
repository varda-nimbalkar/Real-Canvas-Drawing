import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Toolbar from "../components/Toolbar";
import ChatBox from "../components/ChatBox";
import VideoCall from "../components/VideoCall";

const RoomPage = () => {
  const { id } = useParams();
  const canvasRef = useRef(null);
  const wsRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);

  const [showChat, setShowChat] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Chat toggle → close video
  const handleChatToggle = () => {
    setShowChat(!showChat);
    setShowVideo(false);
  };

  // Video toggle → close chat
  const handleVideoToggle = () => {
    setShowVideo(!showVideo);
    setShowChat(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    setCtx(context);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * 0.65;
      canvas.height = window.innerHeight * 0.7;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/room/${id}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "DRAW") {
        const { x, y, color, size, tool } = message.payload;
        context.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
        context.lineWidth = size;
        context.lineTo(x, y);
        context.stroke();
      }

      if (message.type === "CLEAR") {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    return () => ws.close();
  }, [id]);

  const handleMouseDown = (e) => {
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
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

    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "DRAW", payload: { x, y, color, size, tool } })
      );
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    ctx?.closePath();
  };

  const handleClear = () => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    wsRef.current.send(JSON.stringify({ type: "CLEAR" }));
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Collaborative Canvas Room</h1>
      <p style={styles.sub}>Room ID: {id}</p>

      <div style={styles.layout}>
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

        {/* ---- RIGHT: CHAT BUTTON ---- */}
        <div style={styles.rightSide}>
          <button style={styles.sideButton} onClick={handleChatToggle}>
            💬 {showChat ? "Close Chat" : "Chat"}
          </button>

          {showChat && (
            <div style={styles.chatPopup}>
              <div style={styles.popupHeader}>
                <h3>Chat</h3>
                <button style={styles.closeBtn} onClick={handleChatToggle}>
                  ✖
                </button>
              </div>
              <ChatBox />
            </div>
          )}
        </div>

        {/* ---- LEFT: VIDEO BUTTON ---- */}
        <div style={styles.leftSide}>
          <button style={styles.sideButtonVideo} onClick={handleVideoToggle}>
            🎥 {showVideo ? "Close Video" : "Video Call"}
          </button>

          {showVideo && (
            <div style={styles.videoPopup}>
              <div style={styles.popupHeader}>
                <h3>Video Call</h3>
                <button style={styles.closeBtn} onClick={handleVideoToggle}>
                  ✖
                </button>
              </div>
              <VideoCall roomId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------ STYLES ------------------

const styles = {
  page: {
    background: "#f5f7ff",
    height: "100vh",
    padding: "20px",
    fontFamily: "Poppins, sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: "700",
    color: "#4f46e5",
  },
  sub: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#666",
  },

  layout: {
    display: "flex",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },

  canvasContainer: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },

  canvas: {
    border: "2px solid #ccc",
    marginTop: "10px",
    borderRadius: "12px",
    cursor: "crosshair",
  },

  /* Right Chat Section */
  rightSide: {
    position: "absolute",
    right: "20px",
    top: "20px",
  },

  /* Left Video Section */
  leftSide: {
    position: "absolute",
    left: "20px",
    top: "20px",
  },

  sideButton: {
    background: "#4f46e5",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "30px",
    border: "none",
    cursor: "pointer",
    marginBottom: "10px",
  },

  sideButtonVideo: {
    background: "#ec4899",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "30px",
    border: "none",
    cursor: "pointer",
    marginBottom: "10px",
  },

  chatPopup: {
    width: "300px",
    height: "420px",
    background: "#fff",
    borderRadius: "16px",
    padding: "10px",
    boxShadow: "0 6px 25px rgba(0,0,0,0.2)",
  },

  videoPopup: {
    width: "300px",
    height: "420px",
    background: "#fff",
    borderRadius: "16px",
    padding: "10px",
    boxShadow: "0 6px 25px rgba(0,0,0,0.2)",
  },

  popupHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },

  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
  },
};

export default RoomPage;
