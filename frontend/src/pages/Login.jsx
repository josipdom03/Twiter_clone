import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { useNavigate, Link } from 'react-router-dom';

const Login = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authStore.login(email, password);
      navigate('/'); // Vodi na početnu nakon uspješne prijave
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="max-w-md w-full bg-gray-900 p-8 rounded-2xl border border-gray-800">
        <h2 className="text-3xl font-bold mb-6 text-center">Prijava</h2>
        
        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm border border-red-500/50">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Lozinka"
            className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:border-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={authStore.isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-full font-bold transition disabled:opacity-50"
          >
            {authStore.isLoading ? 'Prijava...' : 'Prijavi se'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-500 text-sm">
          Nemaš račun? <Link to="/register" className="text-blue-400 hover:underline">Registriraj se</Link>
        </p>
      </div>
    </div>
  );
});

export default Login;