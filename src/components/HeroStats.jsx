import { useMemo } from 'react';
import { getAnalytics } from '../utils/leaderboard';
import { SALESPERSONS, SUBSCRIPTION_TYPES, SUBSCRIPTION_POINTS } from '../utils/storage';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Target, Zap } from 'lucide-react';
import './HeroStats.css';

// Custom dot that draws a dashed red target line across the bar width
const TargetDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.target || payload.Paid >= payload.target) return null;
  const halfWidth = 40;
  const label = payload.target >= 1000
    ? `${(payload.target / 1000).toFixed(0)}k`
    : payload.target;
  return (
    <g>
      <line
        x1={cx - halfWidth} x2={cx + halfWidth}
        y1={cy} y2={cy}
        stroke="#ff6b6b" strokeWidth={2} strokeDasharray="6 3"
      />
      <text x={cx + halfWidth + 4} y={cy + 4} fill="#ff6b6b" fontSize={10} fontWeight={600}>
        {label}
      </text>
    </g>
  );
};

const PERSON_COLORS = {
  Nischal: '#6c5ce7',
  Prashuv: '#00cec9',
  Samiksha: '#fd79a8',
  Luniva: '#fdcb6e',
  Other: '#636e72',
};

const PIE_COLORS = ['#74b9ff', '#a29bfe', '#00cec9', '#ffd700'];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const entry = payload[0]?.payload;
    const target = entry?.target || 0;
    const paid = entry?.Paid || 0;
    const pct = target > 0 ? Math.round((paid / target) * 100) : null;
    return (
      <div className="hero-tooltip">
        <p className="hero-tooltip-label">{label}</p>
        {payload.filter(p => p.name !== 'target').map((p, i) => (
          <p key={i} className="hero-tooltip-value" style={{ color: p.fill || p.color }}>
            {p.name}: Rs {Number(p.value).toLocaleString()}
          </p>
        ))}
        {target > 0 && (
          <p className="hero-tooltip-target">
            🎯 Rs {paid.toLocaleString()} / Rs {target.toLocaleString()} ({pct}%)
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="hero-tooltip">
        <p className="hero-tooltip-label">{payload[0].name}</p>
        <p className="hero-tooltip-value">{payload[0].value} subscriptions</p>
        <p className="hero-tooltip-pts">{SUBSCRIPTION_POINTS[payload[0].name] || 0} pts each</p>
      </div>
    );
  }
  return null;
};

export default function HeroStats({ transactions, targets }) {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const { analytics, barData, pieData, dailyData, monthTotal, lastMonthTotal, growthPercent } = useMemo(() => {
    const an = getAnalytics(transactions, 'month');

    
    // Bar data: revenue comparison per salesperson (paid vs remaining)
    const bd = SALESPERSONS
      .filter(name => name !== 'Other')
      .map(name => {
        const personTx = transactions.filter(t => {
          const txDate = new Date(t.date);
          const now = new Date();
          return t.salesperson === name &&
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear();
        });
        const paid = personTx.reduce((s, t) => s + (Number(t.paidAmount) || 0), 0);
        const remaining = personTx.reduce((s, t) => s + (Number(t.remainingAmount) || 0), 0);
        return {
          name,
          Paid: paid,
          Remaining: remaining,
          fill: PERSON_COLORS[name],
          target: targets?.individual?.[name] || 0,
        };
      });

    // Pie data: subscription breakdown
    const pd = SUBSCRIPTION_TYPES
      .map((type, i) => ({
        name: type,
        value: an.subscriptionBreakdown[type],
        color: PIE_COLORS[i],
      }))
      .filter(d => d.value > 0);

    // Daily trend data for area chart
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dd = [];
    for (let d = 1; d <= Math.min(now.getDate(), daysInMonth); d++) {
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTx = transactions.filter(t => t.date === dateStr);
      const dayRevenue = dayTx.reduce((s, t) => s + (Number(t.paidAmount) || 0), 0);
      dd.push({
        day: `${d}`,
        revenue: dayRevenue,
      });
    }

    // Last month comparison
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= lastMonth && d <= lastMonthEnd;
    });
    const lmTotal = lastMonthTx.reduce((s, t) => s + (Number(t.paidAmount) || 0), 0);
    const growth = lmTotal > 0 ? Math.round(((an.totalRevenue - lmTotal) / lmTotal) * 100) : (an.totalRevenue > 0 ? 100 : 0);

    return {
      analytics: an,
      barData: bd,
      pieData: pd,
      dailyData: dd,
      monthTotal: an.totalRevenue,
      lastMonthTotal: lmTotal,
      growthPercent: growth,
    };
  }, [transactions, targets]);

  const collectionRate = analytics.totalSales > 0
    ? Math.round((analytics.totalRevenue / analytics.totalSales) * 100) : 0;

  const teamTarget = targets?.team || 0;
  const teamAchievedPct = teamTarget > 0 ? Math.min(Math.round((monthTotal / teamTarget) * 100), 100) : null;
  const teamOverPct = teamTarget > 0 && monthTotal > teamTarget
    ? Math.round(((monthTotal - teamTarget) / teamTarget) * 100) : 0;

  return (
    <section className="hero-stats" id="hero-stats">
      {/* Big Revenue Banner */}
      <div className="revenue-banner">
        <div className="revenue-banner-bg">
          <div className="banner-orb banner-orb-1"></div>
          <div className="banner-orb banner-orb-2"></div>
        </div>
        
        <div className="revenue-banner-content">
          <div className="revenue-main">
            <span className="revenue-label">Total Revenue in</span>
            <span className="revenue-month">{currentMonth}</span>
            <div className="revenue-amount">
              <span className="currency">Rs</span>
              {teamTarget > 0 ? (
                <span className="amount">
                  {monthTotal.toLocaleString()}
                  <span className="amount-target"> / {teamTarget.toLocaleString()}</span>
                </span>
              ) : (
                <span className="amount">{monthTotal.toLocaleString()}</span>
              )}
            </div>

            {teamTarget > 0 && (
              <div className="team-target-pct-display">
                <span className={monthTotal >= teamTarget ? 'achieved' : ''}>
                  {teamAchievedPct}% achieved
                  {monthTotal >= teamTarget && teamOverPct > 0 && ` (+${teamOverPct}% over)`}
                </span>
              </div>
            )}

            {growthPercent !== 0 && (
              <div className={`growth-badge ${growthPercent >= 0 ? 'positive' : 'negative'}`}>
                {growthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(growthPercent)}% vs last month
              </div>
            )}

            {teamTarget > 0 && (
              <div className="team-target-block">
                <div className="team-target-bar">
                  <div
                    className={`team-target-fill ${monthTotal >= teamTarget ? 'achieved' : ''}`}
                    style={{ width: `${Math.min((monthTotal / teamTarget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="revenue-kpis">
            <div className="kpi-card">
              <div className="kpi-icon green"><DollarSign size={18} /></div>
              <div>
                <span className="kpi-value">Rs {analytics.totalSales.toLocaleString()}</span>
                <span className="kpi-label">Total Sales</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon red"><AlertCircle size={18} /></div>
              <div>
                <span className="kpi-value">Rs {analytics.totalOutstanding.toLocaleString()}</span>
                <span className="kpi-label">Outstanding</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon blue"><Target size={18} /></div>
              <div>
                <span className="kpi-value">{collectionRate}%</span>
                <span className="kpi-label">Collection Rate</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon yellow"><Zap size={18} /></div>
              <div>
                <span className="kpi-value">{analytics.transactionCount}</span>
                <span className="kpi-label">Transactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="hero-charts-grid">
        {/* Revenue Comparison Bar Chart */}
        <div className="hero-chart-card">
          <h3>💰 Revenue by Salesperson</h3>
          <p className="chart-subtitle">Stacked: Paid + Outstanding</p>
          {barData.some(d => d.Paid > 0 || d.Remaining > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={barData} margin={{ top: 10, right: 36, left: -10, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
                  )}
                />
                <Bar dataKey="Paid" stackId="revenue" fill="#55efc4" name="Paid" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Remaining" stackId="revenue" fill="#ff6b6b" name="Remaining" radius={[6, 6, 0, 0]} />
                <Line
                  dataKey="target"
                  stroke="transparent"
                  dot={<TargetDot />}
                  activeDot={false}
                  legendType="none"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>Add transactions to see the comparison chart</p>
            </div>
          )}
        </div>

        {/* Subscription Pie Chart */}
        <div className="hero-chart-card">
          <h3>📊 Subscription Breakdown</h3>
          <p className="chart-subtitle">Distribution by plan type</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => (
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>Add transactions to see subscription breakdown</p>
            </div>
          )}
        </div>

        {/* Daily Revenue Trend */}
        <div className="hero-chart-card wide">
          <h3>📈 Daily Revenue Trend</h3>
          <p className="chart-subtitle">Day-by-day revenue flow this month</p>
          {dailyData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(dailyData.length / 10) - 1)}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6c5ce7"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>Revenue trend will appear as transactions are added</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
