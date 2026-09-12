import React from 'react';

export default function Character({ stats }) {
  if (!stats) return <div className="empty-state">Loading character statistics...</div>;

  const { character, attributes, shop } = stats;
  const equippedItems = shop?.filter((i) => i.equipped) || [];

  const attrList = [
    { key: 'int', name: 'INTELLECT', val: character.attr_int || 0, color: 'var(--attr-int)', icon: '🧠', info: attributes?.int },
    { key: 'str', name: 'STRENGTH', val: character.attr_str || 0, color: 'var(--attr-str)', icon: '⚔️', info: attributes?.str },
    { key: 'craft', name: 'CRAFT', val: character.attr_craft || 0, color: 'var(--attr-craft)', icon: '⚒️', info: attributes?.craft },
    { key: 'spirit', name: 'SPIRIT', val: character.attr_spirit || 0, color: 'var(--attr-spirit)', icon: '✨', info: attributes?.spirit },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 className="section-title">
        <span>👤</span> ADVENTURER PROFILE
      </h2>

      {/* Stats Summary Card */}
      <div className="quest-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: '#718096' }}>HERO NAME</div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.95rem', color: 'var(--accent-amber)', marginTop: '4px' }}>
            {character.name}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: '#718096' }}>LEVEL</div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.95rem', color: 'var(--accent-purple)', marginTop: '4px' }}>
            LVL {character.level}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: '#718096' }}>HEALTH POINTS</div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.95rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            ❤️ {character.hp} / {character.max_hp} HP
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: '#718096' }}>COINS</div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.95rem', color: 'var(--accent-amber)', marginTop: '4px' }}>
            🪙 {character.coins} Gold
          </div>
        </div>
      </div>

      {/* Attribute Progression */}
      <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
        ATTRIBUTE TIER PROGRESSION
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {attrList.map((a) => (
          <div key={a.key} className="quest-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', color: a.color }}>
                {a.icon} {a.name}
              </span>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: '#a0aec0' }}>
                Tier {a.info?.level || 1}
              </span>
            </div>

            <div className="xp-bar-track" style={{ width: '100%', height: '10px' }}>
              <div className="xp-bar-fill" style={{ width: `${a.info?.pct || 0}%`, background: a.color }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#a0aec0' }}>
              <span>{a.val} Attr XP</span>
              <span>{a.info?.pct || 0}% to next tier</span>
            </div>
          </div>
        ))}
      </div>

      {/* Equipped Inventory */}
      <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '10px' }}>
        EQUIPPED RELICS & ITEMS
      </h3>

      {equippedItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-text">No relics equipped. Visit the Item Shop to acquire loot!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {equippedItems.map((item) => (
            <div key={item.slug} className="quest-card" style={{ borderColor: item.accent }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', color: item.accent }}>
                ✨ {item.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#a0aec0' }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}