import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore'; 
import axios from 'axios';
import '../../styles/tweet.css';

export const Tweet = observer(({ tweet, onOpen, onLikeUpdate, onRetweetUpdate }) => {
    const navigate = useNavigate();
    
    const isRetweetAction = !!tweet.parentId;
    const displayData = isRetweetAction ? tweet.ParentTweet : tweet;
    const retweeter = isRetweetAction ? tweet.User : null;

    const isLiked = displayData?.LikedByUsers?.some(u => u.id === authStore.user?.id);

    const handleLike = async (e) => {
        e.stopPropagation(); 
        if (!authStore.isAuthenticated) return alert("Moraš biti prijavljen!");
        try {
            const res = await axios.post(
                `http://localhost:3000/api/likes/tweet/${displayData.id}/like`,
                {},
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            if (onLikeUpdate) onLikeUpdate(displayData.id, res.data.liked);
        } catch (err) {
            console.error("Greška pri lajkanju:", err);
        }
    };

    const handleRetweet = async (e) => {
        e.stopPropagation();
        if (!authStore.isAuthenticated) return alert("Moraš biti prijavljen!");
        try {
            const res = await axios.post(
                `http://localhost:3000/api/tweets/${displayData.id}/retweet`,
                {},
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            if (onRetweetUpdate) {
                onRetweetUpdate(displayData.id, res.data.action);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Greška pri retweetingu:", err);
        }
    };

    const renderContent = (text) => {
        if (!text) return "";
        const parts = text.split(/(#[a-zA-Z0-9_ćčšžđ]+|https?:\/\/[^\s]+)/g);
        return parts.map((part, index) => {
            if (part.startsWith("#")) {
                return (
                    <span key={index} className="hashtag-link" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/search?q=${encodeURIComponent(part)}`); }}>
                        {part}
                    </span>
                );
            }
            if (part.match(/^https?:\/\//)) {
                if (displayData.linkUrl && part.trim() === displayData.linkUrl.trim()) return null;
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} className="content-link">
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const formatHostname = (url) => {
        try { return new URL(url).hostname.replace('www.', ''); } 
        catch (e) { return ''; }
    };

    if (!displayData) return <div className="tweet-item">Učitavanje...</div>;

    return (
        <div className="tweet-item" onClick={() => onOpen(displayData)}>
            {isRetweetAction && (
                <div className="retweet-upper-label">
                    <span className="rt-icon">🔁</span> 
                    {retweeter?.displayName || (retweeter?.username ? `@${retweeter.username}` : 'Netko')} je proslijedio/la
                </div>
            )}

            <div className="tweet-main-content">
                <div className="tweet-avatar-placeholder" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/profile/${displayData.User?.username}`}>
                        <img 
                            src={displayData.User?.avatar || '/default-avatar.png'} 
                            alt="avatar" 
                            onError={(e) => { e.target.src = '/default-avatar.png' }}
                        />
                    </Link>
                </div>
                
                <div className="tweet-body">
                    <div className="tweet-header-info">
                        <Link to={`/profile/${displayData.User?.username}`} className="tweet-user-link" onClick={(e) => e.stopPropagation()}>
                            <span className="tweet-display-name">{displayData.User?.displayName || 'Korisnik'}</span>
                            <span className="tweet-username">@{displayData.User?.username || 'nepoznato'}</span>
                        </Link>
                        <span className="tweet-date"> 
                            • {displayData.createdAt && !isNaN(new Date(displayData.createdAt)) 
                                ? new Date(displayData.createdAt).toLocaleDateString() : 'Nedavno'}
                        </span>
                    </div>

                    <p className="tweet-text">{renderContent(displayData.content)}</p>

                    {/* PORTAL LINK KARTICA */}
                    {displayData.linkUrl && (
                        <div className="portal-link-card" onClick={(e) => {
                                e.stopPropagation();
                                window.open(displayData.linkUrl, '_blank');
                            }}>
                            <div className="portal-card-image">
                                {displayData.linkImage ? (
                                    <img src={displayData.linkImage} alt="portal content" />
                                ) : (
                                    <div className="image-fallback">
                                        <span>{formatHostname(displayData.linkUrl)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="portal-card-footer">
                                <span className="portal-domain">{formatHostname(displayData.linkUrl)}</span>
                                <h4 className="portal-title">{displayData.linkTitle || "Pročitajte više na portalu..."}</h4>
                            </div>
                        </div>
                    )}

                    {displayData.image && !displayData.linkUrl && (
                        <div className="tweet-image-container">
                            <img src={displayData.image} className="tweet-image-content" alt="tweet" />
                        </div>
                    )}

                    <div className="tweet-actions">
                        <span className="action-btn comment-btn">💬 {displayData.Comments?.length || 0}</span>
                        <span className={`action-btn retweet-btn ${isRetweetAction ? 'active' : ''}`} onClick={handleRetweet}>
                            {isRetweetAction ? '🔁' : '🔃'} {displayData.retweetCount || 0}
                        </span>
                        <span className={`action-btn like-btn ${isLiked ? 'active' : ''}`} onClick={handleLike}>
                            {isLiked ? '❤️' : '🤍'} {displayData.LikedByUsers?.length || 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});