import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import socket from "../socket.js"; // Importamo instancu socketa

class AuthStore {
    user = null;
    token = localStorage.getItem("token") || null;
    isAuthenticated = !!localStorage.getItem("token");
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
        // Ako već imamo token pri učitavanju aplikacije, provjeri auth i spoji socket
        if (this.token) {
            this.checkAuth();
        }
    }

    // --- POMOĆNA METODA ZA SOCKET SPAJANJE ---
    initializeSocket(userId) {
        if (!socket.connected) {
            socket.connect();
        }
        // Javljamo serveru tko smo kako bi nas stavio u privatnu sobu
        socket.emit("join", userId);
        console.log(`Socket povezan i korisnik ${userId} pridružen sobi.`);
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem("token", token);
            this.isAuthenticated = true;
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            this.isAuthenticated = false;
            // Odspoji socket pri logoutu
            if (socket.connected) {
                socket.disconnect();
            }
        }
    }

    async login(email, password) {
        this.isLoading = true;
        try {
            const response = await axios.post("http://localhost:3000/api/auth/login", {
                email,
                password,
            });
            const { token, user } = response.data;
            runInAction(() => {
                this.user = user;
                this.setToken(token);
                // INICIJALIZACIJA SOCKETA NAKON LOGIN-A
                this.initializeSocket(user.id);
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Prijava neuspješna";
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    logout() {
        runInAction(() => {
            this.user = null;
            this.setToken(null);
        });
    }

    async checkAuth() {
        if (!this.token) {
            runInAction(() => { this.isAuthenticated = false; });
            return;
        }

        runInAction(() => { this.isLoading = true; });
        try {
            const res = await axios.get("http://localhost:3000/api/users/profile", {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            runInAction(() => {
                this.user = res.data;
                this.isAuthenticated = true;
                // INICIJALIZACIJA SOCKETA NAKON USPJEŠNE PROVJERE PROFILA
                this.initializeSocket(res.data.id);
            });
        } catch (err) {
            console.error("Auth check failed:", err);
            this.logout();
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    // Dodano za svaki slučaj
    async register(username, email, password) {
        this.isLoading = true;
        try {
            const response = await axios.post("http://localhost:3000/api/auth/register", {
                username,
                email,
                password,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Registracija neuspješna";
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }
}

export const authStore = new AuthStore();