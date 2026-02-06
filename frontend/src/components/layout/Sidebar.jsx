import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';
import axios from 'axios';
import '../../styles/sidebar.css';

const Sidebar = observer(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tweetContent, setTweetContent] = useState('');

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
      window.location.reload(); // Najjednostavniji način da se osvježi feed ako si na Home
    } catch (err) {
      console.error("Greška pri objavi:", err);
    }
  };

  return (
    <>
      <aside className="sidebar-main-container">
        <div className="sidebar-upper-content">
          <div className="sidebar-logo-box"><div className="sidebar-logo-dot"></div></div>
          <nav className="sidebar-vertical-nav">
            {menuItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.name}</span>
              </NavLink>
            ))}
          </nav>
          {/* KLIK OTVARA MODAL */}
          <button className="sidebar-action-button" onClick={() => setIsModalOpen(true)}>
            Objavi
          </button>
        </div>

        <div className="sidebar-footer-profile">
          {authStore.user?.avatar ? (
            <img src={authStore.user.avatar} className="sidebar-avatar-img" alt="avatar" />
          ) : (
            <div className="sidebar-avatar-placeholder"></div>
          )}
          <div className="sidebar-user-meta">
            <p className="sidebar-username">{authStore.user?.displayName || authStore.user?.username || 'Gost'}</p>
            <p className="sidebar-handle">@{authStore.user?.username?.toLowerCase() || 'gost'}</p>
          </div>
        </div>
      </aside>

      {/* MODAL PROZOR */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-avatar">
                {authStore.user?.avatar ? <img src={authStore.user.avatar} alt="avatar" /> : <div className="avatar-placeholder-inner" />}
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