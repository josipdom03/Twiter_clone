import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import axios from 'axios';
import '../styles/home.css';

const Home = observer(() => {
  const [tweetContent, setTweetContent] = useState('');
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Funkcija za dohvaćanje tweetova s backenda
  const fetchTweets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/tweets');
      // Osiguravamo da su podaci niz (array)
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

  const handlePostTweet = async () => {
    // 1. Provjera sadržaja
    if (!tweetContent.trim()) return;

    // 2. Sigurnosna provjera korisnika (sprječava TypeError null reading 'username')
    if (!authStore.user) {
      alert("Korisnički podaci nisu učitani. Pokušajte ponovno za trenutak.");
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/tweets',
        { content: tweetContent },
        {
          headers: { 
            Authorization: `Bearer ${authStore.token}` 
          }
        }
      );

      // Ručno kreiramo objekt za novi tweet kako bi se odmah prikazao ispravno
      // Koristimo Optional Chaining (?.) da budemo 100% sigurni
      const newTweet = {
        ...response.data,
        User: {
          username: authStore.user?.username || 'Korisnik',
          avatar: authStore.user?.avatar || null,
          displayName: authStore.user?.displayName || authStore.user?.username
        }
      };

      // Dodajemo na vrh liste
      setTweets((prevTweets) => [newTweet, ...prevTweets]);
      setTweetContent(''); 
    } catch (err) {
      console.error("Greška pri objavi na backendu:", err.response?.data || err.message);
      alert("Došlo je do greške pri objavi. Provjerite konzolu.");
    }
  };

  return (
    <div className="home-main-wrapper">
      <header className="home-header">
        <h2 className="header-title">Početna</h2>
      </header>

      {/* Tweet Box - Prikazuje se samo ako je korisnik autentificiran */}
      {authStore.isAuthenticated && (
        <div className="tweet-box-container">
          <div className="tweet-box-avatar">
            {authStore.user?.avatar ? (
              <img src={authStore.user.avatar} alt="profil" />
            ) : (
              <div className="avatar-placeholder-inner"></div>
            )}
          </div>
          <div className="tweet-box-main">
            <textarea
              placeholder="Što se događa?"
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              rows={tweetContent.split('\n').length || 1}
            />
            <div className="tweet-box-footer">
              <div className="tweet-icons">
                <span>🖼️</span> <span>📊</span> <span>😀</span>
              </div>
              <button 
                className="tweet-post-btn"
                disabled={!tweetContent.trim()}
                onClick={handlePostTweet}
              >
                Objavi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-content">
        {loading ? (
          <div className="feed-placeholder"><p>Učitavanje objava...</p></div>
        ) : (
          <div className="tweets-list">
            {tweets.map((tweet) => (
              <div key={tweet.id || Math.random()} className="tweet-item">
                <div className="tweet-avatar-placeholder">
                   {tweet.User?.avatar && <img src={tweet.User.avatar} alt="avatar" />}
                </div>
                <div className="tweet-body">
                  <div className="tweet-header-info">
                    <span className="tweet-username">
                      @{tweet.User?.username || 'nepoznato'}
                    </span>
                    <span className="tweet-date">
                      • {tweet.createdAt ? new Date(tweet.createdAt).toLocaleDateString() : 'Upravo sad'}
                    </span>
                  </div>
                  <p className="tweet-text">{tweet.content}</p>
                  <div className="tweet-actions">
                    <span>💬 0</span> <span>🔁 0</span> <span>❤️ 0</span>
                  </div>
                </div>
              </div>
            ))}

            {tweets.length === 0 && (
              <div className="feed-placeholder">
                <p>Nema objava za prikaz. Budite prvi koji će nešto objaviti!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;