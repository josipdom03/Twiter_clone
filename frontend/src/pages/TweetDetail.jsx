import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite'; // 1. Dodano za MobX
import { authStore } from '../stores/AuthStore';
import '../styles/tweetDetail.css';

const TweetDetail = observer(({ tweet, onClose }) => { // 2. Omotano u observer
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tweet) {
            setComments(tweet.Comments || []);
            fetchFreshComments();
        }
    }, [tweet?.id]);

    const fetchFreshComments = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/tweets/${tweet.id}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.Comments || []);
            }
        } catch (error) {
            console.error("Greška pri osvježavanju:", error);
        }
    };

    const handlePostComment = async () => {
        // Provjera prijave
        if (!authStore.isAuthenticated || !authStore.user) {
            alert("Moraš biti prijavljen za komentiranje!");
            return;
        }

        if (!commentText.trim()) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                },
                body: JSON.stringify({ content: commentText, tweetId: tweet.id })
            });

            if (response.ok) {
                const newComment = await response.json();
                const commentWithUser = {
                    ...newComment,
                    User: { 
                        username: authStore.user.username, 
                        displayName: authStore.user.displayName,
                        avatar: authStore.user.avatar 
                    },
                    LikedByUsers: []
                };
                setComments(prev => [commentWithUser, ...prev]);
                setCommentText('');
            }
        } catch (error) {
            console.error("Greška:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        // 3. POPRAVAK: Zaštita za neprijavljene korisnike
        if (!authStore.isAuthenticated || !authStore.user?.id) {
            alert("Moraš biti prijavljen za lajkanje!");
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/likes/comment/${commentId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authStore.token}` }
            });
            const data = await res.json();
            
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    const currentLikes = c.LikedByUsers || [];
                    return {
                        ...c,
                        LikedByUsers: data.liked 
                            ? [...currentLikes, { id: authStore.user.id }] 
                            : currentLikes.filter(u => u.id !== authStore.user.id)
                    };
                }
                return c;
            }));
        } catch (err) {
            console.error("Greška pri lajkanju komentara:", err);
        }
    };

    if (!tweet) return null;

    return (
        <div className="tweet-modal-overlay" onClick={onClose}>
            <div className="tweet-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>&times;</button>
                <div className="modal-scroll-area">
                    {/* Header i Body Tweeta */}
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

                    <hr className="modal-divider" />

                    {/* Input Sekcija - vidljiva samo ako je korisnik prijavljen */}
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

                    <hr className="modal-divider" />

                    <div className="comments-list">
                        {comments.length > 0 ? (
                            comments.map((comment) => {
                                // 4. POPRAVAK: Siguran pristup user id-u
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
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {isCommentLiked ? '❤️' : '🤍'} {comment.LikedByUsers?.length || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ textAlign: 'center', padding: '20px', color: '#65676b' }}>Nema komentara.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default TweetDetail;