import React, { useState, useEffect, useRef } from "react";

const ChatBox = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages every 2 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/chat/messages");
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!username || !message.trim()) return;

    try {
      await fetch("http://127.0.0.1:8000/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message }),
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Allow Enter key to send message
  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>💬 Collaborative Chat Room</h2>

      {/* Chat Window */}
      <div style={styles.chatWindow}>
        {messages.length === 0 ? (
          <p style={styles.noMessages}>No messages yet. Start chatting!</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                ...styles.messageBubble,
                ...(m.username === username
                  ? styles.ownMessage
                  : styles.otherMessage),
              }}
            >
              <strong style={styles.username}>{m.username}</strong>
              <p style={styles.messageText}>{m.message}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Your name"
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div style={styles.messageInputRow}>
          <input
            type="text"
            placeholder="Type a message..."
            style={styles.messageInput}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button style={styles.sendButton} onClick={sendMessage}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "420px",
    margin: "40px auto",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    textAlign: "center",
    color: "#4A00E0",
    marginBottom: "15px",
  },
  chatWindow: {
    height: "420px",
    overflowY: "auto",
    background: "#f8f9ff",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid #e0e0e0",
  },
  noMessages: {
    textAlign: "center",
    color: "#999",
    marginTop: "40px",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: "14px",
    lineHeight: "1.4",
    wordBreak: "break-word",
    display: "inline-block",
  },
  ownMessage: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    alignSelf: "flex-end",
    borderBottomRightRadius: "2px",
  },
  otherMessage: {
    background: "#e9e9ff",
    color: "#333",
    alignSelf: "flex-start",
    borderBottomLeftRadius: "2px",
  },
  username: {
    fontSize: "12px",
    opacity: "0.8",
    display: "block",
  },
  messageText: {
    margin: "2px 0 0 0",
    fontSize: "14px",
  },
  inputContainer: {
    marginTop: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  messageInputRow: {
    display: "flex",
    gap: "10px",
  },
  messageInput: {
    flexGrow: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  sendButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "18px",
    transition: "all 0.2s ease",
  },
};

export default ChatBox;
