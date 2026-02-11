import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { messageStore } from '../stores/MessageStore';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore';
import '../styles/chat.css';

const ChatDetail = observer(() => {
    // useParams vraća string, osigurajmo da je definiran
    const { userId } = useParams();
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!userId) return;

        const loadChatData = async () => {
            try {
                // Prvo dohvati poruke (ovo bi u tvojem storeu trebalo postaviti i interlocutor-a)
                await messageStore.fetchChat(userId);
                
                // Ako nakon fetchChat i dalje nemamo peer-a, probajmo ga naći u konverzacijama
                if (!messageStore.interlocutor) {
                    await messageStore.fetchConversations();
                }
            } catch (err) {
                console.error("Greška pri učitavanju chata:", err);
            }
        };

        loadChatData();

        // Čišćenje pri izlasku - važno da se ne miješaju poruke različitih korisnika
        return () => {
            messageStore.clearActiveChat();
        };
    }, [userId]);

    // Scroll na dno čim se učitaju poruke ili stigne nova
    useEffect(() => {
        scrollToBottom();
    }, [messageStore.activeChat?.length]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmedText = text.trim();
        if (!trimmedText || !userId) return;

        try {
            await messageStore.sendMessage(userId, trimmedText);
            setText("");
            // Scrollaj odmah nakon slanja
            setTimeout(scrollToBottom, 50);
        } catch (err) {
            console.error("Slanje poruke nije uspjelo:", err);
            alert("Slanje poruke nije uspjelo.");
        }
    };

    const peer = messageStore.interlocutor;

    console.log("Trenutni sugovornik (peer):", peer);
    console.log("Aktivne poruke:", messageStore.activeChat);

    return (
        <div className="chat-detail">
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/messages')}>←</button>
                
                {peer ? (
                    <div className="chat-user-info" onClick={() => navigate(`/profile/${peer.username}`)}>
                        <img 
                            src={peer.avatar || '/default-avatar.png'} 
                            className="header-mini-avatar" 
                            alt="avatar" 
                            onError={(e) => { e.target.src = '/default-avatar.png'; }}
                        />
                        <div className="user-text-details">
                            <span className="user-full-name">{peer.displayName || peer.username}</span>
                            <div className="follow-status-mini">
                                {peer.isFollowing ? (
                                    <span className="following-tag">✓ Pratiš</span>
                                ) : (
                                    <button 
                                        className="mini-follow-btn" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            userStore.handleFollow(peer.id);
                                        }}
                                    >
                                        Prati
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="chat-user-info">
                        <span className="user-full-name">Učitavanje sugovornika... (ID: {userId})</span>
                    </div>
                )}
            </div>

            <div className="chat-messages-area">
                {!messageStore.activeChat || messageStore.activeChat.length === 0 ? (
                    <div className="empty-chat-notice">Nema poruka. Započnite razgovor!</div>
                ) : (
                    messageStore.activeChat.map((msg, index) => {
                        const isMine = msg.senderId === authStore.user?.id;
                        return (
                            <div key={msg.id || index} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                                {!isMine && (
                                    <img 
                                        src={peer?.avatar || '/default-avatar.png'} 
                                        className="mini-avatar" 
                                        alt="avatar"
                                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                    />
                                )}
                                <div className="message-bubble">
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-container">
                <form className="chat-input-form" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        placeholder="Napiši poruku..." 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" disabled={!text.trim() || !userId} className="send-btn">
                        <span className="send-icon">➤</span>
                    </button>
                </form>
            </div>
        </div>
    );
});

export default ChatDetail;