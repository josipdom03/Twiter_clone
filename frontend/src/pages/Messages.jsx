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

    const getUniqueConversations = () => {
        const conversationsMap = new Map();

        // Sortiramo razgovore tako da najnovija poruka bude na vrhu
        const sortedMessages = [...messageStore.conversations].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        sortedMessages.forEach((msg) => {
            const otherUser = msg.Sender?.id === authStore.user?.id ? msg.Recipient : msg.Sender;
            
            if (!otherUser) return;

            if (!conversationsMap.has(otherUser.id)) {
                conversationsMap.set(otherUser.id, {
                    ...msg,
                    otherUser
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
                    uniqueConvs.map((conv) => {
                        // LOGIKA ZA NEPROČITANO:
                        // Poruka je nepročitana ako:
                        // 1. Ti si primatelj (recipientId === tvoj id)
                        // 2. Status isRead je false
                        const isUnread = conv.recipientId === authStore.user?.id && !conv.isRead;

                        return (
                            <div 
                                key={conv.id} 
                                className={`conversation-item ${isUnread ? 'unread' : ''}`}
                                onClick={() => navigate(`/messages/${conv.otherUser.id}`)}
                            >
                                <div className="avatar-wrapper">
                                    <img 
                                        src={conv.otherUser.avatar || '/default-avatar.png'} 
                                        alt="Avatar" 
                                        className="conv-avatar" 
                                        onError={(e) => e.target.src = '/default-avatar.png'}
                                    />
                                    {isUnread && <div className="unread-dot-indicator"></div>}
                                </div>

                                <div className="conv-info">
                                    <div className="conv-user-header">
                                        <span className="display-name">
                                            {conv.otherUser.displayName || conv.otherUser.username}
                                        </span>
                                        <span className="username">
                                            @{conv.otherUser.username}
                                        </span>
                                        <span className="conv-time">
                                            {new Date(conv.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`last-message ${isUnread ? 'unread-text' : ''}`}>
                                        {conv.senderId === authStore.user?.id && (
                                            <span style={{ color: '#536471', fontWeight: '600' }}>Vi: </span>
                                        )}
                                        {conv.content.length > 40 
                                            ? conv.content.substring(0, 40) + "..." 
                                            : conv.content
                                        }
                                    </p>
                                </div>
                                {isUnread && <div className="unread-badge">Nova poruka</div>}
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