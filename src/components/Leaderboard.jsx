import { useState, useMemo } from 'react';
import { calculateLeaderboard, rankLeaderboard } from '../utils/leaderboard';
import { SUBSCRIPTION_TYPES } from '../utils/storage';
import { Trophy, Medal, Award, TrendingUp, Star, Zap } from 'lucide-react';
import './Leaderboard.css';

const RANK_ICONS = {
  1: <Trophy size={24} />,
  2: <Medal size={24} />,
  3: <Award size={24} />,
};

const RANK_COLORS = {
  1: 'gold',
  2: 'silver',
  3: 'bronze',
};

export default function Leaderboard({ transactions, targets }) {
  const [filter, setFilter] = useState('month');
  const [rankMode, setRankMode] = useState('revenue');

  const { ranked, other } = useMemo(() => {
    const stats = calculateLeaderboard(transactions, filter);
    return rankLeaderboard(stats, rankMode);
  }, [transactions, filter, rankMode]);

  const hasData = ranked.some(m => m.transactionCount > 0);

  return (
    <section className="leaderboard-section" id="leaderboard">
      <div className="leaderboard-header">
        <div className="leaderboard-title-group">
          <h2>
            <TrendingUp size={24} />
            Sales Leaderboard
          </h2>
          <p className="leaderboard-subtitle">
            {filter === 'month' ? "This month's" : 'All time'} performance rankings
          </p>
        </div>
        <div className="leaderboard-controls">
          <div className="toggle-group">
            <button
              className={`toggle-btn ${filter === 'month' ? 'active' : ''}`}
              onClick={() => setFilter('month')}
            >
              This Month
            </button>
            <button
              className={`toggle-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Time
            </button>
          </div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${rankMode === 'revenue' ? 'active' : ''}`}
              onClick={() => setRankMode('revenue')}
              title="Rank by revenue"
            >
              💰 Revenue
            </button>
            <button
              className={`toggle-btn ${rankMode === 'points' ? 'active' : ''}`}
              onClick={() => setRankMode('points')}
              title="Rank by weighted points"
            >
              ⭐ Points
            </button>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="leaderboard-empty">
          <Star size={48} />
          <p>No transactions yet. Add your first sale to see the leaderboard!</p>
        </div>
      ) : (
        <div className="leaderboard-grid">
          {ranked.map((person, idx) => (
            <div
              key={person.name}
              className={`leaderboard-card ${RANK_COLORS[person.rank] || ''} ${person.transactionCount === 0 ? 'inactive' : ''}`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="card-rank">
                {RANK_ICONS[person.rank] || <span className="rank-number">#{person.rank}</span>}
              </div>
              
              <div className="card-header">
                <h3>{person.name}</h3>
                {person.todaySales > 0 && (
                  <span className="today-badge">
                    <Zap size={12} /> Today: Rs {person.todaySales.toLocaleString()}
                  </span>
                )}
              </div>

              {(() => {
                const personalTarget = targets?.individual?.[person.name] || 0;
                if (!personalTarget) return null;
                const pct = Math.round((person.totalPaid / personalTarget) * 100);
                const achieved = person.totalPaid >= personalTarget;
                return (
                  <div className="card-target">
                    <div className="card-target-row">
                      <span className="card-target-numbers">
                        Rs {person.totalPaid.toLocaleString()}
                        <span className="card-target-max"> / {personalTarget.toLocaleString()}</span>
                      </span>
                      <span className={`card-target-pct ${achieved ? 'achieved' : ''}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="card-target-bar">
                      <div
                        className={`card-target-fill ${achieved ? 'achieved' : ''}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="card-stats">
                <div className="stat primary">
                  <span className="stat-label">Paid</span>
                  <span className="stat-value">Rs {person.totalPaid.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Sales</span>
                  <span className="stat-value">Rs {person.totalSales.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Remaining</span>
                  <span className="stat-value remaining">Rs {person.totalRemaining.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Efficiency</span>
                  <span className={`stat-value efficiency ${person.closingEfficiency >= 80 ? 'high' : person.closingEfficiency >= 50 ? 'medium' : 'low'}`}>
                    {person.closingEfficiency}%
                  </span>
                </div>
              </div>

              <div className="card-subscriptions">
                {SUBSCRIPTION_TYPES.map(type => (
                  <span key={type} className={`sub-badge ${type.toLowerCase().replace(/\s+/g, '-')}`}>
                    {type}: {person.subscriptions[type]}
                  </span>
                ))}
              </div>

              {rankMode === 'points' && (
                <div className="card-points">
                  <Star size={14} /> {person.totalPoints} pts
                </div>
              )}

              {person.totalRemaining > 0 && person.totalRemaining > person.totalPaid && (
                <div className="pending-alert">
                  ⚠️ High Outstanding
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {other && other.transactionCount > 0 && (
        <div className="other-section">
          <h4>Other Sales</h4>
          <div className="other-stats">
            <span>Sales: Rs {other.totalSales.toLocaleString()}</span>
            <span>Paid: Rs {other.totalPaid.toLocaleString()}</span>
            <span>Remaining: Rs {other.totalRemaining.toLocaleString()}</span>
            <span>Transactions: {other.transactionCount}</span>
          </div>
        </div>
      )}
    </section>
  );
}
