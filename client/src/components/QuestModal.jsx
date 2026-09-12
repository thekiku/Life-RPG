import React, { useState, useEffect } from 'react';
import { sound } from '../audio.js';

export default function QuestModal({ isOpen, onClose, onSave, initialData }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attr, setAttr] = useState('int');
  const [reward, setReward] = useState(25);
  const [priority, setPriority] = useState('normal');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setAttr(initialData.attr || 'int');
      setReward(initialData.reward || 25);
      setPriority(initialData.priority || 'normal');
    } else {
      setTitle('');
      setDescription('');
      setAttr('int');
      setReward(25);
      setPriority('normal');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    sound.playClick();
    onSave({
      title: title.trim(),
      description: description.trim(),
      attr,
      reward: Number(reward),
      priority,
    });
  };

  return (
    <div className="modal-overlay" onClick={() => { sound.playClick(); onClose(); }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{initialData ? 'EDIT QUEST' : 'NEW QUEST'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">QUEST TITLE *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish reading chapter 4"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">DESCRIPTION</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or subgoals..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">ATTRIBUTE TYPE</label>
              <select className="form-select" value={attr} onChange={(e) => setAttr(e.target.value)}>
                <option value="int">INTELLECT (Study/Logic)</option>
                <option value="str">STRENGTH (Fitness/Body)</option>
                <option value="craft">CRAFT (Work/Code)</option>
                <option value="spirit">SPIRIT (Mindfulness/Self)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">PRIORITY</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="normal">NORMAL (+25 XP)</option>
                <option value="high">HIGH (+50 XP)</option>
                <option value="epic">EPIC (+100 XP)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">CUSTOM XP REWARD ({reward} XP)</label>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-icon" onClick={() => { sound.playClick(); onClose(); }}>
              CANCEL
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'SAVE CHANGES' : 'CREATE QUEST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}