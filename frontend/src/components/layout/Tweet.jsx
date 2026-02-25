import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore'; 
import axios from 'axios';

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

    // NADOGRAĐENO: Prepoznaje i hashtage i linkove
    const renderContent = (text) => {
        if (!text) return "";
        const parts = text.split(/(#[a-zA-Z0-9_ćčšžđ]+|https?:\/\/[^\s]+)/g);
        return parts.map((part, index) => {
            if (part.startsWith("#")) {
                return (
                    <span 
                        key={index} 
                        className="hashtag-link" 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/search?q=${encodeURIComponent(part)}`);
                        }}
                        style={{ color: '#1d9bf0', cursor: 'pointer' }}
                    >
                        {part}
                    </span>
                );
            }
            // Dodano: Detekcija URL-a u tekstu
            if (part.match(/^https?:\/\//)) {
                return (
                    <a 
                        key={index} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: '#1d9bf0', textDecoration: 'none' }}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    if (!displayData) return <div className="tweet-item">Učitavanje...</div>;

    return (
        <div className="tweet-item" onClick={() => onOpen(displayData)} style={{ cursor: 'pointer' }}>
            
            {isRetweetAction && (
                <div className="retweet-upper-label" style={{ paddingLeft: '48px', color: '#536471', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span className="rt-icon">🔁</span> 
                    {retweeter?.displayName || (retweeter?.username ? `@${retweeter.username}` : 'Netko')} je proslijedio/la
                </div>
            )}

            <div className="tweet-main-content" style={{ display: 'flex' }}>
                <div className="tweet-avatar-placeholder" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/profile/${displayData.User?.username}`}>
                        <img 
                            src={displayData.User?.avatar || '/default-avatar.png'} 
                            alt="avatar" 
                            onError={(e) => { e.target.src = '/default-avatar.png' }}
                        />
                    </Link>
                </div>
                
                <div className="tweet-body" style={{ width: '100%' }}>
                    <div className="tweet-header-info">
                        <Link 
                            to={`/profile/${displayData.User?.username}`} 
                            className="tweet-user-link" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="tweet-display-name">{displayData.User?.displayName || 'Korisnik'}</span>
                            <span className="tweet-username">@{displayData.User?.username || 'nepoznato'}</span>
                        </Link>
                        <span className="tweet-date"> 
                            • {displayData.createdAt && !isNaN(new Date(displayData.createdAt)) 
                                ? new Date(displayData.createdAt).toLocaleDateString() 
                                : 'Nedavno'}
                        </span>
                    </div>

                    <p className="tweet-text">
                        {renderContent(displayData.content)}
                    </p>

                    {/* NOVO: Link Preview Card (Prikazuje se ako backend nađe link) */}
                    {displayData.linkUrl && (
                        <div 
                            className="link-preview-card"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(displayData.linkUrl, '_blank');
                            }}
                            style={{
                                border: '1px solid #cfd9de',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                marginTop: '12px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7f7f7'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {displayData.linkImage && (
                                <div style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                                    <img 
                                        src={displayData.linkImage} 
                                        alt="preview" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                </div>
                            )}
                            <div style={{ padding: '12px', borderTop: displayData.linkImage ? '1px solid #cfd9de' : 'none' }}>
                                <div style={{ color: '#536471', fontSize: '13px' }}>
                                    {new URL(displayData.linkUrl).hostname}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '15px', margin: '4px 0', color: '#0f1419' }}>
                                    {displayData.linkTitle}
                                </div>
                                {displayData.linkDescription && (
                                    <div style={{ color: '#536471', fontSize: '14px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {displayData.linkDescription}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {displayData.image && (
                        <div className="tweet-image-container">
                            <img src={displayData.image} className="tweet-image-content" alt="tweet" />
                        </div>
                    )}

                    <div className="tweet-actions" style={{ marginTop: '12px', display: 'flex', gap: '20px' }}>
                        <span className="action-btn comment-btn">
                            💬 {displayData.Comments?.length || 0}
                        </span>

                        <span 
                            className={`action-btn retweet-btn ${isRetweetAction ? 'active' : ''}`}
                            onClick={handleRetweet}
                        >
                            {isRetweetAction ? '🔁' : '🔃'} {displayData.retweetCount || 0}
                        </span>

                        <span 
                            className={`action-btn like-btn ${isLiked ? 'active' : ''}`}
                            onClick={handleLike}
                            style={{ color: isLiked ? '#f91880' : 'inherit' }}
                        >
                            {isLiked ? '❤️' : '🤍'} {displayData.LikedByUsers?.length || 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});