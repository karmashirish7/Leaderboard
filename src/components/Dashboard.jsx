import { useState, useCallback, useEffect } from 'react';
import { getTransactions, deleteTransaction, logout, getTargets, fetchTargets } from '../utils/storage';
import HeroStats from './HeroStats';
import Leaderboard from './Leaderboard';
import Analytics from './Analytics';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import TargetSettings from './TargetSettings';
import { Plus, LogOut, TrendingUp, BarChart3, List, ChevronUp, PieChart, Target } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [targets, setTargets] = useState(() => getTargets());

  const refresh = useCallback(async () => {
    const data = await getTransactions();
    setTransactions(data);
  }, []);

  useEffect(() => {
    Promise.all([
      getTransactions().then(setTransactions),
      fetchTargets().then(setTargets),
    ]).finally(() => setLoading(false));
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Delete this transaction?')) {
      await deleteTransaction(id);
      refresh();
    }
  }, [refresh]);

  const handleEdit = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  }, []);

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-logo">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1>Sales Leaderboard</h1>
            <p className="header-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="header-right">
          <button className="target-btn" onClick={() => setShowTargets(true)} title="Set Targets">
            <Target size={18} />
            Targets
          </button>
          <button className="add-btn" onClick={handleOpenAdd} id="add-transaction-btn">
            <Plus size={18} />
            Add Transaction
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          className={`nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <List size={16} />
          Transactions
        </button>
        <button
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <PieChart size={16} />
          Analytics
        </button>
      </nav>

      <main className="dashboard-content">
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading data…</p>
          </div>
        ) : (
          <>
            {(activeTab === 'all' || activeTab === 'overview') && (
              <>
                <HeroStats transactions={transactions} targets={targets} />
                <Leaderboard transactions={transactions} targets={targets} />
              </>
            )}

            {(activeTab === 'all' || activeTab === 'transactions') && (
              <TransactionList
                transactions={transactions}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onImported={refresh}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics transactions={transactions} />
            )}
          </>
        )}
      </main>

      {showForm && (
        <TransactionForm
          onClose={handleCloseForm}
          onAdded={refresh}
          editData={editingTransaction}
        />
      )}

      {showTargets && (
        <TargetSettings
          onClose={() => setShowTargets(false)}
          onSaved={(t) => setTargets(t)}
        />
      )}

      <button className="scroll-top" onClick={scrollToTop} aria-label="Scroll to top">
        <ChevronUp size={20} />
      </button>
    </div>
  );
}
