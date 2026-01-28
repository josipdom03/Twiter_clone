import React from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';

const Profile = observer(() => {
  // Ako korisnik nije prijavljen
  if (!authStore.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-xl text-gray-400">Morate biti prijavljeni da biste vidjeli profil.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-blue-500"></div>
        
        {/* Profile Info */}
        <div className="p-6 relative">
          <div className="absolute -top-12 left-6 h-24 w-24 bg-gray-700 border-4 border-black rounded-full flex items-center justify-center text-3xl">
            👤
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold">{authStore.user?.username || "Korisnik"}</h2>
            <p className="text-gray-500">@{authStore.user?.username?.toLowerCase() || "user"}</p>
            
            <div className="mt-4 py-3 border-t border-gray-800">
              <p className="text-sm text-gray-400">Email adresa</p>
              <p className="text-white">{authStore.user?.email || "nema@emaila.com"}</p>
            </div>

            <button 
              onClick={() => authStore.logout()}
              className="mt-6 w-full bg-white text-black font-bold py-2 rounded-full hover:bg-gray-200 transition"
            >
              Odjavi se
            </button> 
          </div>
        </div>
      </div>
    </div>
  );
});

export default Profile;