import React from 'react';
import { Loader2, AlertTriangle, Star } from './Icons.jsx';

export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, loading = false }) => {
  const variantClass = `btn-${variant}`;
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`btn ${variantClass} ${className}`}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

export const Input = ({ label, type = 'text', value, onChange, placeholder, required, error, multiline, min, max }) => (
  <div className="form-group">
    <label className="form-label">{label} {required && '*'}</label>
    {multiline ? (
       <textarea value={value} onChange={onChange} placeholder={placeholder} rows={4} className={`form-textarea ${error ? 'error' : ''}`} />
    ) : (
      <input type={type} min={min} max={max} value={value} onChange={onChange} placeholder={placeholder} className={`form-input ${error ? 'error' : ''}`} />
    )}
    {error && <p className="form-error">{error}</p>}
  </div>
);

// UPDATED: Changed border-gray-100 to border-gray-200 for better visibility
export const Card = ({ children, className = '', style }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

export const Badge = ({ children, color = 'blue' }) => {
  return <span className={`badge badge-${color}`}>{children}</span>;
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <Card className="modal-card">
        <div className="modal-header">
          <AlertTriangle size={24} />
          <h2 className="modal-title">{title}</h2>
        </div>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
        </div>
      </Card>
    </div>
  );
};

export const SimpleBarChart = ({ data, total }) => {
  if (total === 0) return <div className="no-ratings">No ratings yet.</div>;

  return (
    <div className="bar-chart">
      {[5, 4, 3, 2, 1].map(star => {
        const count = data[star] || 0;
        const percent = (count / total) * 100;
        return (
          <div key={star} className="bar-row">
            <div className="bar-star">
              <span>{star}</span>
              <Star size={12} />
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${percent}%` }}></div>
            </div>
            <div className="bar-count">{count}</div>
          </div>
        );
      })}
    </div>
  );
};
