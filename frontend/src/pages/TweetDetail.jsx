import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import axios from 'axios';
import '../styles/tweetDetail.css';
import { useNavigate } from 'react-router-dom'; 

const TweetDetail = observer(({ tweet: initialTweet, onClose }) => {
    const [tweet, setTweet] = useState(initialTweet);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // NOVO: Stanja za lajkove
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [isHoveringLikes, setIsHoveringLikes] = useState(false);

    const navigate = useNavigate();

    const goToProfile = (username) => {
        onClose(); 
        navigate(`/profile/${username}`); // Navigiraj na profil (prilagodi putanju svojoj ruti)
    };

    useEffect(() => {
        if (initialTweet) {
            fetchFreshTweetData();
        }
    }, [initialTweet?.id]);

    const fetchFreshTweetData = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/tweets/${initialTweet.id}`, {
                headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
            });
            setTweet(response.data);
            setComments(response.data.Comments || []);
        } catch (error) {
            console.error("Greška pri osvježavanju podataka:", error);
        }
    };

    const handleFollowFromModal = async () => {
        if (!authStore.isAuthenticated) return alert("Prijavi se!");
        const userId = tweet.User?.id;
        const isCurrentlyFollowing = tweet.User?.isFollowing;

        try {
            if (isCurrentlyFollowing) {
                await axios.delete(`http://localhost:3000/api/users/${userId}/unfollow`, {
                    headers: { Authorization: `Bearer ${authStore.token}` }
                });
            } else {
                await axios.post(`http://localhost:3000/api/users/${userId}/follow`, {}, {
                    headers: { Authorization: `Bearer ${authStore.token}` }
                });
            }
            fetchFreshTweetData();
        } catch (err) {
            console.error("Greška kod praćenja u modalu:", err);
        }
    };

    const handleLikeMainTweet = async () => {
        if (!authStore.isAuthenticated || !authStore.user?.id) return alert("Moraš biti prijavljen!");
        try {
            await axios.post(`http://localhost:3000/api/likes/tweet/${tweet.id}/like`, {}, 
                { headers: { Authorization: `Bearer ${authStore.token}` } });
            fetchFreshTweetData();
        } catch (err) { console.error(err); }
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
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleLikeComment = async (commentId) => {
        if (!authStore.isAuthenticated) return;
        try {
            await axios.post(`http://localhost:3000/api/likes/comment/${commentId}/like`, {}, 
                { headers: { Authorization: `Bearer ${authStore.token}` } });
            fetchFreshTweetData();
        } catch (err) { console.error(err); }
    };

    // Helper za Tooltip (prvih 5)
    const renderLikesTooltip = () => {
        const likes = tweet.LikedByUsers || [];
        if (likes.length === 0) return null;
        
        const firstFive = likes.slice(0, 5);
        const remaining = likes.length - 5;

        return (
            <div className="likes-tooltip">
                {firstFive.map(u => (
                    <div key={u.id} className="tooltip-user">{u.displayName || u.username}</div>
                ))}
                {remaining > 0 && <div className="tooltip-more">i još {remaining} ostalih...</div>}
            </div>
        );
    };

    if (!tweet) return null;
    const isTweetLiked = tweet.LikedByUsers?.some(u => u.id === authStore.user?.id);
    const isOwnTweet = authStore.user?.id === tweet.User?.id;

    return (
        <div className="tweet-modal-overlay" onClick={onClose}>
            <div className="tweet-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>&times;</button>
                <div className="modal-scroll-area">
                    
                    <div className="modal-tweet-header">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img src={tweet.User?.avatar || '/default-avatar.png'} alt="avatar" className="modal-avatar" />
                            <div className="modal-user-info">
                                <span className="modal-display-name">{tweet.User?.displayName}</span>
                                <span className="modal-username">@{tweet.User?.username}</span>
                            </div>
                        </div>

                        {authStore.isAuthenticated && !isOwnTweet && (
                            <button 
                                className={`modal-follow-btn-small ${tweet.User?.isFollowing ? 'following' : ''}`}
                                onClick={handleFollowFromModal}
                            >
                                {tweet.User?.isFollowing ? 'Pratim' : 'Prati'}
                            </button>
                        )}
                    </div>

                    <div className="modal-tweet-body">
                        <p className="modal-tweet-text">{tweet.content}</p>
                        <div className="modal-date-footer">{new Date(tweet.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="modal-main-actions">
                        <span className="action-stat"><strong>{comments.length}</strong> Odgovora</span>
                        
                        {/* NOVO: Interaktivni lajkovi */}
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

                    <div className="modal-action-buttons">
                        <button className={`modal-like-btn ${isTweetLiked ? 'active' : ''}`} onClick={handleLikeMainTweet}>
                            {isTweetLiked ? '❤️ Liked' : '🤍 Like'}
                        </button>
                    </div>

                    <hr className="modal-divider" />

                    {authStore.isAuthenticated && (
                        <div className="comment-input-section">
                            <img src={authStore.user?.avatar || "/default-avatar.png"} className="comment-avatar-small" alt="" />
                            <div className="comment-input-controls">
                                <textarea placeholder="Objavi svoj odgovor" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                                <button className="post-comment-btn" disabled={!commentText.trim() || loading} onClick={handlePostComment}>
                                    {loading ? '...' : 'Odgovori'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="comments-list">
                        {comments.map((comment) => {
                            const isCommentLiked = comment.LikedByUsers?.some(u => u.id === authStore.user?.id);
                            return (
                                <div key={comment.id} className="comment-item">
                                    <img src={comment.User?.avatar || '/default-avatar.png'} className="comment-avatar" alt="" />
                                    <div className="comment-content">
                                        <div className="comment-user-info">
                                            <span className="comment-display-name">{comment.User?.displayName}</span>
                                            <span className="comment-username">@{comment.User?.username}</span>
                                        </div>
                                        <p className="comment-text">{comment.content}</p>
                                        <div className="comment-actions">
                                            <span className={`c-like-btn ${isCommentLiked ? 'active' : ''}`} onClick={() => handleLikeComment(comment.id)}>
                                                {isCommentLiked ? '❤️' : '🤍'} {comment.LikedByUsers?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MODAL ZA PUNU LISTU LAJKOVA */}
                {showLikesModal && (
                    <div className="likes-full-modal-overlay" onClick={() => setShowLikesModal(false)}>
                        <div className="likes-full-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="likes-modal-header">
                                <h3>Sviđa se korisnicima</h3>
                                <button className="close-small-btn" onClick={() => setShowLikesModal(false)}>&times;</button>
                            </div>
                            <div className="likes-list-scroll">
                                {tweet.LikedByUsers?.length > 0 ? (
                                    tweet.LikedByUsers.map(u => (
                                        <div 
                                            key={u.id} 
                                            className="like-user-row searchable" 
                                            onClick={() => goToProfile(u.username)}
                                        >
                                            <img src={u.avatar || '/default-avatar.png'} alt="" className="user-row-avatar" />
                                            <div className="user-row-info">
                                                <p className="row-display-name">{u.displayName || u.username}</p>
                                                <p className="row-username">@{u.username}</p>
                                            </div>
                                        </div>
                                    ))
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