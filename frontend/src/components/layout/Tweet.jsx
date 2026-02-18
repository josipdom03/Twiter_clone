import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore'; 
import axios from 'axios';

export const Tweet = observer(({ tweet, onOpen, onLikeUpdate }) => {
    const navigate = useNavigate();
    const isLiked = tweet.LikedByUsers?.some(u => u.id === authStore.user?.id);

    const handleLike = async (e) => {
        e.stopPropagation(); 
        if (!authStore.isAuthenticated) return alert("Moraš biti prijavljen!");

        try {
            const res = await axios.post(
                `http://localhost:3000/api/likes/tweet/${tweet.id}/like`,
                {},
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            
            if (onLikeUpdate) {
                onLikeUpdate(tweet.id, res.data.liked);
            }
        } catch (err) {
            console.error("Greška pri lajkanju:", err);
        }
    };

    // FUNKCIJA ZA PRIKAZ HASHTAGOVA
    const renderContent = (text) => {
        if (!text) return "";
        
        // Splitamo tekst pomoću regexa koji prepoznaje hashtagove
        const parts = text.split(/(#[a-zA-Z0-9_ćčšžđ]+)/g);
        
        return parts.map((part, index) => {
            if (part.startsWith("#")) {
                return (
                    <span 
                        key={index} 
                        className="hashtag-link" 
                        onClick={(e) => {
                            e.stopPropagation(); // Da ne otvori cijeli tweet modal
                            navigate(`/search?q=${encodeURIComponent(part)}`);
                        }}
                        style={{ color: '#1d9bf0', cursor: 'pointer' }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="tweet-item" onClick={() => onOpen(tweet)} style={{ cursor: 'pointer' }}>
            <div className="tweet-avatar-placeholder" onClick={(e) => e.stopPropagation()}>
                <Link to={`/profile/${tweet.User?.username}`}>
                    <img src={tweet.User?.avatar || '/default-avatar.png'} alt="avatar" />
                </Link>
            </div>
            <div className="tweet-body">
                <div className="tweet-header-info">
                    <Link 
                        to={`/profile/${tweet.User?.username}`} 
                        className="tweet-user-link" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="tweet-display-name">{tweet.User?.displayName}</span>
                        <span className="tweet-username">@{tweet.User?.username}</span>
                    </Link>
                    <span className="tweet-date"> • {new Date(tweet.createdAt).toLocaleDateString()}</span>
                </div>

                {/* PROMIJENJENO: Ovdje sada pozivamo renderContent */}
                <p className="tweet-text">
                    {renderContent(tweet.content)}
                </p>
                
                {tweet.image && (
                    <div className="tweet-image-container">
                        <img src={tweet.image} className="tweet-image-content" alt="tweet" />
                    </div>
                )}

                <div className="tweet-actions">
                    <span className="action-stat">💬 {tweet.Comments?.length || 0}</span>
                    <span 
                        className={`action-btn like-btn ${isLiked ? 'active' : ''}`}
                        onClick={handleLike}
                    >
                        {isLiked ? '❤️' : '🤍'} {tweet.LikedByUsers?.length || 0}
                    </span>
                </div>
            </div>
        </div>
    );
});