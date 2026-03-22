import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'https://vinod-dinig-hall.onrender.com';

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['polling', 'websocket']
});
