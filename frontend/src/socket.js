import { io } from "socket.io-client";

// URL tvog backenda
const URL = "http://localhost:3000";

const socket = io(URL, {
    autoConnect: false, // Čekamo AuthStore da pozove .connect()
    withCredentials: true, // Nužno za CORS (da bi cookies/session radili)
    transports: ["websocket"], // Ključno: izbjegava 400 Bad Request grešku kod pollinga
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on("connect", () => {
    console.log("Socket spojen s ID-jem:", socket.id);
});

socket.on("connect_error", (err) => {
    console.error("Socket greška pri spajanju:", err.message);
});

export default socket;