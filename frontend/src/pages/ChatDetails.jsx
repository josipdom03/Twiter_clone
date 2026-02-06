import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { messageStore } from '../stores/MessageStore';
import { authStore } from '../stores/AuthStore';
import '../styles/chat.css';

const ChatDetail = observer(() => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null); // Za automatski scroll na dno

    // Automatski scroll na dno liste kada stigne nova poruka
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        messageStore.fetchChat(userId);
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messageStore.activeChat.length]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        await messageStore.sendMessage(userId, text);
        setText("");
    };

    return (
        <div className="chat-detail">
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/messages')}>←</button>
                <h3>Razgovor</h3>
            </div>

            <div className="chat-messages-area">
                {messageStore.activeChat.map((msg) => {
                    const isMine = msg.senderId === authStore.user.id;
                    return (
                        <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                            {!isMine && <img src={msg.Sender?.avatar} className="mini-avatar" />}
                            <div className="message-bubble">
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSend}>
                <input 
                    type="text" 
                    placeholder="Napiši poruku..." 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" disabled={!text.trim()}>
                    ➤
                </button>
            </form>
        </div>
    );
});

export default ChatDetail;