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
                    // Koristimo String() jer ID iz baze i ID iz socketa često nisu isti tip (number vs string)
                    if (this.publicProfile && String(this.publicProfile.id) === String(data.userId)) {
                        this.publicProfile.followersCount = data.followersCount;
                    }
                    if (this.profile && String(this.profile.id) === String(data.userId)) {
                        this.profile.followersCount = data.followersCount;
                    }
                });
            });
        }
    }

    // KLJUČNO ZA OSVJEŽAVANJE (F5): 
    // Prvo gledamo localStorage jer se MobX stanje resetira pri refreshu
    getAuthHeaders() {
        const token = localStorage.getItem("token") || authStore.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Dohvaćanje vlastitog profila (ulogirani korisnik)
    async fetchProfile() {
        const headers = this.getAuthHeaders();
        if (!headers.Authorization) return;

        this.isLoading = true;
        try {
            const res = await axios.get("http://localhost:3000/api/users/profile", { headers });
            runInAction(() => {
                this.profile = res.data;
                // Sinkronizacija s AuthStore-om ako je potrebno
                if (!authStore.user) authStore.user = res.data;
            });
        } catch (err) {
            console.error("fetchProfile Error:", err);
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    // Dohvaćanje tuđeg (javnog) profila
    async fetchPublicProfile(username) {
        if (!username) return;
        this.isLoading = true;
        this.error = null;
        try {
            // Šaljemo headers čak i za javni profil da backend zna jesmo li "follower"
            const res = await axios.get(`http://localhost:3000/api/users/u/${username}`, {
                headers: this.getAuthHeaders()
            });
            
            runInAction(() => { 
                this.publicProfile = res.data; 
            });
        } catch (err) {
            console.error("fetchPublicProfile Error:", err);
            runInAction(() => { 
                this.error = "Korisnik nije pronađen"; 
            });
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
                if (authStore.user) {
                    authStore.user = { ...authStore.user, ...res.data };
                }
            });
            return res.data;
        } catch (err) {
            throw err.response?.data?.message || "Greška pri ažuriranju profila";
        }
    }

    handleFollow = async (userId) => {
        try {
            // Optimistično ažuriranje UI-ja
            runInAction(() => {
                if (this.publicProfile && String(this.publicProfile.id) === String(userId)) {
                    this.publicProfile.isFollowing = true;
                    this.publicProfile.followersCount++;
                }
            });

            await axios.post(`http://localhost:3000/api/users/${userId}/follow`, {}, {
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error("Follow error:", error);
            // Ako ne uspije, osvježi podatke s backenda da se vrati na staro
            this.fetchPublicProfile(this.publicProfile?.username);
        }
    };

    handleUnfollow = async (userId) => {
        try {
            // Optimistično ažuriranje UI-ja
            runInAction(() => {
                if (this.publicProfile && String(this.publicProfile.id) === String(userId)) {
                    this.publicProfile.isFollowing = false;
                    this.publicProfile.followersCount--;
                }
            });

            await axios.delete(`http://localhost:3000/api/users/${userId}/unfollow`, {
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error("Unfollow error:", error);
            this.fetchPublicProfile(this.publicProfile?.username);
        }
    };
}

export const userStore = new UserStore();