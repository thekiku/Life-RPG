import React from 'react';

export default function HeaderHUD({ character }) {
  if (!character) return null;

  const xpPct = character.xpProgressPct ?? 0;

  return (
    <header className="hud-bar" aria-label="Character HUD">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="hud-char-name">{character.name || 'Hero'}</span>
        <span className="hud-level-badge">LVL {character.level}</span>
      </div>

      <div className="xp-bar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', color: '#a0aec0' }}>XP</span>
          <span className="xp-bar-text">{character.xp} / {character.nextLevelXp} XP</span>
        </div>
        <div className="xp-bar-track" title={`${xpPct}% to Level ${character.level + 1}`}>
          <div className="xp-bar-fill" style={{ width: `${Math.min(100, Math.max(0, xpPct))}%` }} />
        </div>
      </div>

      <div className="hud-coins" title="Gold Coins earned from completing quests">
        <span>🪙</span>
        <span>{character.coins} COINS</span>
      </div>
    </header>
  );
}