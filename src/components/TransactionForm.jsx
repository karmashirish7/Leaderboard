import { useState, useEffect } from 'react';
import { addTransaction, updateTransaction, SALESPERSONS, SUBSCRIPTION_TYPES, SUBSCRIPTION_DURATIONS } from '../utils/storage';
import { X, AlertTriangle, Check } from 'lucide-react';
import './TransactionForm.css';

export default function TransactionForm({ onClose, onAdded, editData }) {
  const today = new Date().toISOString().split('T')[0];
  const isEditing = !!editData;

  const [form, setForm] = useState({
    salesperson: '',
    storeName: '',
    subscriptionType: '',
    subscriptionDuration: '',
    totalAmount: '',
    paidAmount: '',
    date: today,
  });

  const [errors, setErrors] = useState({});
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        salesperson: editData.salesperson || '',
        storeName: editData.storeName || '',
        subscriptionType: editData.subscriptionType || '',
        subscriptionDuration: editData.subscriptionDuration || '',
        totalAmount: String(editData.totalAmount || ''),
        paidAmount: String(editData.paidAmount || ''),
        date: editData.date || today,
      });
    }
  }, [editData]);

  const remainingAmount = Math.max(0, (Number(form.totalAmount) || 0) - (Number(form.paidAmount) || 0));

  const validate = () => {
    const newErrors = {};
    if (!form.salesperson) newErrors.salesperson = 'Select a salesperson';
    if (!form.storeName.trim()) newErrors.storeName = 'Enter store name';
    if (!form.subscriptionType) newErrors.subscriptionType = 'Select subscription type';
    if (!form.totalAmount || Number(form.totalAmount) <= 0) newErrors.totalAmount = 'Enter valid amount';
    if (form.paidAmount === '' || Number(form.paidAmount) < 0) newErrors.paidAmount = 'Enter valid amount';
    if (!form.date) newErrors.date = 'Select a date';
    return newErrors;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));

    if (field === 'paidAmount' || field === 'totalAmount') {
      const total = field === 'totalAmount' ? Number(value) : Number(form.totalAmount);
      const paid = field === 'paidAmount' ? Number(value) : Number(form.paidAmount);
      if (paid > total && total > 0) {
        setWarning('⚠️ Paid amount exceeds total amount!');
      } else {
        setWarning('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = {
      salesperson: form.salesperson,
      storeName: form.storeName.trim(),
      subscriptionType: form.subscriptionType,
      subscriptionDuration: form.subscriptionDuration,
      totalAmount: Number(form.totalAmount),
      paidAmount: Math.min(Number(form.paidAmount), Number(form.totalAmount)),
      remainingAmount,
      date: form.date,
    };

    if (isEditing) {
      await updateTransaction(editData.id, data);
    } else {
      await addTransaction(data);
    }

    setSuccess(true);
    setTimeout(() => {
      onAdded();
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${success ? 'success-state' : ''}`}>
        {success ? (
          <div className="success-message">
            <div className="success-icon">
              <Check size={32} />
            </div>
            <h3>{isEditing ? 'Transaction Updated!' : 'Transaction Added!'}</h3>
            <p>Leaderboard updated</p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="close-btn" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="salesperson">Salesperson *</label>
                  <select
                    id="salesperson"
                    value={form.salesperson}
                    onChange={(e) => handleChange('salesperson', e.target.value)}
                    className={errors.salesperson ? 'error' : ''}
                  >
                    <option value="">Select person</option>
                    {SALESPERSONS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {errors.salesperson && <span className="field-error">{errors.salesperson}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="storeName">Store Name *</label>
                  <input
                    id="storeName"
                    type="text"
                    placeholder="e.g. ABC Store"
                    value={form.storeName}
                    onChange={(e) => handleChange('storeName', e.target.value)}
                    className={errors.storeName ? 'error' : ''}
                  />
                  {errors.storeName && <span className="field-error">{errors.storeName}</span>}
                </div>
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label htmlFor="subscriptionType">Plan Type *</label>
                  <select
                    id="subscriptionType"
                    value={form.subscriptionType}
                    onChange={(e) => handleChange('subscriptionType', e.target.value)}
                    className={errors.subscriptionType ? 'error' : ''}
                  >
                    <option value="">Select plan</option>
                    {SUBSCRIPTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.subscriptionType && <span className="field-error">{errors.subscriptionType}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="subscriptionDuration">Duration</label>
                  <select
                    id="subscriptionDuration"
                    value={form.subscriptionDuration}
                    onChange={(e) => handleChange('subscriptionDuration', e.target.value)}
                  >
                    <option value="">Select duration</option>
                    {SUBSCRIPTION_DURATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className={errors.date ? 'error' : ''}
                  />
                  {errors.date && <span className="field-error">{errors.date}</span>}
                </div>
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label htmlFor="totalAmount">Total Amount *</label>
                  <input
                    id="totalAmount"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.totalAmount}
                    onChange={(e) => handleChange('totalAmount', e.target.value)}
                    className={errors.totalAmount ? 'error' : ''}
                  />
                  {errors.totalAmount && <span className="field-error">{errors.totalAmount}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="paidAmount">Paid Amount *</label>
                  <input
                    id="paidAmount"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.paidAmount}
                    onChange={(e) => handleChange('paidAmount', e.target.value)}
                    className={errors.paidAmount ? 'error' : ''}
                  />
                  {errors.paidAmount && <span className="field-error">{errors.paidAmount}</span>}
                </div>

                <div className="form-group">
                  <label>Remaining</label>
                  <div className="calculated-field">
                    Rs {remainingAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {warning && (
                <div className="form-warning">
                  <AlertTriangle size={16} />
                  {warning}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {isEditing ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
