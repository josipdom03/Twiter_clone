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
  
  // Za paginaciju
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  const observerRef = useRef();
  const lastTweetRef = useRef();

  const API_BASE_URL = "http://localhost:3000";
  const TWEETS_PER_PAGE = 10;

  // Funkcija za dohvaćanje objava (s paginacijom)
  const fetchTweets = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log(`Dohvaćam tweets - stranica: ${pageNum}, append: ${append}`);
      
      const res = await axios.get(
        `${API_BASE_URL}/api/tweets?page=${pageNum}&limit=${TWEETS_PER_PAGE}`
      );

      console.log("Odgovor od servera:", res.data);

      // Provjeri strukturu odgovora
      let newTweets = [];
      let total = 1;

      if (Array.isArray(res.data)) {
        // Ako server vraća direktno niz
        newTweets = res.data;
        total = 1; // Ako nema paginacije, onda je samo jedna stranica
        console.log("Server je vratio niz tweets:", newTweets.length);
      } else if (res.data.tweets) {
        // Ako server vraća { tweets: [], totalPages: x }
        newTweets = res.data.tweets;
        total = res.data.totalPages || 1;
        console.log("Server je vratio objekt s tweets poljem:", newTweets.length);
      } else {
        console.warn("Nepoznat format odgovora:", res.data);
      }
      
      setTotalPages(total);
      setHasMore(pageNum < total);

      if (append) {
        // Ako je "učitaj još", dodaj na postojeće
        setTweets(prev => {
          const combined = [...prev, ...newTweets];
          console.log("Nakon append-a, ukupno tweets:", combined.length);
          return combined;
        });
      } else {
        // Ako je prva stranica ili refresh, zamijeni
        setTweets(newTweets);
        console.log("Postavljam nove tweets:", newTweets.length);
      }

    } catch (err) {
      console.error("Ne mogu dohvatiti objave:", err);
      if (err.response) {
        console.error("Status greške:", err.response.status);
        console.error("Poruka greške:", err.response.data);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Inicijalno učitavanje
  useEffect(() => {
    fetchTweets(1, false);
    setPage(1);
  }, []);

  // Intersection Observer za infinite scroll
  const lastTweetCallback = useCallback((node) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
        // Ako je zadnji tweet vidljiv i ima još stranica, učitaj sljedeću
        const nextPage = page + 1;
        console.log("Zadnji tweet vidljiv, učitavam stranicu:", nextPage);
        setPage(nextPage);
        fetchTweets(nextPage, true);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, page]);

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
    if (!tweetContent?.trim() && imageFiles.length === 0) return;

    setPostingTweet(true);

    try {
      const formData = new FormData();
      formData.append('content', tweetContent || '');

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      console.log("Šaljem novi tweet...");
      
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

      console.log("Tweet kreiran:", response.data);

      // Dohvati kompletan tweet sa svim podacima
      const newTweetRes = await axios.get(`${API_BASE_URL}/api/tweets/${response.data.id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });

      console.log("Dohvaćen kompletan tweet:", newTweetRes.data);

      // Nova objava ide na vrh, resetiraj paginaciju
      setTweets((prev) => [newTweetRes.data, ...(prev || [])]);
      setTweetContent('');
      setImageFiles([]);
      setImagePreviews([]);
      
      // Resetiraj paginaciju (vrati na prvu stranicu)
      setPage(1);
      setHasMore(true);
      
      // Osvježi ukupan broj stranica
      fetchTweets(1, false);

    } catch (err) {
      console.error("Greška pri objavi:", err);
      if (err.response) {
        console.error("Status greške:", err.response.status);
        console.error("Poruka greške:", err.response.data);
      }
      alert("Došlo je do greške pri objavi. Pokušaj ponovo.");
    } finally {
      setPostingTweet(false);
    }
  };

  const updateLikeInState = (tweetId, isLiked) => {
    setTweets(prev => (prev || []).map(t => {
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

  // Funkcija za brisanje tweeta iz state-a
  const handleTweetDelete = (tweetId) => {
    setTweets(prev => (prev || []).filter(t => t?.id !== tweetId));
  };

  // Funkcija za osvježavanje feeda (npr. nakon brisanja tweeta)
  const refreshFeed = () => {
    setPage(1);
    fetchTweets(1, false);
  };

  // Funkcija za brojač znakova
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
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-avatar.png";
            }}
          />
          <div className="tweet-box-main">
            <textarea
              placeholder="Što se događa?"
              value={tweetContent || ''}
              onChange={(e) => setTweetContent(e.target.value)}
              rows={Math.min(5, Math.max(1, (tweetContent?.split('\n').length || 1)))}
              disabled={postingTweet}
              maxLength={280}
            />
            <div className={`char-counter ${getCharCounterClass()}`}>
              {(tweetContent?.length || 0)}/280
            </div>

            {imagePreviews?.length > 0 && (
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
                </label>
                {imageFiles.length > 0 && (
                  <span className="image-count">{imageFiles.length}/{MAX_IMAGES}</span>
                )}
              </div>

              <button 
                className="tweet-post-btn" 
                onClick={handlePostTweet}
                disabled={
                  (!tweetContent?.trim() && imageFiles.length === 0) || 
                  postingTweet || 
                  (tweetContent?.length || 0) > 280
                }
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
            {!tweets || tweets.length === 0 ? (
              <div className="feed-placeholder">
                <p>Još nema objava. Budi prvi koji će nešto objaviti!</p>
              </div>
            ) : (
              <>
                {tweets.map((tweet, index) => {
                  if (!tweet) return null;
                  
                  // Zadnji tweet u listi? Dodaj mu ref za observer
                  if (tweets.length === index + 1) {
                    return (
                      <div ref={lastTweetCallback} key={tweet.id}>
                        <Tweet 
                          tweet={tweet} 
                          onOpen={handleOpenTweet} 
                          onLikeUpdate={updateLikeInState}
                          onDelete={handleTweetDelete}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <Tweet 
                        key={tweet.id} 
                        tweet={tweet} 
                        onOpen={handleOpenTweet} 
                        onLikeUpdate={updateLikeInState}
                        onDelete={handleTweetDelete}
                      />
                    );
                  }
                })}
                
                {/* Loading indicator za dodatne objave */}
                {loadingMore && (
                  <div className="feed-placeholder loading-more">
                    <div className="loading-spinner"></div>
                    <p>Učitavanje još objava...</p>
                  </div>
                )}
                
                {/* Kraj feeda */}
                {!hasMore && tweets.length > 0 && (
                  <div className="feed-placeholder end-of-feed">
                    <p>To je sve za sada 🎉</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;