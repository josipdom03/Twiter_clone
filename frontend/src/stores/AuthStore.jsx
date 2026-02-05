import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";

class AuthStore {
    user = null;
    token = localStorage.getItem("token") || null;
    isAuthenticated = !!localStorage.getItem("token");
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem("token", token);
            this.isAuthenticated = true;
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user"); // Čistimo sve
            this.isAuthenticated = false;
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
        // Ako nema tokena, nemamo što provjeravati
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
            });
        } catch (err) {
            console.error("Auth check failed:", err);
            this.logout();
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }
}

export const authStore = new AuthStore();