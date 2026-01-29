import React from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import '../styles/home.css';

const Home = observer(() => {
  return (
    <div className="home-main-wrapper">
      <header className="home-header">
        <h2 className="header-title">Početna</h2>
      </header>

      <div className="home-content">
        <div className="welcome-card">
          <h1 className="welcome-title">Dobrodošli na 𝕏 klon</h1>
          
          {authStore.isAuthenticated ? (
            <div className="user-logged-in">
              <p className="status-text">
                Prijavljeni ste kao: <span className="highlight-user">@{authStore.user?.username}</span>
              </p>
              <button 
                onClick={() => authStore.logout()}
                className="logout-btn"
              >
                Odjavi se
              </button>
            </div>
          ) : (
            <div className="user-logged-out">
              <p className="hint-text">Pridruži se razgovoru i saznaj što se događa.</p>
              <div className="auth-actions">
                <a href="/login" className="login-link">Prijavi se</a>
                <a href="/register" className="register-link">Registriraj se</a>
              </div>
            </div>
          )}
        </div>

        {/* Ovdje će kasnije ići tvoj Feed s tweetovima */}
        <div className="feed-placeholder">
           <p>Ovdje će se pojaviti tvoje objave...</p>
        </div>
      </div>
    </div>
  );
});

export default Home;