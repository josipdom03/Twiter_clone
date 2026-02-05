import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore'; // Provjeri jesu li ovdje dvije točke (../..)
import axios from 'axios';

// KLJUČNO: Mora pisati "export const Tweet"
export const Tweet = observer(({ tweet, onOpen, onLikeUpdate }) => {
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
                <p className="tweet-text">{tweet.content}</p>
                
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