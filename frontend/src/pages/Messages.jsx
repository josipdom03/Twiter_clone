import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { messageStore } from '../stores/MessageStore';
import { authStore } from '../stores/AuthStore'; // Treba nam da znamo tko smo MI
import '../styles/messages.css';

const Messages = observer(() => {
    const navigate = useNavigate();

    useEffect(() => {
        messageStore.fetchConversations();
    }, []);

    return (
        <div className="messages-page">
            <div className="messages-header">
                <h2>Poruke</h2>
            </div>
            <div className="conversations-list">
                {messageStore.conversations && messageStore.conversations.length > 0 ? (
                    messageStore.conversations.map((conv) => {
                        // LOGIKA: Ako sam ja poslao poruku (Sender), sugovornik je Recipient.
                        // Ako sam ja primio poruku, sugovornik je Sender.
                        const otherUser = conv.Sender?.id === authStore.user?.id 
                            ? conv.Recipient 
                            : conv.Sender;

                        // Ako iz nekog razloga nema sugovornika (npr. obrisan profil), preskoči render
                        if (!otherUser) return null;

                        return (
                            <div 
                                key={conv.id} 
                                className="conversation-item"
                                onClick={() => navigate(`/messages/${otherUser.id}`)}
                            >
                                <img 
                                    src={otherUser.avatar || '/default-avatar.png'} 
                                    alt="Avatar" 
                                    className="conv-avatar" 
                                    onError={(e) => e.target.src = '/default-avatar.png'} // Fallback ako link ne radi
                                />
                                <div className="conv-info">
                                    <div className="conv-user-header">
                                        <span className="display-name">
                                            {otherUser.displayName || otherUser.username}
                                        </span>
                                        <span className="username">
                                            @{otherUser.username}
                                        </span>
                                    </div>
                                    <p className="last-message">
                                        {/* Prikazujemo sadržaj poruke */}
                                        {conv.content} 
                                    </p>
                                </div>
                                {conv.unread && <div className="unread-dot"></div>}
                            </div>
                        );
                    })
                ) : (
                    <div className="no-conv-container">
                         <p className="no-conv">Još nemaš započetih razgovora.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default Messages;