import { useState } from 'react';
import { getTargets, saveTargets, SALESPERSONS } from '../utils/storage';
import { X, Target } from 'lucide-react';
import './TargetSettings.css';

export default function TargetSettings({ onClose, onSaved }) {
  const [targets, setTargets] = useState(() => getTargets());

  const setTeam = (val) =>
    setTargets(prev => ({ ...prev, team: Number(val) || 0 }));

  const setIndividual = (name, val) =>
    setTargets(prev => ({
      ...prev,
      individual: { ...prev.individual, [name]: Number(val) || 0 },
    }));

  const handleSave = () => {
    saveTargets(targets);
    onSaved(targets);
    onClose();
  };

  const teamMembers = SALESPERSONS.filter(n => n !== 'Other');

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content target-modal">
        <div className="modal-header">
          <h2><Target size={18} /> Monthly Targets</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="target-form">
          <div className="target-section">
            <h3>Team Target</h3>
            <p className="target-hint">Total revenue goal for the whole team this month</p>
            <div className="target-input-row">
              <span className="target-currency">Rs</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={targets.team || ''}
                onChange={(e) => setTeam(e.target.value)}
              />
            </div>
          </div>

          <div className="target-section">
            <h3>Individual Targets</h3>
            <p className="target-hint">Per-person revenue goal — shown as a red line on the chart</p>
            <div className="individual-targets">
              {teamMembers.map(name => (
                <div key={name} className="individual-row">
                  <span className="individual-name">{name}</span>
                  <div className="target-input-row">
                    <span className="target-currency">Rs</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={targets.individual?.[name] || ''}
                      onChange={(e) => setIndividual(name, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={handleSave}>Save Targets</button>
        </div>
      </div>
    </div>
  );
}
