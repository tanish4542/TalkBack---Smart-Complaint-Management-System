import React from 'react';
import { FaCheck, FaClock, FaExclamationTriangle, FaUserCheck, FaRegCircle } from 'react-icons/fa';
import Badge from './Badge';

const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-400 italic">No timeline history recorded.</p>;
  }

  const getIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
        return <FaCheck className="text-white text-xs" />;
      case 'escalated':
      case 'urgent':
        return <FaExclamationTriangle className="text-white text-xs" />;
      case 'in_review':
      case 'under_review':
        return <FaUserCheck className="text-white text-xs" />;
      default:
        return <FaClock className="text-white text-xs" />;
    }
  };

  const getBgColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
        return 'bg-emerald-500';
      case 'escalated':
      case 'urgent':
        return 'bg-rose-500';
      case 'in_review':
      case 'under_review':
        return 'bg-blue-500';
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6 my-4">
      {history.map((item, idx) => (
        <div key={idx} className="relative group">
          {/* Dot */}
          <div
            className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full ${getBgColor(
              item.new_status
            )} flex items-center justify-center ring-4 ring-white shadow-sm`}
          >
            {getIcon(item.new_status)}
          </div>

          {/* Timeline Item Content */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Badge status={item.new_status} />
                <span className="text-xs font-semibold text-slate-700">
                  By {item.changed_by || 'System'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {item.changed_at ? new Date(item.changed_at).toLocaleString() : 'Recent'}
              </span>
            </div>
            {item.remarks && (
              <p className="text-xs text-slate-600 mt-1.5 pl-0.5 border-l-2 border-slate-300">
                {item.remarks}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusTimeline;
