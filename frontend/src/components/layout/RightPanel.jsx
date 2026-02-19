import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../stores/AuthStore';
import '../../styles/rightPanel.css';

const RightPanel = observer(() => {
    const navigate = useNavigate();

    // Lokalno stanje koje određuje koliko trendova trenutno prikazujemo
    const [visibleTrendsCount, setVisibleTrendsCount] = useState(5);

    useEffect(() => {
        if (authStore.token) {
            authStore.fetchSuggestions();
            authStore.fetchTrends(); 
        }
    }, []);

    const handleFollow = async (e, userId) => {
        e.stopPropagation();
        try {
            await authStore.followUser(userId);
            authStore.fetchSuggestions();
        } catch (err) {
            console.error("Greška pri praćenju:", err);
        }
    };

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
    };

    const handleTrendClick = (tag) => {
        navigate(`/search?q=${encodeURIComponent(tag)}`);
    };

    // Funkcija za povećanje limita prikaza za 5
    const handleShowMoreTrends = () => {
        setVisibleTrendsCount((prev) => prev + 5);
    };

    // Uzimamo samo onoliko trendova koliko dopušta visibleTrendsCount
    const displayedTrends = authStore.trends ? authStore.trends.slice(0, visibleTrendsCount) : [];

    return (
        <div className="right-panel-wrapper">
            {/* SEARCH */}
            <div className="search-container-sticky">
                <div 
                    className="search-input-wrapper clickable-search" 
                    onClick={() => navigate('/search')}
                    style={{ cursor: 'pointer' }}
                >
                    <span className="search-icon">🔍</span>
                    <span className="search-placeholder-text">Pretraži</span>
                </div>
            </div>

            {/* DINAMIČNI TRENDOVI */}
            <div className="right-section-card">
                <h2 className="section-title">Što se događa</h2>
                
                {displayedTrends.length > 0 ? (
                    displayedTrends.map((trend) => (
                        <div 
                            key={trend.tag} 
                            className="item-hover trend-clickable" 
                            onClick={() => handleTrendClick(trend.tag)}
                            style={{ cursor: 'pointer' }}
                        >
                            <p className="trend-category">Trend u zadnjih 10 dana</p>
                            <p className="trend-title">{trend.tag}</p>
                            <p className="trend-stat">{trend.count} posts</p>
                        </div>
                    ))
                ) : (
                    <p className="empty-state-text" style={{ padding: '15px', color: '#71767b' }}>
                        Trenutno nema aktivnih trendova.
                    </p>
                )}

                {/* Gumb prikazujemo samo ako ima više trendova u bazi nego što trenutno prikazujemo */}
                {authStore.trends && authStore.trends.length > visibleTrendsCount && (
                    <button className="show-more-link" onClick={handleShowMoreTrends}>
                        Prikaži više
                    </button>
                )}
            </div>

            {/* KOGA PRATITI SEKCIJA */}
            <div className="right-section-card">
                <h2 className="section-title">Koga pratiti</h2>
                {authStore.suggestions?.length > 0 ? (
                    authStore.suggestions.map((user) => (
                        <div 
                            key={user.id} 
                            className="item-hover user-suggestion-item"
                            onClick={() => handleUserClick(user.username)}
                        >
                            <div className="flex-items">
                                {user.avatar ? (
                                    <img 
                                        src={`http://localhost:3000/${user.avatar}`} 
                                        className="avatar-img" 
                                        alt={user.username}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                {!user.avatar && (
                                    <div className="avatar-placeholder">
                                        {user.username ? user.username[0].toUpperCase() : '?'}
                                    </div>
                                )}
                                
                                <div className="user-info">
                                    <span className="user-name">
                                        {user.displayName || user.username}
                                    </span>
                                    <span className="user-username">
                                        @{user.username}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => handleFollow(e, user.id)} 
                                className="follow-btn"
                            >
                                Prati
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="empty-suggestions">
                        Nema prijedloga za pratiti.
                    </div>
                )}
            </div>
        </div>
    );
});

export default RightPanel;