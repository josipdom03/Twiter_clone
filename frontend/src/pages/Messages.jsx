import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { messageStore } from '../stores/MessageStore';
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
                {messageStore.conversations.length > 0 ? (
                    messageStore.conversations.map((conv) => (
                        <div 
                            key={conv.id} 
                            className="conversation-item"
                            onClick={() => navigate(`/messages/${conv.OtherUser.id}`)}
                        >
                            <img src={conv.OtherUser.avatar} alt="Avatar" className="conv-avatar" />
                            <div className="conv-info">
                                <div className="conv-user-header">
                                    <span className="display-name">{conv.OtherUser.displayName}</span>
                                    <span className="username">@{conv.OtherUser.username}</span>
                                </div>
                                <p className="last-message">
                                    {conv.lastMessageContent}
                                </p>
                            </div>
                            {conv.unreadCount > 0 && <div className="unread-dot"></div>}
                        </div>
                    ))
                ) : (
                    <p className="no-conv">Još nemaš započetih razgovora.</p>
                )}
            </div>
        </div>
    );
});

export default Messages;