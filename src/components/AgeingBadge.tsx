import React from 'react';
import { Clock } from 'lucide-react';

interface AgeingBadgeProps {
  submissionDate?: string;
  status: string;
}

export const AgeingBadge: React.FC<AgeingBadgeProps> = ({ submissionDate, status }) => {
  if (!submissionDate || ['CLOSED', 'PAYMENT_PROCESSED', 'REJECTED', 'CANCELLED', 'DRAFT'].includes(status)) {
    return null;
  }

  const days = Math.floor((Date.now() - new Date(submissionDate).getTime()) / (1000 * 60 * 60 * 24));

  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
  let text = 'Pending < 1d';

  if (days >= 7) {
    badgeColor = 'bg-red-50 text-red-700 border-red-300 font-semibold animate-pulse';
    text = `Pending ${days}d (Critical)`;
  } else if (days >= 5) {
    badgeColor = 'bg-orange-50 text-orange-700 border-orange-300 font-medium';
    text = `Pending ${days}d (High)`;
  } else if (days >= 3) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
    text = `Pending ${days}d`;
  } else if (days >= 1) {
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    text = `Pending ${days}d`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${badgeColor}`}
      title={`Submitted on ${new Date(submissionDate).toLocaleDateString()}`}
    >
      <Clock className="w-3 h-3" />
      {text}
    </span>
  );
};
