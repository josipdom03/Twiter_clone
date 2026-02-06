import { io } from "socket.io-client";

// URL tvog backend servera
const socket = io("http://localhost:3000", {
  autoConnect: false, // Ne spajaj se dok nemamo token/user ID
});

export default socket;