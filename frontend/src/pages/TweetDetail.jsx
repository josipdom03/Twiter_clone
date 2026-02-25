import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import axios from 'axios';
import { io } from 'socket.io-client';
import '../styles/tweetDetail.css';

const socket = io('http://localhost:3000', { transports: ['websocket'] });

const TweetDetail = observer(({ tweet: initialTweet, onClose }) => {
    const navigate = useNavigate();
    const [tweet, setTweet] = useState(initialTweet);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [isHoveringLikes, setIsHoveringLikes] = useState(false);
    
    const [showCommentLikesModal, setShowCommentLikesModal] = useState(false);
    const [commentLikesList, setCommentLikesList] = useState([]);

    const fetchFreshTweetData = useCallback(async () => {
        if (!initialTweet?.id) return;
        setFetchLoading(true);
        try {
            const response = await axios.get(`http://localhost:3000/api/tweets/${initialTweet.id}`, {
                headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
            });
            setTweet(response.data);
            setComments(response.data.Comments || []);
        } catch (error) {
            console.error("Greška pri osvježavanju podataka:", error);
        } finally {
            setFetchLoading(false);
        }
    }, [initialTweet?.id]);

    useEffect(() => {
        if (initialTweet?.id) {
            fetchFreshTweetData();

            socket.on('user_followed', fetchFreshTweetData);
            socket.on('tweet_updated', (updatedTweetId) => {
                if (updatedTweetId === initialTweet.id) {
                    fetchFreshTweetData();
                }
            });

            return () => {
                socket.off('user_followed', fetchFreshTweetData);
                socket.off('tweet_updated');
            };
        }
    }, [initialTweet?.id, fetchFreshTweetData]);

    const goToProfile = (username) => {
        if (!username) return;
        onClose(); 
        navigate(`/profile/${username}`);
    };

    // NADOGRAĐENO: Renderira klikabilne hashtage I linkove u tekstu
    const renderContent = (text) => {
        if (!text) return "";
        // Regex hvata hashtage i URL-ove
        const parts = text.split(/(#[a-zA-Z0-9_ćčšžđ]+|(?:https?:\/\/|www\.)[^\s]+)/g);
        return parts.map((part, index) => {
            if (part.startsWith("#")) {
                return (
                    <span 
                        key={index} 
                        className="hashtag-link" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            navigate(`/search?q=${encodeURIComponent(part)}`);
                        }}
                        style={{ color: '#1d9bf0', cursor: 'pointer', fontWeight: '500' }}
                    >
                        {part}
                    </span>
                );
            }
            // Dodano: Detekcija linka u tekstu
            if (part.match(/^(https?:\/\/|www\.)/)) {
                const cleanUrl = part.startsWith('www.') ? `https://${part}` : part;
                return (
                    <a 
                        key={index} 
                        href={cleanUrl} 
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

    const handleToggleFollow = async (userId, isCurrentlyFollowing) => {
        if (!authStore.isAuthenticated) return alert("Moraš biti prijavljen!");
        try {
            if (isCurrentlyFollowing) {
                await axios.delete(`http://localhost:3000/api/follow/${userId}`, {
                    headers: { Authorization: `Bearer ${authStore.token}` }
                });
            } else {
                await axios.post(`http://localhost:3000/api/follow/${userId}`, {}, {
                    headers: { Authorization: `Bearer ${authStore.token}` }
                });
            }
            fetchFreshTweetData();
        } catch (err) {
            console.error("Greška kod promjene statusa praćenja:", err);
        }
    };

    const handleLikeMainTweet = async () => {
        if (!authStore.isAuthenticated) return alert("Moraš biti prijavljen za lajkanje!");
        try {
            await axios.post(`http://localhost:3000/api/likes/tweet/${tweet.id}/like`, {}, 
                { headers: { Authorization: `Bearer ${authStore.token}` } });
            fetchFreshTweetData();
        } catch (err) { 
            console.error(err); 
        }
    };

    const handlePostComment = async () => {
        if (!authStore.isAuthenticated || !commentText.trim()) return;
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/api/comments', 
                { content: commentText, tweetId: tweet.id },
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            setCommentText('');
            fetchFreshTweetData();
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!authStore.isAuthenticated) return;
        try {
            await axios.post(`http://localhost:3000/api/likes/comment/${commentId}/like`, {}, 
                { headers: { Authorization: `Bearer ${authStore.token}` } });
            fetchFreshTweetData();
        } catch (err) { 
            console.error(err); 
        }
    };

    const handleOpenCommentLikes = async (commentId) => {
        if (!commentId) return;
        try {
            const res = await axios.get(`http://localhost:3000/api/comments/${commentId}/likes`, {
                headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
            });
            setCommentLikesList(res.data);
            setShowCommentLikesModal(true);
        } catch (err) {
            console.error("Greška pri dohvatu lajkova komentara:", err);
        }
    };

    const renderLikesTooltip = () => {
        const likes = tweet.LikedByUsers || [];
        if (likes.length === 0) return null;
        return (
            <div className="likes-tooltip">
                {likes.slice(0, 5).map(u => (
                    <div key={u.id} className="tooltip-user">{u.displayName || u.username}</div>
                ))}
                {likes.length > 5 && <div className="tooltip-more">i još {likes.length - 5} ostalih...</div>}
            </div>
        );
    };

    if (!tweet) return null;

    const isTweetLiked = tweet.LikedByUsers?.some(u => u.id === authStore.user?.id);
    const isOwnTweet = authStore.user?.id === tweet.User?.id;

    return (
        <div className="tweet-modal-overlay" onClick={onClose}>
            <div className="tweet-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose} aria-label="Zatvori">&times;</button>
                
                <div className="modal-scroll-area">
                    {/* Header: User info */}
                    <div className="modal-tweet-header">
                        <div className="header-left" onClick={() => goToProfile(tweet.User?.username)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <img src={tweet.User?.avatar || '/default-avatar.png'} alt="avatar" className="modal-avatar" />
                            <div className="modal-user-info">
                                <span className="modal-display-name">{tweet.User?.displayName || 'Korisnik'}</span>
                                <span className="modal-username">@{tweet.User?.username}</span>
                            </div>
                        </div>

                        {authStore.isAuthenticated && !isOwnTweet && (
                            <button 
                                className={`modal-follow-btn-small ${tweet.User?.isFollowing ? 'following' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFollow(tweet.User?.id, tweet.User?.isFollowing);
                                }}
                            >
                                {tweet.User?.isFollowing ? 'Pratim' : 'Prati'}
                            </button>
                        )}
                    </div>

                    {/* Body: Content & Link Preview */}
                    <div className="modal-tweet-body">
                        <p className="modal-tweet-text">{renderContent(tweet.content)}</p>

                        {/* NOVO: Link Preview Card unutar Detail Modala */}
                        {tweet.linkUrl && (
                            <div 
                                className="modal-link-preview"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(tweet.linkUrl.startsWith('http') ? tweet.linkUrl : `https://${tweet.linkUrl}`, '_blank');
                                }}
                                style={{
                                    border: '1px solid #cfd9de',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    marginTop: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                {tweet.linkImage && (
                                    <img src={tweet.linkImage} alt="preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                                )}
                                <div style={{ padding: '12px', borderTop: tweet.linkImage ? '1px solid #cfd9de' : 'none' }}>
                                    <div style={{ color: '#536471', fontSize: '13px' }}>
                                        {(() => {
                                            try { return new URL(tweet.linkUrl.startsWith('http') ? tweet.linkUrl : `https://${tweet.linkUrl}`).hostname; } 
                                            catch(e) { return 'link'; }
                                        })()}
                                    </div>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', margin: '4px 0' }}>{tweet.linkTitle}</div>
                                    {tweet.linkDescription && <div style={{ color: '#536471', fontSize: '14px' }}>{tweet.linkDescription}</div>}
                                </div>
                            </div>
                        )}

                        {tweet.image && !tweet.linkUrl && (
                            <div className="modal-image-container">
                                <img src={tweet.image} alt="Tweet content" className="modal-tweet-image" />
                            </div>
                        )}
                        <div className="modal-date-footer">
                            {new Date(tweet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(tweet.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="modal-main-actions">
                        <span className="action-stat"><strong>{comments.length}</strong> Odgovora</span>
                        <div 
                            className="likes-stat-container" 
                            onMouseEnter={() => setIsHoveringLikes(true)} 
                            onMouseLeave={() => setIsHoveringLikes(false)} 
                            onClick={() => setShowLikesModal(true)}
                        >
                            <span className="action-stat clickable">
                                <strong>{tweet.LikedByUsers?.length || 0}</strong> Lajkova
                            </span>
                            {isHoveringLikes && renderLikesTooltip()}
                        </div>
                    </div>

                    {/* Interaction Buttons */}
                    <div className="modal-action-buttons">
                        <button 
                            className={`modal-like-btn ${isTweetLiked ? 'active' : ''}`} 
                            onClick={handleLikeMainTweet}
                        >
                            <span className="icon">{isTweetLiked ? '❤️' : '🤍'}</span>
                            <span className="text">{isTweetLiked ? 'Lajkano' : 'Sviđa mi se'}</span>
                        </button>
                    </div>

                    <hr className="modal-divider" />

                    {/* Comment Input */}
                    {authStore.isAuthenticated ? (
                        <div className="comment-input-section">
                            <img src={authStore.user?.avatar || "/default-avatar.png"} className="comment-avatar-small" alt="Vaš avatar" />
                            <div className="comment-input-controls">
                                <textarea 
                                    placeholder="Objavi svoj odgovor" 
                                    value={commentText} 
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows="2"
                                />
                                <button 
                                    className="post-comment-btn" 
                                    disabled={!commentText.trim() || loading} 
                                    onClick={handlePostComment}
                                >
                                    {loading ? 'Slanje...' : 'Odgovori'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="login-prompt-inline">
                            Prijavite se kako biste odgovorili.
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="comments-list">
                        {comments.length > 0 ? (
                            comments.map((comment) => {
                                const isCommentLiked = comment.LikedByUsers?.some(u => u.id === authStore.user?.id);
                                const isOwnComment = authStore.user?.id === comment.User?.id;

                                return (
                                    <div key={comment.id} className="comment-item">
                                        <img 
                                            src={comment.User?.avatar || '/default-avatar.png'} 
                                            className="comment-avatar clickable" 
                                            alt="" 
                                            onClick={() => goToProfile(comment.User?.username)} 
                                        />
                                        <div className="comment-content">
                                            <div className="comment-top-row">
                                                <div className="comment-user-info" onClick={() => goToProfile(comment.User?.username)} style={{cursor: 'pointer'}}>
                                                    <span className="comment-display-name">{comment.User?.displayName}</span>
                                                    <span className="comment-username">@{comment.User?.username}</span>
                                                </div>
                                                
                                                {authStore.isAuthenticated && !isOwnComment && (
                                                    <button 
                                                        className={`modal-follow-btn-tiny ${comment.User?.isFollowing ? 'following' : ''}`}
                                                        onClick={() => handleToggleFollow(comment.User?.id, comment.User?.isFollowing)}
                                                    >
                                                        {comment.User?.isFollowing ? 'Pratim' : 'Prati'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="comment-text">{renderContent(comment.content)}</p>
                                            <div className="comment-actions">
                                                <div className="comment-action-group">
                                                    <span 
                                                        className={`c-like-btn ${isCommentLiked ? 'active' : ''}`} 
                                                        onClick={() => handleLikeComment(comment.id)}
                                                    >
                                                        {isCommentLiked ? '❤️' : '🤍'} 
                                                    </span>
                                                    <span 
                                                        className="comment-likes-count clickable" 
                                                        onClick={() => handleOpenCommentLikes(comment.id)}
                                                    >
                                                        {comment.LikedByUsers?.length || 0}
                                                    </span>
                                                </div>
                                                <span className="comment-time">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-comments-placeholder">Još nema odgovora. Budi prvi!</div>
                        )}
                    </div>
                </div>

                {/* MODAL: Likes for Main Tweet */}
                {showLikesModal && (
                    <div className="likes-full-modal-overlay" onClick={() => setShowLikesModal(false)}>
                        <div className="likes-full-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="likes-modal-header">
                                <h3>Sviđa se korisnicima</h3>
                                <button className="close-small-btn" onClick={() => setShowLikesModal(false)}>&times;</button>
                            </div>
                            <div className="likes-list-scroll">
                                {tweet.LikedByUsers?.length > 0 ? (
                                    tweet.LikedByUsers.map(u => {
                                        const isOwnAccount = authStore.user?.id === u.id;
                                        return (
                                            <div key={u.id} className="like-user-row-container">
                                                <div className="like-user-row searchable" onClick={() => goToProfile(u.username)}>
                                                    <img src={u.avatar || '/default-avatar.png'} alt="" className="user-row-avatar" />
                                                    <div className="user-row-info">
                                                        <p className="row-display-name">{u.displayName || u.username}</p>
                                                        <p className="row-username">@{u.username}</p>
                                                    </div>
                                                </div>
                                                {authStore.isAuthenticated && !isOwnAccount && (
                                                    <button 
                                                        className={`modal-follow-btn-small ${u.isFollowing ? 'following' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleFollow(u.id, u.isFollowing);
                                                        }}
                                                    >
                                                        {u.isFollowing ? 'Pratim' : 'Prati'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="no-likes">Još nema lajkova.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: Likes for Comments */}
                {showCommentLikesModal && (
                    <div className="likes-full-modal-overlay" onClick={() => setShowCommentLikesModal(false)}>
                        <div className="likes-full-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="likes-modal-header">
                                <h3>Komentar se sviđa korisnicima</h3>
                                <button className="close-small-btn" onClick={() => setShowCommentLikesModal(false)}>&times;</button>
                            </div>
                            <div className="likes-list-scroll">
                                {commentLikesList.length > 0 ? (
                                    commentLikesList.map(u => {
                                        const isOwnAccount = authStore.user?.id === u.id;
                                        return (
                                            <div key={u.id} className="like-user-row-container">
                                                <div className="like-user-row searchable" onClick={() => goToProfile(u.username)}>
                                                    <img src={u.avatar || '/default-avatar.png'} alt="" className="user-row-avatar" />
                                                    <div className="user-row-info">
                                                        <p className="row-display-name">{u.displayName || u.username}</p>
                                                        <p className="row-username">@{u.username}</p>
                                                    </div>
                                                </div>
                                                {authStore.isAuthenticated && !isOwnAccount && (
                                                    <button 
                                                        className={`modal-follow-btn-small ${u.isFollowing ? 'following' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleFollow(u.id, u.isFollowing);
                                                        }}
                                                    >
                                                        {u.isFollowing ? 'Pratim' : 'Prati'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="no-likes">Još nema lajkova.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default TweetDetail;