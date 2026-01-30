import React from 'react';
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
  const { isAuthenticated } = authStore;

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto flex justify-center">
        
        {/* Sidebar - Prikazuje se samo ako je korisnik ulogiran */}
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
            
            {/* PROFIL RUTE:
              1. /profile -> tvoj profil (isMyProfile će biti true jer nema username parametra)
              2. /profile/:username -> tuđi profil (ili tvoj ako je ime isto)
            */}
            <Route 
              path="/profile" 
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile/:username" 
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />
            
            {/* Fallback - ako ništa ne pogodi, idi na početnu */}
            <Route path="*" element={<Navigate to="/" />} />

            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/:username" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />  
          </Routes>
        </main>

        {/* Right Panel */}
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