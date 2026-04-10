import { supabase } from './supabase';

// ── Auth (kept in localStorage — no Supabase Auth needed) ─────────────────────
const AUTH_KEY = 'sales_leaderboard_auth';
const PASSWORD = 'Blanxerisntdead';

export const authenticate = (password) => {
  if (password === PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
};

export const isAuthenticated = () => localStorage.getItem(AUTH_KEY) === 'true';

export const logout = () => localStorage.removeItem(AUTH_KEY);

// ── Row mappers ────────────────────────────────────────────────────────────────
const fromRow = (row) => ({
  id: row.id,
  salesperson: row.salesperson,
  storeName: row.store_name,
  subscriptionType: row.subscription_type,
  subscriptionDuration: row.subscription_duration,
  totalAmount: Number(row.total_amount),
  paidAmount: Number(row.paid_amount),
  remainingAmount: Number(row.remaining_amount),
  date: row.date,
  createdAt: row.created_at,
});

const toRow = (tx) => ({
  ...(tx.id ? { id: tx.id } : {}),
  salesperson: tx.salesperson,
  store_name: tx.storeName,
  subscription_type: tx.subscriptionType,
  subscription_duration: tx.subscriptionDuration || null,
  total_amount: tx.totalAmount,
  paid_amount: tx.paidAmount,
  remaining_amount: tx.remainingAmount,
  date: tx.date,
});

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ── CRUD ───────────────────────────────────────────────────────────────────────
export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
};

export const addTransaction = async (transaction) => {
  const row = toRow({ ...transaction, id: generateId() });
  const { data, error } = await supabase
    .from('transactions')
    .insert([row])
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateTransaction = async (id, updates) => {
  const { data, error } = await supabase
    .from('transactions')
    .update(toRow(updates))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const bulkInsertTransactions = async (transactions) => {
  const rows = transactions.map(tx => toRow({ ...tx, id: generateId() }));
  const { error } = await supabase.from('transactions').insert(rows);
  if (error) throw error;
};

// ── Targets (localStorage) ────────────────────────────────────────────────────
const TARGETS_KEY = 'sales_leaderboard_targets';

const DEFAULT_TARGETS = {
  team: 0,
  individual: {
    Nischal: 0,
    Prashuv: 0,
    Samiksha: 0,
    Luniva: 0,
  },
};

export const getTargets = () => {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    return raw ? { ...DEFAULT_TARGETS, ...JSON.parse(raw) } : { ...DEFAULT_TARGETS };
  } catch {
    return { ...DEFAULT_TARGETS };
  }
};

export const saveTargets = (targets) => {
  localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
};

// ── Constants ──────────────────────────────────────────────────────────────────
export const SALESPERSONS = ['Nischal', 'Prashuv', 'Samiksha', 'Luniva', 'Other'];
export const SUBSCRIPTION_TYPES = ['Basic', 'Premium', 'Business Plus', 'Platinum'];
export const SUBSCRIPTION_POINTS = {
  'Basic': 1,
  'Premium': 3,
  'Business Plus': 5,
  'Platinum': 8,
};
export const SUBSCRIPTION_DURATIONS = ['Monthly', 'Quarterly', 'Semi Annually', 'Yearly'];
