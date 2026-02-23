import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore'; 
import axios from 'axios';

export const Tweet = observer(({ tweet, onOpen, onLikeUpdate, onRetweetUpdate }) => {
    const navigate = useNavigate();
    
    // Logika za prebacivanje podataka
    // Ako je tweet retweet (ima parentId), sadržaj koji gledamo je u ParentTweet (original)
    const isRetweetAction = !!tweet.parentId;
    const displayData = isRetweetAction ? tweet.ParentTweet : tweet;
    
    // Osoba koja je napravila retweet (vlasnik ovog specifičnog unosa u bazi)
    // To je tweet.User, dok je displayData.User autor originalne objave
    const retweeter = isRetweetAction ? tweet.User : null;

    // DEBUG: Otkomentiraj ovo ako i dalje piše "Netko" da vidiš što backend šalje
    // console.log("Retweeter podaci:", retweeter);

    // Provjera lajkova na ORIGINALNOM sadržaju
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
        const parts = text.split(/(#[a-zA-Z0-9_ćčšžđ]+)/g);
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
            return part;
        });
    };

    // Sigurnosna provjera ako podaci još nisu stigli
    if (!displayData) return <div className="tweet-item">Učitavanje...</div>;

    return (
        <div className="tweet-item" onClick={() => onOpen(displayData)} style={{ cursor: 'pointer' }}>
            
            {/* Prikaz retweeter labela */}
            {isRetweetAction && (
                <div className="retweet-upper-label" style={{ paddingLeft: '48px', color: '#536471', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span className="rt-icon">🔁</span> 
                    {/* Poboljšana provjera imena: prvo display, pa username, pa 'Netko' */}
                    {retweeter?.displayName || (retweeter?.username ? `@${retweeter.username}` : 'Netko')} je proslijedio/la
                </div>
            )}

            <div className="tweet-main-content" style={{ display: 'flex' }}>
                <div className="tweet-avatar-placeholder" onClick={(e) => e.stopPropagation()}>
                    {/* Avatar autora ORIGINALNOG tweeta */}
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
                        <Link 
                            to={`/profile/${displayData.User?.username}`} 
                            className="tweet-user-link" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="tweet-display-name">{displayData.User?.displayName || 'Korisnik'}</span>
                            <span className="tweet-username">@{displayData.User?.username || 'nepoznato'}</span>
                        </Link>
                        {/* Popravljen datum: provjera valjanosti objekta */}
                        <span className="tweet-date"> 
                            • {displayData.createdAt && !isNaN(new Date(displayData.createdAt)) 
                                ? new Date(displayData.createdAt).toLocaleDateString() 
                                : 'Nedavno'}
                        </span>
                    </div>

                    <p className="tweet-text">
                        {renderContent(displayData.content)}
                    </p>
                    
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