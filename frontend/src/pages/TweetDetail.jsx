import React, { useState, useEffect } from 'react';
import '../styles/tweetDetail.css';

const TweetDetail = ({ tweet, onClose }) => {
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. KLJUČNO: Sinkronizacija komentara čim se tweet promijeni ili dobije
    useEffect(() => {
        if (tweet) {
            // Ako tweet već ima komentare (eager loading), postavi ih
            setComments(tweet.Comments || []);
            // Opcionalno: Možemo pozvati API da budemo 100% sigurni da su svježi
            fetchFreshComments();
        }
    }, [tweet?.id]); // Reagiraj na promjenu ID-a tweeta

    const fetchFreshComments = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/tweets/${tweet.id}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.Comments || []);
            }
        } catch (error) {
            console.error("Greška pri osvježavanju komentara:", error);
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    content: commentText,
                    tweetId: tweet.id
                })
            });

            if (response.ok) {
                const newComment = await response.json();
                // Dodajemo novi komentar na početak liste
                setComments(prev => [newComment, ...prev]);
                setCommentText('');
            }
        } catch (error) {
            console.error("Greška pri slanju komentara:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!tweet) return null;

    return (
        <div className="tweet-modal-overlay" onClick={onClose}>
            <div className="tweet-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>&times;</button>
                
                <div className="modal-scroll-area">
                    {/* --- Glavni Tweet --- */}
                    <div className="modal-tweet-header">
                        <img src={tweet.User?.avatar || '/default-avatar.png'} alt="avatar" className="modal-avatar" />
                        <div className="modal-user-info">
                            <span className="modal-display-name">{tweet.User?.displayName}</span>
                            <span className="modal-username">@{tweet.User?.username}</span>
                        </div>
                    </div>

                    <div className="modal-tweet-body">
                        <p className="modal-tweet-text">{tweet.content}</p>
                        {tweet.image && <img src={tweet.image} alt="tweet content" className="modal-tweet-image" />}
                        <div className="modal-date-footer">
                            {new Date(tweet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(tweet.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <hr className="modal-divider" />

                    {/* --- Input Sekcija --- */}
                    <div className="comment-input-section">
                        <img src="/default-avatar.png" alt="my-avatar" className="comment-avatar-small" />
                        <div className="comment-input-controls">
                            <textarea 
                                placeholder="Objavi svoj odgovor" 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
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

                    <hr className="modal-divider" />

                    {/* --- Lista Komentara --- */}
                    <div className="comments-list">
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="comment-item">
                                    <img 
                                        src={comment.User?.avatar || '/default-avatar.png'} 
                                        alt="comment-avatar" 
                                        className="comment-avatar" 
                                    />
                                    <div className="comment-content">
                                        <div className="comment-user-info">
                                            <span className="comment-display-name">{comment.User?.displayName}</span>
                                            <span className="comment-username">@{comment.User?.username}</span>
                                        </div>
                                        <p className="comment-text">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-comments">Još nema odgovora. Budi prvi!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TweetDetail;