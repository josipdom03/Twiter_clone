import React, { useEffect } from 'react'; // Obavezno dodaj "React" ovdje
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authStore } from '../stores/AuthStore.jsx';
import { observer } from 'mobx-react-lite';

const LoginSuccess = observer(() => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      console.log("Token pronađen, započinjem prijavu...");
      
      // 1. Spremi token
      authStore.setToken(token);
      
      // 2. Provjeri auth (dohvati profil korisnika)
      authStore.checkAuth().then(() => {
        // 3. Preusmjeri na home
        navigate('/');
      }).catch(err => {
        console.error("Greška pri checkAuth nakon Google prijave:", err);
        navigate('/login');
      });
    } else {
      console.error("Token nije pronađen u URL-u");
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '100px', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <div style={{ padding: '20px', border: '1px solid #ddd', display: 'inline-block', borderRadius: '8px' }}>
        <h2>Prijava uspješna!</h2>
        <p>Molimo pričekajte, postavljamo vaš profil...</p>
        {/* Spinner ili loader po želji */}
      </div>
    </div>
  );
});

export default LoginSuccess;