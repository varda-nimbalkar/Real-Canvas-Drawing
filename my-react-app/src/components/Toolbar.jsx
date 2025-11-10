import React from "react";

const Toolbar = ({ tool, setTool, color, setColor, size, setSize, onClear }) => {
  return (
    <div className="toolbar">
      <button onClick={() => setTool("brush")}>Brush</button>
      <button onClick={() => setTool("eraser")}>Eraser</button>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <input type="range" min="1" max="20" value={size} onChange={(e) => setSize(e.target.value)} />
      <button onClick={onClear}>Clear</button>
    </div>
  );
};

export default Toolbar;
