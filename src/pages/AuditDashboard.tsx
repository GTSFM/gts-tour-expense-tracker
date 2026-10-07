import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AgeingBadge } from '../components/AgeingBadge';
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  AlertTriangle,
  Search,
  Check,
  FileCheck
} from 'lucide-react';

interface AuditDashboardProps {
  onSelectClaim: (claimId: string) => void;
}

const CHECKLIST_ITEMS = [
  { key: 'emp_verified', label: '1. Employee verified in official roster' },
  { key: 'emp_id_verified', label: '2. Employee ID verified with HR master' },
  { key: 'tour_dates_verified', label: '3. Tour dates verified with site register' },
  { key: 'travel_docs_verified', label: '4. Travel documents / tickets verified' },
  { key: 'food_bills_verified', label: '5. Food bills & restaurant receipts verified' },
  { key: 'local_travel_docs_verified', label: '6. Local travel / cab receipts verified' },
  { key: 'hotel_invoice_verified', label: '7. Hotel tax invoice & room rates verified' },
  { key: 'other_expenses_verified', label: '8. Other business expenses verified' },
  { key: 'policy_limits_verified', label: '9. Band policy limits & allowances checked' },
  { key: 'exception_approvals_verified', label: '10. Exception approvals & justifications verified' },
  { key: 'duplicate_bills_checked', label: '11. Duplicate bills cross-checked across system' },
  { key: 'documents_readable', label: '12. Attached documents readable and legible' },
  { key: 'total_calc_verified', label: '13. Gross & eligible calculations verified' }
];

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ onSelectClaim }) => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active Audit Inspection Modal
  const [auditingClaim, setAuditingClaim] = useState<ExpenseClaim | null>(null);
  const [checklist, setChecklist] = useState<
    Record<string, { status: 'PASS' | 'FAIL' | 'NA'; comment: string }>
  >({});
  const [auditDecision, setAuditDecision] = useState<'PASS' | 'FAIL' | 'QUERY'>('PASS');
  const [auditorComments, setAuditorComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditError, setAuditError] = useState('');

  const loadAuditClaims = () => {
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
    loadAuditClaims();
  }, [currentUser]);

  const initChecklist = () => {
    const initial: Record<string, { status: 'PASS' | 'FAIL' | 'NA'; comment: string }> = {};
    CHECKLIST_ITEMS.forEach((item) => {
      initial[item.key] = { status: 'PASS', comment: '' };
    });
    setChecklist(initial);
  };

  const handleStartAudit = (claim: ExpenseClaim) => {
    setAuditingClaim(claim);
    initChecklist();
    setAuditDecision('PASS');
    setAuditorComments('All 13 checklist points verified. Supporting documents clear and match totals.');
    setAuditError('');
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditingClaim || !currentUser) return;

    // Validate that any failed checklist item has mandatory comments
    const failedWithoutComment = Object.entries(checklist).find(
      ([key, val]) => val.status === 'FAIL' && (!val.comment || val.comment.trim().length === 0)
    );

    if (failedWithoutComment) {
      const label = CHECKLIST_ITEMS.find((i) => i.key === failedWithoutComment[0])?.label;
      setAuditError(`Mandatory auditor comment required for failed checklist item: ${label}`);
      return;
    }

    if (auditDecision === 'FAIL' && (!auditorComments || auditorComments.trim().length === 0)) {
      setAuditError('Mandatory overall audit comments required when marking an audit as FAILED.');
      return;
    }

    try {
      setIsProcessing(true);
      setAuditError('');

      const res = await fetch(`/api/claims/${auditingClaim.id}/audit-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          action: auditDecision,
          checklist,
          auditorComments
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit action failed.');

      setAuditingClaim(null);
      loadAuditClaims();
    } catch (err: any) {
      setAuditError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingAuditClaims = claims.filter((c) => ['PENDING_AUDIT', 'AUDIT_QUERY'].includes(c.status));

  const filteredClaims = claims.filter((claim) => {
    return (
      claim.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-sky-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Audit & Compliance
            </span>
            <span className="text-xs text-sky-200">
              Welcome, <strong>{currentUser.name}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">13-Point Audit Verification Module</h2>
          <p className="text-xs text-sky-200 mt-0.5">
            Claims approved by President Mr. Bharanidhar Tarimana queued for compliance audit
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/20 text-right">
          <span className="text-[11px] text-sky-200 uppercase font-semibold block">Awaiting Audit</span>
          <div className="text-xl sm:text-2xl font-black text-amber-300">{pendingAuditClaims.length} Claims</div>
          <span className="text-[10px] text-sky-300">Requires line-by-line verification</span>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit queue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-sky-600"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredClaims.length}</strong> claims
        </div>
      </div>

      {/* Audit Claims Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700 mx-auto"></div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">Audit Queue Empty</h4>
            <p className="text-xs text-slate-500">All claims approved by the President have been audited.</p>
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
                      President Approved:{' '}
                      <strong className="text-emerald-700">
                        {claim.presidentApprovedDate ? new Date(claim.presidentApprovedDate).toLocaleDateString() : 'Yes'}
                      </strong>
                    </div>
                  </div>

                  {claim.auditComments && (
                    <p className="text-[11px] text-sky-800 bg-sky-50 p-2 rounded border border-sky-200">
                      <strong>Audit Findings:</strong> {claim.auditComments}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left lg:text-right mr-2">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      Rs. {claim.grossClaim.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Eligible: Rs. {claim.policyEligible.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectClaim(claim.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Bills</span>
                    </button>

                    {['PENDING_AUDIT', 'AUDIT_QUERY'].includes(claim.status) && (
                      <button
                        onClick={() => handleStartAudit(claim)}
                        className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-amber-300" />
                        <span>Run 13-Pt Audit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 13-Point Audit Checklist Modal */}
      {auditingClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="bg-sky-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">13-Point Compliance & Audit Checklist</h3>
                <p className="text-xs text-sky-200">
                  {auditingClaim.id} • {auditingClaim.employeeName} (Band {auditingClaim.band}) • Rs.{' '}
                  {auditingClaim.grossClaim.toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setAuditingClaim(null)} className="p-1 rounded-lg text-white/70 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuditSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {auditError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {auditError}
                </div>
              )}

              {/* 13-Point Interactive Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b text-xs font-bold text-slate-700">
                  <span>AUDIT VERIFICATION ITEM</span>
                  <span>STATUS (PASS / FAIL / NA)</span>
                </div>

                <div className="space-y-2.5">
                  {CHECKLIST_ITEMS.map((item) => {
                    const state = checklist[item.key] || { status: 'PASS', comment: '' };
                    return (
                      <div
                        key={item.key}
                        className={`p-2.5 rounded-xl border text-xs transition-colors ${
                          state.status === 'FAIL'
                            ? 'bg-rose-50 border-rose-300'
                            : state.status === 'PASS'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">{item.label}</span>

                          <div className="flex items-center gap-1 shrink-0">
                            {(['PASS', 'FAIL', 'NA'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setChecklist((prev) => ({
                                    ...prev,
                                    [item.key]: { ...prev[item.key], status: opt }
                                  }))
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all border ${
                                  state.status === opt
                                    ? opt === 'PASS'
                                    : opt === 'FAIL'
                                    ? 'bg-white text-slate-600 border-slate-300'
                                    : 'bg-white text-slate-600 border-slate-300'
                                } ${
                                  state.status === opt && opt === 'PASS'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : state.status === opt && opt === 'FAIL'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : state.status === opt && opt === 'NA'
                                    ? 'bg-slate-700 text-white border-slate-700'
                                    : ''
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment box if failed */}
                        {state.status === 'FAIL' && (
                          <div className="mt-2 pt-2 border-t border-rose-200">
                            <label className="block text-[11px] font-bold text-rose-900 mb-1">
                              Auditor Discrepancy Comment <span className="text-rose-600">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Detail the failure reason (mandatory)..."
                              value={state.comment}
                              onChange={(e) =>
                                setChecklist((prev) => ({
                                  ...prev,
                                  [item.key]: { ...prev[item.key], comment: e.target.value }
                                }))
                              }
                              className="w-full text-xs rounded border border-rose-300 p-1.5 outline-none bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall Audit Result */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Overall Audit Result
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PASS', label: 'PASSED (Move to Accounts)', color: 'bg-emerald-600 text-white' },
                    { id: 'QUERY', label: 'RAISE QUERY', color: 'bg-amber-600 text-white' },
                    { id: 'FAIL', label: 'FAILED (Return)', color: 'bg-rose-600 text-white' }
                  ].map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setAuditDecision(res.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        auditDecision === res.id
                          ? res.color + ' shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Overall Audit Findings / Justification
                </label>
                <textarea
                  rows={2}
                  required={auditDecision !== 'PASS'}
                  placeholder="Audit summary..."
                  value={auditorComments}
                  onChange={(e) => setAuditorComments(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setAuditingClaim(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 text-xs font-bold text-white bg-sky-800 hover:bg-sky-900 rounded-lg shadow-sm"
                >
                  {isProcessing ? 'Submitting Audit...' : `Confirm Audit (${auditDecision})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
