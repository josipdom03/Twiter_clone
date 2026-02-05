import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore.jsx';
import { Tweet } from '../components/layout/Tweet.jsx';
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

  const updateLikeInState = (tweetId, isLiked) => {
    setTweets(prev => prev.map(t => {
      if (t.id === tweetId) {
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
            {tweets.map((tweet) => (
              <Tweet 
                key={tweet.id} 
                tweet={tweet} 
                onOpen={handleOpenTweet} 
                onLikeUpdate={updateLikeInState}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;