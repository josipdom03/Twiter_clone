import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { userStore } from '../stores/UserStore.jsx';
import axios from 'axios';

const Search = observer(() => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const query = new URLSearchParams(location.search).get('q') || "";
    const [inputQuery, setInputQuery] = useState(query);

    const API_BASE_URL = "http://localhost:3000";

    // Set za brzu provjeru pratimo li korisnika
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
            const response = await axios.get(`${API_BASE_URL}/api/users/search?query=${query}`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });

            const updatedResults = response.data.map(user => ({
                ...user,
                isFollowing: user.isFollowing || followingIds.has(user.id)
            }));

            setResults(updatedResults);
        } catch (err) {
            console.error("Greška pri pretrazi:", err);
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
            <div className="search-header-sticky">
                <div className="search-top-bar">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>

                    <form onSubmit={handleSearchSubmit} className="search-input-wrapper-main">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Pretraži korisnike"
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
                ) : results.length > 0 ? (
                    results.map((user) => {
                        const isFollowing = followingIds.has(user.id);

                        return (
                            <div 
                                key={user.id} 
                                className="search-user-item"
                                onClick={() => navigate(`/profile/${user.username}`)}
                            >
                                <div className="avatar-container">
                                    
                                    {user.avatar && (
                                        <img 
                                            src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE_URL}/${user.avatar}`} 
                                            className="avatar-img" 
                                            alt={user.username}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    )}
                                </div>

                                <div className="search-user-info">
                                    <span className="search-user-name">
                                        {user.displayName || user.username}
                                    </span>
                                    <span className="search-user-username">@{user.username}</span>
                                </div>

                                {authStore.user?.id !== user.id && (
                                    <button 
                                        onClick={(e) => handleFollowToggle(e, user)} 
                                        className={`follow-btn ${isFollowing ? 'following' : ''}`}
                                    >
                                        {isFollowing ? 'Pratim' : 'Prati'}
                                    </button>
                                )}
                            </div>
                        );
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