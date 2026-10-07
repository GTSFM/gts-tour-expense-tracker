import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Eye,
  AlertTriangle,
  Search,
  Check,
  PauseCircle,
  XCircle,
  Banknote
} from 'lucide-react';

interface AccountsDashboardProps {
  onSelectClaim: (claimId: string) => void;
}

export const AccountsDashboard: React.FC<AccountsDashboardProps> = ({ onSelectClaim }) => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Settlement Dialog
  const [paymentClaim, setPaymentClaim] = useState<ExpenseClaim | null>(null);
  const [actionType, setActionType] = useState<'PAYMENT_PROCESSED' | 'MARK_FOR_PAYMENT' | 'HOLD'>('PAYMENT_PROCESSED');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [processedAmount, setProcessedAmount] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAccountsClaims = () => {
    if (!currentUser) return;
    setIsLoading(true);

    fetch('/api/claims', { headers: { 'x-user-id': currentUser.id } })
      .then((r) => r.json())
      .then((data) => {
        setClaims(data.claims || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAccountsClaims();
  }, [currentUser]);

  const openPaymentModal = (claim: ExpenseClaim) => {
    setPaymentClaim(claim);
    setActionType('PAYMENT_PROCESSED');
    const randomUTR = `HDFC-NEFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    setPaymentReference(randomUTR);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setProcessedAmount(claim.grossClaim);
    setRemarks('Disbursed via Corporate NetBanking directly to salary account.');
    setErrorMsg('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentClaim || !currentUser) return;

    if (actionType === 'PAYMENT_PROCESSED' && !paymentReference.trim()) {
      setErrorMsg('Payment reference (NEFT/RTGS/UTR/Cheque) is mandatory.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg('');

      const res = await fetch(`/api/claims/${paymentClaim.id}/accounts-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          action: actionType,
          paymentReference,
          paymentDate,
          processedAmount: Number(processedAmount) || paymentClaim.grossClaim,
          remarks
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment processing failed.');

      setPaymentClaim(null);
      loadAccountsClaims();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingSettlement = claims.filter(
    (c) => ['AUDIT_PASSED', 'PENDING_ACCOUNTS', 'PAYMENT_PROCESSING'].includes(c.status)
  );
  const closedClaims = claims.filter((c) => ['CLOSED', 'PAYMENT_PROCESSED'].includes(c.status));

  const pendingAmount = pendingSettlement.reduce((acc, c) => acc + (c.grossClaim || 0), 0);
  const paidAmount = closedClaims.reduce((acc, c) => acc + (c.processedAmount || c.grossClaim || 0), 0);

  const filteredClaims = claims.filter((c) => {
    return (
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Finance & Accounts
            </span>
            <span className="text-xs text-emerald-200">
              Welcome, <strong>{currentUser.name}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Payment Settlement & Disbursal Module</h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            Process payments for Audit-Passed claims and close expense cycles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/20 text-right">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Pending Payout</span>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              Rs. {pendingAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-300">{pendingSettlement.length} Claims Awaiting Transfer</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/20 text-right">
            <span className="text-[10px] text-emerald-200 uppercase font-semibold block">Disbursed Total</span>
            <div className="text-lg sm:text-xl font-black text-emerald-300">
              Rs. {paidAmount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-300">{closedClaims.length} Settled & Closed</span>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search claim, employee, bank ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredClaims.length}</strong> claims
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto"></div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">Accounts Queue Clear</h4>
            <p className="text-xs text-slate-500">No claims awaiting payment processing at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{claim.id}</span>
                    <StatusBadge status={claim.status} size="sm" />
                    {claim.auditStatus === 'PASSED' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Audit Passed
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      Claimant: <strong className="text-slate-900">{claim.employeeName}</strong> ({claim.employeeId})
                    </div>
                    <div>
                      Department: <strong>{claim.department}</strong>
                    </div>
                    <div>
                      Region: <strong className="text-purple-700">{claim.region}</strong>
                    </div>
                    <div>
                      Tour: {claim.destination} ({claim.numberOfDays} Days)
                    </div>
                  </div>

                  {claim.paymentReference && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center justify-between">
                      <span>
                        Payment Ref: <strong>{claim.paymentReference}</strong> • Date: {claim.paymentDate}
                      </span>
                      <span>Disbursed: Rs. {claim.processedAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left lg:text-right mr-2">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      Rs. {claim.grossClaim.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      Payable: Rs. {claim.grossClaim.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectClaim(claim.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {['AUDIT_PASSED', 'PENDING_ACCOUNTS', 'PAYMENT_PROCESSING'].includes(claim.status) && (
                      <button
                        onClick={() => openPaymentModal(claim)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                        <span>Process Payout</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      {paymentClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-emerald-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Payment Processing & Disbursal</h3>
                <p className="text-xs text-emerald-200">
                  {paymentClaim.id} • {paymentClaim.employeeName} (Rs.{' '}
                  {paymentClaim.grossClaim.toLocaleString('en-IN')})
                </p>
              </div>
              <button onClick={() => setPaymentClaim(null)} className="p-1 rounded-lg text-white/70 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Action Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Accounts Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PAYMENT_PROCESSED', label: 'Payment Processed (Close Claim)' },
                    { id: 'MARK_FOR_PAYMENT', label: 'Queue in Batch' },
                    { id: 'HOLD', label: 'Place on Hold' }
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActionType(act.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        actionType === act.id
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {actionType === 'PAYMENT_PROCESSED' && (
                <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 text-xs">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Bank UTR / NEFT Reference Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC-NEFT-20261001-998231"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2 outline-none bg-white focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Payment Date</label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Processed Amount (Rs)</label>
                      <input
                        type="number"
                        required
                        value={processedAmount}
                        onChange={(e) => setProcessedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-xs font-bold rounded-lg border border-slate-300 p-2 outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accounts Remarks & Notes</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentClaim(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  {isProcessing ? 'Processing...' : 'Complete & Settle Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
