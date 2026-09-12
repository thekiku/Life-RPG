import React, { useState } from 'react';
import { sound } from '../audio.js';

export default function Shop({ stats, onRefreshStats }) {
  const [loadingSlug, setLoadingSlug] = useState(null);
  const [error, setError] = useState(null);

  if (!stats) return <div className="empty-state">Loading catalog...</div>;

  const { shop, character } = stats;

  const handleBuy = async (slug) => {
    sound.playClick();
    setLoadingSlug(slug);
    setError(null);

    try {
      const res = await fetch('/api/stats/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Purchase failed');

      sound.playBuy();
      onRefreshStats();
    } catch (err) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoadingSlug(null);
    }
  };

  const handleEquip = async (slug) => {
    sound.playClick();
    setLoadingSlug(slug);
    try {
      const res = await fetch('/api/stats/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      if (res.ok) {
        onRefreshStats();
      }
    } catch (err) {
      sound.playError();
    } finally {
      setLoadingSlug(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="quest-header-row">
        <h2 className="section-title">
          <span>🏪</span> ITEM SHOP & ARMORY
        </h2>

        <div className="hud-coins" style={{ fontSize: '0.85rem' }}>
          <span>YOUR BALANCE:</span>
          <span>🪙 {character?.coins || 0} COINS</span>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 71, 111, 0.2)', border: '1px solid var(--accent-rose)', padding: '10px', borderRadius: '6px', color: 'var(--accent-rose)', fontFamily: 'var(--font-pixel)', fontSize: '0.65rem' }}>
          {error}
        </div>
      )}

      <div className="shop-grid">
        {shop?.map((item) => (
          <div key={item.slug} className="shop-card" style={{ borderColor: item.equipped ? 'var(--accent-cyan)' : '#282e3d' }}>
            <div>
              <div className="shop-item-name" style={{ color: item.accent }}>
                {item.name}
              </div>
              <div className="shop-item-desc">{item.description}</div>
            </div>

            <div style={{ marginTop: '14px' }}>
              {item.owned ? (
                <button
                  className="btn-primary"
                  style={{
                    width: '100%',
                    background: item.equipped ? 'var(--accent-purple)' : '#3a3f4d',
                    color: '#fff',
                  }}
                  onClick={() => handleEquip(item.slug)}
                  disabled={loadingSlug === item.slug}
                >
                  {item.equipped ? 'EQUIPPED ✓' : 'EQUIP ITEM'}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleBuy(item.slug)}
                  disabled={loadingSlug === item.slug || (character?.coins || 0) < item.price}
                >
                  BUY FOR 🪙 {item.price}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}