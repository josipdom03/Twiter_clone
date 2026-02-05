import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { authStore } from '../stores/AuthStore';
import axios from 'axios';
import TweetDetail from './TweetDetail';
import '../styles/home.css';

const Home = observer(() => {
  const [tweetContent, setTweetContent] = useState('');
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTweet, setSelectedTweet] = useState(null);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/tweets');
      setTweets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Ne mogu dohvatiti objave:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const handleOpenTweet = async (tweet) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/tweets/${tweet.id}`);
      setSelectedTweet(res.data);
    } catch (err) {
      setSelectedTweet(tweet);
    }
  };

  const handlePostTweet = async () => {
    if (!tweetContent.trim()) return;
    try {
      const response = await axios.post(
        'http://localhost:3000/api/tweets',
        { content: tweetContent },
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      const newTweet = {
        ...response.data,
        User: {
          username: authStore.user?.username,
          avatar: authStore.user?.avatar,
          displayName: authStore.user?.displayName || authStore.user?.username
        },
        LikedByUsers: [],
        Comments: []
      };
      setTweets((prev) => [newTweet, ...prev]);
      setTweetContent(''); 
    } catch (err) {
      alert("Došlo je do greške pri objavi.");
    }
  };

  const handleLikeTweet = async (e, tweetId) => {
    e.stopPropagation(); 
    
    // 1. POPRAVAK: Sigurnosna provjera prijave prije pristupa ID-u
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      return alert("Moraš biti prijavljen!");
    }

    try {
      const res = await axios.post(
        `http://localhost:3000/api/likes/tweet/${tweetId}/like`,
        {},
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );

      setTweets(prev => prev.map(t => {
        if (t.id === tweetId) {
          const isLiked = res.data.liked;
          const currentLikes = t.LikedByUsers || [];
          return {
            ...t,
            LikedByUsers: isLiked 
              ? [...currentLikes, { id: authStore.user.id }] 
              : currentLikes.filter(u => u.id !== authStore.user.id)
          };
        }
        return t;
      }));
    } catch (err) {
      console.error("Greška pri lajkanju:", err);
    }
  };

  return (
    <div className="home-main-wrapper">
      {selectedTweet && (
        <TweetDetail 
          tweet={selectedTweet} 
          onClose={() => setSelectedTweet(null)} 
        />
      )}

      <header className="home-header">
        <h2 className="header-title">Početna</h2>
      </header>

      {authStore.isAuthenticated && (
        <div className="tweet-box-container">
          <div className="tweet-box-main">
             <textarea
              placeholder="Što se događa?"
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
            />
            <button className="tweet-post-btn" onClick={handlePostTweet}>Objavi</button>
          </div>
        </div>
      )}

      <div className="home-content">
        {loading ? (
          <div className="feed-placeholder"><p>Učitavanje...</p></div>
        ) : (
          <div className="tweets-list">
            {tweets.map((tweet) => {
              // 2. POPRAVAK: Optional chaining na authStore.user?.id
              const isLiked = tweet.LikedByUsers?.some(u => u.id === authStore.user?.id);
              
              return (
                <div 
                  key={tweet.id} 
                  className="tweet-item" 
                  onClick={() => handleOpenTweet(tweet)} 
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tweet-avatar-placeholder" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/profile/${tweet.User?.username}`}>
                      <img src={tweet.User?.avatar || '/default-avatar.png'} alt="avatar" />
                    </Link>
                  </div>
                  <div className="tweet-body">
                    <div className="tweet-header-info">
                      <span className="tweet-display-name">{tweet.User?.displayName}</span>
                      <span className="tweet-username">@{tweet.User?.username}</span>
                    </div>
                    <p className="tweet-text">{tweet.content}</p>
                    <div className="tweet-actions">
                      <span>💬 {tweet.Comments?.length || 0}</span>
                      <span 
                        className={`action-btn like-btn ${isLiked ? 'active' : ''}`}
                        onClick={(e) => handleLikeTweet(e, tweet.id)}
                      >
                        {isLiked ? '❤️' : '🤍'} {tweet.LikedByUsers?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;