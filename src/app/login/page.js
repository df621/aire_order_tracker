'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
      <img
        src="https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images//aire-logo-transparent.png"
        alt="Aire Logo"
        style={{ width: '250px', marginBottom: '40px' }}
      />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#111827' }}>Iniciar sesión</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            marginBottom: '12px'
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            marginBottom: '20px'
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Entrar
        </button>

        {errorMsg && (
          <p style={{ color: 'red', marginTop: '12px', textAlign: 'center' }}>
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}