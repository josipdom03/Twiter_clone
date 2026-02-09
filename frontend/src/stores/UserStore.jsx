import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";
import { io } from "socket.io-client";

class UserStore {
    profile = null;
    publicProfile = null;
    isLoading = false;
    error = null;
    socket = null;

    constructor() {
        // Ovo omogućuje MobX-u da prati promjene i automatski osvježava komponente
        makeAutoObservable(this);
        this.initSocket();
    }

    initSocket() {
        if (!this.socket) {
            this.socket = io("http://localhost:3000", {
                transports: ['websocket']
            });

            this.socket.on('update_followers', (data) => {
                runInAction(() => {
                    if (this.publicProfile && this.publicProfile.id == data.userId) {
                        this.publicProfile.followersCount = data.followersCount;
                    }
                    if (this.profile && this.profile.id == data.userId) {
                        this.profile.followersCount = data.followersCount;
                    }
                });
            });
        }
    }

    getAuthHeaders() {
        const token = authStore.token || localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // --- FUNKCIJA KOJA TI JE FALILA ---
    async fetchProfile() {
        const headers = this.getAuthHeaders();
        if (!headers.Authorization) return;

        this.isLoading = true;
        try {
            const res = await axios.get("http://localhost:3000/api/users/profile", { headers });
            runInAction(() => {
                this.profile = res.data;
                if (!authStore.user) authStore.user = res.data;
            });
        } catch (err) {
            console.error("fetchProfile Error:", err);
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    // --- FUNKCIJA KOJA TI JE FALILA ---
    async fetchPublicProfile(username) {
        this.isLoading = true;
        try {
            const res = await axios.get(`http://localhost:3000/api/users/u/${username}`);
            runInAction(() => { 
                this.publicProfile = res.data; 
            });
        } catch (err) {
            runInAction(() => { this.error = "Korisnik nije pronađen"; });
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async updateProfile(userData) {
        try {
            const res = await axios.put("http://localhost:3000/api/users/profile", userData, {
                headers: this.getAuthHeaders()
            });
            runInAction(() => {
                this.profile = res.data;
                if (authStore.user) authStore.user = { ...authStore.user, ...res.data };
            });
            return res.data;
        } catch (err) {
            throw err.response?.data?.message || "Greška";
        }
    }

    handleFollow = async (userId) => {
        try {
            // Optimistično ažuriranje (UI reagira odmah)
            runInAction(() => {
                if (this.publicProfile && this.publicProfile.id === userId) {
                    this.publicProfile.isFollowing = true;
                    this.publicProfile.followersCount++;
                }
            });
            await axios.post(`http://localhost:3000/api/users/${userId}/follow`, {}, {
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            this.fetchPublicProfile(this.publicProfile?.username); // Vrati na staro ako ne uspije
        }
    };

    handleUnfollow = async (userId) => {
        try {
            runInAction(() => {
                if (this.publicProfile && this.publicProfile.id === userId) {
                    this.publicProfile.isFollowing = false;
                    this.publicProfile.followersCount--;
                }
            });
            await axios.delete(`http://localhost:3000/api/users/${userId}/unfollow`, {
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            this.fetchPublicProfile(this.publicProfile?.username);
        }
    };


    async fetchPublicProfileById(userId) {
    this.isLoading = true;
    this.error = null;
    try {
        const res = await axios.get(`http://localhost:3000/api/users/id/${userId}`, {
            headers: this.getAuthHeaders() // Šaljemo header da backend zna pratim li ga (isFollowing)
        });
        runInAction(() => {
            this.publicProfile = res.data;
        });
    } catch (err) {
        console.error("fetchPublicProfileById Error:", err);
        runInAction(() => {
            this.error = "Korisnik nije pronađen";
        });
    } finally {
        runInAction(() => { this.isLoading = false; });
    }
}
}

export const userStore = new UserStore();