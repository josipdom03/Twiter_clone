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
            {/* Javne rute (dostupne samo ako NISI ulogiran) */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            
            {/* Ruta za verifikaciju emaila - javna jer korisnik klikne iz maila */}
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Zaštićene rute (dostupne samo ako SI ulogiran) */}
            <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
            
            {/* Dinamička ruta za profile */}
            <Route path="/:username" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Right Panel - Trendovi i pretraga */}
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