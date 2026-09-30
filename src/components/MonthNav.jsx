import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MonthNav.css';

// value: { year, month } for a specific month, or null for "All time" (only when allowAll)
export default function MonthNav({ value, onChange, allowAll = false }) {
  const now = new Date();
  const current = value || { year: now.getFullYear(), month: now.getMonth() };
  const isCurrentMonth = current.year === now.getFullYear() && current.month === now.getMonth();

  const goToPrev = () => {
    const { year, month } = current;
    onChange(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  };

  const goToNext = () => {
    if (isCurrentMonth) return;
    const { year, month } = current;
    onChange(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  };

  const label = value
    ? new Date(value.year, value.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'All Time';

  return (
    <div className="month-nav">
      <button className="month-nav-btn" onClick={goToPrev} aria-label="Previous month">
        <ChevronLeft size={16} />
      </button>
      <span className="month-nav-label">{label}</span>
      <button
        className="month-nav-btn"
        onClick={goToNext}
        disabled={isCurrentMonth}
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
      {allowAll && (
        <button
          className={`month-nav-all ${value ? '' : 'active'}`}
          onClick={() => onChange(value ? null : { year: now.getFullYear(), month: now.getMonth() })}
        >
          {value ? 'All' : 'This Month'}
        </button>
      )}
    </div>
  );
}
