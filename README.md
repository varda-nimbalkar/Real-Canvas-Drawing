REAL-Time Collaborative Drawing Application

A collaborative canvas application that allows multiple users to join rooms and draw together on a shared digital canvas in real-time using WebSockets.

Project Overview

1.Create accounts and log in securely.
2.Create or join drawing rooms.
3.Draw in real-time with other connected users.
4.See other users' cursors andactivities.
5.Use various drawing tools (brush , shapes , colors)
6.Save and restore canvas sessions


Technology Stack

Frontend 

1.Language: JavaScript ES6+
2.Framework: React 18+ with hooks
3.Canvas: HTML5 Canvas API  WebSocket: Native WebSocket API
4.Styling: CSS3 with Flexbox/Grid or styled-components.
5.State Management: React Context API or Redux Toolkit

Backend Technologies

Language: Python 
1.Framework: FastAPI with WebSockets 
2.Database: PostgreSQL 13+ with connection pooling
3.ORM: SQLAlchemy (Python) 
4.Authentication: JWT with bcrypt password hashing
5.WebSocket: FastAPI WebSockets 

Project Structure
As of now i have deal with the login page the room is created and the brush and eraser is working    Requirements Specification
Real-Time Drawing Synchronization
Implement instant broadcasting of all drawing operations including brush strokes, shape creation, and canvas modifications. All connected users must see drawing
actions in real-time with minimal latency. Support concurrent drawing operations
without conflicts or data corruption. Multi-User Canvas Management
Enable multiple users to work simultaneously on the same canvas with individual
cursor tracking and user identification. Implement user presence indicators showingactive participants and their current actions. Provide conflict resolution for
overlapping drawing areas. Advanced Drawing Tools
Implement drawing toolkit with brush tools, shapes, and color controls. Use any
drawing library such as Fabric.js, Konva.js, or Paper.js for enhanced functionality andtool management. Canvas Session Persistence
Maintain canvas state across browser sessions with database storage of drawing
operations. Implement session recovery allowing users to reconnect and continueprevious work. Provide canvas versioning and snapshot capabilities for state
management. User Authentication and Rooms
Implement user registration and login system for canvas access control. Create
room-based canvas sessions where users can join specific drawing rooms. Maintainuser permissions and canvas ownership with administrative controls. WebSocket Communication Protocol
Design event system for drawing operations, user presence, and canvas state.
Implement message queuing and this is requirements   real-time-canvas/
│
├── README.md                             # Project overview and setup instructions
├── .gitignore
├── docker-compose.yml                    # optional (backend + db container setup)
├── .env.example                          # sample environment variables
│
├── frontend/                             # React frontend
│   ├── package.json
│   ├── vite.config.js                    # or webpack.config.js
│   ├── public/
│   │   └── index.html                    # Root HTML
│   └── src/
│       ├── index.js                      # React entry point
│       ├── App.js                        # Root component
│       │
│       ├── components/                   # Reusable UI parts
│       │   ├── CanvasBoard.jsx           # Main drawing component using Canvas API / Konva.js
│       │   ├── Toolbar.jsx               # Brush, shapes, color, eraser tools
│       │   ├── ColorPicker.jsx
│       │   ├── RoomList.jsx              # Create/join rooms
│       │   ├── UserPresence.jsx          # Display online users & cursors
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   ├── LoginForm.jsx             # Login form (JWT auth)
│       │   └── RegisterForm.jsx          # Registration form
│       │
│       ├── pages/                        # Major screens
│       │   ├── LoginPage.jsx
│       │   ├── HomePage.jsx
│       │   └── RoomPage.jsx              # Actual drawing room screen
│       │
│       ├── contexts/                     # Global state management
│       │   ├── AuthContext.js            # Handles JWT authentication state
│       │   └── WebSocketContext.js       # WebSocket connection for all components
│       │
│       ├── hooks/                        # Reusable React hooks
│       │   ├── useWebSocket.js           # Connects to backend WebSocket
│       │   └── useCanvas.js              # Handles canvas draw logic
│       │
│       ├── services/                     # API services (Axios)
│       │   ├── api.js                    # Axios base instance
│       │   ├── authService.js            # Login, register, token refresh
│       │   ├── roomService.js            # Room CRUD endpoints
│       │   └── canvasService.js          # Fetch/save canvas snapshots
│       │
│       ├── utils/                        # Utility files
│       │   ├── websocketEvents.js        # Event names: DRAW, ERASE, USER_JOINED, etc.
│       │   └── helpers.js                # Common helper functions
│       │
│       ├── assets/                       # Static images/icons
│       │   └── logo.png
│       │
│       └── styles/                       # Styling (CSS or styled-components)
│           ├── App.css
│           ├── Canvas.css
│           ├── Toolbar.css
│           └── Auth.css
│
├── backend/                              # FastAPI backend
│   ├── main.py                           # FastAPI entry file (includes REST + WebSocket setup)
│   ├── requirements.txt                  # Python dependencies
│   ├── .env                              # Backend environment variables
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   │
│   │   ├── api/                          # REST API endpoints
│   │   │   ├── auth.py                   # User registration/login (JWT)
│   │   │   ├── rooms.py                  # Create/join room endpoints
│   │   │   ├── users.py                  # Manage users and profiles
│   │   │   └── canvas.py                 # Save/load canvas state snapshots
│   │   │
│   │   ├── websocket/                    # Real-time WebSocket handling
│   │   │   ├── manager.py                # Handles connections & broadcasts
│   │   │   ├── events.py                 # Defines message structures (draw, join, leave)
│   │   │   └── router.py                 # WebSocket route (/ws/{room_id})
│   │   │
│   │   ├── models/                       # Database models (SQLAlchemy ORM)
│   │   │   ├── base.py                   # Declarative Base
│   │   │   ├── user.py                   # User model
│   │   │   ├── room.py                   # Room model
│   │   │   └── canvas.py                 # Canvas state/snapshot model
│   │   │
│   │   ├── schemas/                      # Pydantic data validation schemas
│   │   │   ├── user_schema.py
│   │   │   ├── room_schema.py
│   │   │   └── canvas_schema.py
│   │   │
│   │   ├── core/                         # Core app logic and config
│   │   │   ├── config.py                 # Environment variables, settings
│   │   │   ├── database.py               # PostgreSQL connection setup
│   │   │   ├── auth.py                   # JWT generation/validation
│   │   │   └── security.py               # Password hashing, token checks
│   │   │
│   │   ├── utils/                        # Helper functions and error handling
│   │   │   ├── helpers.py
│   │   │   └── exceptions.py
│   │   │
│   │   └── tests/                        # Unit and integration tests
│   │       ├── test_auth.py
│   │       ├── test_websocket.py
│   │       └── test_canvas.py
│
└── docs/                                 # Documentation (for submission)
    ├── API_Documentation.md              # REST API reference
    ├── WebSocket_Protocol.md             # Message/event structure
    ├── Database_Schema.png               # ER diagram (User–Room–Canvas)
    ├── Setup_Guide.md                    # Installation & running steps
    ├── User_Guide.md                     # End-user instructions
    ├── Postman_Collection.json           # For testing API endpoints
    └── Performance_Report.md             # Load testing, latency report  structure is like this  and this is my project structure my react frontend setup is with the vite and now give me what i have to donext part


prerequisites

Node.js 16+
MySQL server
Git

Backend

1.Navigate to the backend directory: cd backend
2.Install dependencies: npm install
3.Run Prisma migrations: npx prisma migrate dev
4.Start the development server: npm run dev

Frontend

1.Navigate to the frontend directory: cd frontend
2.Install dependencies: npm install
3.Start the development server: npm start

Features
User Interface

1.Modern, clean UI design with pink color schema
2.Attractive gradients and visual elements

User Authentication

1.Registration and login using JWT.

Canvas Operations

1.Free-hand drawing with adjustable brush size
2.Text tool for adding text elements
3.Shape tools (rectangles, circles, lines)

Collaboration

1.Real-time drawing synchronization using WebSocket
2.User attribution for all drawings and objects
3.Room Creation .



