import React from 'react';
import '../styles/tweetDetail.css';

const TweetDetail = ({ tweet, onClose }) => {
    if (!tweet) return null;

    return (
        <div className="tweet-modal-overlay" onClick={onClose}>
            {/* stopPropagation sprječava zatvaranje kad klikneš na sam tweet */}
            <div className="tweet-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={onClose}>&times;</button>
                
                <div className="modal-tweet-header">
                    <img 
                        src={tweet.User?.avatar || '/default-avatar.png'} 
                        alt="avatar" 
                        className="modal-avatar" 
                    />
                    <div className="modal-user-info">
                        <span className="modal-display-name">{tweet.User?.displayName}</span>
                        <span className="modal-username">@{tweet.User?.username}</span>
                    </div>
                </div>

                <div className="modal-tweet-body">
                    <p className="modal-tweet-text">{tweet.content}</p>
                    {tweet.image && <img src={tweet.image} alt="tweet content" className="modal-tweet-image" />}
                </div>

                <div className="modal-tweet-footer">
                    <span className="modal-date">
                        {new Date(tweet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · 
                        {new Date(tweet.createdAt).toLocaleDateString()}
                    </span>
                </div>
                
                <div className="comments-section-placeholder">
                    {/* Ovdje ćemo kasnije dodati komentare */}
                    <hr />
                    <p style={{color: '#536471'}}>Komentari dolaze uskoro...</p>
                </div>
            </div>
        </div>
    );
};

export default TweetDetail;