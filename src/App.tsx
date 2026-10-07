import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { RegionalApprovalDashboard } from './pages/RegionalApprovalDashboard';
import { PresidentDashboard } from './pages/PresidentDashboard';
import { AuditDashboard } from './pages/AuditDashboard';
import { AccountsDashboard } from './pages/AccountsDashboard';
import { MasterAdminDashboard } from './pages/MasterAdminDashboard';
import { ReportsPage } from './pages/ReportsPage';
import { NewTourModal } from './pages/NewTourModal';
import { ExpenseEntryModal } from './pages/ExpenseEntryModal';
import { ClaimSummaryModal } from './pages/ClaimSummaryModal';
import { ClaimDetailDrawer } from './pages/ClaimDetailDrawer';
import { RegisterModal } from './pages/RegisterModal';
import { LoginModal } from './pages/LoginModal';
import { ChangePasswordModal } from './pages/ChangePasswordModal';
import { ExpenseClaim, ExpenseItem, DocumentAttachment } from './types';
import { ShieldAlert, KeyRound, ShieldCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modals
  const [isNewTourOpen, setIsNewTourOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [loginPrefill, setLoginPrefill] = useState<{ ident: string; pw: string } | null>(null);

  // Claim Detail Drawer
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Claim Summary Modal
  const [summaryClaim, setSummaryClaim] = useState<ExpenseClaim | null>(null);
  const [summaryItems, setSummaryItems] = useState<ExpenseItem[]>([]);
  const [summaryDocs, setSummaryDocs] = useState<DocumentAttachment[]>([]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Auto-switch default tab when active persona/role changes
  useEffect(() => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }
    const role = currentUser.role;

    // Check if URL specified a direct tab or action
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const actionParam = params.get('action');
    const hash = window.location.hash;

    if (actionParam === 'register' || hash === '#register') {
      setIsRegisterOpen(true);
    }
    if (actionParam === 'login' || hash === '#login') {
      setIsLoginOpen(true);
    }

    if (tabParam === 'admin' || tabParam === 'master' || hash === '#master' || hash === '#admin') {
      if (role === 'PRESIDENT' || role === 'DIRECTOR' || role === 'MASTER_ADMIN') {
        setCurrentTab('admin');
        return;
      }
    }

    if (role === 'EMPLOYEE' || role === 'PROFIT_CENTRE_HEAD') {
      setCurrentTab('dashboard');
    } else if (role === 'REGIONAL_APPROVER') {
      setCurrentTab('approvals');
    } else if (role === 'PRESIDENT' || role === 'DIRECTOR') {
      setCurrentTab('president');
    } else if (role === 'AUDITOR') {
      setCurrentTab('audit');
    } else if (role === 'ACCOUNTS') {
      setCurrentTab('accounts');
    } else if (role === 'MASTER_ADMIN') {
      setCurrentTab('admin');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Handle open claim summary for submission
  const handleOpenClaimSummary = async (claimId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      if (data.claim) {
        setSummaryClaim(data.claim);
        setSummaryItems(data.items || []);
        setSummaryDocs(data.documents || []);
        setIsSummaryOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isDirectorOrPresident =
    currentUser &&
    (currentUser.role === 'PRESIDENT' ||
      currentUser.role === 'DIRECTOR' ||
      currentUser.role === 'MASTER_ADMIN');

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#3C2A9A] via-[#2f1f80] to-[#1f1358] text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center max-w-sm w-full text-center animate-in fade-in duration-150">
          <div className="w-44 h-24 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center p-3 shadow-2xl mb-6">
            <img src="/logo-transparent.png" alt="GTS Logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="text-[11px] font-bold tracking-widest uppercase text-amber-400 mb-1.5 opacity-95">
            GTS Facility Management Services
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-white">
            Tour Expense Management & Claim Tracker
          </h1>
          <div className="mt-7 w-40 h-1 bg-white/20 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-200 w-3/4 rounded-full animate-pulse"></div>
          </div>
          <p className="mt-3 text-xs text-purple-200/70 font-medium">
            Starting application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 sm:pb-6 text-slate-900">
      {/* Top Header */}
      <Header
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'new-tour') setIsNewTourOpen(true);
          else if (tab === 'new-expense') setIsNewExpenseOpen(true);
          else setCurrentTab(tab);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <EmployeeDashboard
            onOpenNewTour={() => setIsNewTourOpen(true)}
            onOpenNewExpense={() => setIsNewExpenseOpen(true)}
            onSelectClaim={(id) => setSelectedClaimId(id)}
            onSubmitClaimSummary={handleOpenClaimSummary}
          />
        )}

        {currentTab === 'approvals' && (
          <RegionalApprovalDashboard onSelectClaim={(id) => setSelectedClaimId(id)} />
        )}

        {currentTab === 'president' && (
          <PresidentDashboard onSelectClaim={(id) => setSelectedClaimId(id)} />
        )}

        {currentTab === 'audit' && (
          <AuditDashboard onSelectClaim={(id) => setSelectedClaimId(id)} />
        )}

        {currentTab === 'accounts' && (
          <AccountsDashboard onSelectClaim={(id) => setSelectedClaimId(id)} />
        )}

        {/* View Master (Strict access control: Directors & President only) */}
        {currentTab === 'admin' && (
          isDirectorOrPresident ? (
            <MasterAdminDashboard />
          ) : (
            <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-red-200 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Access Restricted</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Master Administration, Policy Configuration, and Governance console is strictly reserved for Company Directors and President.
              </p>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-4 py-2 bg-purple-900 text-white font-bold rounded-xl text-xs hover:bg-purple-950 transition-colors"
              >
                Return to My Dashboard
              </button>
            </div>
          )
        )}

        {currentTab === 'reports' && <ReportsPage />}

        {currentTab === 'all-claims' && <ReportsPage />}

        {currentTab === 'profile' && (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Employee Profile</h3>
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold text-xs transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </button>
              </div>

              {currentUser && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                    <strong className="text-slate-900 text-sm">{currentUser.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee ID</span>
                    <strong className="text-slate-900 text-sm">{currentUser.employeeId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
                    <strong className="text-slate-900">{currentUser.designation}</strong>
                  </div>

                  {/* Band is explicitly hidden/removed for Directors! */}
                  {currentUser.role !== 'DIRECTOR' && currentUser.band && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Band</span>
                      <strong className="text-purple-700 font-bold">{currentUser.band}</strong>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                    <strong className="text-slate-900">{currentUser.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Region</span>
                    <strong className="text-slate-900">{currentUser.region}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Approver</span>
                    <strong className="text-slate-900">{currentUser.approvingAuthorityName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Status</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      {currentUser.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Account Security
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your login password regularly to protect your tour expense account.
                </p>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Modals */}
      <NewTourModal
        isOpen={isNewTourOpen}
        onClose={() => setIsNewTourOpen(false)}
        onTourCreated={() => {
          setIsNewExpenseOpen(true);
        }}
      />

      <ExpenseEntryModal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        onExpenseAdded={() => {
          // Automatic refresh
        }}
      />

      {summaryClaim && (
        <ClaimSummaryModal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          claim={summaryClaim}
          items={summaryItems}
          documents={summaryDocs}
          onSubmitted={() => {
            setIsSummaryOpen(false);
            setSummaryClaim(null);
          }}
        />
      )}

      <ClaimDetailDrawer
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
        onActionComplete={() => setSelectedClaimId(null)}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenLoginWithCredentials={(ident, pw) => {
          setLoginPrefill({ ident, pw });
          setIsLoginOpen(true);
        }}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setLoginPrefill(null);
        }}
        onOpenRegister={() => setIsRegisterOpen(true)}
        initialIdentifier={loginPrefill?.ident || ''}
        initialPassword={loginPrefill?.pw || ''}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
