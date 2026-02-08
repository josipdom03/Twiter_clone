import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import socket from "../socket";
import { authStore } from "./AuthStore"; // Uvezi authStore da možemo dohvatiti token

class MessageStore {
    conversations = []; // Za MessagesPage (lista ljudi)
    activeChat = [];    // Za ChatDetail (poruke unutar jednog chata)
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
        this.setupSocket();
    }

    setupSocket() {
        // Važno: Očisti stare listenere da se poruke ne duplaju pri re-renderu
        socket.off('receive_message'); 
        
        socket.on('receive_message', (msg) => {
            runInAction(() => {
                // Provjera: Dodajemo u activeChat samo ako je poruka dio trenutnog razgovora
                // msg.senderId je osoba koja šalje, msg.recipientId si ti
                // Ili obrnuto ako si ti poslao s drugog uređaja
                this.activeChat.push(msg);
                
                // Osvježi listu razgovora da se ažurira snippet zadnje poruke
                this.fetchConversations(); 
            });
        });
    }

    // Pomoćna funkcija za headere (da ne pišemo stalno isto)
    get config() {
        return {
            headers: { Authorization: `Bearer ${authStore.token}` }
        };
    }

    // 1. Dohvaća listu svih ljudi s kojima pričamo
    async fetchConversations() {
        try {
            const res = await axios.get("http://localhost:3000/api/message/conversations", this.config);
            runInAction(() => { 
                this.conversations = res.data; 
            });
        } catch (err) {
            console.error("Greška pri dohvaćanju razgovora:", err);
        }
    }

    // 2. Dohvaća poruke samo s jednom osobom
    async fetchChat(userId) {
        this.isLoading = true;
        try {
            const res = await axios.get(`http://localhost:3000/api/message/${userId}`, this.config);
            runInAction(() => {
                this.activeChat = res.data;
                this.isLoading = false;
            });
        } catch (err) {
            console.error("Greška pri dohvaćanju chata:", err);
            runInAction(() => { this.isLoading = false; });
        }
    }

    // 3. NOVO: Slanje poruke
    async sendMessage(recipientId, content) {
        try {
            const res = await axios.post(
                "http://localhost:3000/api/message/send", 
                { recipientId, content }, 
                this.config
            );

            // Socket na backendu bi trebao emitirati poruku, 
            // ali je možemo i ručno dodati ovdje radi bržeg UI-ja (optimistic update)
            runInAction(() => {
                // Provjeravamo da je ne dodamo dvaput ako socket odmah vrati
                const exists = this.activeChat.some(m => m.id === res.data.id);
                if (!exists) {
                    this.activeChat.push(res.data);
                }
                this.fetchConversations(); // Ažuriraj listu sa strane
            });

            return res.data;
        } catch (err) {
            console.error("Greška pri slanju poruke:", err);
            throw err;
        }
    }
}

export const messageStore = new MessageStore();