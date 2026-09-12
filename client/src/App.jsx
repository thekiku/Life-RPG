import React, { useState, useEffect } from 'react';
import HeaderHUD from './components/HeaderHUD.jsx';
import QuestLog from './pages/QuestLog.jsx';
import Character from './pages/Character.jsx';
import Shop from './pages/Shop.jsx';
import AuthPage from './pages/AuthPage.jsx';
import LevelUpModal from './components/LevelUpModal.jsx';
import { sound } from './audio.js';
import './style.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quests'); // 'quests' | 'character' | 'shop'
  const [levelUpAlert, setLevelUpAlert] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          await fetchStats();
        }
      }
    } catch (err) {
      console.error('Session check failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch failed', err);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    sound.playClick();
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setStats(null);
  };

  const toggleSound = () => {
    sound.enabled = soundMuted;
    setSoundMuted(!soundMuted);
    if (!soundMuted) sound.playClick();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-pixel)', color: 'var(--accent-amber)' }}>
        INITIALIZING SYSTEM...
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={(u) => { setUser(u); fetchStats(); }} />;
  }

  return (
    <div className="console-chassis">
      {/* Handheld Console Top Bar */}
      <div className="console-brand">
        <span className="brand-title">QUESTLOG v2.0</span>
        <div className="power-led">
          <div className="led-dot" />
          <span>SYS ON</span>
        </div>
      </div>

      {/* Screen Bezel & Display Window */}
      <div className="screen-bezel">
        <div className="screen-content">
          <HeaderHUD character={stats?.character} />

          {activeTab === 'quests' && (
            <QuestLog
              stats={stats}
              onRefreshStats={fetchStats}
              onLevelUp={(lvl) => setLevelUpAlert(lvl)}
            />
          )}

          {activeTab === 'character' && (
            <Character stats={stats} />
          )}

          {activeTab === 'shop' && (
            <Shop stats={stats} onRefreshStats={fetchStats} />
          )}
        </div>

        {levelUpAlert !== null && (
          <LevelUpModal
            level={levelUpAlert}
            onClose={() => setLevelUpAlert(null)}
          />
        )}
      </div>

      {/* Retro Arcade Controls & Hardware Deck */}
      <div className="console-controls">
        <div className="nav-tab-group" role="tablist">
          <button
            className={`nav-tab-btn ${activeTab === 'quests' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('quests'); }}
            role="tab"
          >
            [A] QUEST BOARD
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'character' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('character'); }}
            role="tab"
          >
            [B] HERO PROFILE
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveTab('shop'); }}
            role="tab"
          >
            [SELECT] ITEM SHOP
          </button>
        </div>

        <div className="control-meta">
          <button className="btn-icon" onClick={toggleSound} title="Toggle Synth Sound Effects">
            {soundMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
          </button>
          <button className="btn-icon" onClick={handleLogout} title="Log Out">
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}