import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AgeingBadge } from '../components/AgeingBadge';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  MapPin,
  AlertTriangle,
  FileText,
  Search,
  Filter
} from 'lucide-react';

interface RegionalApprovalDashboardProps {
  onSelectClaim: (claimId: string) => void;
}

export const RegionalApprovalDashboard: React.FC<RegionalApprovalDashboardProps> = ({ onSelectClaim }) => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Action Dialog State
  const [actionModalClaim, setActionModalClaim] = useState<ExpenseClaim | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'SEND_BACK'>('APPROVE');
  const [actionComment, setActionComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadClaims = () => {
    if (!currentUser) return;
    setIsLoading(true);

    fetch('/api/claims', {
      headers: { 'x-user-id': currentUser.id }
    })
      .then((r) => r.json())
      .then((data) => {
        setClaims(data.claims || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadClaims();
  }, [currentUser]);

  if (!currentUser) return null;

  // Filter claims based on status tab and search
  const filteredClaims = claims.filter((claim) => {
    // Territory check is already strictly enforced by the backend endpoint!
    const matchesSearch =
      claim.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'PENDING') {
      return claim.status === 'PENDING_REGIONAL_APPROVAL';
    } else if (filterStatus === 'APPROVED') {
      return ['REGIONAL_APPROVED', 'PENDING_PRESIDENT_APPROVAL', 'PRESIDENT_APPROVED', 'PENDING_AUDIT', 'PENDING_ACCOUNTS', 'CLOSED'].includes(claim.status);
    } else if (filterStatus === 'REJECTED') {
      return claim.status === 'REJECTED';
    } else if (filterStatus === 'SENT_BACK') {
      return claim.status === 'SENT_BACK';
    }
    return true;
  });

  const pendingCount = claims.filter((c) => c.status === 'PENDING_REGIONAL_APPROVAL').length;
  const approvedCount = claims.filter((c) =>
    ['REGIONAL_APPROVED', 'PENDING_PRESIDENT_APPROVAL', 'PRESIDENT_APPROVED', 'PENDING_AUDIT', 'PENDING_ACCOUNTS', 'CLOSED'].includes(c.status)
  ).length;
  const rejectedCount = claims.filter((c) => c.status === 'REJECTED').length;
  const sentBackCount = claims.filter((c) => c.status === 'SENT_BACK').length;

  const totalPendingAmount = claims
    .filter((c) => c.status === 'PENDING_REGIONAL_APPROVAL')
    .reduce((acc, c) => acc + (c.grossClaim || 0), 0);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModalClaim) return;

    if ((actionType === 'REJECT' || actionType === 'SEND_BACK') && !actionComment.trim()) {
      setActionError('Mandatory comments/reason required for rejection or sending back a claim.');
      return;
    }

    try {
      setIsProcessing(true);
      setActionError('');

      const res = await fetch(`/api/claims/${actionModalClaim.id}/regional-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          action: actionType,
          comments: actionComment
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed.');

      setActionModalClaim(null);
      setActionComment('');
      loadClaims();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Territory Isolation Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-purple-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Regional Approving Authority
            </span>
            <span className="text-xs text-purple-200">
              Welcome, <strong>{currentUser.name}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Territory Approval Queue</h2>
          <div className="flex items-center gap-2 text-xs text-amber-200 mt-1">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Assigned Territories: <strong>{currentUser.assignedTerritories?.join(', ') || currentUser.region}</strong>
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/20 text-right">
          <span className="text-[11px] text-purple-200 uppercase font-semibold block">Pending Territory Value</span>
          <div className="text-xl sm:text-2xl font-black text-amber-300">
            Rs. {totalPendingAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-purple-300">{pendingCount} claims awaiting your sign-off</span>
        </div>
      </div>

      {/* KPI Status Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          { id: 'PENDING', label: 'Pending Approval', count: pendingCount, color: 'text-amber-700 bg-amber-50' },
          { id: 'APPROVED', label: 'Approved', count: approvedCount, color: 'text-emerald-700 bg-emerald-50' },
          { id: 'REJECTED', label: 'Rejected', count: rejectedCount, color: 'text-rose-700 bg-rose-50' },
          { id: 'SENT_BACK', label: 'Sent Back', count: sentBackCount, color: 'text-blue-700 bg-blue-50' },
          { id: 'ALL', label: 'Total Claims', count: claims.length, color: 'text-slate-700 bg-slate-50' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              filterStatus === tab.id
                ? 'bg-purple-900 text-white border-purple-900 shadow-md font-bold'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className={`text-[11px] block font-medium ${filterStatus === tab.id ? 'text-purple-200' : 'text-slate-500'}`}>
              {tab.label}
            </span>
            <div className={`text-xl font-black mt-0.5 ${filterStatus === tab.id ? 'text-amber-300' : ''}`}>
              {tab.count}
            </div>
          </button>
        ))}
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Employee, Claim ID, Destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredClaims.length}</strong> claims for territory
        </div>
      </div>

      {/* Claims Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto"></div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">No Claims in this Category</h4>
            <p className="text-xs text-slate-500">Your assigned territory has no matching claims.</p>
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
                    <AgeingBadge submissionDate={claim.submissionDate} status={claim.status} />
                    {claim.hasExceptions && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        EXCEPTION (Excess: Rs. {claim.exceptionAmount})
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      Claimant: <strong className="text-slate-900">{claim.employeeName}</strong> ({claim.employeeId})
                    </div>
                    <div>
                      Designation: <strong>{claim.designation}</strong> (Band {claim.band})
                    </div>
                    <div>
                      Territory: <strong className="text-purple-700">{claim.region}</strong>
                    </div>
                    <div>
                      Destination: <strong className="text-slate-900">{claim.destination}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4">
                    <span>
                      Tour: {claim.tourStartDate} to {claim.tourEndDate} ({claim.numberOfDays} Days)
                    </span>
                    <span>
                      Submitted: {claim.submissionDate ? new Date(claim.submissionDate).toLocaleDateString() : 'N/A'}
                    </span>
                    {claim.exceptionNotes && (
                      <span className="text-rose-700 font-medium">Notes: {claim.exceptionNotes}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left lg:text-right mr-2">
                    <div className="text-base sm:text-lg font-black text-purple-950">
                      Rs. {claim.grossClaim.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Eligible: Rs. {claim.policyEligible.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectClaim(claim.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {claim.status === 'PENDING_REGIONAL_APPROVAL' && (
                      <button
                        onClick={() => {
                          setActionModalClaim(claim);
                          setActionType('APPROVE');
                          setActionComment('');
                          setActionError('');
                        }}
                        className="px-3.5 py-1.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
                        <span>Action</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regional Action Modal */}
      {actionModalClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-purple-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Regional Approval Decision</h3>
                <p className="text-xs text-purple-200">
                  Claim: {actionModalClaim.id} • {actionModalClaim.employeeName} (Rs.{' '}
                  {actionModalClaim.grossClaim.toLocaleString('en-IN')})
                </p>
              </div>
              <button
                onClick={() => setActionModalClaim(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-5 space-y-4">
              {actionError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {actionError}
                </div>
              )}

              {/* Action Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'APPROVE', label: 'Approve Claim', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'SEND_BACK', label: 'Send Back', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                    { id: 'REJECT', label: 'Reject Claim', color: 'border-rose-500 bg-rose-50 text-rose-800' }
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActionType(act.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        actionType === act.id ? act.color + ' ring-2 ring-purple-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {actionModalClaim.hasExceptions && actionType === 'APPROVE' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
                  <strong>APPROVING WITH EXCEPTION (Rs. {actionModalClaim.exceptionAmount})</strong>
                  <p className="text-[11px] text-amber-800">
                    This claim contains items above standard Band limits. Your approval comments will be forwarded to
                    President Mr. Bharanidhar Tarimana.
                  </p>
                </div>
              )}

              {/* Comments Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Approver Remarks & Comments {actionType !== 'APPROVE' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={actionType !== 'APPROVE'}
                  placeholder={
                    actionType === 'APPROVE'
                      ? 'Approved. All documents verified and site visit confirmed.'
                      : actionType === 'SEND_BACK'
                      ? 'Please attach the hotel bill receipt for day 2 and resubmit.'
                      : 'Rejection reason (mandatory)...'
                  }
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActionModalClaim(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : actionType === 'SEND_BACK'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
