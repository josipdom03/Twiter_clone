import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";
import socket from "../socket";

class MessageStore {
    conversations = []; // Za MessagesPage (lista ljudi)
    activeChat = [];    // Za ChatDetail (poruke unutar jednog chata)
    isLoading = false;

    constructor() {
        makeAutoObservable(this);
        this.setupSocket();
    }

    setupSocket() {
        socket.on('receive_message', (msg) => {
            runInAction(() => {
                // Ako je to poruka iz chata koji trenutno gledamo, dodaj je u listu
                this.activeChat.push(msg);
                
                // Osvježi i listu razgovora (da zadnja poruka bude ažurna)
                this.fetchConversations(); 
            });
        });
    }

    // Dohvaća listu svih ljudi s kojima pričamo
    async fetchConversations() {
        const res = await axios.get("http://localhost:3000/api/message/conversations");
        runInAction(() => { this.conversations = res.data; });
    }

    // Dohvaća poruke samo s jednom osobom
    async fetchChat(userId) {
        this.isLoading = true;
        const res = await axios.get(`http://localhost:3000/api/message/${userId}`);
        runInAction(() => {
            this.activeChat = res.data;
            this.isLoading = false;
        });
    }
}

export const messageStore = new MessageStore();