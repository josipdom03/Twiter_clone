import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import axios from 'axios'; // Koristimo axios radi konzistentnosti
import '../styles/tweetDetail.css';

const TweetDetail = observer(({ tweet: initialTweet, onClose }) => {
    const [tweet, setTweet] = useState(initialTweet);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialTweet) {
            fetchFreshTweetData();
        }
    }, [initialTweet?.id]);

    const fetchFreshTweetData = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/tweets/${initialTweet.id}`);
            setTweet(response.data);
            setComments(response.data.Comments || []);
        } catch (error) {
            console.error("Greška pri osvježavanju podataka:", error);
        }
    };

    // Lajkanje glavnog tweeta u modalu
    const handleLikeMainTweet = async () => {
        if (!authStore.isAuthenticated || !authStore.user?.id) {
            return alert("Moraš biti prijavljen za lajkanje!");
        }

        try {
            const res = await axios.post(
                `http://localhost:3000/api/likes/tweet/${tweet.id}/like`,
                {},
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );

            const isLiked = res.data.liked;
            const currentLikes = tweet.LikedByUsers || [];

            setTweet({
                ...tweet,
                LikedByUsers: isLiked 
                    ? [...currentLikes, { id: authStore.user.id }] 
                    : currentLikes.filter(u => u.id !== authStore.user.id)
            });
        } catch (err) {
            console.error("Greška pri lajkanju tweeta:", err);
        }
    };

    const handlePostComment = async () => {
        if (!authStore.isAuthenticated) return alert("Prijavi se!");
        if (!commentText.trim()) return;

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/api/comments', 
                { content: commentText, tweetId: tweet.id },
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );

            const commentWithUser = {
                ...response.data,
                User: { 
                    username: authStore.user.username, 
                    displayName: authStore.user.displayName,
                    avatar: authStore.user.avatar 
                },
                LikedByUsers: []
            };
            setComments(prev => [commentWithUser, ...prev]);
            setCommentText('');
        } catch (error) {
            console.error("Greška:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!authStore.isAuthenticated || !authStore.user?.id) return;

        try {
            const res = await axios.post(`http://localhost:3000/api/likes/comment/${commentId}/like`, 
                {}, 
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    const currentLikes = c.LikedByUsers || [];
                    return {
                        ...c,
                        LikedByUsers: res.data.liked 
                            ? [...currentLikes, { id: authStore.user.id }] 
                            : currentLikes.filter(u => u.id !== authStore.user.id)
                    };
                }
                return c;
            }));
        } catch (err) {
            console.error(err);
        }
    };

    if (!tweet) return null;

    const isTweetLiked = tweet.LikedByUsers?.some(u => u.id === authStore.user?.id);

    return (
        <div className="tweet-modal-overlay" onClick={onClose}>
            <div className="tweet-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>&times;</button>
                <div className="modal-scroll-area">
                    
                    <div className="modal-tweet-header">
                        <img src={tweet.User?.avatar || '/default-avatar.png'} alt="avatar" className="modal-avatar" />
                        <div className="modal-user-info">
                            <span className="modal-display-name">{tweet.User?.displayName}</span>
                            <span className="modal-username">@{tweet.User?.username}</span>
                        </div>
                    </div>

                    <div className="modal-tweet-body">
                        <p className="modal-tweet-text">{tweet.content}</p>
                        <div className="modal-date-footer">
                            {new Date(tweet.createdAt).toLocaleString()}
                        </div>
                    </div>

                    {/* NOVO: Akcije za glavni tweet (Lajk i Broj komentara) */}
                    <div className="modal-main-actions">
                        <span className="action-stat">
                            <strong>{comments.length}</strong> Odgovora
                        </span>
                        <span className="action-stat">
                            <strong>{tweet.LikedByUsers?.length || 0}</strong> Lajkova
                        </span>
                    </div>

                    <div className="modal-action-buttons">
                        <button 
                            className={`modal-like-btn ${isTweetLiked ? 'active' : ''}`}
                            onClick={handleLikeMainTweet}
                        >
                            {isTweetLiked ? '❤️ Liked' : '🤍 Like'}
                        </button>
                    </div>

                    <hr className="modal-divider" />

                    {authStore.isAuthenticated && (
                        <div className="comment-input-section">
                            <img src={authStore.user?.avatar || "/default-avatar.png"} className="comment-avatar-small" alt="" />
                            <div className="comment-input-controls">
                                <textarea 
                                    placeholder="Objavi svoj odgovor" 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
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
                                            <span 
                                                className={`c-like-btn ${isCommentLiked ? 'active' : ''}`}
                                                onClick={() => handleLikeComment(comment.id)}
                                            >
                                                {isCommentLiked ? '❤️' : '🤍'} {comment.LikedByUsers?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default TweetDetail;