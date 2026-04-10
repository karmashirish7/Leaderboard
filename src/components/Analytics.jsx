import { useMemo } from 'react';
import { getAnalytics } from '../utils/leaderboard';
import { SUBSCRIPTION_TYPES, SALESPERSONS } from '../utils/storage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, AlertCircle, ShoppingBag, TrendingUp } from 'lucide-react';
import './Analytics.css';

const PIE_COLORS = ['#74b9ff', '#a29bfe', '#00cec9', '#ffd700'];
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

export default function Analytics({ transactions, filter = 'month' }) {
  const analytics = useMemo(() => getAnalytics(transactions, filter), [transactions, filter]);

  const pieData = SUBSCRIPTION_TYPES
    .map((type, i) => ({
      name: type,
      value: analytics.subscriptionBreakdown[type],
      color: PIE_COLORS[i],
    }))
    .filter(d => d.value > 0);

  const barData = SALESPERSONS
    .filter(name => name !== 'Other')
    .map((name, i) => ({
      name,
      revenue: analytics.salesByPerson[name] || 0,
      fill: BAR_COLORS[i],
    }));

  const collectionRate = analytics.totalSales > 0
    ? Math.round((analytics.totalRevenue / analytics.totalSales) * 100)
    : 0;

  return (
    <section className="analytics-section" id="analytics">
      <h2>📈 Analytics Overview</h2>
      
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">
            <DollarSign size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">Rs {analytics.totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="metric-card outstanding">
          <div className="metric-icon">
            <AlertCircle size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Outstanding</span>
            <span className="metric-value">Rs {analytics.totalOutstanding.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="metric-card transactions-metric">
          <div className="metric-icon">
            <ShoppingBag size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Transactions</span>
            <span className="metric-value">{analytics.transactionCount}</span>
          </div>
        </div>
        
        <div className="metric-card efficiency-metric">
          <div className="metric-icon">
            <TrendingUp size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Collection Rate</span>
            <span className="metric-value">{collectionRate}%</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {barData.some(d => d.revenue > 0) && (
          <div className="chart-card">
            <h3>Revenue by Salesperson</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 14 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={110}
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
                  formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
