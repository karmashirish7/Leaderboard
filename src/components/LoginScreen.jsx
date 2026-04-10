import { useState } from 'react';
import { authenticate } from '../utils/storage';
import { Lock, Eye, EyeOff, TrendingUp } from 'lucide-react';
import './LoginScreen.css';

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (authenticate(password)) {
        onLogin();
      } else {
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="login-screen">
      <div className="login-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <TrendingUp size={32} />
          </div>
          <h1>Sales Leaderboard</h1>
          <p className="login-subtitle">Internal Performance Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter access password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoFocus
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button
            id="login-button"
            type="submit"
            className={`login-btn ${isLoading ? 'loading' : ''}`}
            disabled={!password || isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>🔒 Protected internal tool</p>
        </div>
      </div>
    </div>
  );
}
