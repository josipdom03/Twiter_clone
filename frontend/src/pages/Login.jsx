import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css'; // Uvozimo zajednički CSS

const Login = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authStore.login(email, password);
      navigate('/'); 
    } catch (err) {
      // Hvatanje poruke o grešci s backend-a ako postoji
      setError(err.response?.data?.message || 'Pogrešan email ili lozinka');
    }
  };

  return (
    /* Roditeljski kontejner za centriranje */
    <div className="auth-container">
      <div className="auth-card">
        <h2>Prijavi se na 𝕏 klon</h2>
        
        {/* Google Login Button */}
        <button className="google-btn" onClick={handleGoogleLogin}>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" 
            alt="Google" 
            style={{ width: '20px', height: '20px' }} 
          />
          Prijavi se putem Googlea
        </button>

        <div className="separator">
          <span>ili</span>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email adresa"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={authStore.isLoading}
          >
            {authStore.isLoading ? 'Prijava...' : 'Prijavi se'}
          </button>
        </form>

        {/* Prikaz greške */}
        {error && <p className="error-text">{error}</p>}
        
        <p className="hint">
          Nemaš račun? <Link to="/register" style={{ color: '#1d9bf0', textDecoration: 'none', fontWeight: 'bold' }}>Registriraj se</Link>
        </p>
      </div>
    </div>
  );
});

export default Login;