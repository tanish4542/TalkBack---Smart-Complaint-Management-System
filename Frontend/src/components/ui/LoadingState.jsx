import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100/80 border-b border-slate-200" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center space-x-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-200 rounded"
                style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
    <div className="h-4 bg-slate-200 rounded w-1/3" />
    <div className="h-8 bg-slate-200 rounded w-1/2" />
    <div className="h-3 bg-slate-200 rounded w-2/3" />
  </div>
);

const LoadingState = ({ text = 'Loading details...' }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-3">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-sm font-medium text-slate-600">{text}</span>
  </div>
);

export default LoadingState;
