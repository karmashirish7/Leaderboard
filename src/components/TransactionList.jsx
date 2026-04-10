import { useState, useMemo, useRef } from 'react';
import { SALESPERSONS, SUBSCRIPTION_TYPES, bulkInsertTransactions } from '../utils/storage';
import { Search, Filter, Trash2, Pencil, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import './TransactionList.css';

export default function TransactionList({ transactions, onDelete, onEdit, onImported }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [importStatus, setImportStatus] = useState(null); // { type: 'success'|'error', message }
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    let result = [...transactions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.storeName.toLowerCase().includes(term) ||
        t.salesperson.toLowerCase().includes(term)
      );
    }
    
    if (filterPerson) result = result.filter(t => t.salesperson === filterPerson);
    if (filterType) result = result.filter(t => t.subscriptionType === filterType);
    if (dateFrom) result = result.filter(t => t.date >= dateFrom);
    if (dateTo) result = result.filter(t => t.date <= dateTo);

    result.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'date': valA = a.date; valB = b.date; break;
        case 'salesperson': valA = a.salesperson; valB = b.salesperson; break;
        case 'totalAmount': valA = a.totalAmount; valB = b.totalAmount; break;
        case 'paidAmount': valA = a.paidAmount; valB = b.paidAmount; break;
        default: valA = a.date; valB = b.date;
      }
      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [transactions, searchTerm, filterPerson, filterType, dateFrom, dateTo, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPerson('');
    setFilterType('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || filterPerson || filterType || dateFrom || dateTo;

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    // Parse a single CSV line respecting quoted fields
    const parseLine = (line) => {
      const fields = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          fields.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      fields.push(cur.trim());
      return fields;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s*\(rs\)/g, '').trim());
    const col = (row, name) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? row[idx] : '';
    };

    return lines.slice(1).map(line => {
      const row = parseLine(line);
      const totalAmount  = Number(col(row, 'total'))  || 0;
      const paidAmount   = Number(col(row, 'paid'))   || 0;
      const remaining    = Number(col(row, 'remaining')) || Math.max(0, totalAmount - paidAmount);
      return {
        date:                 col(row, 'date'),
        salesperson:          col(row, 'salesperson'),
        storeName:            col(row, 'store'),
        subscriptionType:     col(row, 'plan'),
        subscriptionDuration: col(row, 'duration'),
        totalAmount,
        paidAmount,
        remainingAmount: remaining,
      };
    }).filter(t => t.date && t.salesperson && t.storeName);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setImportStatus({ type: 'error', message: 'No valid rows found in CSV.' });
        return;
      }
      await bulkInsertTransactions(rows);
      setImportStatus({ type: 'success', message: `Imported ${rows.length} transaction${rows.length > 1 ? 's' : ''}.` });
      if (onImported) onImported();
    } catch (err) {
      setImportStatus({ type: 'error', message: err.message || 'Import failed.' });
    } finally {
      setImporting(false);
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Salesperson', 'Store', 'Plan', 'Duration', 'Total (Rs)', 'Paid (Rs)', 'Remaining (Rs)'];
    const rows = filtered.map(t => [
      t.date,
      t.salesperson,
      `"${t.storeName.replace(/"/g, '""')}"`,
      t.subscriptionType,
      t.subscriptionDuration || '',
      t.totalAmount,
      t.paidAmount,
      t.remainingAmount,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="transactions-section" id="transactions">
      <div className="transactions-header">
        <h2>Transaction History</h2>
        <div className="transactions-header-right">
          <span className="tx-count">{filtered.length} transactions</span>
          <button
            className={`import-btn ${importing ? 'loading' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            title="Import CSV"
          >
            <Upload size={15} />
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          {filtered.length > 0 && (
            <button className="export-btn" onClick={exportToCSV} title="Export to CSV">
              <Download size={15} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {importStatus && (
        <div className={`import-status ${importStatus.type}`}>
          {importStatus.message}
        </div>
      )}

      <div className="transactions-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by store or salesperson..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && <span className="filter-dot"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Salesperson</label>
              <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
                <option value="">All</option>
                {SALESPERSONS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Subscription</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All</option>
                {SUBSCRIPTION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearFilters}>Clear all filters</button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="no-transactions">
          <p>{transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('date')} className="sortable">
                  Date <SortIcon field="date" />
                </th>
                <th onClick={() => toggleSort('salesperson')} className="sortable">
                  Salesperson <SortIcon field="salesperson" />
                </th>
                <th>Store</th>
                <th>Plan</th>
                <th>Duration</th>
                <th onClick={() => toggleSort('totalAmount')} className="sortable">
                  Total <SortIcon field="totalAmount" />
                </th>
                <th onClick={() => toggleSort('paidAmount')} className="sortable">
                  Paid <SortIcon field="paidAmount" />
                </th>
                <th>Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="td-date" data-label="Date">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td data-label="Salesperson">
                    <span className="person-tag">{t.salesperson}</span>
                  </td>
                  <td className="td-store" data-label="Store">{t.storeName}</td>
                  <td data-label="Plan">
                    <span className={`type-tag ${t.subscriptionType.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.subscriptionType}
                    </span>
                  </td>
                  <td data-label="Duration">
                    {t.subscriptionDuration ? (
                      <span className="duration-tag">{t.subscriptionDuration}</span>
                    ) : (
                      <span className="td-empty">—</span>
                    )}
                  </td>
                  <td className="td-amount" data-label="Total">Rs {Number(t.totalAmount).toLocaleString()}</td>
                  <td className="td-amount td-paid" data-label="Paid">Rs {Number(t.paidAmount).toLocaleString()}</td>
                  <td className={`td-amount ${Number(t.remainingAmount) > 0 ? 'td-remaining' : ''}`} data-label="Remaining">
                    Rs {Number(t.remainingAmount).toLocaleString()}
                  </td>
                  <td data-label="Actions">
                    <div className="action-btns">
                      <button
                        className="edit-btn"
                        onClick={() => onEdit(t)}
                        title="Edit transaction"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => onDelete(t.id)}
                        title="Delete transaction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
