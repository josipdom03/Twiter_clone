import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";

class UserStore {
    profile = null;
    publicProfile = null;
    isLoading = false;
    error = null;

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Pomoćna funkcija za headere. 
     * Ako authStore.token još nije postavljen, pokušava ga uzeti direktno iz localStorage-a.
     */
    getAuthHeaders() {
        const token = authStore.token || localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async fetchProfile() {
        // Ako nema tokena nigdje, nemoj ni slati zahtjev jer će backend vratiti 403
        const headers = this.getAuthHeaders();
        if (!headers.Authorization) {
            console.warn("UserStore: Nema tokena, preskačem fetchProfile.");
            return;
        }

        this.isLoading = true;
        this.error = null;

        try {
            const res = await axios.get("http://localhost:3000/api/users/profile", {
                headers: headers
            });

            runInAction(() => {
                this.profile = res.data;
                // Osiguraj da je i authStore sinkroniziran ako već nije
                if (!authStore.user) authStore.user = res.data;
            });
        } catch (err) {
            console.error("fetchProfile Error:", err.response?.status, err.response?.data);
            
            runInAction(() => {
                this.error = err.response?.data?.message || "Greška pri učitavanju profila";
                
                // Ako je token nevažeći (403 ili 401), odjavi korisnika
                if (err.response?.status === 403 || err.response?.status === 401) {
                    authStore.logout();
                }
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async fetchPublicProfile(username) {
        // Public profil ne treba auth headere
        this.isLoading = true;
        this.error = null;
        
        try {
            const res = await axios.get(`http://localhost:3000/api/users/u/${username}`);
            runInAction(() => { 
                this.publicProfile = res.data; 
            });
        } catch (err) {
            console.error("fetchPublicProfile Error:", err);
            runInAction(() => { 
                this.publicProfile = null; 
                this.error = "Korisnik nije pronađen";
            });
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async updateProfile(userData) {
        this.isLoading = true;
        try {
            const res = await axios.put("http://localhost:3000/api/users/profile", userData, {
                headers: this.getAuthHeaders()
            });

            runInAction(() => {
                this.profile = res.data;
                // Ažuriraj i glavnog ulogiranog korisnika u AuthStore-u
                if (authStore.user) {
                    authStore.user = { ...authStore.user, ...res.data };
                }
            });
            return res.data;
        } catch (err) {
            console.error("updateProfile Error:", err);
            throw err.response?.data?.message || "Ažuriranje neuspješno";
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Poziva se kod logouta
    clearUserData() {
        runInAction(() => {
            this.profile = null;
            this.publicProfile = null;
            this.error = null;
        });
    }
}

export const userStore = new UserStore();