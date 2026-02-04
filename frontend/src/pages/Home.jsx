import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { authStore } from '../stores/AuthStore';
import axios from 'axios';
import TweetDetail from './TweetDetail'; // 1. Uvezi komponentu
import '../styles/home.css';

const Home = observer(() => {
  const [tweetContent, setTweetContent] = useState('');
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 2. State za modal
  const [selectedTweet, setSelectedTweet] = useState(null);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/tweets');
      setTweets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Ne mogu dohvatiti objave:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  // 3. Funkcija za otvaranje modala (dohvaća svježe podatke o tweetu)
  const handleOpenTweet = async (tweet) => {
    try {
      // Opcionalno: dohvati svježe podatke s komentarima s backenda
      const res = await axios.get(`http://localhost:3000/api/tweets/${tweet.id}`);
      setSelectedTweet(res.data);
    } catch (err) {
      // Ako api za detalje ne radi, koristi podatke koje već imaš
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
        }
      };
      setTweets((prev) => [newTweet, ...prev]);
      setTweetContent(''); 
    } catch (err) {
      alert("Došlo je do greške pri objavi.");
    }
  };

  return (
    <div className="home-main-wrapper">
      {/* 4. Prikaz modala ako je tweet odabran */}
      {selectedTweet && (
        <TweetDetail 
          tweet={selectedTweet} 
          onClose={() => setSelectedTweet(null)} 
        />
      )}

      <header className="home-header">
        <h2 className="header-title">Početna</h2>
      </header>

      {/* Tweet Box ... (tvoj postojeći kod) */}
      {authStore.isAuthenticated && (
        <div className="tweet-box-container">
          {/* ... tvoj box kod ... */}
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
            {tweets.map((tweet) => (
              <div 
                key={tweet.id} 
                className="tweet-item" 
                onClick={() => handleOpenTweet(tweet)} // 5. Klik na cijeli tweet otvara modal
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
                    {/* 6. Prikaz broja komentara ako ih imaš u bazi */}
                    <span>💬 {tweet.Comments?.length || 0}</span> <span>🔁 0</span> <span>❤️ 0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;