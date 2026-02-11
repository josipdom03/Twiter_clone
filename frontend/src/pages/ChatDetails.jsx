import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { messageStore } from '../stores/MessageStore';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore';
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
        if (!userId) return;

        const loadChatData = async () => {
            try {
                // 1. Pokušaj dohvatiti chat (i info o korisniku ako postoji povijest)
                await messageStore.fetchChat(userId);
                
                // 2. Ako interlocutor još nije postavljen (npr. novi chat bez poruka), dohvati ga ručno
                if (!messageStore.interlocutor) {
                    await messageStore.fetchInterlocutorInfo(userId);
                }
            } catch (err) {
                console.error("Greška pri učitavanju chata:", err);
            }
        };

        loadChatData();

        return () => {
            messageStore.clearActiveChat();
        };
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messageStore.activeChat?.length, messageStore.isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmedText = text.trim();
        if (!trimmedText || !userId) return;

        try {
            await messageStore.sendMessage(userId, trimmedText);
            setText("");
            messageStore.sendTypingStatus(userId, false);
            setTimeout(scrollToBottom, 50);
        } catch (err) {
            console.error("Slanje poruke nije uspjelo:", err);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setText(val);
        if (userId) {
            messageStore.sendTypingStatus(userId, val.length > 0);
            clearTimeout(window.typingTimeout);
            window.typingTimeout = setTimeout(() => {
                messageStore.sendTypingStatus(userId, false);
            }, 3000);
        }
    };

    const peer = messageStore.interlocutor;
    const isOnline = messageStore.isInterlocutorOnline;

    return (
        <div className="chat-detail">
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/messages')}>←</button>
                
                {peer ? (
                    <div className="chat-user-info" onClick={() => navigate(`/profile/${peer.username}`)}>
                        <div className="avatar-container">
                            <img 
                                src={peer.avatar || '/default-avatar.png'} 
                                className="header-mini-avatar" 
                                alt="avatar" 
                                onError={(e) => { e.target.src = '/default-avatar.png'; }}
                            />
                            {isOnline && <span className="online-indicator-dot"></span>}
                        </div>
                        <div className="user-text-details">
                            <span className="user-full-name">
                                {peer.displayName || peer.username}
                                {isOnline && <span className="online-text"> (Online)</span>}
                            </span>
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
                        <span className="user-full-name">Učitavanje...</span>
                    </div>
                )}
            </div>

            <div className="chat-messages-area">
                {(!messageStore.activeChat || messageStore.activeChat.length === 0) ? (
                    <div className="empty-chat-notice">
                        Nema poruka. Započnite razgovor s korisnikom {peer?.username || ''}!
                    </div>
                ) : (
                    messageStore.activeChat.map((msg, index) => {
                        const isMine = String(msg.senderId) === String(authStore.user?.id);
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
                                <div className="message-container">
                                    <div className="message-bubble">
                                        {msg.content}
                                    </div>
                                    {isMine && (
                                        <div className={`read-status ${msg.isRead ? 'read' : ''}`}>
                                            {msg.isRead ? '✓✓' : '✓'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                
                {messageStore.isTyping && (
                    <div className="message-wrapper theirs">
                        <div className="typing-indicator-bubble">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-container">
                <form className="chat-input-form" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        placeholder="Napiši poruku..." 
                        value={text}
                        onChange={handleInputChange}
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