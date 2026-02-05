import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from './stores/AuthStore';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register'; 
import VerifyEmail from './pages/VerifyEmail'; 
import Notifications from './pages/Notifications';

// Components
import Sidebar from './components/layout/Sidebar';
import RightPanel from './components/layout/RightPanel';

const App = observer(() => {
  const { isAuthenticated, isLoading } = authStore;

  // Provjera korisnika odmah pri paljenju aplikacije/osvježavanju
  useEffect(() => {
    authStore.checkAuth();
  }, []);

  // Dok se provjerava token, prikaži loader (sprječava blicanje login stranice)
  if (isLoading && !authStore.user && authStore.token) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3">Učitavanje...</span>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto flex justify-center">
        
        {/* Sidebar - Prikazuje se samo ulogiranima */}
        {isAuthenticated && (
          <div className="hidden sm:block w-20 xl:w-64 sticky top-0 h-screen">
            <Sidebar />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow max-w-[600px] border-x border-gray-800 min-h-screen">
          <Routes>
            {/* JAVNE RUTE */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <Register /> : <Navigate to="/" />} 
            />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* ZAŠTIĆENE RUTE */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/notifications" 
              element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/profile" 
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile/:username" 
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Right Panel - Prikazuje se samo ulogiranima */}
        {isAuthenticated && (
          <div className="hidden lg:block w-80 ml-8 sticky top-0 h-screen">
            <RightPanel />
          </div>
        )}
        
      </div>
    </div>
  );
});

export default App;