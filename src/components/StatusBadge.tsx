import React from 'react';
import { ClaimStatus } from '../types';

interface StatusBadgeProps {
  status: ClaimStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'DRAFT':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'SUBMITTED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'PENDING_EMPLOYEE_VALIDATION':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'PENDING_REGIONAL_APPROVAL':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'REGIONAL_APPROVED':
      colorClasses = 'bg-cyan-50 text-cyan-800 border-cyan-200';
      break;
    case 'PENDING_PRESIDENT_APPROVAL':
      colorClasses = 'bg-purple-50 text-purple-800 border-purple-300 font-semibold animate-pulse';
      label = 'Pending Management Approval';
      break;
    case 'PRESIDENT_APPROVED':
      colorClasses = 'bg-teal-50 text-teal-800 border-teal-200';
      label = 'Management Approved';
      break;
    case 'PENDING_AUDIT':
      colorClasses = 'bg-sky-50 text-sky-800 border-sky-300';
      break;
    case 'AUDIT_QUERY':
      colorClasses = 'bg-amber-100 text-amber-900 border-amber-400 font-semibold';
      break;
    case 'AUDIT_PASSED':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      break;
    case 'AUDIT_FAILED':
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      break;
    case 'PENDING_ACCOUNTS':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300';
      break;
    case 'PAYMENT_PROCESSING':
      colorClasses = 'bg-yellow-50 text-yellow-800 border-yellow-300 animate-pulse';
      break;
    case 'PAYMENT_PROCESSED':
    case 'CLOSED':
      colorClasses = 'bg-green-100 text-green-800 border-green-300 font-medium';
      label = status === 'CLOSED' ? 'CLAIM CLOSED (PAID)' : 'PAYMENT PROCESSED';
      break;
    case 'REJECTED':
      colorClasses = 'bg-red-100 text-red-800 border-red-300 font-semibold';
      break;
    case 'SENT_BACK':
      colorClasses = 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
      break;
    case 'CANCELLED':
      colorClasses = 'bg-gray-200 text-gray-700 border-gray-300';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5'
      : size === 'lg'
      ? 'text-sm px-3.5 py-1.5 font-semibold'
      : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status.includes('REJECTED') || status.includes('FAILED')
            ? 'bg-red-500'
            : status.includes('CLOSED') || status.includes('PASSED')
            ? 'bg-green-500'
            : status.includes('PRESIDENT')
            ? 'bg-purple-600'
            : 'bg-blue-500'
        }`}
      />
      {label}
    </span>
  );
};
