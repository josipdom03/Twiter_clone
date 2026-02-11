import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';
import axios from 'axios';
import '../../styles/sidebar.css';

const Sidebar = observer(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRequests, setShowRequests] = useState(false); // Za toggle liste zahtjeva
  const [tweetContent, setTweetContent] = useState('');
  const navigate = useNavigate();

  const requests = authStore.pendingFollowRequests || [];

  const menuItems = [
    { name: 'Početna', path: '/', icon: '🏠' },
    { name: 'Obavijesti', path: '/notifications', icon: '🔔' },
    { name: 'Poruke', path: '/messages', icon: '✉️' },
    { 
      name: 'Profil', 
      path: authStore.user ? `/profile/${authStore.user.username}` : '/profile', 
      icon: '👤' 
    },
  ];

  const handleSidebarPost = async () => {
    if (!tweetContent.trim()) return;
    try {
      await axios.post(
        'http://localhost:3000/api/tweets',
        { content: tweetContent },
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      setTweetContent('');
      setIsModalOpen(false);
      window.location.reload(); 
    } catch (err) {
      console.error("Greška pri objavi:", err);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Sigurno se želite odjaviti?")) {
      authStore.logout();
      navigate('/login');
    }
  };

  return (
    <>
      <aside className="sidebar-main-container">
        <div className="sidebar-upper-content">
          <div className="sidebar-logo-box">
            <div className="sidebar-logo-dot"></div>
          </div>
          
          <nav className="sidebar-vertical-nav">
            {menuItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.name}</span>
              </NavLink>
            ))}

            {/* --- SEKCIJA ZA ZAHTJEVE ZA PRAĆENJE --- */}
            <div className="sidebar-requests-wrapper">
              <button 
                className={`sidebar-nav-link requests-toggle ${showRequests ? 'active' : ''}`}
                onClick={() => setShowRequests(!showRequests)}
              >
                <span className="sidebar-icon">📩</span>
                <span className="sidebar-label">Zahtjevi</span>
                {requests.length > 0 && (
                  <span className="requests-badge">{requests.length}</span>
                )}
              </button>

              {showRequests && (
                <div className="sidebar-requests-dropdown">
                  {requests.length === 0 ? (
                    <p className="no-requests-text">Nema novih zahtjeva</p>
                  ) : (
                    requests.map((req) => (
                      <div key={req.id} className="sidebar-request-item">
                        <div 
                          className="req-user-info" 
                          onClick={() => {
                            navigate(`/profile/${req.Sender?.username}`);
                            setShowRequests(false);
                          }}
                        >
                          <img 
                            src={req.Sender?.avatar || '/default-avatar.png'} 
                            alt="avatar" 
                          />
                          <span className="req-username">@{req.Sender?.username}</span>
                        </div>
                        <div className="req-buttons">
                          <button 
                            className="req-accept-btn" 
                            onClick={() => authStore.respondToFollowRequest(req.id, 'accept')}
                            title="Prihvati"
                          >
                            ✔
                          </button>
                          <button 
                            className="req-reject-btn" 
                            onClick={() => authStore.respondToFollowRequest(req.id, 'reject')}
                            title="Odbij"
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </nav>
          
          <button className="sidebar-action-button" onClick={() => setIsModalOpen(true)}>
            Objavi
          </button>
        </div>

        <div className="sidebar-footer-profile">
          <div className="sidebar-user-info-group" onClick={() => navigate(`/profile/${authStore.user?.username}`)}>
            {authStore.user?.avatar ? (
              <img src={authStore.user.avatar} className="sidebar-avatar-img" alt="avatar" />
            ) : (
              <div className="sidebar-avatar-placeholder"></div>
            )}
            <div className="sidebar-user-meta">
              <p className="sidebar-username">
                {authStore.user?.displayName || authStore.user?.username || 'Gost'}
                {authStore.user?.isPrivate && <span style={{fontSize: '12px', marginLeft: '4px'}}>🔒</span>}
              </p>
              <p className="sidebar-handle">
                @{authStore.user?.username?.toLowerCase() || 'gost'}
              </p>
            </div>
          </div>
          
          <button 
            className="sidebar-logout-btn" 
            onClick={handleLogout}
            title="Odjavi se"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* MODAL PROZOR ZA OBJAVU */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-avatar">
                {authStore.user?.avatar ? (
                  <img src={authStore.user.avatar} alt="avatar" />
                ) : (
                  <div className="avatar-placeholder-inner" />
                )}
              </div>
              <textarea 
                placeholder="Što se događa?" 
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="tweet-post-btn" 
                disabled={!tweetContent.trim()}
                onClick={handleSidebarPost}
              >
                Objavi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Sidebar;