import React, { useState } from 'react';
import { sound } from '../audio.js';

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playClick();

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin
      ? { username, password }
      : { username, password, characterName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      sound.playComplete();
      onAuthSuccess(data.user);
    } catch (err) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    sound.playClick();
    setLoading(true);
    setError(null);
    try {
      // Trigger dev seed if needed
      await fetch('/api/dev/seed', { method: 'POST' });
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'hero', password: 'demo1234' }),
      });
      const data = await res.json();
      if (res.ok) onAuthSuccess(data.user);
      else throw new Error(data.message);
    } catch (err) {
      sound.playError();
      setError('Demo login failed. Make sure server is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🕹️</div>
      <h1 className="brand-title" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
        QUESTLOG
      </h1>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: '#a0aec0', marginBottom: '24px' }}>
        HANDHELD LIFE RPG PROGRESSION
      </p>

      <div className="modal-card" style={{ boxShadow: 'var(--pixel-shadow)' }}>
        <h2 className="modal-title">{isLogin ? 'ENTER RUNE CODE' : 'CREATE ADVENTURER'}</h2>

        {error && (
          <div style={{ background: 'rgba(239, 71, 111, 0.2)', border: '1px solid var(--accent-rose)', padding: '10px', borderRadius: '6px', color: 'var(--accent-rose)', fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">USER NAME</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="hero"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">CHARACTER NAME</label>
              <input
                type="text"
                className="form-input"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Valiant Knight"
              />
            </div>
          )}

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">PASSWORD</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={loading}>
            {loading ? 'PROCESSING...' : isLogin ? 'PRESS START (LOGIN)' : 'INITIALIZE CHARACTER'}
          </button>
        </form>

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => { sound.playClick(); setIsLogin(!isLogin); setError(null); }}
          >
            {isLogin ? 'Need an account? Sign Up' : 'Already have account? Login'}
          </button>

          <button
            type="button"
            className="btn-primary"
            style={{ background: 'var(--accent-amber)', color: '#000' }}
            onClick={handleDemoLogin}
          >
            ⚡ QUICK DEMO LOG IN
          </button>
        </div>
      </div>
    </div>
  );
}