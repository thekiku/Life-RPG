import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../audio.js';

export default function LevelUpModal({ level, onClose }) {
  useEffect(() => {
    sound.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffd23f', '#4cc9f0', '#06d6a0', '#ef476f'],
    });
  }, []);

  return (
    <div className="levelup-overlay">
      <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>⚡ UPGRADE! ⚡</div>
      <h1 className="levelup-title">LEVEL {level} REACHED!</h1>
      <p className="levelup-sub">HP Restored to Max! Attributes unlocked!</p>

      <button
        className="btn-primary"
        style={{ padding: '14px 28px', fontSize: '0.85rem' }}
        onClick={() => {
          sound.playClick();
          onClose();
        }}
      >
        CONTINUE ADVENTURE
      </button>
    </div>
  );
}