import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'https://vinod-dinig-hall.onrender.com';

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'], // Force WebSocket for better stability on Render
  reconnectionAttempts: 5,
  timeout: 10000
});

socket.on('connect_error', (err) => {
  console.error('Socket Connection Error:', err.message);
});
