import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/HomePage.css"; // 👈 make sure this file exists

const HomePage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(response.data);
      } catch (err) {
        console.error(err);
        setError("⚠️ Failed to load rooms. Please login again.");
      }
    };
    fetchRooms();
  }, [token]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/rooms",
        { name: roomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRooms([...rooms, response.data]);
      setRoomName("");
    } catch (err) {
      console.error(err);
      setError("Could not create room.");
    }
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">🎨 Collaborative Canvas</h1>
      <p className="homepage-subtitle">
        Create a new room or join an existing one to start drawing together!
      </p>

      <form className="create-room-form" onSubmit={handleCreateRoom}>
        <input
          type="text"
          className="room-input"
          placeholder="Enter new room name..."
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button type="submit" className="create-room-btn">
          ➕ Create Room
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <div className="rooms-section">
        <h2 className="rooms-title">🏠 Available Rooms</h2>
        <div className="rooms-list">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div className="room-card" key={room.id}>
                <h3>{room.name}</h3>
                <button
                  className="join-room-btn"
                  onClick={() => handleJoinRoom(room.id)}
                >
                  Join 🎯
                </button>
              </div>
            ))
          ) : (
            <p className="no-rooms-text">No rooms yet — be the first to create one!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
