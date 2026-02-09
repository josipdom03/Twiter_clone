import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import socket from "../socket";
import { authStore } from "./AuthStore";
import { userStore } from "./UserStore"; 

class MessageStore {
    conversations = []; 
    activeChat = [];    
    interlocutor = null; 
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
        this.setupSocket();
    }

    setupSocket() {
        socket.off('receive_message'); 
        socket.on('receive_message', (msg) => {
            runInAction(() => {
                // Dodajemo poruku samo ako pripada otvorenom chatu
                // Provjeravamo oba smjera (da smo mi poslali ili da smo primili u ovaj chat)
                const isRelevant = 
                    (String(msg.senderId) === String(this.interlocutor?.id)) || 
                    (String(msg.recipientId) === String(this.interlocutor?.id) && String(msg.senderId) === String(authStore.user?.id));

                if (this.activeChat && isRelevant) {
                    const exists = this.activeChat.some(m => m.id === msg.id);
                    if (!exists) {
                        this.activeChat.push(msg);
                    }
                }
                this.fetchConversations(); 
            });
        });
    }

    get config() {
        return {
            headers: { Authorization: `Bearer ${authStore.token}` }
        };
    }

    async fetchConversations() {
        try {
            const res = await axios.get("http://localhost:3000/api/message/conversations", this.config);
            runInAction(() => { 
                this.conversations = res.data; 
            });
            return res.data;
        } catch (err) {
            console.error("Greška pri dohvaćanju razgovora:", err);
        }
    }

    async fetchChat(userId) {
        this.isLoading = true;
        try {
            const res = await axios.get(`http://localhost:3000/api/message/${userId}`, this.config);
            
            runInAction(() => {
                this.activeChat = res.data; 

                // 1. POKUŠAJ: Nađi sugovornika u listi konverzacija
                const conversation = this.conversations.find(c => 
                    String(c.Participant1Id) === String(userId) || 
                    String(c.Participant2Id) === String(userId)
                );

                if (conversation) {
                    this.interlocutor = String(conversation.Participant1Id) === String(userId) 
                        ? conversation.Participant1 
                        : conversation.Participant2;
                } 
                
                // 2. POKUŠAJ (Fallback): Ako ga nema u konverzacijama, izvuci ga iz poruke
                // Gledamo poruku gdje je Sender objekt prisutan i ID se poklapa
                if (!this.interlocutor && this.activeChat.length > 0) {
                    const msgWithSender = this.activeChat.find(m => 
                        m.Sender && String(m.senderId) === String(userId)
                    );
                    if (msgWithSender) {
                        this.interlocutor = msgWithSender.Sender;
                    }
                }

                this.isLoading = false;
            });
        } catch (err) {
            console.error("Greška pri dohvaćanju chata:", err);
            runInAction(() => { this.isLoading = false; });
        }
    }

    async sendMessage(recipientId, content) {
        try {
            const res = await axios.post(
                "http://localhost:3000/api/message/send", 
                { recipientId, content }, 
                this.config
            );

            runInAction(() => {
                if (this.activeChat) {
                    const exists = this.activeChat.some(m => m.id === res.data.id);
                    if (!exists) {
                        this.activeChat.push(res.data);
                    }
                }
                this.fetchConversations();
            });

            return res.data;
        } catch (err) {
            console.error("Greška pri slanju poruke:", err);
            throw err;
        }
    }

    clearActiveChat() {
        runInAction(() => {
            this.activeChat = [];
            this.interlocutor = null;
        });
    }
}

export const messageStore = new MessageStore();