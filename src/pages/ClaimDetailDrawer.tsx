import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim, ExpenseItem, DocumentAttachment, AuditTrailItem, Tour } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AgeingBadge } from '../components/AgeingBadge';
import { generateClaimPDF } from '../utils/pdfGenerator';
import {
  X,
  Download,
  Calendar,
  Building,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

interface ClaimDetailDrawerProps {
  claimId: string | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const ClaimDetailDrawer: React.FC<ClaimDetailDrawerProps> = ({
  claimId,
  onClose,
  onActionComplete
}) => {
  const { currentUser } = useAuth();
  const [claim, setClaim] = useState<ExpenseClaim | null>(null);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrailItem[]>([]);
  const [tour, setTour] = useState<Tour | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Lightbox preview for bills
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const loadClaimDetails = () => {
    if (!claimId || !currentUser) return;
    setIsLoading(true);

    fetch(`/api/claims/${claimId}`, {
      headers: { 'x-user-id': currentUser.id }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load claim');
        return res.json();
      })
      .then((data) => {
        setClaim(data.claim);
        setItems(data.items || []);
        setDocuments(data.documents || []);
        setAuditLogs(data.auditLogs || []);
        setTour(data.tour);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadClaimDetails();
  }, [claimId, currentUser]);

  if (!claimId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">{claim?.id || claimId}</h3>
                {claim && <StatusBadge status={claim.status} size="sm" />}
              </div>
              <p className="text-xs text-white/70">
                {claim?.destination} • {claim?.numberOfDays} Days Tour
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {claim && (
              <button
                onClick={() => generateClaimPDF(claim, items, documents, tour)}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-purple-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                title="Download Official Claim PDF Statement"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          </div>
        ) : !claim ? (
          <div className="flex-1 p-6 text-center text-slate-500 text-xs">Claim could not be loaded.</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Duplicate Alert Banner */}
            {claim.isPotentialDuplicate && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>POTENTIAL DUPLICATE EXPENSE FLAGGED</strong>
                  <p className="text-[11px] mt-0.5">{claim.duplicateWarningReason}</p>
                </div>
              </div>
            )}

            {/* Employee & Tour Meta Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Claimant</span>
                <strong className="text-slate-900">{claim.employeeName}</strong>
                <span className="block text-slate-500 text-[11px]">
                  {claim.employeeId} • Band {claim.band}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Department & Region</span>
                <strong className="text-slate-900">{claim.department}</strong>
                <span className="block text-slate-500 text-[11px]">{claim.region}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tour Dates</span>
                <strong className="text-slate-900">{claim.tourStartDate} to {claim.tourEndDate}</strong>
                <span className="block text-purple-700 font-semibold text-[11px]">
                  {claim.numberOfDays} Days ({claim.destination})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Approving Authority</span>
                <strong className="text-slate-900">{claim.approvingAuthorityName}</strong>
                <AgeingBadge submissionDate={claim.submissionDate} status={claim.status} />
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-purple-900 text-white p-3.5 rounded-xl shadow-xs">
                <span className="text-[11px] text-purple-200 uppercase font-semibold block">Total Claimed</span>
                <div className="text-lg sm:text-2xl font-black mt-1 text-amber-300">
                  Rs. {claim.grossClaim.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-purple-300 block mt-0.5">Gross sum of all bills</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <span className="text-[11px] text-emerald-800 uppercase font-semibold block">Policy Eligible</span>
                <div className="text-lg sm:text-2xl font-black mt-1 text-emerald-700">
                  Rs. {claim.policyEligible.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Within Band limit</span>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  claim.exceptionAmount > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-[11px] uppercase font-semibold block">Exception Amount</span>
                <div
                  className={`text-lg sm:text-2xl font-black mt-1 ${
                    claim.exceptionAmount > 0 ? 'text-rose-700' : 'text-slate-800'
                  }`}
                >
                  Rs. {claim.exceptionAmount.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] block mt-0.5">
                  {claim.hasExceptions ? 'Above policy limits' : 'Zero exceptions'}
                </span>
              </div>
            </div>

            {/* Category Breakdown Chips */}
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Travel</span>
                <strong className="text-slate-800">Rs. {claim.travelTotal}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Daily Food</span>
                <strong className="text-slate-800">Rs. {claim.foodTotal}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Local Travel</span>
                <strong className="text-slate-800">Rs. {claim.localTravelTotal}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Hotel Stay</span>
                <strong className="text-slate-800">Rs. {claim.hotelTotal}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Other</span>
                <strong className="text-slate-800">Rs. {claim.otherTotal}</strong>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-700" />
                  Itemized Expenses ({items.length})
                </h4>
                <span className="text-xs text-slate-500 font-medium">Validated against Band {claim.band} Policy</span>
              </div>

              {items.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                  No expense items recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        item.isException
                          ? 'bg-rose-50/40 border-rose-300'
                          : 'bg-white border-slate-200 hover:border-purple-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded text-[10px]">
                              {item.category}
                            </span>
                            <span className="text-slate-500 text-[11px]">{item.date}</span>
                            {item.isException ? (
                              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                EXCEPTION (Excess Rs. {item.excessAmount})
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                                Within Limit
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-slate-900 text-sm">
                            {item.category === 'FOOD' && `${item.mealType} at ${item.restaurantVendor || 'Restaurant'}`}
                            {item.category === 'HOTEL' && `${item.hotelName}, ${item.hotelCity || ''} (${item.nights || 1} nights)`}
                            {item.category === 'TRAVEL' && `${item.travelMode}: ${item.fromLocation} to ${item.toLocation}`}
                            {item.category === 'LOCAL_TRAVEL' && `${item.localMode}: ${item.localFrom} to ${item.localTo}`}
                            {item.category === 'OTHER' && `${item.otherCategory}: ${item.otherDescription || item.remarks}`}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {item.ticketNo && `Ticket: ${item.ticketNo} • `}
                            {item.foodBillNo && `Bill: ${item.foodBillNo} • `}
                            {item.hotelInvoiceNo && `Invoice: ${item.hotelInvoiceNo} • `}
                            {item.localReceiptNo && `Receipt: ${item.localReceiptNo} • `}
                            Policy Cap: Rs. {item.policyLimit}
                          </div>

                          {item.exceptionReason && (
                            <p className="text-[11px] text-rose-800 bg-rose-100/70 p-1.5 rounded mt-1 font-medium">
                              <strong>Exception Reason:</strong> {item.exceptionReason}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-extrabold text-slate-900">
                            Rs. {item.amount.toLocaleString('en-IN')}
                          </div>
                          {item.documentUrl && (
                            <button
                              onClick={() => setPreviewDocUrl(item.documentUrl || null)}
                              className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center justify-end gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" /> View Bill
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Uploaded Supporting Documents */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-700" />
                Supporting Documents Attached ({documents.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-800 truncate">{doc.documentName}</p>
                      <p className="text-[10px] text-slate-500">
                        {doc.documentType} • {Math.round(doc.fileSize / 1024)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setPreviewDocUrl(doc.dataUrl || doc.fileUrl)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-purple-700 font-semibold text-[11px] shrink-0"
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval & Audit Sign-Off Section */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                Approval & Settlement Status
              </h4>
              <div className="space-y-2 text-xs">
                {/* Regional Approver Stage */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Regional Approver</span>
                    <span className="font-semibold text-slate-600">
                      {claim.regionalApprovedDate ? 'APPROVED' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Approver: {claim.regionalApproverName || claim.approvingAuthorityName}
                    {claim.regionalApprovedDate && ` on ${new Date(claim.regionalApprovedDate).toLocaleDateString()}`}
                  </p>
                  {claim.regionalComments && (
                    <p className="text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px]">
                      <strong>Remarks:</strong> {claim.regionalComments}
                    </p>
                  )}
                </div>

                {/* Management Stage (President / Directors) */}
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950">Final Management Approval (President / Directors)</span>
                    <span className="font-semibold text-purple-800">
                      {(claim.managementApprovedDate || claim.presidentApprovedDate) ? 'APPROVED' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Approver: {claim.managementApproverName || claim.presidentApproverName || 'Mr. Bharanidhar Tarimana / Directors'}
                    {(claim.managementApprovedDate || claim.presidentApprovedDate) && ` on ${new Date(claim.managementApprovedDate || claim.presidentApprovedDate).toLocaleDateString()}`}
                  </p>
                  {(claim.managementComments || claim.presidentComments) && (
                    <p className="text-purple-950 bg-white p-2 rounded border border-purple-200 text-[11px]">
                      <strong>Management Comments:</strong> {claim.managementComments || claim.presidentComments}
                    </p>
                  )}
                </div>

                {/* Audit Stage */}
                <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-950">Internal Audit Verification (13-Point)</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        claim.auditStatus === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.auditStatus === 'FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {claim.auditStatus || 'PENDING AUDIT'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Auditor: {claim.auditorName || 'Pending'}
                    {claim.auditDate && ` on ${new Date(claim.auditDate).toLocaleDateString()}`}
                  </p>
                  {claim.auditComments && (
                    <p className="text-sky-950 bg-white p-2 rounded border border-sky-200 text-[11px]">
                      <strong>Audit Findings:</strong> {claim.auditComments}
                    </p>
                  )}
                </div>

                {/* Accounts Stage */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">Accounts Payment Settlement</span>
                    <span className="font-bold text-emerald-800">
                      {claim.paymentStatus === 'PROCESSED' || claim.status === 'CLOSED'
                        ? 'PAYMENT SETTLED (CLOSED)'
                        : 'PENDING ACCOUNTS'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Payment Ref: <strong>{claim.paymentReference || 'Pending UTR'}</strong>
                    {claim.paymentDate && ` • Disbursed on: ${claim.paymentDate}`}
                  </p>
                  {claim.accountsRemarks && (
                    <p className="text-emerald-950 bg-white p-2 rounded border border-emerald-200 text-[11px]">
                      <strong>Accounts Remarks:</strong> {claim.accountsRemarks}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Complete Immutable Audit Trail */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-700" />
                Immutable Audit Trail History
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 max-h-48 overflow-y-auto text-[11px]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900">{log.action}</strong>
                        <span className="text-slate-400">•</span>
                        <span className="text-purple-700 font-semibold">{log.userName}</span>
                        <span className="text-slate-500">({log.userRole})</span>
                      </div>
                      <p className="text-slate-600 text-[10px] mt-0.5">{log.comment}</p>
                    </div>
                    <span className="text-slate-400 text-[10px] shrink-0">
                      {log.date} {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {claim && (
              <span>
                Gross: <strong>Rs. {claim.grossClaim.toLocaleString('en-IN')}</strong> • Status:{' '}
                <strong>{claim.status}</strong>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Lightbox / Preview Modal for Attached Bills */}
      {previewDocUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewDocUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <span className="font-bold text-sm text-slate-900">Document Bill Preview</span>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              {previewDocUrl.endsWith('.pdf') ? (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-purple-700 mx-auto" />
                  <p className="text-xs text-slate-600 font-semibold">PDF Document</p>
                  <a
                    href={previewDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-800 text-white rounded-lg text-xs font-bold"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Full PDF in New Tab
                  </a>
                </div>
              ) : (
                <img
                  src={previewDocUrl}
                  alt="Bill Preview"
                  className="max-h-[65vh] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
