import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore.jsx';
import { Tweet } from '../components/layout/Tweet.jsx'; 
import TweetDetail from './TweetDetail'; 
import axios from 'axios';

const Search = observer(() => {
    const [results, setResults] = useState([]);
    const [resultType, setResultType] = useState('users'); 
    const [loading, setLoading] = useState(false);
    const [selectedTweet, setSelectedTweet] = useState(null); 
    const location = useLocation();
    const navigate = useNavigate();

    const query = new URLSearchParams(location.search).get('q') || "";
    const [inputQuery, setInputQuery] = useState(query);

    const API_BASE_URL = "http://localhost:3000";

    const followingIds = useMemo(() => {
        if (!userStore.profile?.Following) return new Set();
        return new Set(userStore.profile.Following.map(u => u.id));
    }, [userStore.profile?.Following]);

    const fetchResults = async () => {
        if (!query) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users/search?query=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });

            const { data, type } = response.data;
            setResultType(type);

            if (type === 'users') {
                const updatedResults = data.map(user => ({
                    ...user,
                    isFollowing: followingIds.has(user.id)
                }));
                setResults(updatedResults || []);
            } else {
                // Za objave osiguravamo da su LikedByUsers i Comments barem prazni nizovi ako nisu stigli
                const formattedTweets = data.map(tweet => ({
                    ...tweet,
                    LikedByUsers: tweet.LikedByUsers || [],
                    Comments: tweet.Comments || []
                }));
                setResults(formattedTweets || []); 
            }
        } catch (err) {
            console.error("Greška pri pretrazi:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userStore.profile) {
            userStore.fetchProfile();
        }
        fetchResults();
        setInputQuery(query);
    }, [query, followingIds]);

    const handleOpenTweet = async (tweet) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/tweets/${tweet.id}`);
            setSelectedTweet(res.data);
        } catch (err) {
            setSelectedTweet(tweet);
        }
    };

    const updateLikeInState = (tweetId, isLiked) => {
        setResults(prev => prev.map(t => {
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

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (inputQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(inputQuery.trim())}`);
        }
    };

    const handleFollowToggle = async (e, user) => {
        e.stopPropagation();
        try {
            const currentlyFollowing = followingIds.has(user.id);
            if (currentlyFollowing) {
                await userStore.handleUnfollow(user.id);
            } else {
                await userStore.handleFollow(user.id);
            }
        } catch (err) {
            console.error("Greška kod promjene praćenja:", err);
        }
    };

    return (
        <div className="search-page">
            {selectedTweet && (
                <TweetDetail 
                    tweet={selectedTweet} 
                    onClose={() => setSelectedTweet(null)} 
                    // Ako TweetDetail podržava update, možeš proslijediti i updateLikeInState
                />
            )}

            <div className="search-header-sticky">
                <div className="search-top-bar">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <form onSubmit={handleSearchSubmit} className="search-input-wrapper-main">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Pretraži korisnike ili #hashtagove"
                            value={inputQuery}
                            onChange={(e) => setInputQuery(e.target.value)}
                        />
                    </form>
                </div>
            </div>

            <div className="search-results-list">
                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="loading-spinner"></div>
                    </div>
                ) : results && results.length > 0 ? (
                    results.map((item) => {
                        if (resultType === 'users') {
                            const isFollowing = followingIds.has(item.id);
                            return (
                                <div key={item.id} className="search-user-item" onClick={() => navigate(`/profile/${item.username}`)}>
                                    <div className="avatar-container">
                                        {item.avatar ? (
                                            <img 
                                                src={item.avatar.startsWith('http') ? item.avatar : `${API_BASE_URL}/${item.avatar}`} 
                                                className="avatar-img" alt={item.username}
                                            />
                                        ) : <div className="avatar-placeholder">{item.username ? item.username[0].toUpperCase() : "?"}</div>}
                                    </div>
                                    <div className="search-user-info">
                                        <span className="search-user-name">{item.displayName || item.username}</span>
                                        <span className="search-user-username">@{item.username}</span>
                                    </div>
                                    {authStore.user?.id !== item.id && (
                                        <button 
                                            onClick={(e) => handleFollowToggle(e, item)} 
                                            className={`follow-btn ${isFollowing ? 'following' : ''}`}
                                        >
                                            {isFollowing ? 'Pratim' : 'Prati'}
                                        </button>
                                    )}
                                </div>
                            );
                        } else {
                            return (
                                <Tweet 
                                    key={item.id} 
                                    tweet={item} 
                                    onOpen={handleOpenTweet} 
                                    onLikeUpdate={updateLikeInState}
                                />
                            );
                        }
                    })
                ) : query && (
                    <div className="search-empty-state">
                        <p>Nema rezultata za "{query}".</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default Search;