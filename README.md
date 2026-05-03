# Vinnod Dining Hall — Real-Time Restaurant Ecosystem

Vinnod Dining Hall is a state-of-the-art, full-stack restaurant management system designed for high-scale operations. It bridges the gap between customers, kitchen staff (chefs), and owners through a high-performance, real-time synchronization engine powered by WebSockets.

## 🚀 Vision
To provide a seamless, paperless dining experience where every order update is communicated instantly across all stakeholders, eliminating manual refreshes and reducing order-to-table latency.

---

## 🛠️ Technology Stack

### Frontend (Modern React Ecosystem)
- **Framework**: React 18+ with Vite
- **State Management**: Zustand (for session-aware carts and global application state)
- **Animations**: GSAP (GreenSock) for high-end cinematic landing page experiences and scroll-driven frame sequences.
- **Styling**: Tailwind CSS for a premium, responsive UI/UX.
- **Real-Time**: Socket.IO Client for instant event synchronization.
- **Icons**: Lucide React.

### Backend (Robust Python Architecture)
- **Framework**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM (highly scalable relational schema).
- **Real-Time Engine**: Flask-SocketIO with Gevent for asynchronous event broadcasting.
- **Security**: JWT (JSON Web Tokens) for role-based access control (RBAC).
- **Payments**: Razorpay Integration for digital settlements.
- **Infrastructure**: Configured for deployment on platforms like Render (Backend) and Vercel (Frontend).

---

## 💎 Core Features

### 1. Cinematic Customer Experience
- **QR-Based Ordering**: Customers scan a table-specific QR code to initiate a session.
- **Digital Window Ordering**: Support for takeaway/window orders with unique pickup codes.
- **Scroll-Driven Landing Page**: A premium hero section featuring a 192-frame smooth scroll animation sequence.
- **Active Order Modification**: Customers can add more items to an existing order while it's being prepared.
- **Real-Time Tracking**: Instant status updates (Pending → Cooking → Ready) reflected on the customer's device.

### 2. Intelligent Chef Dashboard
- **Live Order Stream**: Orders appear instantly without refreshing.
- **Visual Alert System**: Updated orders (when a customer adds more items) are highlighted with a pulsing Deep Indigo indicator.
- **Status Management**: Simple toggle system to move orders through the kitchen workflow.
- **Automatic Sync**: Updating an order status automatically clears "Updated" flags across all connected dashboards.

### 3. Professional Owner Suite
- **Live Analytics**: Real-time monitoring of revenue, active orders, and completed transactions.
- **Real-Time History View**: A dedicated monitor that receives full order payloads (items, price, status) instantly.
- **Menu Management**: Full CRUD capabilities for categories and items, including automated image uploads.
- **Table & QR System**: Generate and manage dynamic QR codes for every table in the restaurant.
- **Global Settings**: Control customer login availability and restaurant status (Open/Closed).

---

## 📡 Real-Time Architecture (WebSocket Rooms)
The system utilizes a sophisticated room-based broadcasting strategy to ensure data privacy and efficiency:
- `order_{id}`: Dedicated channel for a specific customer's order updates.
- `{restaurant_id}`: Broad channel for all kitchen staff (Chefs).
- `owner_{restaurant_id}`: Private channel for owner-specific analytics and history synchronization.

---

## 🏗️ Project Structure
```bash
.
├── backend/
│   ├── routes/          # API Endpoints (Auth, Orders, Chef, Owner, Window)
│   ├── models/          # Database Schema (Order, MenuItem, User, etc.)
│   ├── extensions.py    # Shared plugins (SocketIO, DB, JWT)
│   ├── app.py           # Application Entry Point & Socket Handlers
│   └── seed.py          # Database Initialization & Demo Data
├── frontend/
│   ├── src/
│   │   ├── pages/       # View Components (Landing, Menu, Dashboard, Owner)
│   │   ├── store/       # Zustand Store (Cart & Session Management)
│   │   └── api/         # Axios Interceptors & Configuration
│   └── public/          # Static Assets & Hero Frame Sequence
```

---

## 🔧 Installation

### Backend Setup
1. `cd backend`
2. `pip install -r requirements.txt`
3. Configure `.env` with `DATABASE_URL`, `JWT_SECRET`, and `RAZORPAY_KEYS`.
4. `flask run`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 📈 Scalability & Performance
The project is built to handle multiple restaurants with concurrent users by utilizing database indexing on restaurant IDs and efficient socket broadcasting that minimizes unnecessary data transfer.