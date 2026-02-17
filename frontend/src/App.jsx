import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from './stores/AuthStore';

// Pages & Components
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import ChatDetail from './pages/ChatDetails';
import Sidebar from './components/layout/Sidebar';
import RightPanel from './components/layout/RightPanel';
import Search from './pages/Search';

// CSS
import './index.css';

const App = observer(() => {
  const { isAuthenticated, isLoading } = authStore;

  useEffect(() => {
    authStore.checkAuth();
  }, []);

  if (isLoading && !authStore.user && authStore.token) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <span className="ml-2">Učitavanje...</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-layout">
        {/* LIJEVI STUPAC - Sidebar */}
        {isAuthenticated && (
          <div className="sidebar-column">
            <div className="sidebar-sticky">
              <Sidebar />
            </div>
          </div>
        )}

        {/* SREDNJI STUPAC - Glavni sadržaj */}
        <div className={`main-column ${!isAuthenticated ? 'full-width' : ''}`}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
            <Route path="/messages" element={isAuthenticated ? <Messages /> : <Navigate to="/login" />} />
            <Route path="/messages/:userId" element={isAuthenticated ? <ChatDetail /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/:username" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/search" element={isAuthenticated ? <Search /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        {/* DESNI STUPAC - RightPanel */}
        {isAuthenticated && (
          <div className="right-column">
            <div className="right-column-sticky">
              <RightPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default App;