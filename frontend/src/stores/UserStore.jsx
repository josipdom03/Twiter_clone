import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import { authStore } from "./AuthStore";
import { io } from "socket.io-client";

const API_BASE = "http://localhost:3000";

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

    formatAvatarUrl(user) {
        if (!user || !user.avatar) return null;
        if (user.avatar.startsWith('http')) return user.avatar;
        const path = user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`;
        return `${API_BASE}${path}`;
    }

    processUserList(list) {
        if (!list || !Array.isArray(list)) return [];
        return list.map(item => {
            const userData = item.Follower || item.Following || item;
            return {
                ...userData,
                avatar: this.formatAvatarUrl(userData)
            };
        });
    }

    initSocket() {
        if (!this.socket) {
            this.socket = io(API_BASE, { transports: ['websocket'] });
            this.socket.on('update_followers', (data) => {
                runInAction(() => {
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

    getAuthHeaders() {
        const token = localStorage.getItem("token") || authStore.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async fetchProfile() {
        const headers = this.getAuthHeaders();
        if (!headers.Authorization) return;
        this.isLoading = true;
        try {
            const res = await axios.get(`${API_BASE}/api/users/profile`, { headers });
            runInAction(() => {
                const data = res.data;
                data.avatar = this.formatAvatarUrl(data);
                data.Followers = this.processUserList(data.Followers || data.followers);
                data.Following = this.processUserList(data.Following || data.following);

                this.profile = data;
                if (!authStore.user) authStore.user = data;
            });
        } catch (err) {
            console.error("fetchProfile Error:", err);
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async fetchPublicProfile(username) {
        if (!username || username === "undefined" || username === "null") return;
        this.isLoading = true;
        this.error = null;
        try {
            // Provjeri putanju na backendu, obično je /api/users/:username ili /api/users/u/:username
            const res = await axios.get(`${API_BASE}/api/users/u/${username}`, {
                headers: this.getAuthHeaders()
            });
            runInAction(() => { 
                const data = res.data;
                data.avatar = this.formatAvatarUrl(data);
                data.Followers = this.processUserList(data.Followers || data.followers);
                data.Following = this.processUserList(data.Following || data.following);

                this.publicProfile = data; 
            });
        } catch (err) {
            runInAction(() => { this.error = "Korisnik nije pronađen"; });
        } finally {
            runInAction(() => { this.isLoading = false; });
        }
    }

    async updateProfile(userData) {
        try {
            const res = await axios.put(`${API_BASE}/api/users/profile`, userData, {
                headers: this.getAuthHeaders()
            });
            runInAction(() => {
                const data = res.data;
                data.avatar = this.formatAvatarUrl(data);
                this.profile = data;
                if (authStore.user) authStore.user = { ...authStore.user, ...data };
            });
            return res.data;
        } catch (err) {
            throw err.response?.data?.message || "Greška pri ažuriranju";
        }
    }

    // POPRAVLJENO: Koristi /api/follow/:id
    handleFollow = async (userId) => {
        try {
            const res = await axios.post(`${API_BASE}/api/follow/${userId}`, {}, { 
                headers: this.getAuthHeaders() 
            });

            runInAction(() => {
                if (this.publicProfile && String(this.publicProfile.id) === String(userId)) {
                    if (res.data.status === 'pending') {
                        this.publicProfile.followStatus = 'pending';
                    } else {
                        this.publicProfile.isFollowing = true;
                        this.publicProfile.followersCount++;
                    }
                }
            });
        } catch (error) {
            console.error("Follow error:", error);
            // Osvježi profil u slučaju greške da se UI sinkronizira
            this.fetchPublicProfile(this.publicProfile?.username);
        }
    };

    // POPRAVLJENO: Koristi DELETE /api/follow/:id
    handleUnfollow = async (userId) => {
        try {
            await axios.delete(`${API_BASE}/api/follow/${userId}`, { 
                headers: this.getAuthHeaders() 
            });

            runInAction(() => {
                if (this.publicProfile && String(this.publicProfile.id) === String(userId)) {
                    this.publicProfile.isFollowing = false;
                    this.publicProfile.followStatus = null;
                    this.publicProfile.followersCount = Math.max(0, this.publicProfile.followersCount - 1);
                }
            });
        } catch (error) {
            console.error("Unfollow error:", error);
            this.fetchPublicProfile(this.publicProfile?.username);
        }
    };
}

export const userStore = new UserStore();