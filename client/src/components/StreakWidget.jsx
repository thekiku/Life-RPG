import React from 'react';

export default function StreakWidget({ streak }) {
  if (!streak) return null;

  return (
    <div className="streak-box" aria-label="Streak Counter">
      <div className="streak-count-col">
        <span className="flame-icon">🔥</span>
        <div>
          <div className="streak-num">{streak.count} DAY STREAK</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#718096' }}>
            {streak.count > 0 ? 'Run active! Keep completing quests daily.' : 'No active run. Complete a quest today!'}
          </div>
        </div>
      </div>

      <div className="streak-matrix" title="Past 9 days activity history">
        {streak.history?.map((tile, i) => (
          <div
            key={tile.date || i}
            className={`streak-tile ${tile.active ? 'active' : ''}`}
            title={`${tile.date}: ${tile.active ? 'Completed' : 'Missed'}`}
          >
            {tile.active ? '✓' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}