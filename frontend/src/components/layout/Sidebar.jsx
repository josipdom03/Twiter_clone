import React from 'react';
import { NavLink } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';
import '../../styles/sidebar.css';

const Sidebar = observer(() => {
  const menuItems = [
    { name: 'Početna', path: '/', icon: '🏠' },
    { name: 'Obavijesti', path: '/notifications', icon: '🔔' },
    { name: 'Profil', path: `/${authStore.user?.username || 'profile'}`, icon: '👤' },
  ];

  return (
    <aside className="sidebar-main-container">
      <div className="sidebar-upper-content">
        {/* Logo */}
        <div className="sidebar-logo-box">
          <div className="sidebar-logo-dot"></div>
        </div>

        {/* Navigacija - Ovdje forsiramo stupac */}
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
        </nav>

        <button className="sidebar-action-button">
          Objavi
        </button>
      </div>

      {/* Profil na dnu */}
      <div className="sidebar-footer-profile">
        <div className="sidebar-avatar-placeholder"></div>
        <div className="sidebar-user-meta">
          <p className="sidebar-username">{authStore.user?.username || 'Gost'}</p>
          <p className="sidebar-handle">@{authStore.user?.username?.toLowerCase() || 'gost'}</p>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;