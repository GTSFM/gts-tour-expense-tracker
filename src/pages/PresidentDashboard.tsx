import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AgeingBadge } from '../components/AgeingBadge';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Building,
  TrendingUp,
  MapPin,
  Search,
  Filter,
  Users
} from 'lucide-react';

interface PresidentDashboardProps {
  onSelectClaim: (claimId: string) => void;
}

export const PresidentDashboard: React.FC<PresidentDashboardProps> = ({ onSelectClaim }) => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [filterRegion, setFilterRegion] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Decision Modal
  const [actionClaim, setActionClaim] = useState<ExpenseClaim | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'SEND_BACK'>('APPROVE');
  const [actionComments, setActionComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadData = () => {
    if (!currentUser) return;
    setIsLoading(true);

    fetch('/api/claims', { headers: { 'x-user-id': currentUser.id } })
      .then((r) => r.json())
      .then((data) => setClaims(data.claims || []))
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  if (!currentUser) return null;

  const isManagementApprover =
    currentUser.role === 'PRESIDENT' ||
    currentUser.role === 'DIRECTOR' ||
    currentUser.role === 'MASTER_ADMIN';

  // Regional breakdown metrics
  const pendingPresidentClaims = claims.filter((c) => c.status === 'PENDING_PRESIDENT_APPROVAL');
  const totalCompanySpend = claims.reduce((acc, c) => acc + (c.grossClaim || 0), 0);
  const totalExceptions = claims.reduce((acc, c) => acc + (c.exceptionAmount || 0), 0);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.destination.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRegion !== 'ALL' && claim.region !== filterRegion) {
      return false;
    }

    if (filterStatus === 'PENDING') {
      return claim.status === 'PENDING_PRESIDENT_APPROVAL';
    } else if (filterStatus === 'APPROVED') {
      return ['PRESIDENT_APPROVED', 'PENDING_AUDIT', 'PENDING_ACCOUNTS', 'CLOSED'].includes(claim.status);
    } else if (filterStatus === 'EXCEPTIONS') {
      return claim.hasExceptions || claim.exceptionAmount > 0;
    }

    return true;
  });

  const handlePresidentAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionClaim) return;

    if ((actionType === 'REJECT' || actionType === 'SEND_BACK') && !actionComments.trim()) {
      setActionError('Mandatory justification is required for rejecting or sending back a claim.');
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError('');

      const res = await fetch(`/api/claims/${actionClaim.id}/president-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          action: actionType,
          comments: actionComments
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed.');

      setActionClaim(null);
      setActionComments('');
      loadData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Management Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-purple-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              {currentUser.designation} Dashboard
            </span>
            <span className="text-xs text-purple-200">
              Welcome, <strong>{currentUser.name}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Final Management Approval Queue & Corporate Governance
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Authorized Management Approval Authority: President (Mr. Bharanidhar Tarimana) & Directors (Mr. Mariappan S, Mr. Prabakar B)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/20 text-right">
            <span className="text-[10px] text-purple-200 uppercase font-semibold block">Total Claims Claimed</span>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              Rs. {totalCompanySpend.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-purple-300">Company-wide Tour Spend</span>
          </div>
          <div className="bg-rose-500/20 backdrop-blur-xs rounded-xl p-3 border border-rose-400/30 text-right">
            <span className="text-[10px] text-rose-200 uppercase font-semibold block">Policy Exceptions</span>
            <div className="text-lg sm:text-xl font-black text-rose-300">
              Rs. {totalExceptions.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-rose-300">Above Standard Caps</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus('PENDING')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'PENDING'
              ? 'bg-purple-900 text-white border-purple-900 shadow-md font-bold'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span>Pending Final Approval</span>
            <Clock className={`w-4 h-4 ${filterStatus === 'PENDING' ? 'text-amber-300' : 'text-amber-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${filterStatus === 'PENDING' ? 'text-amber-300' : 'text-purple-950'}`}>
            {pendingPresidentClaims.length}
          </div>
          <span className={`text-[10px] ${filterStatus === 'PENDING' ? 'text-purple-200' : 'text-slate-400'}`}>
            Regional Approved & PCH
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('EXCEPTIONS')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'EXCEPTIONS'
              ? 'bg-rose-900 text-white border-rose-900 shadow-md font-bold'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span>Exception Claims</span>
            <AlertTriangle className={`w-4 h-4 ${filterStatus === 'EXCEPTIONS' ? 'text-rose-200' : 'text-rose-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${filterStatus === 'EXCEPTIONS' ? 'text-white' : 'text-rose-700'}`}>
            {claims.filter((c) => c.hasExceptions || c.exceptionAmount > 0).length}
          </div>
          <span className={`text-[10px] ${filterStatus === 'EXCEPTIONS' ? 'text-rose-200' : 'text-slate-400'}`}>
            Require Special Justification
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'APPROVED'
              ? 'bg-purple-900 text-white border-purple-900 shadow-md font-bold'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span>Forwarded to Audit</span>
            <CheckCircle2 className={`w-4 h-4 ${filterStatus === 'APPROVED' ? 'text-emerald-300' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${filterStatus === 'APPROVED' ? 'text-amber-300' : 'text-slate-900'}`}>
            {claims.filter((c) => ['PRESIDENT_APPROVED', 'PENDING_AUDIT', 'PENDING_ACCOUNTS', 'CLOSED'].includes(c.status)).length}
          </div>
          <span className={`text-[10px] ${filterStatus === 'APPROVED' ? 'text-purple-200' : 'text-slate-400'}`}>
            Audit / Accounts Queue
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'ALL'
              ? 'bg-purple-900 text-white border-purple-900 shadow-md font-bold'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span>All Company Claims</span>
            <Building className={`w-4 h-4 ${filterStatus === 'ALL' ? 'text-amber-300' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${filterStatus === 'ALL' ? 'text-amber-300' : 'text-slate-900'}`}>
            {claims.length}
          </div>
          <span className={`text-[10px] ${filterStatus === 'ALL' ? 'text-purple-200' : 'text-slate-400'}`}>
            All active & settled
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search claimant, claim ID, site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Region:</span>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="ALL">All Territories</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="East">East</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto"></div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">No Claims Pending in this Queue</h4>
            <p className="text-xs text-slate-500">All regional submissions have been processed.</p>
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
                      Band: <strong>{claim.band}</strong> • {claim.department}
                    </div>
                    <div>
                      Region: <strong className="text-purple-700">{claim.region}</strong>
                    </div>
                    <div>
                      Destination: <strong className="text-slate-900">{claim.destination}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4">
                    <span>
                      Tour: {claim.tourStartDate} to {claim.tourEndDate} ({claim.numberOfDays} Days)
                    </span>
                    {claim.regionalApproverName && (
                      <span>
                        Regional Approved by:{' '}
                        <strong className="text-slate-700">{claim.regionalApproverName}</strong>
                      </span>
                    )}
                    {claim.regionalComments && (
                      <span className="text-indigo-700">Reg. Remarks: {claim.regionalComments}</span>
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
                      <span>Review</span>
                    </button>

                    {isManagementApprover && claim.status === 'PENDING_PRESIDENT_APPROVAL' && (
                      claim.userId === currentUser.id ? (
                        <span className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          Self Claim (Awaiting Peer Approval)
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setActionClaim(claim);
                            setActionType('APPROVE');
                            setActionComments(`Final Management Approval Granted by ${currentUser.name} (${currentUser.designation || currentUser.role}).`);
                            setActionError('');
                          }}
                          className="px-4 py-1.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-300" />
                          <span>Management Decision</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Management Approval Modal */}
      {actionClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-purple-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Final Management Approval</h3>
                <p className="text-xs text-purple-200">
                  {actionClaim.employeeName} ({actionClaim.employeeId}) • Rs.{' '}
                  {actionClaim.grossClaim.toLocaleString('en-IN')}
                </p>
                <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                  Approving Executive: <strong>{currentUser.name}</strong> ({currentUser.designation || currentUser.role})
                </div>
              </div>
              <button onClick={() => setActionClaim(null)} className="p-1 rounded-lg text-white/70 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePresidentAction} className="p-5 space-y-4">
              {actionError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {actionError}
                </div>
              )}

              {/* Action Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Management Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'APPROVE', label: 'Final Approve', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'SEND_BACK', label: 'Send Back', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                    { id: 'REJECT', label: 'Reject', color: 'border-rose-500 bg-rose-50 text-rose-800' }
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

              {actionType === 'APPROVE' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                  <strong>Workflow Transition: PENDING AUDIT</strong>
                  <p className="text-[11px] text-emerald-800">
                    Once approved by Management (President / Director), the claim will automatically move to the dedicated Internal Audit
                    verification queue.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Executive Comments & Remarks {actionType !== 'APPROVE' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={actionType !== 'APPROVE'}
                  placeholder="Final management approval comments..."
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActionClaim(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all ${
                    actionType === 'APPROVE'
                      ? 'bg-purple-800 hover:bg-purple-900'
                      : actionType === 'SEND_BACK'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? 'Confirming...' : `Submit Decision (${actionType})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
