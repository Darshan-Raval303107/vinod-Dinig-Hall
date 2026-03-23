import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'https://vinod-dinig-hall.onrender.com';

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['polling', 'websocket'], // Allow polling first for better reliability on Render
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 45000 // Increase timeout to 45s for slow cold starts
});

socket.on('connect_error', (err) => {
  console.error('Socket Connection Error:', err.message);
});
