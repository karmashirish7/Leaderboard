import { useState, useMemo } from 'react';
import { getAnalytics, getMonthlyTrend, filterByMonth } from '../utils/leaderboard';
import { SUBSCRIPTION_TYPES, SALESPERSONS } from '../utils/storage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import { DollarSign, AlertCircle, ShoppingBag, TrendingUp, X } from 'lucide-react';
import Leaderboard from './Leaderboard';
import TransactionList from './TransactionList';
import MonthNav from './MonthNav';
import './Analytics.css';

const PIE_COLORS = ['#74b9ff', '#a29bfe', '#00cec9', '#ffd700', '#fab1a0', '#e17055', '#ff7675'];
const BAR_COLORS = ['#6c5ce7', '#00cec9', '#fd79a8', '#fdcb6e', '#74b9ff'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">Rs {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const TrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">Rs {payload[0].value.toLocaleString()}</p>
        {payload[1] && (
          <p className="tooltip-label" style={{ marginTop: 2 }}>{payload[1].value} transactions</p>
        )}
      </div>
    );
  }
  return null;
};

function pctChange(current, prev) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

function DrillModal({ title, rows, monthLabel, onClose }) {
  const total = rows.reduce((s, t) => s + (Number(t.remainingAmount) || 0), 0);
  const isOutstanding = title === 'Outstanding';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content drill-modal">
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p className="drill-subtitle">{monthLabel} · {rows.length} transaction{rows.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        {rows.length === 0 ? (
          <p className="drill-empty">No {title.toLowerCase()} for this month.</p>
        ) : (
          <>
            <div className="drill-list">
              {rows.map(t => (
                <div key={t.id} className="drill-row">
                  <div className="drill-row-top">
                    <span className="drill-store">{t.storeName}</span>
                    <span className="drill-date">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="drill-row-bottom">
                    <span className="drill-person">{t.salesperson}</span>
                    <span className={`drill-plan drill-plan--${t.subscriptionType.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.subscriptionType}
                    </span>
                    <div className="drill-amounts">
                      <span className="drill-paid">Paid Rs {Number(t.paidAmount).toLocaleString()}</span>
                      {Number(t.remainingAmount) > 0 && (
                        <span className="drill-remaining">Due Rs {Number(t.remainingAmount).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isOutstanding && (
              <div className="drill-footer">
                <span>Total Outstanding</span>
                <span className="drill-footer-amount">Rs {total.toLocaleString()}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Analytics({ transactions, targets, onDelete, onEdit }) {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const { year, month } = period;
  const [drill, setDrill] = useState(null); // 'outstanding' | 'all' | null

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  const monthTx = useMemo(
    () => filterByMonth(transactions, year, month),
    [transactions, year, month],
  );

  const analytics = useMemo(() => getAnalytics(transactions, year, month), [transactions, year, month]);

  const prevDate = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const prevAnalytics = useMemo(
    () => getAnalytics(transactions, prevDate.year, prevDate.month),
    [transactions, prevDate.year, prevDate.month],
  );

  const trend = useMemo(() => getMonthlyTrend(transactions, 6), [transactions]);

  const pieData = SUBSCRIPTION_TYPES
    .map((type, i) => ({ name: type, value: analytics.subscriptionBreakdown[type], color: PIE_COLORS[i] }))
    .filter(d => d.value > 0);

  const barData = SALESPERSONS
    .filter(name => name !== 'Other')
    .map((name, i) => ({ name, revenue: analytics.salesByPerson[name] || 0, fill: BAR_COLORS[i] }));

  const collectionRate = analytics.totalSales > 0
    ? Math.round((analytics.totalRevenue / analytics.totalSales) * 100)
    : 0;

  const prevCollectionRate = prevAnalytics.totalSales > 0
    ? Math.round((prevAnalytics.totalRevenue / prevAnalytics.totalSales) * 100)
    : 0;

  const revenueDelta = pctChange(analytics.totalRevenue, prevAnalytics.totalRevenue);
  const outstandingDelta = pctChange(analytics.totalOutstanding, prevAnalytics.totalOutstanding);
  const txDelta = pctChange(analytics.transactionCount, prevAnalytics.transactionCount);
  const rateDelta = collectionRate - prevCollectionRate;

  const Delta = ({ value, invert = false }) => {
    if (value === 0) return null;
    const positive = invert ? value < 0 : value > 0;
    return (
      <span className={`metric-delta ${positive ? 'positive' : 'negative'}`}>
        {value > 0 ? '+' : ''}{value}{typeof value === 'number' && !String(value).includes('%') ? '%' : ''}
      </span>
    );
  };

  const hasData = analytics.transactionCount > 0;

  return <>
    <section className="analytics-section" id="analytics">
      <div className="analytics-header">
        <h2>Analytics</h2>
        <MonthNav value={period} onChange={setPeriod} />
      </div>

      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon"><DollarSign size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Revenue Collected</span>
            <span className="metric-value">Rs {analytics.totalRevenue.toLocaleString()}</span>
            <Delta value={revenueDelta} />
          </div>
        </div>

        <div className="metric-card outstanding metric-card--clickable" onClick={() => setDrill('outstanding')} title="View outstanding transactions">
          <div className="metric-icon"><AlertCircle size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Outstanding</span>
            <span className="metric-value">Rs {analytics.totalOutstanding.toLocaleString()}</span>
            <Delta value={outstandingDelta} invert />
          </div>
        </div>

        <div className="metric-card transactions-metric metric-card--clickable" onClick={() => setDrill('all')} title="View all transactions">
          <div className="metric-icon"><ShoppingBag size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Transactions</span>
            <span className="metric-value">{analytics.transactionCount}</span>
            <Delta value={txDelta} />
          </div>
        </div>

        <div className="metric-card efficiency-metric">
          <div className="metric-icon"><TrendingUp size={20} /></div>
          <div className="metric-info">
            <span className="metric-label">Collection Rate</span>
            <span className="metric-value">{collectionRate}%</span>
            <Delta value={rateDelta} />
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="chart-card chart-card--wide">
        <h3>6-Month Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#a29bfe"
              strokeWidth={2.5}
              dot={{ fill: '#a29bfe', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!hasData ? (
        <div className="analytics-empty">No transactions for {monthLabel}</div>
      ) : (
        <div className="charts-grid">
          {barData.some(d => d.revenue > 0) && (
            <div className="chart-card">
              <h3>Revenue by Salesperson</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 13 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {pieData.length > 0 && (
            <div className="chart-card">
              <h3>Subscription Breakdown</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} subscriptions`, name]}
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    formatter={value => (
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </section>

    <Leaderboard transactions={transactions} targets={targets} period={period} />

    <TransactionList
      transactions={monthTx}
      onDelete={onDelete}
      onEdit={onEdit}
      title={`Transactions · ${monthLabel}`}
      allowImport={false}
      emptyText={`No transactions for ${monthLabel}`}
    />

    {drill && (
      <DrillModal
        title={drill === 'outstanding' ? 'Outstanding' : 'All Transactions'}
        rows={drill === 'outstanding' ? monthTx.filter(t => Number(t.remainingAmount) > 0) : monthTx}
        monthLabel={monthLabel}
        onClose={() => setDrill(null)}
      />
    )}
  </>;
}
