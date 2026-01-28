import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Provjeravamo vašu prijavu...');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Pozivamo BACKEND rutu koju smo ranije definirali
        const response = await axios.get(`http://localhost:3000/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
        // Automatski preusmjeri na login nakon 3 sekunde
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Neispravan ili istekao token.');
      }
    };

    if (token) {
      confirmEmail();
    }
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center max-w-md w-full">
        {status === 'verifying' && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>}
        {status === 'success' && <span className="text-4xl mb-4 block">✅</span>}
        {status === 'error' && <span className="text-4xl mb-4 block">❌</span>}
        
        <h2 className="text-2xl font-bold mb-2">Potvrda računa</h2>
        <p className={`${status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
          {message}
        </p>
        
        {status === 'success' && (
          <p className="mt-4 text-sm text-gray-500">Preusmjeravanje na prijavu...</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;