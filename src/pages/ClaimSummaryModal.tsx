import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim, ExpenseItem, DocumentAttachment } from '../types';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Send,
  X,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ClaimSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ExpenseClaim;
  items: ExpenseItem[];
  documents: DocumentAttachment[];
  onSubmitted: () => void;
}

export const ClaimSummaryModal: React.FC<ClaimSummaryModalProps> = ({
  isOpen,
  onClose,
  claim,
  items,
  documents,
  onSubmitted
}) => {
  const { currentUser } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !claim || !currentUser) return null;

  const handleSubmitClaim = async () => {
    if (!confirmed) {
      setError('You must confirm the official declaration statement before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await fetch(`/api/claims/${claim.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ declarationConfirmed: true })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProfitCentreHead = currentUser.isProfitCentreHead || currentUser.role === 'PROFIT_CENTRE_HEAD';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">Tour Expense Claim Summary</h3>
              <p className="text-xs text-white/70">Review final calculations before formal submission</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Summary */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Duplicate Detection Alert if Flagged */}
          {claim.isPotentialDuplicate && (
            <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">POTENTIAL DUPLICATE EXPENSE DETECTED</strong>
                <p className="text-amber-800 text-[11px] mt-0.5">{claim.duplicateWarningReason}</p>
                <p className="text-[10px] text-amber-700 mt-1">
                  Note: The claim can still be submitted, but will be highlighted in the Approver and Audit review queues.
                </p>
              </div>
            </div>
          )}

          {/* Workflow Routing Banner */}
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">Approval Routing:</span>
              {isProfitCentreHead ? (
                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
                  Direct to President (Mr. Bharanidhar Tarimana)
                </span>
              ) : (
                <span className="bg-purple-200 text-purple-900 font-semibold px-2 py-0.5 rounded text-[11px]">
                  Regional Approver: {claim.approvingAuthorityName}
                </span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-purple-700" />
          </div>

          {/* Meta Info Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Claim ID</span>
              <strong className="text-slate-900">{claim.id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee</span>
              <strong className="text-slate-900">{claim.employeeName}</strong> ({claim.employeeId})
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tour Period</span>
              <strong className="text-slate-900">{claim.tourStartDate} to {claim.tourEndDate}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
              <strong className="text-purple-800">{claim.destination}</strong>
            </div>
          </div>

          {/* Expense Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <span>EXPENSE SUMMARY BY CATEGORY</span>
              <span>AMOUNT</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs text-slate-700">
              <div className="px-4 py-2 flex items-center justify-between">
                <span>Travel (Train / Bus / Cab / Flight)</span>
                <span className="font-semibold">Rs. {claim.travelTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span>Daily Food Expenses</span>
                <span className="font-semibold">Rs. {claim.foodTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span>Local Travel (Ola / Auto / Cab)</span>
                <span className="font-semibold">Rs. {claim.localTravelTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span>Hotel Room Stay</span>
                <span className="font-semibold">Rs. {claim.hotelTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span>Other Expenses (Parking / Toll / Comm.)</span>
                <span className="font-semibold">Rs. {claim.otherTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total Highlight Bar */}
            <div className="bg-purple-950 text-white p-4 space-y-2">
              <div className="flex items-center justify-between text-sm sm:text-base font-extrabold">
                <span>TOTAL GROSS CLAIM</span>
                <span className="text-amber-300">Rs. {claim.grossClaim.toLocaleString('en-IN')}</span>
              </div>
              <div className="grid grid-cols-2 text-xs pt-2 border-t border-purple-800 text-purple-200">
                <div>
                  Policy Eligible Amount:{' '}
                  <strong className="text-emerald-300">Rs. {claim.policyEligible.toLocaleString('en-IN')}</strong>
                </div>
                <div className="text-right">
                  Exception Amount:{' '}
                  <strong className={claim.exceptionAmount > 0 ? 'text-amber-300' : 'text-white'}>
                    Rs. {claim.exceptionAmount.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Documents Counter */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Paperclip className="w-4 h-4 text-purple-700" />
              <span>Supporting Documents & Bills Attached:</span>
              <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {documents.length} Files
              </strong>
            </div>
            <span className="text-[11px] text-slate-500">All receipts verified</span>
          </div>

          {/* Mandatory Employee Declaration Checkbox */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="claimDeclaration"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-600 mt-0.5 cursor-pointer"
              />
              <label
                htmlFor="claimDeclaration"
                className="text-xs font-semibold text-slate-800 leading-snug cursor-pointer select-none"
              >
                "I confirm that the expenses claimed are related to official company travel and the information/documents
                submitted are correct." <span className="text-rose-600 font-bold">*</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={handleSubmitClaim}
            disabled={!confirmed || isSubmitting || items.length === 0}
            className="px-6 py-2.5 text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 active:bg-purple-950 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-amber-300" />
            <span>{isSubmitting ? 'Submitting Claim...' : 'Confirm & Submit Claim'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
