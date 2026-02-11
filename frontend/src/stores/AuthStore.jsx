import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import socket from "../socket.js";

class AuthStore {
    user = null;
    token = localStorage.getItem("token") || null;
    isAuthenticated = !!localStorage.getItem("token");
    isLoading = false;
    pendingFollowRequests = [];

    constructor() {
        makeAutoObservable(this);
        if (this.token) {
            this.checkAuth();
        }
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        socket.on("new_follow_request", (data) => {
            runInAction(() => {
                this.pendingFollowRequests.unshift(data.request);
                console.log("Novi zahtjev za praćenje primljen putem socketa");
            });
        });
    }

    initializeSocket(userId) {
        if (!socket.connected) {
            socket.connect();
        }
        socket.emit("join", userId);
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem("token", token);
            this.isAuthenticated = true;
        } else {
            localStorage.removeItem("token");
            this.isAuthenticated = false;
            if (socket.connected) {
                socket.disconnect();
            }
        }
    }

    async fetchPendingRequests() {
        if (!this.token) return;
        try {
            const res = await axios.get("http://localhost:3000/api/follow/requests", {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            runInAction(() => {
                this.pendingFollowRequests = res.data;
            });
        } catch (err) {
            console.error("Neuspješno dohvaćanje zahtjeva za praćenje", err);
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
                this.initializeSocket(user.id);
                this.fetchPendingRequests();
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Prijava neuspješna";
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

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

    logout() {
        runInAction(() => {
            this.user = null;
            this.setToken(null);
            this.pendingFollowRequests = [];
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
                this.initializeSocket(res.data.id);
                this.fetchPendingRequests();
            });
        } catch (err) {
            console.error("Auth check failed:", err);
            this.logout();
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async updatePrivacy(isPrivate) {
        try {
            const res = await axios.put("http://localhost:3000/api/users/profile", 
                { isPrivate },
                { headers: { Authorization: `Bearer ${this.token}` } }
            );
            runInAction(() => {
                if (this.user) this.user.isPrivate = res.data.isPrivate;
            });
        } catch (err) {
            console.error("Greška pri promjeni privatnosti");
        }
    }


    async respondToFollowRequest(requestId, action) {
    try {
        await axios.post("http://localhost:3000/api/follow/respond", 
            { requestId, action },
            { headers: { Authorization: `Bearer ${this.token}` } }
        );
        runInAction(() => {
            // Makni zahtjev iz liste na frontendu odmah
            this.pendingFollowRequests = this.pendingFollowRequests.filter(req => req.id !== requestId);
        });
    } catch (err) {
        console.error("Greška pri odgovoru na zahtjev", err);
    }
}
}

export const authStore = new AuthStore();