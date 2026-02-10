import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import axios from 'axios';
import { io } from 'socket.io-client'; // DODANO: Socket klijent
import '../styles/tweetDetail.css';

// Inicijalizacija socketa (pazi na port tvog servera)
const socket = io('http://localhost:3000', { transports: ['websocket'] });

const TweetDetail = observer(({ tweet: initialTweet, onClose }) => {
    const navigate = useNavigate();
    const [tweet, setTweet] = useState(initialTweet);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [isHoveringLikes, setIsHoveringLikes] = useState(false);

    // Glavni efekt za dohvat podataka i Socket slušalice
    useEffect(() => {
        if (initialTweet?.id) {
            fetchFreshTweetData();

            // --- SOCKET LOGIKA ---
            // Slušamo 'user_followed' događaj s backenda
            socket.on('user_followed', (data) => {
                // Ako je netko zapratio autora tweeta ili nekoga u listi lajkova, osvježi
                fetchFreshTweetData();
            });

            // Slušamo nove lajkove u realnom vremenu
            socket.on('tweet_updated', (updatedTweetId) => {
                if (updatedTweetId === initialTweet.id) {
                    fetchFreshTweetData();
                }
            });

            return () => {
                socket.off('user_followed');
                socket.off('tweet_updated');
            };
        }
    }, [initialTweet?.id]);

    const fetchFreshTweetData = async () => {
        try {
            // Jako važno: Šaljemo token kako bi backend znao tvoj 'isFollowing' status
            const response = await axios.get(`http://localhost:3000/api/tweets/${initialTweet.id}`, {
                headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
            });
            setTweet(response.data);
            setComments(response.data.Comments || []);
        } catch (error) {
            console.error("Greška pri osvježavanju podataka:", error);
        }
    };

    const goToProfile = (username) => {
        if (!username) return;
        onClose(); 
        navigate(`/profile/${username}`);
    };

    const handleToggleFollow = async (userId, isCurrentlyFollowing) => {
        if (!authStore.isAuthenticated) return alert("Moraš biti prijavljen!");
        
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
            // Odmah osvježavamo lokalno za najbolji UX
            fetchFreshTweetData();
        } catch (err) {
            console.error("Greška kod promjene statusa praćenja:", err);
        }
    };

    const handleLikeMainTweet = async () => {
        if (!authStore.isAuthenticated) return alert("Moraš biti prijavljen!");
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
                <button className="close-modal-btn" onClick={onClose}>&times;</button>
                
                <div className="modal-scroll-area">
                    <div className="modal-tweet-header">
                        <div className="header-left" onClick={() => goToProfile(tweet.User?.username)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <img src={tweet.User?.avatar || '/default-avatar.png'} alt="avatar" className="modal-avatar" />
                            <div className="modal-user-info">
                                <span className="modal-display-name">{tweet.User?.displayName}</span>
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

                    <div className="modal-tweet-body">
                        <p className="modal-tweet-text">{tweet.content}</p>
                        {tweet.image && <img src={tweet.image} alt="Tweet" className="modal-tweet-image" />}
                        <div className="modal-date-footer">{new Date(tweet.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="modal-main-actions">
                        <span className="action-stat"><strong>{comments.length}</strong> Odgovora</span>
                        <div className="likes-stat-container" onMouseEnter={() => setIsHoveringLikes(true)} onMouseLeave={() => setIsHoveringLikes(false)} onClick={() => setShowLikesModal(true)}>
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
                            const isOwnComment = authStore.user?.id === comment.User?.id;

                            return (
                                <div key={comment.id} className="comment-item">
                                    <img src={comment.User?.avatar || '/default-avatar.png'} className="comment-avatar clickable" alt="" onClick={() => goToProfile(comment.User?.username)} />
                                    <div className="comment-content">
                                        <div className="comment-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="comment-user-info" onClick={() => goToProfile(comment.User?.username)} style={{cursor: 'pointer'}}>
                                                <span className="comment-display-name">{comment.User?.displayName}</span>
                                                <span className="comment-username">@{comment.User?.username}</span>
                                            </div>
                                            
                                            {/* DODANO: Gumb za follow i na komentarima */}
                                            {authStore.isAuthenticated && !isOwnComment && (
                                                <button 
                                                    className={`modal-follow-btn-tiny ${comment.User?.isFollowing ? 'following' : ''}`}
                                                    onClick={() => handleToggleFollow(comment.User?.id, comment.User?.isFollowing)}
                                                >
                                                    {comment.User?.isFollowing ? 'Pratim' : 'Prati'}
                                                </button>
                                            )}
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
            </div>
        </div>
    );
});

export default TweetDetail;