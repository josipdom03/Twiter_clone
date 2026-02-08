import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { messageStore } from '../stores/MessageStore';
import { authStore } from '../stores/AuthStore';
import '../styles/messages.css';

const Messages = observer(() => {
    const navigate = useNavigate();

    useEffect(() => {
        messageStore.fetchConversations();
    }, []);

    // --- LOGIKA ZA GRUPIRANJE KONVERZACIJA ---
    const getUniqueConversations = () => {
        const conversationsMap = new Map();

        messageStore.conversations.forEach((msg) => {
            // Odredi tko je druga osoba
            const otherUser = msg.Sender?.id === authStore.user?.id ? msg.Recipient : msg.Sender;
            
            if (!otherUser) return;

            // Ako ovaj korisnik već nije u mapi, dodaj ga (budući da su poruke sortirane DESC, prva koju nađemo je najnovija)
            if (!conversationsMap.has(otherUser.id)) {
                conversationsMap.set(otherUser.id, {
                    ...msg,
                    otherUser // Spremo objekt korisnika radi lakšeg pristupa
                });
            }
        });

        return Array.from(conversationsMap.values());
    };

    const uniqueConvs = getUniqueConversations();

    return (
        <div className="messages-page">
            <div className="messages-header">
                <h2>Poruke</h2>
            </div>
            <div className="conversations-list">
                {uniqueConvs.length > 0 ? (
                    uniqueConvs.map((conv) => (
                        <div 
                            key={conv.id} 
                            className="conversation-item"
                            onClick={() => navigate(`/messages/${conv.otherUser.id}`)}
                        >
                            <img 
                                src={conv.otherUser.avatar || '/default-avatar.png'} 
                                alt="Avatar" 
                                className="conv-avatar" 
                                onError={(e) => e.target.src = '/default-avatar.png'}
                            />
                            <div className="conv-info">
                                <div className="conv-user-header">
                                    <span className="display-name">
                                        {conv.otherUser.displayName || conv.otherUser.username}
                                    </span>
                                    <span className="username">
                                        @{conv.otherUser.username}
                                    </span>
                                </div>
                                <p className="last-message">
                                    {/* Prikazuje samo zadnju poruku u listi za tog korisnika */}
                                    {conv.content.length > 40 ? conv.content.substring(0, 40) + "..." : conv.content}
                                </p>
                            </div>
                        </div>
                    ))
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