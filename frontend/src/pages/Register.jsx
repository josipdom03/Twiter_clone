import React, { useState } from 'react'; // Dodaj useState
import { observer } from "mobx-react-lite";
import { authStore } from "../stores/AuthStore.js";

const Register = observer(() => {
  // Stanje za input polja
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Pozivamo akciju iz MobX storea
    await authStore.register(username, email, password);
  };

  return (
    <div className="auth-card">
      <h2>Pridruži se Twitter Klonu</h2>
      
      <button onClick={handleGoogleLogin} className="google-btn">
        Registriraj se putem Googlea
      </button>

      <div className="separator">ili</div>

      {/* Popravljeno: onSubmit sada ima pravu funkciju */}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
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
          {authStore.isLoading ? "Slanje..." : "Pošalji zahtjev za registraciju"}
        </button>
      </form>

      {/* Prikaz poruke o grešci ako postoji */}
      {authStore.error && <p style={{ color: 'red' }}>{authStore.error}</p>}
      
      <p className="hint">
        Nakon klika, poslat ćemo ti mail za potvrdu računa.
      </p>
    </div>
  );
});

export default Register;