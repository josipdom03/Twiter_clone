import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import authStore from './stores/AuthStore';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
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
            <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Dinamička ruta za profile (tvoj :moj-username i :neki-username) */}
            <Route path="/:username" element={<Profile />} />
            
            {/* Fallback na home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Right Panel - Trendovi i pretraga (samo za desktop) */}
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