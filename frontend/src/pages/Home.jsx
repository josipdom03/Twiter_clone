import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore.jsx';
import { Tweet } from '../components/layout/Tweet.jsx';
import axios from 'axios';
import TweetDetail from './TweetDetail';
import '../styles/home.css';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 3;
const MAX_TOTAL_SIZE_MB = 10;

const Home = observer(() => {
  const [tweetContent, setTweetContent] = useState('');
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [postingTweet, setPostingTweet] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    // 1) Limit broja slika
    if (files.length + imageFiles.length > MAX_IMAGES) {
      alert(`Maksimalno ${MAX_IMAGES} slike po objavi!`);
      e.target.value = '';
      return;
    }

    // 2) Provjera formata
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const invalidType = files.some(file => !allowedTypes.includes(file.type));

    if (invalidType) {
      alert("Dozvoljeni formati su: JPG, PNG, GIF, WEBP.");
      e.target.value = '';
      return;
    }

    // 3) Provjera veličine pojedine slike
    const tooLarge = files.some(file => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      alert(`Svaka slika mora biti manja od ${MAX_IMAGE_SIZE_MB}MB!`);
      e.target.value = '';
      return;
    }

    // 4) Provjera ukupne veličine svih slika
    const totalSize = [...imageFiles, ...files].reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      alert(`Ukupna veličina svih slika ne smije prelaziti ${MAX_TOTAL_SIZE_MB}MB!`);
      e.target.value = '';
      return;
    }

    // Ako je sve OK — spremi slike
    setImageFiles(prev => [...prev, ...files]);

    // Generiraj preview
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostTweet = async () => {
    if (!tweetContent.trim() && imageFiles.length === 0) return;

    setPostingTweet(true);

    try {
      const formData = new FormData();
      formData.append('content', tweetContent);

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await axios.post(
        'http://localhost:3000/api/tweets',
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      const newTweetRes = await axios.get(`http://localhost:3000/api/tweets/${response.data.id}`);

      const newTweet = {
        ...newTweetRes.data,
        User: {
          username: authStore.user?.username,
          avatar: authStore.user?.avatar,
          displayName: authStore.user?.displayName || authStore.user?.username
        }
      };

      setTweets((prev) => [newTweet, ...prev]);
      setTweetContent('');
      setImageFiles([]);
      setImagePreviews([]);

    } catch (err) {
      console.error("Greška pri objavi:", err);
      alert("Došlo je do greške pri objavi. Pokušaj ponovo.");
    } finally {
      setPostingTweet(false);
    }
  };

  const updateLikeInState = (tweetId, isLiked) => {
    setTweets(prev => prev.map(t => {
      if (t.id === tweetId) {
        const currentLikes = t.LikedByUsers || [];
        return {
          ...t,
          LikedByUsers: isLiked 
            ? [...currentLikes, { id: authStore.user?.id }] 
            : currentLikes.filter(u => u.id !== authStore.user?.id)
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
          <img 
            src={authStore.user?.avatar || "/default-avatar.png"} 
            alt="Avatar" 
            className="tweet-box-avatar"
            onError={(e) => e.target.src = "/default-avatar.png"}
          />
          <div className="tweet-box-main">
            <textarea
              placeholder="Što se događa?"
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              rows={Math.min(5, Math.max(1, tweetContent.split('\n').length))}
              disabled={postingTweet}
            />

            {imagePreviews.length > 0 && (
              <div className={`image-preview-container ${imagePreviews.length > 1 ? 'grid' : ''}`}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button 
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                      type="button"
                      disabled={postingTweet}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="tweet-box-footer">
              <div className="tweet-actions-left">
                <label className={`image-upload-btn ${postingTweet ? 'disabled' : ''}`}>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/gif,image/webp" 
                    multiple 
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                    disabled={postingTweet}
                  />
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/>
                  </svg>
                  <span>Media</span>
                </label>
                {imageFiles.length > 0 && (
                  <span className="image-count">{imageFiles.length}/{MAX_IMAGES}</span>
                )}
              </div>

              <button 
                className="tweet-post-btn" 
                onClick={handlePostTweet}
                disabled={(!tweetContent.trim() && imageFiles.length === 0) || postingTweet}
              >
                {postingTweet ? 'Objavljivanje...' : 'Objavi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-content">
        {loading ? (
          <div className="feed-placeholder">
            <div className="loading-spinner"></div>
            <p>Učitavanje objava...</p>
          </div>
        ) : (
          <div className="tweets-list">
            {tweets.length === 0 ? (
              <div className="feed-placeholder">
                <p>Još nema objava. Budi prvi koji će nešto objaviti!</p>
              </div>
            ) : (
              tweets.map((tweet) => (
                <Tweet 
                  key={tweet.id} 
                  tweet={tweet} 
                  onOpen={handleOpenTweet} 
                  onLikeUpdate={updateLikeInState}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;
