import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [postingTweet, setPostingTweet] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Paginacija
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Tabovi (all = Za vas, following = Pratim)
  const [activeTab, setActiveTab] = useState('all');
  
  const observerRef = useRef();

  const API_BASE_URL = "http://localhost:3000";
  const TWEETS_PER_PAGE = 10;

  // Funkcija za dohvaćanje objava
  const fetchTweets = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const endpoint = activeTab === 'following' ? '/api/tweets/following' : '/api/tweets';
      
      const res = await axios.get(
        `${API_BASE_URL}${endpoint}?page=${pageNum}&limit=${TWEETS_PER_PAGE}`,
        {
          headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
        }
      );

      let newTweets = [];
      let total = 1;

      if (Array.isArray(res.data)) {
        newTweets = res.data;
        total = 1;
      } else if (res.data.tweets) {
        newTweets = res.data.tweets;
        total = res.data.totalPages || 1;
      }
      
      setTotalPages(total);
      setHasMore(pageNum < total);

      if (append) {
        setTweets(prev => [...prev, ...newTweets]);
      } else {
        setTweets(newTweets);
      }

    } catch (err) {
      console.error("Ne mogu dohvatiti objave:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Resetiranje na promjenu taba
  useEffect(() => {
    setPage(1);
    fetchTweets(1, false);
  }, [activeTab]);

  // Infinite scroll
  const lastTweetCallback = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchTweets(nextPage, true);
          return nextPage;
        });
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const handleOpenTweet = async (tweet) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tweets/${tweet.id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      setSelectedTweet(res.data);
    } catch (err) {
      console.error("Greška pri dohvaćanju tweeta:", err);
      setSelectedTweet(tweet);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (files.length + imageFiles.length > MAX_IMAGES) {
      alert(`Maksimalno ${MAX_IMAGES} slike po objavi!`);
      e.target.value = '';
      return;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert(`Format ${file.name} nije dozvoljen.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`Slika ${file.name} je veća od ${MAX_IMAGE_SIZE_MB}MB.`);
        continue;
      }

      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostTweet = async () => {
    if (!tweetContent?.trim() && imageFiles.length === 0) return;
    
    // LOG PODATAKA PRIJE SLANJA
    console.log("--- ŠALJEM OBJAVU ---");
    console.log("Tekst:", tweetContent);
    console.log("Slike (Files):", imageFiles);
    
    setPostingTweet(true);

    try {
      const formData = new FormData();
      formData.append('content', tweetContent || '');
      imageFiles.forEach(file => formData.append('images', file));

      const response = await axios.post(
        `${API_BASE_URL}/api/tweets`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      console.log("Server odgovor (ID):", response.data.id);

      // Dohvat punog objekta nakon objave (zbog relacija)
      const newTweetRes = await axios.get(`${API_BASE_URL}/api/tweets/${response.data.id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });

      setTweets(prev => [newTweetRes.data, ...prev]);
      setTweetContent('');
      setImageFiles([]);
      setImagePreviews([]);
      
    } catch (err) {
      console.error("Greška pri objavi:", err);
      alert("Došlo je do greške pri objavi.");
    } finally {
      setPostingTweet(false);
    }
  };

  const updateLikeInState = (tweetId, isLiked) => {
    setTweets(prev => prev.map(t => {
      if (t?.id === tweetId) {
        const currentLikes = t?.LikedByUsers || [];
        return {
          ...t,
          LikedByUsers: isLiked 
            ? [...currentLikes, { id: authStore.user?.id }] 
            : currentLikes.filter(u => u?.id !== authStore.user?.id)
        };
      }
      return t;
    }));
  };

  const handleTweetDelete = (tweetId) => {
    setTweets(prev => prev.filter(t => t?.id !== tweetId));
  };

  const refreshFeed = () => {
    setPage(1);
    fetchTweets(1, false);
  };

  const getCharCounterClass = () => {
    const length = tweetContent?.length || 0;
    if (length >= 270) return 'danger';
    if (length >= 250) return 'warning';
    return '';
  };

  return (
    <div className="home-main-wrapper">
      {selectedTweet && (
        <TweetDetail 
          tweet={selectedTweet} 
          onClose={() => setSelectedTweet(null)}
          onTweetUpdate={refreshFeed}
          onTweetDelete={handleTweetDelete}
        />
      )}

      <header className="home-header">
        <h2 className="header-title">Početna</h2>
      </header>

      <div className="feed-tabs">
        <div 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>Za vas</span>
          <div className="tab-indicator"></div>
        </div>
        <div 
          className={`tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => {
            if (!authStore.isAuthenticated) {
              alert("Morate biti prijavljeni.");
              return;
            }
            setActiveTab('following');
          }}
        >
          <span>Pratim</span>
          <div className="tab-indicator"></div>
        </div>
      </div>

      {authStore.isAuthenticated && (
        <div className="tweet-box-container">
          <img 
            src={authStore.user?.avatar ? 
              (authStore.user.avatar.startsWith('http') ? 
                authStore.user.avatar : 
                `${API_BASE_URL}${authStore.user.avatar}`) 
              : "/default-avatar.png"
            } 
            alt="Avatar" 
            className="tweet-box-avatar"
            onError={(e) => { e.target.src = "/default-avatar.png"; }}
          />
          <div className="tweet-box-main">
            <textarea
              placeholder="Što se događa?"
              value={tweetContent}
              onChange={(e) => setTweetContent(e.target.value)}
              rows={Math.min(5, Math.max(1, (tweetContent?.split('\n').length || 1)))}
              disabled={postingTweet}
              maxLength={280}
            />
            <div className={`char-counter ${getCharCounterClass()}`}>
              {tweetContent.length}/280
            </div>

            {imagePreviews.length > 0 && (
              <div className={`image-preview-container ${imagePreviews.length > 1 ? 'grid' : ''}`}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview} alt="Preview" />
                    <button className="remove-image-btn" onClick={() => removeImage(index)} disabled={postingTweet}>
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
                    accept="image/*" 
                    multiple 
                    onChange={handleImageSelect} 
                    style={{ display: 'none' }} 
                    disabled={postingTweet}
                  />
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"/>
                  </svg>
                </label>
              </div>

              <button 
                className="tweet-post-btn" 
                onClick={handlePostTweet}
                disabled={postingTweet || (!tweetContent.trim() && imageFiles.length === 0)}
              >
                {postingTweet ? '...' : 'Objavi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-content">
        {loading ? (
          <div className="feed-placeholder"><div className="loading-spinner"></div></div>
        ) : (
          <div className="tweets-list">
            {tweets.length === 0 ? (
              <div className="feed-placeholder">
                <p>{activeTab === 'following' ? "Nema novih objava." : "Budi prvi koji će objaviti!"}</p>
              </div>
            ) : (
              <>
                {tweets.map((tweet, index) => (
                  <div key={tweet.id} ref={index === tweets.length - 1 ? lastTweetCallback : null}>
                    <Tweet 
                      tweet={tweet} 
                      onOpen={handleOpenTweet} 
                      onLikeUpdate={updateLikeInState}
                      onDelete={handleTweetDelete}
                    />
                  </div>
                ))}
                {loadingMore && <div className="loading-spinner"></div>}
                {!hasMore && tweets.length > 0 && <p className="end-of-feed">To je sve za sada 🎉</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;