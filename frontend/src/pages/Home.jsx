import React from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';

const Home = observer(() => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-400">Dobrodošli na Twitter Klon 🐦</h1>
        
        {authStore.isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-xl">Prijavljeni ste kao: <span className="font-mono text-green-400">{authStore.user?.username || 'Korisnik'}</span></p>
            <button 
              onClick={() => authStore.logout()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold transition"
            >
              Odjavi se
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-lg">Trenutno niste prijavljeni.</p>
            <div className="flex gap-4 justify-center">
              <a href="/login" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold transition">
                Prijavi se
              </a>
              <a href="/register" className="border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-6 py-2 rounded-full font-bold transition">
                Registriraj se
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default Home;