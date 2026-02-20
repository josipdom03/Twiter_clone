import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore.jsx';
import { Tweet } from '../components/layout/Tweet.jsx'; 
import TweetDetail from './TweetDetail'; 
import axios from 'axios';
import '../styles/search.css'; 

const Search = observer(() => {
    const [results, setResults] = useState([]);
    const [resultType, setResultType] = useState('users'); 
    const [loading, setLoading] = useState(false);
    const [selectedTweet, setSelectedTweet] = useState(null); 
    
    // Za prijedloge
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dropdownRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();

    const query = new URLSearchParams(location.search).get('q') || "";
    const [inputQuery, setInputQuery] = useState(query);

    const API_BASE_URL = "http://localhost:3000";

    // Pratimo lokalno stanje follow statusa za brže ažuriranje
    const [localFollowing, setLocalFollowing] = useState(new Set());

    // Inicijaliziramo localFollowing iz userStore.profile
    useEffect(() => {
        if (userStore.profile?.Following) {
            setLocalFollowing(new Set(userStore.profile.Following.map(u => u.id)));
        }
    }, [userStore.profile?.Following]);

    // Koristimo localFollowing umjesto direktno iz storea za brže ažuriranje
    const followingIds = useMemo(() => {
        return localFollowing;
    }, [localFollowing]);

    // Dohvaćanje prijedloga (Debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputQuery.trim().length > 1 && inputQuery !== query) {
                fetchSuggestions(inputQuery);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputQuery, query]);

    // Zatvaranje dropdowna klikom izvan
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (val) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users/search?query=${encodeURIComponent(val)}`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            
            if (response.data.type === 'users') {
                setSuggestions(response.data.data.slice(0, 5));
                setShowSuggestions(true);
            }
        } catch (err) {
            console.error("Greška kod prijedloga:", err);
        }
    };

    const fetchResults = async () => {
        if (!query) {
            setResults([]);
            return;
        }
        setLoading(true);
        setShowSuggestions(false);
        
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
    }, [query]);

    // Poseban useEffect za osvježavanje resultsa kada se promijeni followingIds
    useEffect(() => {
        if (results.length > 0 && resultType === 'users') {
            setResults(prev => prev.map(user => ({
                ...user,
                isFollowing: followingIds.has(user.id)
            })));
        }
    }, [followingIds]);

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
            setShowSuggestions(false);
            navigate(`/search?q=${encodeURIComponent(inputQuery.trim())}`);
        }
    };

    const handleFollowToggle = async (e, user) => {
        e.stopPropagation();
        
        // Optimistično ažuriranje - odmah mijenjamo stanje
        const newFollowing = new Set(localFollowing);
        const currentlyFollowing = followingIds.has(user.id);
        
        if (currentlyFollowing) {
            newFollowing.delete(user.id);
        } else {
            newFollowing.add(user.id);
        }
        
        // Lokalno ažuriramo stanje za instant UI promjenu
        setLocalFollowing(newFollowing);
        
        // Također ažuriramo results odmah
        setResults(prev => prev.map(u => {
            if (u.id === user.id) {
                return { ...u, isFollowing: !currentlyFollowing };
            }
            return u;
        }));

        try {
            // Pozivamo API
            if (currentlyFollowing) {
                await userStore.handleUnfollow(user.id);
            } else {
                await userStore.handleFollow(user.id);
            }
            
            // Nakon uspješnog API poziva, osvježavamo profil da bude u sync
            await userStore.fetchProfile();
            
        } catch (err) {
            console.error("Greška kod promjene praćenja:", err);
            
            // Vraćamo staro stanje ako je došlo do greške
            const revertFollowing = new Set(localFollowing);
            if (currentlyFollowing) {
                revertFollowing.add(user.id);
            } else {
                revertFollowing.delete(user.id);
            }
            setLocalFollowing(revertFollowing);
            
            setResults(prev => prev.map(u => {
                if (u.id === user.id) {
                    return { ...u, isFollowing: currentlyFollowing };
                }
                return u;
            }));
        }
    };

    const handleSuggestionClick = (user) => {
        setInputQuery(user.username);
        setShowSuggestions(false);
        navigate(`/profile/${user.username}`);
    };

    return (
        <div className="search-page">
            {selectedTweet && (
                <TweetDetail 
                    tweet={selectedTweet} 
                    onClose={() => setSelectedTweet(null)} 
                />
            )}

            <div className="search-header-sticky">
                <div className="search-top-bar">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <div className="search-input-container" ref={dropdownRef}>
                        <form onSubmit={handleSearchSubmit} className="search-input-wrapper-main">
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Pretraži korisnike ili #hashtagove"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                onFocus={() => inputQuery.length > 1 && setShowSuggestions(true)}
                            />
                        </form>

                        {/* DROPDOWN ZA PRIJEDLOGE */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions-dropdown">
                                {suggestions.map((user) => {
                                    const isFollowing = followingIds.has(user.id);
                                    return (
                                        <div 
                                            key={user.id} 
                                            className="suggestion-item" 
                                            onClick={() => handleSuggestionClick(user)}
                                        >
                                            <div className="suggestion-avatar">
                                                {user.avatar ? (
                                                    <img 
                                                        src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE_URL}/${user.avatar}`} 
                                                        alt={user.username} 
                                                    />
                                                ) : (
                                                    <div className="suggestion-placeholder">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="suggestion-info">
                                                <span className="suggestion-name">
                                                    {user.displayName || user.username}
                                                </span>
                                                <span className="suggestion-handle">
                                                    @{user.username}
                                                    {isFollowing && <span style={{ marginLeft: '8px', color: '#1d9bf0', fontSize: '12px' }}>• Pratim</span>}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Search link stavka */}
                                <div 
                                    className="suggestion-item search-link"
                                    onClick={handleSearchSubmit}
                                >
                                    Traži "{inputQuery}"
                                </div>
                            </div>
                        )}
                    </div>
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
                                <div 
                                    key={item.id} 
                                    className="search-user-item" 
                                    onClick={() => navigate(`/profile/${item.username}`)}
                                >
                                    <div className="avatar-container">
                                        {item.avatar ? (
                                            <img 
                                                src={item.avatar.startsWith('http') ? item.avatar : `${API_BASE_URL}/${item.avatar}`} 
                                                className="avatar-img" 
                                                alt={item.username}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {item.username ? item.username[0].toUpperCase() : "?"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="search-user-info">
                                        <span className="search-user-name">
                                            {item.displayName || item.username}
                                        </span>
                                        <span className="search-user-username">
                                            @{item.username}
                                        </span>
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