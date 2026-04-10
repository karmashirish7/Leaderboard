import { SALESPERSONS, SUBSCRIPTION_TYPES, SUBSCRIPTION_POINTS } from './storage';

export const calculateLeaderboard = (transactions, filter = 'month') => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const filtered = filter === 'month'
    ? transactions.filter(t => new Date(t.date) >= startOfMonth)
    : transactions;

  const stats = {};
  
  SALESPERSONS.forEach(name => {
    stats[name] = {
      name,
      totalSales: 0,
      totalPaid: 0,
      totalRemaining: 0,
      subscriptions: {},
      totalPoints: 0,
      transactionCount: 0,
      todaySales: 0,
      closingEfficiency: 0,
    };
    SUBSCRIPTION_TYPES.forEach(type => {
      stats[name].subscriptions[type] = 0;
    });
  });

  const todayStr = now.toISOString().split('T')[0];

  filtered.forEach(t => {
    const person = stats[t.salesperson];
    if (!person) return;
    
    person.totalSales += Number(t.totalAmount) || 0;
    person.totalPaid += Number(t.paidAmount) || 0;
    person.totalRemaining += Number(t.remainingAmount) || 0;
    person.transactionCount += 1;
    
    if (t.subscriptionType && SUBSCRIPTION_TYPES.includes(t.subscriptionType)) {
      person.subscriptions[t.subscriptionType] += 1;
      person.totalPoints += SUBSCRIPTION_POINTS[t.subscriptionType] || 0;
    }

    if (t.date === todayStr) {
      person.todaySales += Number(t.paidAmount) || 0;
    }
  });

  // Calculate closing efficiency
  Object.values(stats).forEach(person => {
    person.closingEfficiency = person.totalSales > 0
      ? Math.round((person.totalPaid / person.totalSales) * 100)
      : 0;
  });

  return stats;
};

export const rankLeaderboard = (stats, mode = 'revenue') => {
  const teamMembers = Object.values(stats).filter(s => s.name !== 'Other');
  const other = stats['Other'];
  
  if (mode === 'points') {
    teamMembers.sort((a, b) => b.totalPoints - a.totalPoints || b.totalPaid - a.totalPaid);
  } else {
    teamMembers.sort((a, b) => b.totalPaid - a.totalPaid || b.totalSales - a.totalSales);
  }
  
  teamMembers.forEach((member, i) => {
    member.rank = i + 1;
  });
  
  if (other) {
    other.rank = null; // Not ranked
  }
  
  return { ranked: teamMembers, other };
};

export const getAnalytics = (transactions, filter = 'month') => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const filtered = filter === 'month'
    ? transactions.filter(t => new Date(t.date) >= startOfMonth)
    : transactions;
  
  const totalRevenue = filtered.reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0);
  const totalOutstanding = filtered.reduce((sum, t) => sum + (Number(t.remainingAmount) || 0), 0);
  const totalSales = filtered.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  
  const subscriptionBreakdown = {};
  SUBSCRIPTION_TYPES.forEach(type => {
    subscriptionBreakdown[type] = filtered.filter(t => t.subscriptionType === type).length;
  });
  
  const salesByPerson = {};
  SALESPERSONS.forEach(name => {
    salesByPerson[name] = filtered
      .filter(t => t.salesperson === name)
      .reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0);
  });

  return {
    totalRevenue,
    totalOutstanding,
    totalSales,
    subscriptionBreakdown,
    salesByPerson,
    transactionCount: filtered.length,
  };
};
