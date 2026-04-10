import { supabase } from './supabase';
import { bulkInsertTransactions } from './storage';

const SEED_DATA = [
  { storeName: 'Behuli Collection',      salesperson: 'Prashuv',  subscriptionType: 'Business Plus', subscriptionDuration: 'Yearly', totalAmount: 34200, paidAmount: 34200, remainingAmount: 0,     date: '2026-04-07' },
  { storeName: 'Wish Party Studio',      salesperson: 'Samiksha', subscriptionType: 'Platinum',      subscriptionDuration: 'Yearly', totalAmount: 48000, paidAmount: 48000, remainingAmount: 0,     date: '2026-04-06' },
  { storeName: 'Motorev Nepal',          salesperson: 'Other',    subscriptionType: 'Basic',         subscriptionDuration: 'Yearly', totalAmount: 12000, paidAmount: 12000, remainingAmount: 0,     date: '2026-04-06' },
  { storeName: 'HISI',                   salesperson: 'Prashuv',  subscriptionType: 'Platinum',      subscriptionDuration: 'Yearly', totalAmount: 48000, paidAmount: 30000, remainingAmount: 18000, date: '2026-04-06' },
  { storeName: 'Calido Wears',           salesperson: 'Prashuv',  subscriptionType: 'Platinum',      subscriptionDuration: 'Yearly', totalAmount: 36000, paidAmount: 36000, remainingAmount: 0,     date: '2026-04-06' },
  { storeName: 'Dhoka Samma',            salesperson: 'Other',    subscriptionType: 'Basic',         subscriptionDuration: 'Yearly', totalAmount: 12000, paidAmount: 12000, remainingAmount: 0,     date: '2026-04-06' },
  { storeName: 'Imperial Beauty',        salesperson: 'Prashuv',  subscriptionType: 'Business Plus', subscriptionDuration: 'Yearly', totalAmount: 27000, paidAmount: 27000, remainingAmount: 0,     date: '2026-04-06' },
  { storeName: 'Mandala Crafts',         salesperson: 'Prashuv',  subscriptionType: 'Platinum',      subscriptionDuration: 'Yearly', totalAmount: 36000, paidAmount: 36000, remainingAmount: 0,     date: '2026-04-05' },
  { storeName: 'SECURA NEPAL',           salesperson: 'Luniva',   subscriptionType: 'Basic',         subscriptionDuration: 'Yearly', totalAmount: 12000, paidAmount: 12000, remainingAmount: 0,     date: '2026-04-03' },
  { storeName: 'Oju Store',              salesperson: 'Luniva',   subscriptionType: 'Basic',         subscriptionDuration: 'Yearly', totalAmount: 18000, paidAmount: 18000, remainingAmount: 0,     date: '2026-04-03' },
  { storeName: 'Retro Collection',       salesperson: 'Other',    subscriptionType: 'Basic',         subscriptionDuration: 'Yearly', totalAmount: 12000, paidAmount: 12000, remainingAmount: 0,     date: '2026-04-03' },
  { storeName: 'K-Beauty Bliss',         salesperson: 'Prashuv',  subscriptionType: 'Platinum',      subscriptionDuration: 'Yearly', totalAmount: 43200, paidAmount: 43200, remainingAmount: 0,     date: '2026-04-03' },
  { storeName: 'Salon Essential Nepal',  salesperson: 'Samiksha', subscriptionType: 'Basic',         subscriptionDuration: 'Yearly', totalAmount: 12000, paidAmount: 12000, remainingAmount: 0,     date: '2026-04-03' },
  { storeName: 'Shots Nepal',            salesperson: 'Prashuv',  subscriptionType: 'Premium',       subscriptionDuration: 'Yearly', totalAmount: 28000, paidAmount: 28000, remainingAmount: 0,     date: '2026-04-03' },
  { storeName: 'Glow Getter',            salesperson: 'Other',    subscriptionType: 'Business Plus', subscriptionDuration: 'Yearly', totalAmount: 34000, paidAmount: 34000, remainingAmount: 0,     date: '2026-04-02' },
  { storeName: 'BOINYCO',               salesperson: 'Nischal',  subscriptionType: 'Platinum',      subscriptionDuration: 'Yearly', totalAmount: 45000, paidAmount: 45000, remainingAmount: 0,     date: '2026-04-01' },
  { storeName: 'National Online Market', salesperson: 'Other',    subscriptionType: 'Basic',         subscriptionDuration: 'Yearly', totalAmount: 12500, paidAmount: 12500, remainingAmount: 0,     date: '2026-04-01' },
  { storeName: 'Geetanjali Sarees',      salesperson: 'Samiksha', subscriptionType: 'Platinum',      subscriptionDuration: 'Yearly', totalAmount: 48000, paidAmount: 48000, remainingAmount: 0,     date: '2026-04-01' },
];

export async function seedIfEmpty() {
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Seed check failed:', error.message);
    return false;
  }

  if (count === 0) {
    await bulkInsertTransactions(SEED_DATA);
    console.log(`✅ Seeded ${SEED_DATA.length} transactions`);
    return true;
  }

  return false;
}
