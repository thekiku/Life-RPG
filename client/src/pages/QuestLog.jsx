import React, { useState, useEffect } from 'react';
import StreakWidget from '../components/StreakWidget.jsx';
import QuestModal from '../components/QuestModal.jsx';
import { sound } from '../audio.js';

export default function QuestLog({ stats, onRefreshStats, onLevelUp }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('active'); // active, done, all

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (taskId) => {
    sound.playClick();
    try {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.newStatus === 'done' || data.task.status === 'done') {
          sound.playComplete();
        }
        if (data.leveledUp) {
          onLevelUp(data.character.level);
        }
        fetchTasks();
        onRefreshStats();
      }
    } catch (err) {
      sound.playError();
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Abandon this quest?')) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
        onRefreshStats();
      }
    } catch (err) {
      sound.playError();
    }
  };

  const handleSaveQuest = async (questData) => {
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData),
      });

      if (res.ok) {
        setModalOpen(false);
        setEditingTask(null);
        fetchTasks();
        onRefreshStats();
      }
    } catch (err) {
      sound.playError();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return t.status === 'active';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  return (
    <div className="quest-section">
      <StreakWidget streak={stats?.streak} />

      <div className="quest-header-row">
        <h2 className="section-title">
          <span>📜</span> QUEST BOARD
        </h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="active">Active Quests</option>
            <option value="done">Completed Log</option>
            <option value="all">All Quests</option>
          </select>

          <button
            className="btn-primary"
            onClick={() => {
              sound.playClick();
              setEditingTask(null);
              setModalOpen(true);
            }}
          >
            + NEW QUEST
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-text">Loading quest log...</div></div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <div className="empty-text">
            {filter === 'done' ? 'No completed quests logged yet.' : 'No active quests! Create one above.'}
          </div>
        </div>
      ) : (
        <div className="quest-list">
          {filteredTasks.map((t) => (
            <div key={t.id} className={`quest-card ${t.status === 'done' ? 'done' : ''}`}>
              <button
                className="quest-checkbox"
                onClick={() => handleToggle(t.id)}
                title={t.status === 'done' ? 'Mark uncompleted' : 'Complete quest'}
              >
                {t.status === 'done' ? '✓' : ''}
              </button>

              <div className="quest-info">
                <div className="quest-title-row">
                  <span className="quest-title">{t.title}</span>
                  <span className={`attr-tag attr-${t.attr}`}>{t.attr}</span>
                  {t.priority === 'epic' && <span style={{ color: 'var(--accent-rose)', fontFamily: 'var(--font-pixel)', fontSize: '0.55rem' }}>EPIC</span>}
                </div>
                {t.description && <div className="quest-desc">{t.description}</div>}
              </div>

              <div className="quest-reward-tag">+{t.reward} XP</div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn-icon"
                  style={{ padding: '4px 8px' }}
                  onClick={() => {
                    sound.playClick();
                    setEditingTask(t);
                    setModalOpen(true);
                  }}
                  title="Edit Quest"
                >
                  ✎
                </button>
                <button
                  className="btn-icon"
                  style={{ padding: '4px 8px', background: 'var(--accent-rose)' }}
                  onClick={() => handleDelete(t.id)}
                  title="Delete Quest"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveQuest}
        initialData={editingTask}
      />
    </div>
  );
}