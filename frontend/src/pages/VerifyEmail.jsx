import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Provjeravamo vaš token...');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/auth/verify-email?token=${token}`);
        setMessage(response.data.message);
        // Nakon 3 sekunde preusmjeri na login
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Došlo je do greške pri verifikaciji.');
      }
    };

    if (token) verify();
  }, [token, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Potvrda Emaila</h2>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;