import { io } from "socket.io-client";

const socket = io("https://horizontechx-taskflow-realtime.onrender.com");

export default socket;
