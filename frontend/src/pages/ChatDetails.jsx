import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { messageStore } from '../stores/MessageStore';
import { authStore } from '../stores/AuthStore';
import { runInAction } from 'mobx';
import '../styles/chat.css';

const ChatDetail = observer(() => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        messageStore.fetchChat(userId);
        
        // Čišćenje aktivnog chata pri odlasku s komponente ili promjeni korisnika
        return () => {
            runInAction(() => {
                messageStore.activeChat = [];
            });
        };
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messageStore.activeChat.length]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            await messageStore.sendMessage(userId, text);
            setText("");
        } catch (err) {
            alert("Slanje poruke nije uspjelo.");
        }
    };

    return (
        <div className="chat-detail">
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/messages')}>←</button>
                <h3>Razgovor</h3>
            </div>

            <div className="chat-messages-area">
                {messageStore.activeChat.map((msg) => {
                    // SIGURNA PROVJERA: Koristimo ?.id i osiguravamo da user postoji
                    const isMine = msg.senderId === authStore.user?.id;
                    
                    return (
                        <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                            {/* Avatar se prikazuje samo za tuđe poruke */}
                            {!isMine && (
                                <img 
                                    src={msg.Sender?.avatar || '/default-avatar.png'} 
                                    className="mini-avatar" 
                                    alt="avatar"
                                    onError={(e) => e.target.src = '/default-avatar.png'}
                                />
                            )}
                            <div className="message-bubble">
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-container">
                <form className="chat-input-form" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        placeholder="Napiši poruku..." 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button type="submit" disabled={!text.trim()} className="send-btn">
                        <span className="send-icon">➤</span>
                    </button>
                </form>
            </div>
        </div>
    );
});

export default ChatDetail;