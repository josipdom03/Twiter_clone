import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../stores/AuthStore';
import '../../styles/rightPanel.css';

const RightPanel = observer(() => {
    const navigate = useNavigate();

    useEffect(() => {
        if (authStore.token) {
            authStore.fetchSuggestions();
        }
    }, []);

    const handleFollow = async (e, userId) => {
        e.stopPropagation();
        try {
            await authStore.followUser(userId);
            // Osvježi prijedloge nakon praćenja
            authStore.fetchSuggestions();
        } catch (err) {
            console.error("Greška pri praćenju:", err);
        }
    };

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
    };

    return (
        <div className="right-panel-wrapper">
            {/* PRETRAGA */}
            <div className="search-container-sticky">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Pretraži" 
                        aria-label="Pretraži"
                    />
                </div>
            </div>

            {/* TRENDING SEKCIJA */}
            <div className="right-section-card">
                <h2 className="section-title">Što se događa</h2>
                <TrendItem 
                    category="Tehnologija · Trend" 
                    title="#JavaScript" 
                    tweets="12.5K" 
                />
                <TrendItem 
                    category="Sport · Trend" 
                    title="Hajduk" 
                    tweets="5.8K" 
                />
                <TrendItem 
                    category="Glazba · Trend" 
                    title="Dora 2024" 
                    tweets="3.2K" 
                />
                <button className="show-more-link">
                    Prikaži više
                </button>
            </div>

            {/* KOGO PRATITI SEKCIJA */}
            <div className="right-section-card">
                <h2 className="section-title">Koga pratiti</h2>
                {authStore.suggestions?.length > 0 ? (
                    authStore.suggestions.map((user) => (
                        <div 
                            key={user.id} 
                            className="item-hover"
                            onClick={() => handleUserClick(user.username)}
                        >
                            <div className="flex-items">
                                {/* Avatar */}
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
                                
                                {/* Korisnički podaci */}
                                <div className="user-info">
                                    <span className="user-name">
                                        {user.displayName || user.username}
                                    </span>
                                    <span className="user-username">
                                        @{user.username}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Follow button */}
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

// TrendItem komponenta
const TrendItem = ({ category, title, tweets }) => (
    <div className="item-hover">
        <div>
            <p className="trend-category">{category}</p>
            <p className="trend-title">{title}</p>
            <p className="trend-stat">{tweets} posts</p>
        </div>
    </div>
);

export default RightPanel;