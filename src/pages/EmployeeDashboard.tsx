import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim, Tour } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AgeingBadge } from '../components/AgeingBadge';
import {
  PlusCircle,
  Compass,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';

interface EmployeeDashboardProps {
  onOpenNewTour: () => void;
  onOpenNewExpense: () => void;
  onSelectClaim: (claimId: string) => void;
  onSubmitClaimSummary: (claimId: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onOpenNewTour,
  onOpenNewExpense,
  onSelectClaim,
  onSubmitClaimSummary
}) => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<ExpenseClaim[]>(() => {
    try {
      const cached = localStorage.getItem(`gts_claims_${currentUser?.id}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [tours, setTours] = useState<Tour[]>(() => {
    try {
      const cached = localStorage.getItem(`gts_tours_${currentUser?.id}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    if (!currentUser) return;

    Promise.all([
      fetch('/api/claims', { headers: { 'x-user-id': currentUser.id } }).then((r) => r.json()),
      fetch('/api/tours', { headers: { 'x-user-id': currentUser.id } }).then((r) => r.json())
    ])
      .then(([claimsData, toursData]) => {
        const fetchedClaims = claimsData.claims || [];
        const fetchedTours = toursData.tours || [];

        if (fetchedClaims.length > 0 || fetchedTours.length > 0) {
          setClaims(fetchedClaims);
          setTours(fetchedTours);
          try {
            localStorage.setItem(`gts_claims_${currentUser.id}`, JSON.stringify(fetchedClaims));
            localStorage.setItem(`gts_tours_${currentUser.id}`, JSON.stringify(fetchedTours));
          } catch {}
        } else {
          try {
            const cachedClaimsRaw = localStorage.getItem(`gts_claims_${currentUser.id}`);
            const cachedToursRaw = localStorage.getItem(`gts_tours_${currentUser.id}`);
            if (cachedClaimsRaw) {
              const cachedClaims = JSON.parse(cachedClaimsRaw);
              const cachedTours = cachedToursRaw ? JSON.parse(cachedToursRaw) : [];
              if (cachedClaims.length > 0) {
                setClaims(cachedClaims);
                setTours(cachedTours);
                fetch('/api/sync/restore', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ claims: cachedClaims, tours: cachedTours })
                }).catch(() => {});
              }
            }
          } catch {}
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  if (!currentUser) return null;

  // Counts
  const draftCount = claims.filter((c) => c.status === 'DRAFT').length;
  const pendingCount = claims.filter((c) =>
    ['SUBMITTED', 'PENDING_REGIONAL_APPROVAL', 'PENDING_PRESIDENT_APPROVAL', 'PENDING_AUDIT', 'PENDING_ACCOUNTS'].includes(
      c.status
    )
  ).length;
  const approvedPaidCount = claims.filter((c) => ['CLOSED', 'PAYMENT_PROCESSED'].includes(c.status)).length;
  const rejectedCount = claims.filter((c) => ['REJECTED', 'AUDIT_FAILED'].includes(c.status)).length;

  const totalClaimed = claims.reduce((acc, c) => acc + (c.grossClaim || 0), 0);
  const totalPaid = claims
    .filter((c) => ['CLOSED', 'PAYMENT_PROCESSED'].includes(c.status))
    .reduce((acc, c) => acc + (c.processedAmount || c.grossClaim || 0), 0);

  const isPendingValidation = currentUser.status === 'PENDING_VALIDATION';

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Account Status Alert if Pending Validation */}
      {isPendingValidation && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Account Status: PENDING VALIDATION</h4>
            <p className="text-amber-800 leading-relaxed">
              Your profile is currently awaiting approval from your Approving Authority (
              <strong>{currentUser.approvingAuthorityName}</strong>) or Master Admin. Once activated, you can submit
              expense claims.
            </p>
          </div>
        </div>
      )}

      {/* Welcome Card & 3-Click Action Bar */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 text-white rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-xs font-semibold mb-2">
              {currentUser.role !== 'DIRECTOR' && currentUser.band && <span>Band {currentUser.band} • </span>}
              <span>{currentUser.department}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 mt-1">
              Employee ID: <strong>{currentUser.employeeId}</strong> • Approver:{' '}
              <strong>{currentUser.approvingAuthorityName}</strong> • Region:{' '}
              <strong>{currentUser.region}</strong>
            </p>
          </div>

          {/* Quick Action Buttons (Large, finger-friendly for Mobile) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewTour}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-purple-950 hover:bg-slate-100 active:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
            >
              <Compass className="w-4 h-4 text-purple-700" />
              <span>+ New Tour</span>
            </button>

            <button
              onClick={onOpenNewExpense}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-purple-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-purple-900" />
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Draft Claims</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{draftCount}</div>
          <span className="text-[11px] text-slate-400">Ready to submit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
            <span>In Approval</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-1">{pendingCount}</div>
          <span className="text-[11px] text-indigo-600">Regional / President / Audit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Settled / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">{approvedPaidCount}</div>
          <span className="text-[11px] text-emerald-600">Disbursed to Bank</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700 text-xs font-semibold">
            <span>Total Claimed</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-950 mt-1">
            Rs. {totalClaimed.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500">
            Paid: Rs. {totalPaid.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Employee Policy Entitlements Strip */}
      {currentUser.role !== 'DIRECTOR' && currentUser.band && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50/30 border border-purple-100 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="bg-purple-900 text-white font-black text-[11px] px-2.5 py-1 rounded-md">
              Band {currentUser.band}
            </span>
            <div>
              <span className="font-bold text-slate-800">
                {currentUser.designation} Entitlements:
              </span>
              <span className="text-slate-600 block text-[11px] sm:inline sm:ml-1.5">
                Food Cap: <strong>₹{currentUser.band === 'B1' ? '550' : '600'} / day</strong> • Lodging Cap:{' '}
                <strong>
                  ₹{currentUser.band === 'B1'
                    ? '1,500'
                    : currentUser.band === 'B2' && (currentUser.designation === 'AGM' || currentUser.designation.includes('AGM'))
                    ? '2,000'
                    : currentUser.band === 'B2'
                    ? '1,800'
                    : '2,500'} / night
                </strong>
              </span>
            </div>
          </div>
          <div className="text-[11px] text-purple-900 font-semibold bg-white/90 border border-purple-200/80 px-2.5 py-1 rounded-lg">
            Eligible: {currentUser.band === 'B3' ? 'Train 3rd AC / Sleeper Bus' : 'Train up to 3rd AC / Local Cabs / Sleeper Bus'}
          </div>
        </div>
      )}

      {/* Claims List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">My Tour Expense Claims</h3>
            <p className="text-xs text-slate-500">Track claim progress and download statements</p>
          </div>
          <span className="text-xs bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-full">
            {claims.length} Claims
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto"></div>
          </div>
        ) : claims.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Compass className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">No Tour Claims Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by creating a new Tour Request, then record your travel, food, and hotel bills with photos.
            </p>
            <button
              onClick={onOpenNewTour}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-purple-900"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>Create Your First Tour</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => onSelectClaim(claim.id)}
                className="p-4 sm:p-5 hover:bg-purple-50/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-sm sm:text-base">{claim.id}</span>
                    <StatusBadge status={claim.status} size="sm" />
                    <AgeingBadge submissionDate={claim.submissionDate} status={claim.status} />
                    {claim.hasExceptions && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                        Exception: Rs. {claim.exceptionAmount}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Destination: <strong className="text-slate-800">{claim.destination}</strong>
                    </span>
                    <span>
                      Dates: {claim.tourStartDate} to {claim.tourEndDate} ({claim.numberOfDays} Days)
                    </span>
                    <span>
                      Approver: <strong className="text-slate-800">{claim.approvingAuthorityName}</strong>
                    </span>
                  </div>

                  {claim.isPotentialDuplicate && (
                    <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Potential duplicate expense detected
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-black text-purple-950">
                      Rs. {claim.grossClaim.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Eligible: Rs. {claim.policyEligible.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {claim.status === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubmitClaimSummary(claim.id);
                        }}
                        className="px-3 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        Submit
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
