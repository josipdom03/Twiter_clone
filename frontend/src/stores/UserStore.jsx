import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";

class UserStore {
    profile = null;
    isLoading = false;
    error = null;

    constructor() {
        makeAutoObservable(this);
    }

    // Pomoćna funkcija za dobivanje headera s tokenom
    getAuthHeaders() {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Dohvaćanje profila trenutnog korisnika
    async fetchProfile() {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await axios.get("http://localhost:3000/api/users/profile", {
                headers: this.getAuthHeaders()
            });
            runInAction(() => {
                this.profile = response.data;
            });
        } catch (error) {
            runInAction(() => {
                this.error = error.response?.data?.message || "Greška pri učitavanju profila";
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Ažuriranje profila (username, bio, avatar)
    async updateProfile(userData) {
        this.isLoading = true;
        try {
            const response = await axios.put("http://localhost:3000/api/users/profile", userData, {
                headers: this.getAuthHeaders()
            });
            runInAction(() => {
                this.profile = response.data; // Osvježavamo podatke novim odgovorom s servera
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Ažuriranje neuspješno";
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Čišćenje podataka kod odjave
    clearUserData() {
        this.profile = null;
        this.error = null;
    }
}

export const userStore = new UserStore();