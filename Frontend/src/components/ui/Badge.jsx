import React from 'react';

const Badge = ({ status, text, className = '' }) => {
  const normStatus = (status || '').toLowerCase().replace(' ', '_');

  const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
    under_review: 'bg-blue-50 text-blue-700 border-blue-200/80',
    in_review: 'bg-blue-50 text-blue-700 border-blue-200/80',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    escalated: 'bg-rose-50 text-rose-700 border-rose-200/80',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200/80',
    default: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const statusDot = {
    pending: 'bg-amber-500',
    under_review: 'bg-blue-500',
    in_review: 'bg-blue-500',
    resolved: 'bg-emerald-500',
    escalated: 'bg-rose-500',
    urgent: 'bg-rose-500',
    default: 'bg-slate-400'
  };

  const displayText = text || normStatus.replace('_', ' ').toUpperCase();

  const style = statusStyles[normStatus] || statusStyles.default;
  const dot = statusDot[normStatus] || statusDot.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`} />
      {displayText}
    </span>
  );
};

export default Badge;
