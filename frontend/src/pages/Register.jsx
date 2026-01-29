import React, { useState } from 'react'; 
import { observer } from "mobx-react-lite";
import { authStore } from "../stores/AuthStore.jsx";
import '../styles/auth.css';

const Register = observer(() => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await authStore.register(username, email, password);
  };

  return (
    /* Glavna klasa 'auth-container' sada vrši centriranje preko CSS-a */
    <div className="auth-container">
      <div className="auth-card">
        <h2>Pridruži se 𝕏 klonu</h2>
        
        <button onClick={handleGoogleLogin} className="google-btn">
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" 
            alt="Google" 
            style={{ width: '20px', height: '20px' }} 
          />
          Registriraj se putem Googlea
        </button>

        <div className="separator">
          <span>ili</span>
        </div>

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Korisničko ime" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
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
          <button type="submit" disabled={authStore.isLoading}>
            {authStore.isLoading ? "Slanje..." : "Kreiraj račun"}
          </button>
        </form>

        {authStore.error && <p className="error-text">{authStore.error}</p>}
        
        <p className="hint">
          Nakon klika, poslat ćemo ti mail za potvrdu računa.
        </p>
      </div>
    </div>
  );
});

export default Register;