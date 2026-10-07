import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertTriangle, ShieldCheck, X, Eye, EyeOff, ChevronDown, ChevronUp, KeyRound, UserPlus, Building2, Briefcase, UserCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
  initialIdentifier?: string;
  initialPassword?: string;
}

interface CredentialPreset {
  roleLabel: string;
  name: string;
  identifier: string;
  password: string;
  badge: string;
  category: 'LEADERSHIP' | 'REGIONAL_APPROVERS';
  isDirector?: boolean;
}

const OFFICIAL_ROLE_PRESETS: CredentialPreset[] = [
  // 1. Executive Leadership, Board of Directors & Audit
  {
    roleLabel: 'President - Bharanidhar Tarimana',
    name: 'Bharanidhar Tarimana',
    identifier: 'GTS-EXEC-01',
    password: 'Bharani@123',
    badge: 'Final Management Approval',
    category: 'LEADERSHIP'
  },
  {
    roleLabel: 'Director 1 - Mariappan S',
    name: 'Mariappan S',
    identifier: 'GTS-EXEC-02',
    password: 'Mariappan@123',
    badge: 'Board of Directors',
    isDirector: true,
    category: 'LEADERSHIP'
  },
  {
    roleLabel: 'Director 2 - PrabakarB',
    name: 'Prabakar B',
    identifier: 'GTS-EXEC-03',
    password: 'Prabakar@123',
    badge: 'Board of Directors',
    isDirector: true,
    category: 'LEADERSHIP'
  },
  {
    roleLabel: 'Auditor - Auditor',
    name: 'Auditor',
    identifier: 'GTS-AUD-01',
    password: 'Audit@123',
    badge: '13-Point Audit Verification',
    category: 'LEADERSHIP'
  },
  {
    roleLabel: 'Accounts - Accounts',
    name: 'Accounts',
    identifier: 'GTS-ACC-01',
    password: 'Accounts@123',
    badge: 'Payment Disbursal & Settlement',
    category: 'LEADERSHIP'
  },
  {
    roleLabel: 'Master Administrator',
    name: 'Master Admin',
    identifier: 'GTS-ADM-01',
    password: 'Admin@123',
    badge: 'Super Admin',
    category: 'LEADERSHIP'
  },

  // 2. Regional Approving Authorities & Profit Centre Heads
  {
    roleLabel: 'RH 01 - GTSPCH (Krishnan Govindan)',
    name: 'Krishnan Govindan',
    identifier: 'GTS-RH-01',
    password: 'GTSPCH@01',
    badge: 'AP & Telangana • PCH',
    category: 'REGIONAL_APPROVERS'
  },
  {
    roleLabel: 'RH 02 - GTSPCH (Samuel)',
    name: 'Samuel',
    identifier: 'GTS-RH-02',
    password: 'GTSPCH@02',
    badge: 'Karnataka & East • PCH',
    category: 'REGIONAL_APPROVERS'
  },
  {
    roleLabel: 'RH 03 - GTSPCH (Yoganandam)',
    name: 'Yoganandam',
    identifier: 'GTS-RH-03',
    password: 'GTSPCH@03',
    badge: 'TN / ROTN • PCH',
    category: 'REGIONAL_APPROVERS'
  },
  {
    roleLabel: 'RH 04 - GTSPCH (Sundar)',
    name: 'Sundar',
    identifier: 'GTS-RH-04',
    password: 'GTSPCH@04',
    badge: 'TN / ROTN',
    category: 'REGIONAL_APPROVERS'
  },
  {
    roleLabel: 'CRM - Tejinder Singh',
    name: 'Tejinder Singh',
    identifier: 'GTS-PCH-01',
    password: 'CRM@123',
    badge: 'Profit Centre Head (Direct to President)',
    category: 'REGIONAL_APPROVERS'
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
  initialIdentifier = '',
  initialPassword = ''
}) => {
  const { login, allUsers } = useAuth();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialsGuide, setShowCredentialsGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'LEADERSHIP' | 'REGIONAL_APPROVERS' | 'REGISTERED_EMPLOYEES'>('LEADERSHIP');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Employee ID, Full Name, or Email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const res = await login(identifier.trim(), password.trim());
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Invalid credentials. Please verify your Name/ID and password.');
    }
  };

  const handleSelectPreset = (preset: CredentialPreset) => {
    setIdentifier(preset.identifier);
    setPassword(preset.password);
    setErrorMessage('');
  };

  const handleSelectRegisteredUser = (user: any) => {
    setIdentifier(user.name);
    setPassword(user.password || '');
    setErrorMessage('');
  };

  const registeredEmployees = (allUsers || []).filter((u) => u.role === 'EMPLOYEE');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header with Complete Logo */}
        <div className="bg-gradient-to-r from-purple-950 via-[#3C2A9A] to-indigo-950 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-20 rounded-lg overflow-hidden border border-purple-400/40 bg-[#3C2A9A] flex items-center justify-center shrink-0 p-1 shadow-xs">
              <img src="/logo.png" alt="GTS Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-base">GTS Tour Expense Tracker</h3>
              <p className="text-xs text-white/70">Sign In to Your Authorized Account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Open Generation Banner for Field Staff / Employees */}
          <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 text-xs">New Employee / Field Staff?</span>
                {onOpenRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegister();
                    }}
                    className="text-purple-800 hover:text-purple-950 font-bold underline text-xs"
                  >
                    Register Now →
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Register with your Full Name, Department, and custom password. Once registered, log in directly using your Name or Employee ID.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Employee ID, Full Name, or Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. Full Name, Employee ID, or Email"
                className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-purple-600 font-medium text-slate-900"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                * You can sign in using your official Name or your unique Employee ID.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-purple-600 font-mono text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-800 to-indigo-900 text-white font-bold rounded-xl shadow hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing In...' : 'Sign In to Account'}</span>
            </button>
          </form>

          {/* Quick Access Credentials Directory for Authorities */}
          <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/50 mt-2">
            <button
              type="button"
              onClick={() => setShowCredentialsGuide(!showCredentialsGuide)}
              className="w-full px-3 py-2 text-left flex items-center justify-between text-[11px] font-bold text-purple-950 hover:bg-purple-100/60 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-700" />
                <span>Authorized Management & Approvers Directory</span>
              </div>
              {showCredentialsGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCredentialsGuide && (
              <div className="p-3 border-t border-purple-200 bg-white space-y-2.5 max-h-60 overflow-y-auto">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('LEADERSHIP')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      selectedCategory === 'LEADERSHIP'
                        ? 'bg-purple-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Leadership & Audit ({OFFICIAL_ROLE_PRESETS.filter((p) => p.category === 'LEADERSHIP').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('REGIONAL_APPROVERS')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      selectedCategory === 'REGIONAL_APPROVERS'
                        ? 'bg-purple-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Regional Approvers ({OFFICIAL_ROLE_PRESETS.filter((p) => p.category === 'REGIONAL_APPROVERS').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('REGISTERED_EMPLOYEES')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      selectedCategory === 'REGISTERED_EMPLOYEES'
                        ? 'bg-purple-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Registered Employees ({registeredEmployees.length})
                  </button>
                </div>

                <div className="space-y-1.5">
                  {selectedCategory === 'REGISTERED_EMPLOYEES' ? (
                    registeredEmployees.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700">No employees registered yet.</p>
                        <p className="text-[10px]">
                          Pre-seeded names have been cleared. Click{' '}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenRegister && onOpenRegister();
                            }}
                            className="text-purple-800 font-bold underline"
                          >
                            Register
                          </button>{' '}
                          to generate a new employee account.
                        </p>
                      </div>
                    ) : (
                      registeredEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectRegisteredUser(emp)}
                          className="p-2 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/60 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-[11px]">{emp.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: <span className="font-bold text-purple-950">{emp.employeeId}</span> • Designation:{' '}
                              <span className="font-semibold text-slate-800">{emp.designation}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 shrink-0 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </span>
                        </div>
                      ))
                    )
                  ) : (
                    OFFICIAL_ROLE_PRESETS.filter((p) =>
                      selectedCategory === 'ALL' ? true : p.category === selectedCategory
                    ).map((preset) => (
                      <div
                        key={preset.identifier}
                        onClick={() => handleSelectPreset(preset)}
                        className="p-2 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/60 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-[11px]">{preset.roleLabel}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: <span className="font-bold text-purple-950">{preset.identifier}</span> • PW:{' '}
                            <span className="font-bold text-slate-800">{preset.password}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 shrink-0">
                          {preset.badge}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
