import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import socket from "../socket";
import { authStore } from "./AuthStore";

class MessageStore {
    conversations = [];
    activeChat = [];
    interlocutor = null;
    isLoading = false;
    isTyping = false;
    onlineUsers = new Set();

    constructor() {
        makeAutoObservable(this);
        this.setupSocket();
    }

    setupSocket() {
        socket.off('receive_message');
        socket.off('messages_read_update');
        socket.off('display_typing');
        socket.off('user_status_change');

        socket.on('receive_message', (msg) => {
            runInAction(() => {
                const isRelevant = 
                    String(msg.senderId) === String(this.interlocutor?.id) ||
                    (String(msg.recipientId) === String(this.interlocutor?.id) && String(msg.senderId) === String(authStore.user?.id));

                if (this.activeChat && isRelevant) {
                    if (!this.activeChat.some(m => m.id === msg.id)) {
                        this.activeChat.push(msg);
                        if (String(msg.senderId) === String(this.interlocutor?.id)) {
                            this.markChatAsRead(this.interlocutor.id);
                        }
                    }
                }
                this.fetchConversations();
            });
        });

        socket.on('messages_read_update', ({ readBy }) => {
            runInAction(() => {
                if (this.interlocutor && String(this.interlocutor.id) === String(readBy)) {
                    this.activeChat.forEach(msg => {
                        if (String(msg.senderId) === String(authStore.user?.id)) {
                            msg.isRead = true;
                        }
                    });
                }
                this.fetchConversations();
            });
        });

        socket.on('display_typing', ({ senderId, typing }) => {
            if (this.interlocutor && String(this.interlocutor.id) === String(senderId)) {
                runInAction(() => {
                    this.isTyping = typing;
                });
            }
        });

        socket.on('user_status_change', ({ userId, online }) => {
            runInAction(() => {
                if (online) this.onlineUsers.add(String(userId));
                else this.onlineUsers.delete(String(userId));
            });
        });
    }

    sendTypingStatus(recipientId, isTyping) {
        socket.emit('typing', {
            recipientId,
            senderId: authStore.user?.id,
            typing: isTyping
        });
    }

    get config() {
        return { headers: { Authorization: `Bearer ${authStore.token}` } };
    }

    get isInterlocutorOnline() {
        return this.interlocutor && this.onlineUsers.has(String(this.interlocutor.id));
    }

    // NOVA/VRAĆENA METODA: Dohvaća info o korisniku preko ID-a
    async fetchInterlocutorInfo(userId) {
        try {
            const res = await axios.get(`http://localhost:3000/api/users/id/${userId}`, this.config);
            runInAction(() => {
                this.interlocutor = res.data;
            });
        } catch (err) {
            console.error("Neuspjelo dohvaćanje podataka o sugovorniku:", err);
        }
    }

    async fetchChat(userId) {
        this.isLoading = true;
        try {
            const res = await axios.get(`http://localhost:3000/api/message/${userId}`, this.config);
            runInAction(() => {
                // Backend obično šalje objekt koji sadrži i poruke i korisnika
                this.activeChat = res.data.messages || (Array.isArray(res.data) ? res.data : []);
                this.interlocutor = res.data.user || null;
                this.isLoading = false;
            });
            await this.markChatAsRead(userId);
        } catch (err) {
            console.error("Greška pri dohvaćanju chata:", err);
            runInAction(() => this.isLoading = false);
        }
    }

    async sendMessage(recipientId, content) {
        try {
            const res = await axios.post("http://localhost:3000/api/message/send", { recipientId, content }, this.config);
            runInAction(() => {
                if (!this.activeChat.some(m => m.id === res.data.id)) {
                    this.activeChat.push(res.data);
                }
                this.fetchConversations();
            });
            this.sendTypingStatus(recipientId, false);
            return res.data;
        } catch (err) {
            console.error("Slanje neuspjelo:", err);
            throw err;
        }
    }

    async markChatAsRead(userId) {
        try {
            await axios.put(`http://localhost:3000/api/message/read/${userId}`, {}, this.config);
            socket.emit('messages_seen', { 
                senderId: userId, 
                receiverId: authStore.user?.id 
            });
            this.fetchConversations();
        } catch (err) {
            console.error("Greška pri markAsRead:", err);
        }
    }

    async fetchConversations() {
        try {
            const res = await axios.get("http://localhost:3000/api/message/conversations", this.config);
            runInAction(() => { this.conversations = res.data; });
        } catch (err) {
            console.error("Greška pri konverzacijama:", err);
        }
    }

    clearActiveChat() {
        runInAction(() => {
            this.activeChat = [];
            this.interlocutor = null;
            this.isTyping = false;
        });
    }
}

export const messageStore = new MessageStore();